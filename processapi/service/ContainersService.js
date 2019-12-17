'use strict';

const docker = require('../lib/docker');
const writer = require('../utils/writer');
/**
 * Create Docker container with given parameters
 * Creates a container for a given Docker image using the given arguments. Returns the id of the started container.
 *
 * containerRequest ContainerRequest Parmeters required for container creation. Requires that the executable program in the image is defined in the Dockerfile using the `ENTRYPOINT` instruction. Arguments supplied here as an array are then passed as parameters to the executable. (optional)
 * returns ContainersCreateResponse
 **/
exports.createContainer = function(containerRequest) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      docker.createContainer(containerRequest)
      .then((val) => resolve(val))
      .catch(err => {reject(writer.respondWithCode(err.statusCode, err))});
    }
  });
}


/**
 * List available Docker images for platform tools
 * The list of retrieved images can be filtered by **name** and (docker) **tag**. The suggested Docker convention for naming images is `username/repository:tag` ([more details](https://docs.docker.com/glossary/?term=repository)). In *its4land* this convention is adopted and an image is identified by `its4land/<name-of-tool>[:tag]`. Name is also supplied via `LABEL name=<name-of-tool>` as image metadata ([LABEL reference](https://docs.docker.com/engine/reference/builder/#label)).  
 *
 * toolName String Filter images by tool name. This filter uses the `LABEL name=<value>` metadata supplied during image creation. E.g. If the tool is named `foo`, then the query becomes `/toolImages?toolName=foo` (optional)
 * tag String Filter images by tag. (optional)
 * latestByTag Boolean If `true`, get only the images tagged as latest. Implies `tag=latest` and overrides any supplied tag filters. Has precedence over `latestByVersion` and `latestByCreated` filters when used together. (optional)
 * latestByVersion Boolean If `true`, get the latest versions of images (if version metadata is available). If two or more images have the same name and version metadata, all are returned. If version is not available in metadata, return nothing. Has precedence over `latestByCreated` filter when used together. (optional)
 * latestByCreated Boolean If `true`, get the latest versions of the images sorted by their creation time. (optional)
 * returns List
 **/
exports.getToolImages = function(toolName,tag,latestByTag,latestByVersion,latestByCreated) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    var enableExample = false;
    examples['application/json'] = [ {
      "Containers" : -1,
      "Created" : 1531837230,
      "Id" : "sha256:a8e0cd29a9685a51f5de70b87ed79fb77af5288177e85554974c9e8425854145",
      "Labels" : {
        "description" : "its4land project sketch and make tool",
        "name" : "sketch-and-make",
        "version" : "1.0.0"
      },
      "ParentId" : "sha256:a89c6f79ea098c12c4e76078338e8631b4aa971e7b635a4e3131f39cbcc42d1f",
      "RepoDigests" : null,
      "RepoTags" : [ "its4land/sketch-and-make:latest" ],
      "SharedSize" : -1,
      "Size" : 934304535,
      "VirtualSize" : 934304535
    }, {
      "Containers" : -1,
      "Created" : 1531837230,
      "Id" : "sha256:a8e0cd29a9685a51f5de70b87ed79fb77af5288177e85554974c9e8425854145",
      "Labels" : {
        "description" : "its4land project sketch and make tool",
        "name" : "sketch-and-make",
        "version" : "1.0.0"
      },
      "ParentId" : "sha256:a89c6f79ea098c12c4e76078338e8631b4aa971e7b635a4e3131f39cbcc42d1f",
      "RepoDigests" : null,
      "RepoTags" : [ "its4land/sketch-and-make:latest" ],
      "SharedSize" : -1,
      "Size" : 934304535,
      "VirtualSize" : 934304535
    } ];

    if (enableExample && Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      let opts = {
        toolName: toolName,
        tag: tag,
        latestByTag: latestByTag,
        latestByVersion: latestByVersion,
        latestByCreated: latestByCreated
      }
      docker.getImages(opts)
      .then((val) => {resolve(val);})
      .catch((err) => {reject(writer.respondWithCode(err.statusCode, err));});
    }
  });
}


/**
 * List information about image with given id
 * The information is the same as the one obtained by running the `docker inspect` command on an image.
 *
 * id String Docker Id of the requested Tool.  `repository:tag` can also be used in place of Id.
 * returns ToolImage
 **/
exports.getToolImagesById = function(id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      docker.getImagesById(id)
      .then((val) => {resolve(val)})
      .catch((err) => {reject(writer.respondWithCode(err.statusCode, err));})
    }
  });
}


/**
 * Force stop a running Docker container
 * Forcibly stop a running container. Send SIGKILL
 *
 * cid String Docker ID of image to run
 * no response value expected for this operation
 **/
exports.killContainer = function(cid) {
  return new Promise(function(resolve, reject) {
    docker.killContainer(cid)
    .then(()=>resolve(writer.respondWithCode(204)))
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err))});
  });
}


/**
 * Remove container
 * Remove a container. If it is running, it is killed before removing it.
 *
 * cid String Docker ID of image to run
 * no response value expected for this operation
 **/
exports.removeContainer = function(cid) {
  return new Promise(function(resolve, reject) {
    docker.removeContainer(cid)
    .then(()=>resolve(writer.respondWithCode(204)))
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err));});
  });
}


/**
 * Start a Docker container with the given id
 * Internally invokes `docker run` on the given image. Returns the id of the started container
 *
 * cid String Docker ID of image to run
 * no response value expected for this operation
 **/
exports.startContainer = function(cid) {
  return new Promise(function(resolve, reject) {
    docker.startContainer(cid)
    .then(()=>resolve(writer.respondWithCode(204)))
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err));});
  });
}


/**
 * Stop a running Docker container
 * Stop a running container. Attempts to stop via SIGTERM first and SIGKILL after 5 seconds
 *
 * cid String Docker ID of image to run
 * no response value expected for this operation
 **/
exports.stopContainer = function(cid) {
  return new Promise(function(resolve, reject) {
    docker.stopContainer(cid)
    .then((val)=>resolve(writer.respondWithCode(204)))
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err))});
  });
}

