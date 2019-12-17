'use strict';

const Docker = require('dockerode');
const winston = require('winston');
const _ = require('lodash');
const config = require('../settings/config')

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
        new winston.transports.File({filename: 'logs/docker.log'})
    ],
    level: 'debug',
    format: winston.format.combine(winston.format.timestamp(), msgFormat)
});

let docker = new Docker({
    host: config.dockerCfg.host,
    port: config.dockerCfg.port,
    protocol: config.dockerCfg.protocol,
    version: config.dockerCfg.version
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
 * @param err {Object} Error object supplied by Docker API
 * @return {Object}
 * 
 */
async function errorHandler(caller, err) {
    logger.error(`${err}`);

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

/**
 * Return list of Docker images filtered by given parameters
 * 
 * @method getImages
 * @param {*} options Query parameters passed to /images endpoint
 * @return {Object[]} Array of (matching) images
 * 
 * NOTE: Docker images for the its4land project should follow the following 'name:tag' format
 * during image creation (docker build -t <name[:tag]>):
 * 
 * - its4land/<name-of-tool>[:tag]
 * 
 * E.g. docker build -t its4land/drawandmake:v1
 * 
 * - `tag` is optional and if omitted, Docker automatically assigns 'latest' as the tag
 * - Mutliple `name:tag`s can be assigned to the same image
 * 
 * Additionally, the Docker image should have the following `key=value` pairs 
 * as `LABEL` (see Dockerfile reference) metadata
 * - name="name-of-tool"
 * - version="Tool version contained in this image"
 * - description="Description of toool"
 * 
 * While it is not necessary that the *name-of-tool* in the LABEL metadata is the same as 
 * the one in `its4land/<name-of-tool>`, it is highly recommended to keep them same for consistency.
 * 
 * If tag is omitted, Docker automatically assigns the `latest` tag to it
 */
module.exports.getImages = async function(options) {
    try {
        // let images = await docker.listImages({filters: {'labve2l': ['foo']}});
        let filters = {},
            sortByVersion, sortByCreated = false;
        if (options.toolName) {
            filters.label = [`name=${options.toolName}`];
        }
        if (options.latestByTag == true) {
            // The following filter assumes that images follow 'its4land/<tool-name>[:tag]' pattern
            filters.reference = ["*/*:latest"];
        } else if (options.latestByVersion == true) {
            // 'LABEL version=xx' must be added to image metadata during creation, for this to work
            sortByVersion = true;
        } else if (options.latestByCreated == true) {
            sortByCreated = true;
        }
        logger.debug({
            'function-name': "getImages",
            'options': options,
            'filters': filters
        });
        
        let images = await docker.listImages({"filters": filters});

        // No images were found
        if (images.length == 0) throw({statusCode: 404});
        
        // Perform filtering/sorting of images after they are obtain from Docker
        if (sortByVersion) {
            let latestImageByVersion = _(images)
                                .filter((elem) => {
                                    // Image should have LABEL metadata that includes 'version'
                                    return 'Labels' in elem 
                                            && elem.Labels != null 
                                            && 'version' in elem.Labels
                                })
                                // Sort so that most recent version of image is first
                                .orderBy(['Labels.version'], ['desc'])
                                // Group them by name of the image
                                .groupBy('Labels.name')
                                // Now select the latest version in each group
                                .map((imgInfo, imgName) => {
                                    let latestVersion = imgInfo[0].Labels.version;
                                    return _(imgInfo)
                                            .filter((e) => {
                                                return latestVersion === e.Labels.version
                                            })
                                });
            logger.debug({
                'function' : 'getImages',
                'latestVersionByImage' : latestImageByVersion
            });
            return latestImageByVersion;
        } else if (sortByCreated) {
            let latestImageByCreated = _(images)
                                    .filter((elem) => {
                                        // Image should have LABEL metadata that includes 'name'
                                        return 'Labels' in elem 
                                                && elem.Labels != null 
                                                && 'name' in elem.Labels
                                    })
                                    // Sort in descending order by creation timestamp
                                    .orderBy(['Created'], ['desc'])
                                    // Group by image name
                                    .groupBy('Labels.name')
                                    // Select most recently created image in each group
                                    .map ((imgInfo, imgName) => {
                                        return imgInfo[0];
                                    });
            logger.debug({
                'function' : 'getImages',
                'latestImageByCreated' : latestImageByCreated
            });
            return latestImageByCreated;
        }

        return images;
    } catch (err) {
        let handledErr = await errorHandler('getImages', err);
        throw(handledErr);
    }
}

/**
 * Return information about image with given id. Information object is the same as
 * the one obtained by running the `docker inspect` command
 * 
 * @method getImageById
 * @param {String} Id of image
 * @return {Object}
 */
module.exports.getImagesById = async function(id) {
    try {
        let img  = new Docker.Image(docker.modem, id);
        let info = await img.inspect();
        logger.debug({
            'function': 'getImagesById',
            'info': info
        });
        return info;
    } catch (err) {
        let handledErr = await errorHandler('getImageById', err);
        throw(handledErr);
    }
}

/**
 * Create a container for a given image
 * 
 * @method createContainer
 * @param {String} id of image
 * @return {String} id of container
 */
module.exports.createContainer = async function(requestBody) {
    try {
        let params = {
            Image: requestBody.id,
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            HostConfig: {
                AutoRemove: true,
            },
            OpenStdin: false,
            StdinOnce: false
        };

        let optionalArgsMap = {
            "args": "Cmd",
            "env": "Env",
            "dockerParams": "dockerParams"
        }
        
        // Replace optional parameters by corresponding property in Docker body
        for (let optArg of Object.keys(optionalArgsMap)) {
            if (Object.keys(requestBody).includes(optArg)) {
                switch(optArg) {
                    case "dockerParams":
                        _.merge(params, requestBody.dockerParams)
                        break;
                    default:
                        params[optionalArgsMap[optArg]] = requestBody[optArg];  
                }
            }
        }

        logger.debug({
            'function': 'createContainer',
            'creation params': params
        });

        let container = await docker.createContainer(params);
        return {
            id: container.id
        };
    } catch(err) {
        let handledErr = await errorHandler('createContainer', err);
        throw(handledErr);
    }
}

/**
 * Start a container with given id
 * 
 * @method startContainer
 * @param {String} id of container
 * @return {}
 */
module.exports.startContainer = async function(id) {
    try {
        let container = await docker.getContainer(id);
        let data = await container.start()
        let timeout = 6 * 60 * 60; // kill the container after 6 hours
        let timeoutms = timeout * 1000;
        setTimeout(()=> {
            removeContainerAfterTimeout(id, timeout);
        }, timeoutms);
        return container.inspect(id);
    } catch(err) {
        let handledErr = await errorHandler('startContainer', err);
        throw(handledErr);
    }
}

/**
 * Stop a container with given id
 * 
 * @method stopContainer
 * @param {String} id of container
 * @return {}
 */
module.exports.stopContainer = async function(id) {
    try {
        let container = await docker.getContainer(id);
        let data = await container.stop()
        // logger.debug({
        //     'function': 'stopContainer',
        //     'data': data
        // });
        return data;
    } catch(err) {
        let handledErr = await errorHandler('stopContainer', err);
        throw(handledErr);
    }
}

/**
 * Kill a container with given id
 * 
 * @method killContainer
 * @param {String} id of container
 * @return {}
 */
module.exports.killContainer = async function(id) {
    try {
        let container = await docker.getContainer(id);
        let data = await container.kill()
        logger.debug({
            'function': 'killContainer',
            'data': data
        });
        return data;
    } catch(err) {
        let handledErr = await errorHandler('killContainer', err);
        throw(handledErr);
    }
}

/**
 * Remove a container with the given id
 * 
 * @method removeContainer
 * @param {String} id of container
 * @return {}
 * 
 * If the container is running/paused, then kill it before removing
 */
module.exports.removeContainer = async function(id) {
    try {
        let container = await docker.getContainer(id);
        let containerInfo = await container.inspect();
        let retVal = {};

        if ( 'State' in containerInfo
            && containerInfo.State.Running 
            || containerInfo.State.Paused 
            || containerInfo.State.Restarting) {
            await container.kill();
            retVal = await container.remove();
        } else {
            retVal = await container.remove();
        }
        logger.debug({
            'function': 'killContainer',
            'retVal': retVal
        });
        return retVal;
    } catch(err) {
        let handledErr = await errorHandler('killContainer', err);
        throw(handledErr);
    }
}

/**
 * Get information about a container
 * 
 * @param {String} id Id of container
 */
module.exports.getContainerInfo = async function(id) {
    try {
        let container = await docker.getContainer(id);
        let containerInfo = await container.inspect();
        return containerInfo;
    } catch(err) {
        throw(err);
    }
}

let removeContainerAfterTimeout = async function(id, timeout) {
    try {
        await exports.removeContainer(id);
        logger.info(`Timeout: Stopping container with ID '${id}' after ${timeout} seconds`)
    } catch(err) {
        if (err.statusCode === 404) {
            logger.info("Error when auto-removing container after timeout. Container was possibly removed earlier");
        }
    }
}