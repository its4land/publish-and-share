'use strict';

const config = require('../config/config');
const requestPromise = require('request-promise-native');
const util = require('util');
const _ = require('lodash');
const http = require('http');
const redis = require('redis');

const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const toolsLib = require('./Tools');

const TABLEID = 'PROCESSES_TABLE';
const PARAMETERS_TABLEID = 'PROCESS_PARAMETERS_TABLE';
const ENTRYPOINT_TABLEID = 'ENTRYPOINT_TABLE';
const LOGS_TABLEID = 'LOGS_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';
const TOOLS_TABLEID = 'TOOLS_TABLE';
const RESULTS_TABLEID = 'RESULTS_TABLE';

const PROP_PROJECTS = 'Projects';
const PROP_TOOL = 'Tool';
const PROP_PROJECT = 'Project';
const PROP_LOGS = 'Logs';
const PROP_RESULTS = 'Results';
const PROP_PROCESSID = 'processuid';

/*  Process API states allowed to be writted to the database field 'status'.
    Other valid process states such as 'DEQUEUED' are ignored here 
 */
const VALID_PROCESS_STATES = ['CREATED', 'WAITING', 'RUNNING', 'FINISHED', 'ABORTED'];

// Redis connections for getting process status from Process API using message queue
const redis_opts = {
    host: config.processAPI.redis.host,
    port: config.processAPI.redis.port
}
const PROCESS_STATUS_CHANNEL = config.processAPI.redis.status_channel;

let statusChannelClient = redis.createClient(redis_opts);

// NOTE: A succesful connection is optional during development, but is mandatory during deployment
statusChannelClient.on("error", function(err) {
    if (err.code === "ECONNREFUSED") {
        console.log("ERROR! Cannot connect to Redis client with options: ", JSON.stringify(redis_opts));
        console.log("Redis connection is neccesary to auto-refresh process status in the database.");
        console.log("Please make sure the connection is available if this feature is needed!");
        statusChannelClient.quit();
    }
})

function ProcessesHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
ProcessesHandler.prototype.constructor = ProcessesHandler;
ProcessesHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ProcessesHandler.prototype = new reqHnd.RequestHandler();

/**
 * 
 * @param {Object} properties item metadata
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {String} uid of the new item
 */
ProcessesHandler.prototype.createNewItem = async function(properties, transaction = null) {
    let timestamp = new Date(Date.now());
    let processProperties = {
        'projectuid': properties.Project.UID,
        'toolname': properties.Tool.ToolName,
        'toolversion': properties.Tool.Version,
        'createdby': "dummy",
        'createdat': timestamp,
        'lastmodifiedby': "dummy",
        'lastmodifiedat': timestamp,
        'status': "WAITING"
    };
    
    let toolImage = await toolsLib.queryItems(false, undefined, processProperties.toolname, processProperties.toolversion);
    let toolImageUID, dockerImageId, err;
    switch (toolImage.length) {
        case 1:
            let tImg = toolImage[0];
            if ('Image' in tImg) {
                toolImageUID = tImg.Image.UID;
                dockerImageId = tImg.Image.Image; // bad choice for property name :-(
                if (!processProperties.toolversion) {
                    // If version is not defined in the request body, modify it now
                    processProperties.toolversion = tImg.Version
                }
            }
            break;
        case 0:
            throw(dblib.customErr(404, "No matching tool found"));
        default:
            throw(dblib.customErr(500, "No unique tool found"));
    }
    if (!dockerImageId) {
        err = dblib.customErr(500, "Unable to find Docker Image");
        throw(err);
    }
    properties.dockerImageId = dockerImageId;


    let clauses = {
        'toolimageuid': toolImageUID,
        'name': properties.Tool.EntryPoint.EntryPointName
    }
    let table = dblib.getTable(ENTRYPOINT_TABLEID);
    if (table != null) {
        let entrypointInfo = await table.getQueryResult(null, clauses, undefined, false, true);
        if (entrypointInfo && entrypointInfo.length == 1) {
            properties.entrypoint = dblib.getItemProperty(entrypointInfo[0], 'entrypoint');
            processProperties.entrypoint = dblib.getItemProperty(entrypointInfo[0], 'uid');
        } else {
            throw(dblib.customErr(500, "Entrypoint information is not unique"))
        }
    }

    this._reqBody = properties;
    return await this.constructor.prototype.createNewItem.call(this, processProperties, transaction);

}

ProcessesHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let dockerArgs = [];
    if (typeof this._reqBody.entrypoint !== "undefined")
        dockerArgs.push(this._reqBody.entrypoint);

    if ('Parameter' in this._reqBody.Tool.EntryPoint) {
        let parameters = this._reqBody.Tool.EntryPoint.Parameter;
        if (parameters.length > 0) {
            for (let param of parameters) {
                let key = param.ParameterName;
                dockerArgs.push(key);
                let value = undefined;
                if ('ParameterValue' in param) {
                    value = param.ParameterValue;
                    dockerArgs.push(value);
                }
                let paramProps = {
                    'processuid': itemUID,
                    'parametername': key,
                    'parametervalue': value
                }
                let table = dblib.getTable(PARAMETERS_TABLEID);
                if (table != null) 
                    await table.createNewItem(paramProps, transaction);
            }
        }
    }
    
    this._newProcessRequest = {
        toolImageId: this._reqBody.dockerImageId,
        processId: itemUID,
        args: dockerArgs,
        env:
        [
            `I4L_PROJECTUID=${properties.projectuid}`,
            `I4L_PROCESSUID=${itemUID}`,
            `I4L_PUBLICAPIURL=${this._api_url}`
        ]
    };

    // Some tools may required special (predefined) Docker arguments
    let dockerParams = this.getPreDefinedDockerParams();

    if (dockerParams !== null) {
        this._newProcessRequest.dockerParams = dockerParams;
    }
    return true;
}

/**
 * does some post processing if necessary, after the transaction is finished
 * 
 * @param {String} uid UUID of the item to be updated
 * @param {Object} properties to be updated
 * @param {boolean} isNew true after 'insert', false after 'update'
 * @returns {boolean} success
 */
ProcessesHandler.prototype.postProcessing = async function(itemUID, properties, isNew) {
    try {
        let logEntry = {
            LogSource: 'PublishAndShare',
            LogLevel: 'info',
            LogMsg: 'Starting process'
        };
        module.exports.createProcessLog(itemUID, logEntry, false, null);
        let response = await this.startProcess(config.processAPI.url, properties);
        
        // Handle post processing of results for 'special' processes
        this.handlePredefinedParamsPostProcessing(itemUID, response);

        return response;
    } catch(err) {
        console.log("Error occured when starting process");
        throw(err);
    }
    // return true;
}

ProcessesHandler.prototype.prepareItems = async function (items, embed, fields) {
    return await this.constructor.prototype.prepareItems.call(this, items, embed, fields);
}

ProcessesHandler.prototype.prepareItem = async function (item, embed, fields) {
    //embed = embed === undefined ? 'Project,Tool,Logs' : embed;
    let table = this.getTable();
    if (table != null) {
        let itemUID = table.getRecordUID(item);
        if (itemUID) {
            await dbrel.setDirectRelationAsProperty(item, PROP_PROJECT, dblib.getTable(PROJECTS_TABLEID), PROP_PROJECT, true); 
            if (!dbrel.contains(embed, PROP_PROJECT)) {
                let project = dblib.getItemProperty(item, PROP_PROJECT);
                if (project != null) {
                    let data = {};
                    data["UID"] = project["UID"];
                    data["Name"] = project["Name"];
                    data["Description"] = project["Description"];
                    dblib.setItemProperty(item, PROP_PROJECT, data);
                }
            }
            let props = dblib.publishItems(item)
            if (props.ToolName) {
                let tool = {}
                let tools = await toolsLib.queryItems(false, undefined, props.ToolName, props.ToolVersion);
                if (tools.length == 1) {
                    if (dbrel.contains(embed, PROP_TOOL))
                        tool = tools[0];
                    else {
                        tool['ToolName'] = tools[0].Name;
                        tool['Version'] = tools[0].Version;
                        table = dblib.getTable(ENTRYPOINT_TABLEID);
                        if (table != null) {
                            let entrypoint = await table.getItemByID(props.EntryPoint, ['name'], false);
                            table = dblib.getTable(PARAMETERS_TABLEID);
                            if (table != null) {
                                let clauses = {'processuid': itemUID};
                                let parameters = await table.getQueryResult(['parametername', 'parametervalue'],
                                    clauses, undefined, true, false);
                                tool['EntryPoint'] = {
                                    "EntryPointName": dblib.getItemProperty(entrypoint, "name"),
                                    "Parameter": parameters
                                }
                                delete props.EntryPoint;
                            }
                        }
                    }
                    /*
                    else {
                        table = dblib.getTable(TOOLS_TABLEID);
                        if (table != null)
                            tool = table.getRecordUID(tools[0]);
                    }
                    */
                }
                props[PROP_TOOL] = tool;
            }
            delete props.ToolName;
            delete props.ToolVersion;

            props[PROP_LOGS] = await module.exports.getProcessLogs(itemUID, false, undefined, undefined, undefined, 'logseq desc');

            await dbrel.setDirectRelationsAsProperty(item, dblib.getTable(RESULTS_TABLEID), PROP_PROCESSID, PROP_RESULTS, PROP_RESULTS);
            if (!dbrel.contains(embed, PROP_RESULTS)) {
                let results = dblib.getItemProperty(item, PROP_RESULTS);
                if (results != null) {
                    let nresults = [];
                    for (let result of results) {
                        let data = {};
                        data["ResultType"] = result["ResultType"];
                        data["ResultUID"] = result["ResultUID"];
                        nresults.push(data);
                    }
                    props[PROP_RESULTS] = nresults;
                }
            }

            return true;
        }
    }
    return false;
}

ProcessesHandler.prototype.startProcess = async function (processApiUrl, procRequestBody) {
    try {
        let options = {
            method: 'POST',
            url: processApiUrl + "/process/run",
            json: true,
            body: this._newProcessRequest
        };

        //console.log("Starting process with options", options);
        return requestPromise.post(options);
    } catch(err) {
        throw(err);
    }
}

/**
 * Get process status for all items from the ProcessAPI using only a single API call
 * and update DB table if needed
 * 
 * @param {Array} pInfoArr Information about all processes in Database
 * @returns {Object}
 */
ProcessesHandler.prototype.updateAllProcessStatus = async function (pInfoArr) {
    try {
        let url = `${config.processAPI.url}/process/all/info`;
        let options = {
            method: 'GET',
            uri: url,
            resolveWithFullResponse: true, // return full response object instead of just the body
            simple: false, // don't treat 400,404 etc. as exceptions
            json: true // body is JSON
        };
        let response = await requestPromise.get(options);

        if (response.statusCode == 200) {
            // Build a lookup table from the process API response which is array of objects
            let latestPInfo = {};
            for (let p of response.body) {
                latestPInfo[p.processId] = p;
            }

            // Compare status obtained from the DB against latest results
            for (let i in pInfoArr) {
                let pInfo = pInfoArr[i];
                let needsUpdate = false;
                let latestStatus = undefined;

                // Change Process Status only if it is waiting/running
                if (pInfo.Status == "WAITING" || pInfo.Status == "RUNNING") {
                    if (pInfo.UID in latestPInfo) {
                        latestStatus = latestPInfo[pInfo.UID].status;
                        if (latestStatus != pInfo.Status && pInfo.status != "FINISHED") {
                            needsUpdate = true;
                        }
                    }  else {
                        // Could not find process with given UID
                        // Mark it as a zombie process (status = -2)
                        needsUpdate = true;
                        latestStatus = "ZOMBIE";
                    }

                    if (needsUpdate) {
                        let props = {
                            Status: latestStatus
                        }
                        let table = this.getTable();
                        if (table != null)
                            table.updateItemByUID(pInfo.UID, props);
                        pInfoArr[i].Status = latestStatus;
                    }
                }
            }
        } else {
            console.log("Empty response from Process API");
        }
        return pInfoArr;
    } catch (err) {
        console.log(err);
    }
}

/**
 * Get latest process status from the ProcessAPI and update DB table if needed
 * 
 * @param {Object} pInfo Information about a process
 * @returns {Object}
 */
ProcessesHandler.prototype.updateProcessStatus = async function (pInfo) {
    try {
        // Update table with latest status
        let props = {
            Status: pInfo.Status
        }
        let table = this.getTable();
        if (table != null) {
            table.updateItemByUID(pInfo.UID, props);
        }
        let logEntry = {
            LogSource: 'PublishAndShare',
            LogLevel: 'info',
            LogMsg: `Process status changed to ${pInfo.Status}`
        };
        module.exports.createProcessLog(pInfo.UID, logEntry, false, null);
        return pInfo;
    } catch (err) {
        console.log(err);
    }
}

/**
 * Get latest process status from the Process API
 * 
 * @param {String} pid Process Id
 * @returns {Integer}
 */
ProcessesHandler.prototype.getProcessStatus = async function (pid) {
    try {
        let url = `${config.processAPI.url}/process/${pid}`;
        let options = {
            method: 'GET',
            uri: url,
            resolveWithFullResponse: true, // return full response object instead of just the body
            simple: false, // don't treat 400,404 etc. as exceptions
            json: true // body is JSON
        };

        let response = await requestPromise.get(options);
        let statusTxt = undefined;
        if (response.statusCode == 200) {
            let info = response.body;
            statusTxt = info.status; // mapProcessStatus(info);
        } else if (response.statusCode == 400) {
            // ProcessAPI is unable to find the process in the in-memory store
            statusTxt = "ZOMBIE";
        }
        return statusTxt;
    } catch (err) {
        console.log("Error getting latest process status", err);
    }
}


/**
 * Get predefined Docker parameters for special tools
 * 
 * @param {object} reqBody Body of new Process request
 */
ProcessesHandler.prototype.getPreDefinedDockerParams = function() {
    // Dict of tools, their entrypoints and corresponding docker params
    let toolParams = {
        'SmartSkeMa' : {
            'SmartSkeMa': {
                'ExposedPorts': {'5000/tcp': {}},
                'HostConfig': {
                    'PortBindings': {
                        '5000/tcp': [
                            {'HostPort': '5000-5020'}
                        ]
                    }
                }
            }
        }
    };

    let toolName = this._reqBody.Tool.ToolName;
  
    if (Object.keys(toolParams).includes(toolName)) {
        let entrypoint = this._reqBody.Tool.EntryPoint.EntryPointName;
        if (Object.keys(toolParams[toolName]).includes(entrypoint)) {
            return toolParams[toolName][entrypoint];
        }
    }
    return null;
};

/**
 * Handle post processing of special tools after their container has been created and started
 */
ProcessesHandler.prototype.handlePredefinedParamsPostProcessing = function(itemUID, response) {
    let toolsPostProcessingHandler = {
        'SmartSkeMa' : {
            'SmartSkeMa': {
                'handler': function() {
                    let dqResponse = _.get(response, 'dequeueResponse');
                    let respCode = _.get(dqResponse, 'statusCode');
                    if (respCode == 200) {
                        let ports = _.get(response, 'dequeueResponse.containerInfo.NetworkSettings.Ports');
                        let values = (_.values(ports))[0][0];
                        let port = values['HostPort'];
                        let toolUrl = `${config.processAPI.protocol}://${config.processAPI.host}:${port}`
                        let logEntry = {
                            LogSource: 'PublishAndShare',
                            LogLevel: 'notify',
                            LogMsg: `Tool URL: ${toolUrl}`
                        };
                        module.exports.createProcessLog(itemUID, logEntry, false, null);
                    } else {
                        let logEntry = {
                            LogSource: 'PublishAndShare',
                            LogLevel: 'error',
                            LogMsg: `Cannot generate Tool URL. Reason - ${JSON.stringify(dqResponse)}`
                        };
                        module.exports.createProcessLog(itemUID, logEntry, false, null);
                    }
                }
            }
        }
    };

    let toolName = this._reqBody.Tool.ToolName;
    let entrypoint = this._reqBody.Tool.EntryPoint.EntryPointName;
    
    if (toolName && entrypoint) {
        let handler = _.get(toolsPostProcessingHandler, `${toolName}.${entrypoint}.handler`);
        if (handler) {
            handler();
        }
    }
}

const handler = new ProcessesHandler();

/**
 * 
 * @param {Object} properties Process request body
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function (request, properties, envelope, embed, processUID, transaction = null) {
    try {
        await procAPIHostPing();
        handler._api_url = `http://${request.headers.host}${request.baseUrl}`
        return await handler.createNewItemContent (properties, envelope, embed, processUID, transaction);
    } catch (err) {
        if ('code' in err && err.code === "ECONNREFUSED")
            throw dblib.customErr(500, "Unable to reach Process API host");
        else
            throw(err);
    }
};

/**
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUID of process
 * @param {String[]} projectUID UUIDs of projects
 * @param {Number} status Runtime state of process
 * @param {String[]} toolUID UUIDs of tools
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of fields to include in output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function(envelope, uid, projectUID, status, toolUID, page, sort, fields, embed) {
    let properties = {};
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projectUID); 
    reqHnd.addQueryValue(properties, 'status', status); 
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
}

/**
 * Return process information of a single process
 * 
 * @param {String} process_uid UUID of process
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}

/**
 * Create and persist logs associated with a process, in the database
 * 
 * @param {String} processUID UUID of process
 * @param {Object} newLogEntry LogEntry object (see spec)
 * @param {Boolean} envelope 
 */
module.exports.createProcessLog = async function(processUID, newLogEntry, envelope, transaction = null) {
    let table = dblib.getTable(LOGS_TABLEID);
    if (table != null && newLogEntry != null) {
        newLogEntry.processuid = processUID;
        newLogEntry.logdate = new Date(Date.now());
        newLogEntry.logseq = processUID;  // korrekt! (wg Ermittlung der neuen Sequenznummer)
        return await table.createNewItem(newLogEntry, transaction);
    }
    return null;
}

/**
 * 
 * @param {String} processUID UUID of process
 * @param {String} envelope 
 * @param {String} loglevel Logging level to display
 * @param {String} logsource Source of logs
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.getProcessLogs = async function (processUID, envelope, loglevel, logsource, page, sort, fields, embed) {
    let table = dblib.getTable(LOGS_TABLEID);
    if (table != null) {
        let clauses = {};
        reqHnd.addQueryValue(clauses, 'processuid', processUID);
        reqHnd.addQueryValue(clauses, 'logsource', logsource); 
        reqHnd.addQueryValue(clauses, 'loglevel', loglevel); 
        fields = fields ? fields : ['logseq', 'logdate', 'logsource', 'loglevel', 'logtext'];  //dbutils.LOGS_TABLE_COLUMNS;
        return handler.publishResult(await table.getQueryResult(fields, clauses, sort, true, false));
        // TODO : filtering, sorting etc.
    }
    return null;
}

/**
 * Add given item to the projectcomputation results table
 * @param {String} processUID UID of process whichj generated the result
 * @param {String} resultUID UID of item to be treated as result
 * @param {String} resultType type of result
 * @param {Object} transaction Transaction object of which this is a part
 */
module.exports.addItemToComputationResults = async function(processUID, resultUID, resultType, transaction=null) {
    let table = handler.getTable();
    if (table != null)
        try {
            let row = await table.getItemByID(['projectuid'], processUID, false, true);
            if (row instanceof dblib.Record) {
                let properties = {
                    projectuid: row.properties['projectuid'],
                    computedate: new Date(Date.now()),
                    processuid: processUID,
                    resulttype: resultType,
                    resultuid: resultUID
                };
                table = dblib.getTable(RESULTS_TABLEID);
                if (table != null)
                    return await table.createNewItem(properties, transaction);
            }
            return null;
        } catch (err) {
            // Do nothing
            return undefined;
        }
}

/**
 * Simply check if the configured Process API host is alive and accessible
 */
let procAPIHostPing = function() {
    return new Promise((resolve, reject) => {
        let options = {
            method: 'HEAD',
            host: config.processAPI.host,
            port: config.processAPI.port,
            path: `/${config.processAPI.api_root}/${config.processAPI.api_version}/about`
        };
        let req = http.request(options, (resp) => {
            // console.log(resp.headers);
            resolve(resp);
        });
        req.on('error', (e) => {
            console.log("Error accessing Process API", e);    
            reject(e);
        });
        req.end();
    });
}

/**
 * Listen to events on the Process API's Redis status channel
 */
 statusChannelClient.on("message", function(channel, message) {
    // Messages are in the form of the string "<pid>:<status>"
    let [pid, status] = message.split(':');

    if (pid != null && status != null) {
        if (VALID_PROCESS_STATES.indexOf(status) > -1) {
            let pInfo = {
                UID: pid,
                Status: status
            }
            handler.updateProcessStatus(pInfo);
        }
    } else {
        console.log("Ignoring Message invalid format received on process status channel: ", message);
    }
});

/**
 * Subscribe to the Process API's Redis status channel
 */
statusChannelClient.subscribe(PROCESS_STATUS_CHANNEL);
