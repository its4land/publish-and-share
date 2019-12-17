'use strict';

const dockerlib = require('../lib/docker')
const winston = require('winston');
const _ = require('lodash');
const EventEmitter = require('events');
const config = require('../settings/config');
const redis = require('redis');
const Redlock = require('redlock');
const crypto = require('crypto');
const http = require('http');
const JSONStream = require('JSONStream');
const util = require('util');


// Data structure names in redis
const procMap = "PROCESSMAP"; // Hashtable:ProcessID -> Process Object (as JSON string)
const cntnrMap = "CONTAINERMAP"; // Hashtable: ContainerID -> Process ID, for fast lookup
const waitQueue = "WAITING"; // Queue: ProcessIDs waiting to run
const runningMap = "RUNNING"; // Hashtable: ProcessIDs of running processes (Queue is not needed here)
const finishedMap = "FINISHED"; // Hashtable: ProcessIDs of finished processes

// Publish-Subscribe
const statusChannel = "STATUS_CHAN"
const publishClient = redis.createClient();

const msgFormat = winston.format.printf (log => {
    let message = log.message;
    if (typeof message === "object") {
        message = JSON.stringify(message);
    }
    return `${log.timestamp} ${log.level}: ${message}`
})

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'logs/process_manager.log'})
    ],
    level: 'debug',
    format: winston.format.combine(winston.format.timestamp(), msgFormat)
});

/**
 * Log errors and map Docker-API response error code/message to the one specified
 * in the its4land processAPI
 * 
 * TODO:
 * 1. Format JSON messsages properly
 * 
 * @method errorHandler
 * @param caller {String} Name of calling function
 * @return {Object}
 * 
 */
async function errorHandler(caller, err) {
    let code = err.statusCode;
    if ('errno' in err && err.errno === 'ECONNREFUSED') code = 503;
    let message = "";
    switch(code) {
        case 304:
            if ('reason' in err)
                message = err.reason
            else
                message = "Not modified"
            break;
        case 400:
            message = "Bad or incorrect HTTP request"
            break;
        case 404:
            message = "No Docker image(s) found"
            break;
        case 409:
            if (caller === 'killContainer') {
                message = "Container not running"
            } else {
                if ('json' in err && 'message' in err.json)
                    message = err.json.message;
                else
                    message = "Unknown error due to bad request"
            }
            break;
        case 503:
            message = "Docker internal error"
            break;
        default:
            code = 500;
            message = "Internal server error"
    }
    let newErr = {
        statusCode: code,
        msg: message,
        origError: err
    }
    return newErr;
}

let redisClient = redis.createClient(config.redisCfg);

// Redis locking for simultaneous writes to shared resource
let redlock = new Redlock( [redisClient], {
    driftFactor : 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200
});

// Respond to Redis connection events
redisClient.on('error', (err) => {
    logger.error("Connection to Redis instance failed", err);
});

redisClient.on('ready', (val) => {
    /* Create promisified versions of functions in the redis client library.
     * By default the library uses old the callback style.
     * 
     * To promisify a function just add it to the array candidateFunctions.
     * Promisified functions are given the 'async' prefix and camelCased
     * 
     * e.g. 'asyncHget' is the promisified version of 'hget'
    */ 
    const candidateFunctions = ['hdel', 'hget', 'hgetall', 'hlen', 'hset', 'llen', 'lpush', 'lrem', 'rpop'];
    candidateFunctions.forEach((fname) => {
        let client = 'redisClient'; // variable used to reference client
        let asyncFuncName = `${client}.async${fname.charAt(0).toUpperCase()}${fname.slice(1)}`
        let cmd = `${asyncFuncName} = util.promisify(${client}.${fname}).bind(${client})`;
        eval(cmd);
    })
});

// Should be gotten rid of once database is in place
// 'tool name' : {'version' : 'docker image id', ...}
/*
let toolToImageMap = {
    'WP3.1' : {
        '1.0': '2f13a37dd5e6'
    },
    'WP3.2': {
        '1.0': 'a8e0cd29a968',
        '1.1': '216a1b7aadc7',
        '1.2': '6e011835c7ee'
    },
    'WP5.1': {
        '1.0': 'f0840c22031c'
    }
};
*/

/**
 * Create a process
 * 
 * The process request requires the id of the tool to run and optionally its version, 
 * userId, comment and arguments passed to the tool. This method creates the corresponding
 * container and assigns a unique SHA-1 hashvalue as the processId. The return object
 * consists of the request + generated properties.
 * 
 * NOTE: This method does not enqueue the process into the waiting queue yet
 * 
 * @method createProcess 
 * @param {Object}
 * @return {Object}
 */

module.exports.createProcess = async function(body){
    try {
        let toolImageId = body.toolImageId;
        let version = body.version;
        let userId = body.userId
        //let imageId = body. toolImageId; //toolToImageMap[toolName][version];
        let containerRequest = {
            "id": toolImageId
        };
        let optionalArgs = ["args", "env", "dockerParams"];
        for (let arg of optionalArgs) {
            if (Object.keys(body).includes(arg)) {
                containerRequest[arg] = body[arg];
            }
        }
        let containerId = await dockerlib.createContainer(containerRequest);
        containerId = containerId.id;
        let processId;
        if ('processId' in body) {
            processId = body.processId;
        } else {
            let uniqStr = `${toolImageId}/${version}/${userId}/${Date.now()}`;
            let salt = 'platform.its4land.com'
            processId = crypto.createHmac('sha1', salt).update(uniqStr).digest('hex');
        }
        let processObj = body;
        processObj.id = processId
        processObj.containerId = containerId;
        processObj.status = 'CREATED';
        processObj.timestampCreated = Date.now();
        processEvent.emit('process-created', processObj)
        return processObj;
    } catch (error) {
        let handledErr = await errorHandler('createProcess', error);
        throw(handledErr);
    }
}

/**
 * Add process to a waiting queue in Redis 
 * 
 * @method enqueueProcess
 * @param {String} pid Process Id
 * @return {Object}
 */
module.exports.enqueueProcess = async function(pid) {
    try {
        setProcessProperty(pid, 'status', 'WAITING');
        let retVal = await redisClient.asyncLpush(waitQueue, pid);
        let length = -1;
        if (retVal) {
            length = await redisClient.asyncLlen(waitQueue);
        }
        processEvent.emit('process-enqueued', pid, retVal);
        let result = {
            position: length - 1,
            waitQueueLength: length
        }
        return result;
    } catch (err) {
        throw(err);
    }
}

/**
 * Remove process from waiting queue in Redis in a FIFO order 
 * 
 * @method enqueueProcess
 * @param {Boolean} throwQueueingErr Throw error if queue is full. If false, return err as response
 * @return {Object}
 */
module.exports.dequeueProcess = async function (throwQueueingErr=true) {
    try {
        let len = await redisClient.asyncHlen(runningMap);
        let err = {};
        let errQueueEmpty = {
            statusCode: 500,
            message: `Could not Dequeue. Possibly empty wait queue`
        };
        let errQueueFull = {
            statusCode: 503,
            message: `Run queue full `
        }
        
        // Dequeue only if no. of running processes is below limit
        if (len < config.executionPolicy.maxConcurrentTasks) {
            let waitQLen = await redisClient.asyncLlen(waitQueue);

            // Queue exists and has waiting processes
            if (waitQLen && waitQLen > 0) {
                // Remove processes from wait queue and execute them
                //let pid = await redisClient.asyncRpop(waitQueue);
                let pid = await getPidOfWaitingProcess();
                processEvent.emit('process-dequeued', pid);
                let result = await executeProcess(pid);
                processEvent.emit('process-started', pid);
                result.statusCode = 200;
                return result;
            } else {
                err = errQueueEmpty;
            }
        } else {
            let waitQLen = await redisClient.asyncLlen(waitQueue);
            if (waitQLen) {
                err = errQueueFull;
                err.message = `Run queue full (Number of waiting tasks = ${waitQLen}; Max concurrent tasks = ${config.executionPolicy.maxConcurrentTasks}) `;
            } else {
                err = errQueueEmpty;
            }
        }
        
        // Throw error or return it as response depending on flasg
        if (throwQueueingErr) {
            throw(err);            
        } else {
            return err;
        }
    } catch (err) {
        if ( _(err).get('origError.reason') === "no such container") {
            // Docker daemon could not find dequeued container. Possibly removed externally
            // In this case continue with dequeueing
            exports.dequeueProcess();
        } else {
            throw (err);
        }
    }
}

/**
 * Stop a running/waiting process
 * 
 * If the process is waiting, remove it from the waiting queue. 
 * If the process is running, stop the container. Set state to ABORTED in 
 * both these cases
 * 
 * @method stopProcess
 * @param {String} pid Process Id
 * @return {Object}
 */
module.exports.stopProcess = async function(pid) {
    try {
        let info = await exports.getProcessInfo(pid);
        switch (info.status) {
            case 'FINISHED':
            case 'ABORTED':
                // If process already finished running, there's nothing to do
                logger.debug(`Process '${pid}' already stopped`);
                break;
            case 'WAITING':
                // If process is waiting, remove it from the wait queue
                let numRemovedInstances = await redisClient.asyncLrem(waitQueue, 0, pid);
                if (numRemovedInstances > 0) {
                    logger.debug(`Removed process from wait queue - ${pid}`)
                    // Also remove it from container map and change its status
                    redisClient.asyncHdel(cntnrMap, info.containerId);
                    setProcessProperty(pid, 'status', 'ABORTED');
                }
                break;               
            case 'RUNNING':
                // If process is currently running, stop the container
                logger.info(`Stopping running process - ${pid}`);
                let containerInfo = await dockerlib.stopContainer(info.containerId);
                logger.debug(`Attempting to stop container - ${info.containerId}`);
                
                // Reread info. The state is changed in the 'container-killed' event handler
                if (containerInfo)
                    info = await exports.getProcessInfo(pid);
                break;
        }
        return info;
    } catch(err) {
        throw(err);
    }
}

/**
 * Return information about a process
 * 
 * Comma separated fields can be passed as a string to choose what information
 * to return. E.g. "containerId,status,timeStarted"
 * 
 * @method getProcessInfo
 * @param {String} pid Process Id
 * @param {String} fields comma separated fields to include in return value
 * @return {Object}
 */
module.exports.getProcessInfo = async function(pid, fields) {
    try {
        let pStr = await redisClient.asyncHget(procMap, pid);
        if (pStr === null) {
            let err = {
                statusCode: 400,
                message: `No such process with id - ${pid}`
            }
            throw (err);
        }
        let pObj = JSON.parse(pStr);
        let output = {};
        
        // Filter which fields to add to response
        if (fields) {
            let fArr = fields.split(",");
            fArr.forEach(element => {
                let elem = element.trim();
                if (pObj[element]) {
                    output[element] = pObj[element];
                }
            });
        } else {
            output = pObj;
        }
        return output;
    } catch (err) {
        throw(err);
    }
}


/**
 * Get information about all processes currently tracked in Redis Hashmap
 * 
 * NOTE: Implementation uses Lodash functionality for filtering/sorting
 * 
 * @method getAllProcessInfo
 * @param {String} status Process state filter - RUNNING/WAITING/FINISHED/ABORTED
 * @param {String} fields comma separated fields to include in return value
 * @param {String} sortBy sort results according to given field
 * @param {String} sortOrder sorting order for above field - asc(default)/desc
 */
module.exports.getAllProcessInfo = async function(status, fields, sortBy, sortOrder) {
    try {
        let allProcesses = await redisClient.asyncHgetall(procMap);
        let pObj = allProcesses;

        // Convert JSON Object to Array of Process Objects
        let result = _.values(pObj).map((elem) => {return JSON.parse(elem)});

        // Filter by status
        if (status) {
            result = _.filter(result, (proc) => {return status === proc.status});
        }

        // If result is empty at this point, there's no need to process further
        if (result.length == 0) {
            return result;
        }

        // First sort by given field
        if (sortBy) {
            // Determine sort order
            if (sortOrder) {
                if (sortOrder !== 'asc' && sortOrder !== 'desc') {
                    let err = {
                        statusCode: 400,
                        message: `Invalid sortOrder in request: '${sortOrder}'. Should be either 'asc' or 'desc'`
                    };
                    throw (err);
                }
            } else {
                sortOrder = 'asc'; // default sort order
            }
            // Check if field exists in returned objects
            if ( (sortBy in _.sample(result)) === false) {
                let err = {
                    statusCode: 400,
                    message: `Invalid sortBy field in request: '${sortBy}'`
                };
                throw(err);
            }
            result = _.orderBy(result, (obj) => { return obj[sortBy] }, sortOrder);
        }

        // Select fields to return
        if (fields) {
            // Convert comma separated string to array of strings
            let fieldsArr = _(fields.split(',')).map(e => {return e.trim()}).value();
            // Pick fields to return
            result = _.map(result, (e) => {return _.pick(e, fieldsArr)});
        }
        return result;
    } catch (err) {
        throw(err);
    }
}


/**
 * Create, Enqueue and Dequeue process, in one shot.
 * 
 * @param {Object} procRequestBody New Process request body
 */
module.exports.runProcessPost = async function(procRequestBody) {
    try {
        let response = {};
        response.statusCode = 500;
        
        // 1. Create Process
        let procObj = await exports.createProcess(procRequestBody);
        let procId = procObj.id;
        response.createResponse = procObj; // response for container creation
        response.statusCode = 202;
        
        // 2. Enqueue Process
        let enqResult = await exports.enqueueProcess(procId);
        response.enqueueResponse = enqResult;
        if (enqResult) {
            // 3. Dequeue process - set throwQueueingErr flag to false
            let deqResult = await exports.dequeueProcess(false);
            response.dequeueResponse = deqResult;
            if (Object.keys(deqResult).includes('statusCode')) { //indicates error
                switch (deqResult.statusCode) {
                    case 503: // queue is full, but process might eventually run
                        response.statusCode = 202;
                }
            } else {
                response.statusCode = 201;
            }
        } else {
            let err = {
                statusCode: 500,
                message: `Unable to enqueue process with ID - ${procId}`
            }
            throw(err);
        }
        return response;
    } catch (err) {
        throw(err);
    }
};

/**
 * Execute a process
 * 
 * Extract and parse the process object encoded as a JSON string in Redis PROCESSMAP hashtable
 * and start the container associated with the process
 * 
 * @method executeProcess
 * @param {string} pid Id of process to execute
 * @return {Object} return id and containerId of started process
 *  
 */
async function executeProcess(pid) {
    try {
        let pStr = await redisClient.asyncHget(procMap, pid); // JSON string of process object
        let pObj = JSON.parse(pStr);
        
        // Start container
        logger.debug(`Executing container with id: "${pObj.containerId}"`);
        let containerInfo = await dockerlib.startContainer(pObj.containerId);

        let result = {
            'processId': pid,
            'containerInfo': containerInfo
        }
        return result;
    } catch (err) {
        err.processId = pid;
        throw(err);
    }
}

/**
 * Set the value of a process' property
 * 
 * The Process object is stored in a Redis Hashmap as a JSON string. This method parses
 * the JSON string as an object, sets/modifies the given property and writes it
 * back as a JSON string.
 * 
 * Since the process can be invoked concurrently by different methods, we need to use
 * locks to avoid race conditions.
 * 
 * @method setProcessProperty
 * @param {String} pid Process Id
 * @param {String} property Property to change
 * @param {String} value Value of property
 */
async function setProcessProperty(pid, property, value) {
    // A unique id for the resource we want to lock
    let resource = `lock:process:${pid}`;

    // the maximum amount of time you want the resource locked,
    let ttl = 100;

    try {
        let lock = await redlock.lock(resource, ttl);
        let pStr = await redisClient.asyncHget(procMap, pid);
        let pObj = JSON.parse(pStr);
        pObj[property] = value;
        await redisClient.asyncHset(procMap, pid, JSON.stringify(pObj));
        lock.unlock();
        return pObj;
    } catch (err) {
        throw (err);
    }
}


/**
 * Get container events by monitoring Docker event stream using docker internal API
 */

let dockerAPIurl = `${config.dockerCfg.protocol}`
                    + `://${config.dockerCfg.host}:${config.dockerCfg.port}`
                    + `/${config.dockerCfg.version}`
                    + '/events';

http.get(dockerAPIurl, function(res) {
    // Events are streamed as concatenated JSON i.e. a response can 
    // contain more than one JSON object. Hence we use JSONStream
    // to parse it
    let stream = JSONStream.parse();
    res.setEncoding('utf8');
    res.pipe(stream);

    // Monitor Docker events
    stream.on('data', (event) => {
        if (event.Type == "container") {
            // logger.debug(`Docker Container Event - Type:${event.Type} Action:${event.Action}`);
            let cid = event.id;
            
            redisClient.hget(cntnrMap, cid, (err, pid) => {
                if (err) throw err;
                
                // Create container event only if the container is present in the map
                if (pid) {
                    switch(event.status) {
                        case 'create': // Container created
                            logger.debug(`(event) container-created: ${event.id}`);
                            break;
                        case 'die': // Container finished running
                            processEvent.emit('container-died', event, pid);
                            break;
                        case 'start': // Container started running
                            processEvent.emit('container-started', event, pid);
                            break;
                        case 'kill': // Container forcibly killed
                            processEvent.emit('container-killed', event, pid);
                            break;
                        case 'destroy': // Container removed
                            processEvent.emit('container-destroyed', event, pid);
                            break;
                    }
                }
            });
        }
    });
});

/**
 * Event handlers for process management
 */

class ProcEventHandler extends EventEmitter {}
const processEvent = new ProcEventHandler();

processEvent.on('process-created', handleProcessCreated);
processEvent.on('process-enqueued', handleProcessEnqueued);
processEvent.on('process-dequeued', handleProcessDequeued);
processEvent.on('process-started', handleProcessStarted);
processEvent.on('process-terminated', handleProcessTerminated);
processEvent.on('container-died', handleContainerDied);
processEvent.on('container-started', handleContainerStarted);
processEvent.on('container-killed', handleContainerKilled);
processEvent.on('container-destroyed', handleContainerDestroyed);

function handleProcessCreated(pObj){
    let pid = pObj.id;
    let state = 'CREATED';

    // Add process to hash of processes maintained on Redis
    redisClient.hset(procMap, pid, JSON.stringify(pObj));
    
    // Add an inverse map from containerID to process Id
    redisClient.hset(cntnrMap, pObj.containerId, pid);

    publishState(pid, state);
}

function handleProcessEnqueued(pid, len){
    publishState(pid, 'WAITING');
}

function handleProcessDequeued(pid){
    publishState(pid, 'DEQUEUED');
}

function handleProcessStarted(pid){
    setProcessProperty(pid, 'timestampStarted', Date.now());
    publishState(pid, 'RUNNING');
}

/**
 * Handle termination of a process. A process can either terminate normally (state=FINISHED) or
 * may be terminated forcibly (state=ABORTED). 
 * 
 * @param {String} pid id of proces
 * @param {String} state state of termination FINISHED|ABORTED
 */
function handleProcessTerminated(pid, state){
    // Remove process id from Running Map
    redisClient.hdel(runningMap, pid);
        
    // Add process id to Hashmap of finished processes
    redisClient.hset(finishedMap, pid, state);
    
    // Set process state
    setProcessProperty(pid, 'status', state);
    setProcessProperty(pid, 'timestampFinished', Date.now());

    // publish message
    publishState(pid, state);

    // Start next process in queue
    exports.dequeueProcess(false)
    .then((data) => {
        let statusCode = _(data).get('statusCode');
        switch (statusCode) {
            case 200:
                logger.debug(`Auto-dequeue successful. DQ'd process had id ${data.processId}`);
                break;
            case 500:
                logger.debug(`Auto-dequeue: Queue is empty!`);
                break;
        }
    })
    .catch ((err) => { 
        logger.error("Error when auto-dequeueing on process terminated signal");
        logger.error(err);

        // Handle case when process terminates before container even starts
        if ( _(err).get("origError.statusCode") == 500 && _(err).has('processId')) {
            let errPid = err.processId;
            logger.error(`Process ${errPid} terminated before container started`);
            // Remove created (but not started) container
            processEvent.emit('process-terminated', errPid, state);
        }
    });
}

function handleContainerStarted(event, pid) {
    logger.debug(`(event) container-started: ${event.id}`);

    // First set process status to RUNNING in process map
    let state = 'RUNNING';
    setProcessProperty(pid, 'status', state);
    
    // Add process id to Running Map
    redisClient.hset(runningMap, pid, true);
}

async function handleContainerDied(event, pid) {
    let cid = event.id;
    logger.debug(`(event) container-died: ${cid}`);
    let state = 'FINISHED';

    let wasAborted = await redisClient.asyncHget(finishedMap, pid);
    
    if (!wasAborted) { // i.e. container was not killed before
        cleanupAfterContainer(cid, pid, state);
    }
    // Remove container - can't always assume that container will be removed
    //dockerlib.removeContainer(cid)
    //.then((id) => { logger.debug(`Removed container: ${id}`)})
}

async function handleContainerKilled(event, pid) {
    let cid = event.id;
    logger.debug(`(event) container-killed: ${cid}`);

    let state = 'ABORTED';
    cleanupAfterContainer(cid, pid, state);

    //processEvent.emit('process-terminated', pid, state);

    // Remove container id from container map
    // redisClient.hdel(cntnrMap, cid);
    
    // Add process id to Hashmap of finished processes
    //await redisClient.hset(finishedMap, pid, state);
    // redisClient.hset(finishedMap, pid, true);
}

async function handleContainerDestroyed(event, pid) {
    let cid = event.id;
    logger.debug(`(event) container-destroyed: ${cid}`);

    redisClient.hget(cntnrMap, cid, (err, pid) => {
        // If a container is removed before it starts:
        // 1. remove corresponding process from the wait queue
        // 2. remove container from container map
        // 3. set corresponding process state to ABORTED
        if (err) throw(err);

        redisClient.lrem(waitQueue, 0, pid);

        // Remove container id from container map
        redisClient.hdel(cntnrMap, cid);
        processEvent.emit('process-terminated', pid, 'ABORTED');
    });
}

function cleanupAfterContainer(cid, pid, state) {
    let delay = 3000; // wait this long for Docker daemon to disconnect networks etc.

    // Remove container id from container map
    redisClient.hdel(cntnrMap, cid);

    setTimeout(() => {
        processEvent.emit('process-terminated', pid, state);
    }, delay);
}

/**
 * Publish process state onto redis channel
 *
 * @param {String} pid Process ID
 * @param {String} state Process runtime status
 */
function publishState(pid, state) {
    let message = `${pid}:${state}`;
    logger.info(`(event) Process ${message}`);
    publishClient.publish(statusChannel, message);
}

/**
 * Examine Redis WAITING queue to get pid of waiting process
 */
async function getPidOfWaitingProcess() {
    try {
        let waitQLen = await redisClient.asyncLlen(waitQueue);
        if (waitQLen > 0) {
            let pid = await redisClient.asyncRpop(waitQueue);
            let pStr = await redisClient.asyncHget(procMap, pid); // JSON string of process object
            let pObj = JSON.parse(pStr);
            let cid = pObj.containerId;
            let info = await dockerlib.getContainerInfo(cid);
            if (info) {
                return pid;
            }
        }
        return null; // should not happen
    } catch(err) {
        logger.error(`Error getting PID of waiting process`);
        logger.error(err);
        if (_(err).get('reason') === "no such container") {
            setProcessProperty(pid, 'status', state);
            // Container of dequeued process not available
            getPidOfWaitingProcess();
        }
    }
}