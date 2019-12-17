'use strict';

const processManager = require('../lib/process');
const writer = require('../utils/writer');

/**
 * Create a process associated with a tool
 * A process is started in response to the user selecting a tool and starting the operation. In addition to encaspulating a container which actually runs the tool, the data model of a process also consists of metadata and parameters which are passed to the container as arguments.  For creation, `toolid` is the only required parameter. The fields `id` and `containerid` are filled in dynamically. Ohter fields are optional
 *
 * body ProcessRequest Process object that is enqueued for running
 * returns Process
 **/
exports.createProcess = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      processManager.createProcess(body)
      .then(val => resolve(val))
      .catch(err => reject(writer.respondWithCode(err.statusCode, err)));
    }
  });
}


/**
 * Remove process from front of queue
 * Removes process at the front of the process queue.
 *
 * returns Process
 **/
exports.dequeueProcess = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      processManager.dequeueProcess()
      .then(val => resolve(writer.respondWithCode(val.statusCode, val)))
      .catch(err => reject(writer.respondWithCode(err.statusCode, err)));
    }
  });
}


/**
 * Add process to queue for execution
 * Add process with `pid` to the queue for execution
 *
 * pid String PID of process to queue
 * returns ProcessEnqueueResponse
 **/
exports.enqueueProcess = function(pid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      processManager.enqueueProcess(pid)
      .then(val => resolve(val))
      .catch(err => reject(writer.respondWithCode(err.statusCode, err)));
    }
  });
}


/**
 * Get status of all processes
 * Show status of all processes that are waiting, running, stopped or aborted in the current session.
 *
 * status String Filter by status (optional)
 * fields String Comma separated list of process related fields to return. By default all fields in the process object are returned (optional)
 * sortBy String Sort by given process object field (optional)
 * sortOrder String Sort ascending or descending (optional)
 * returns List
 **/
exports.getAllProcessStatus = function (status, fields, sortBy, sortOrder) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = [{
      "toolId": "toolid",
      "comment": "comment",
      "id": "id",
      "args": ["param1", "param2"],
      "containerId": "containerid",
      "userid": "userid",
      "status": {},
      "timestamp": 0
    }, {
      "toolId": "toolid",
      "comment": "comment",
      "id": "id",
      "args": ["param1", "param2"],
      "containerId": "containerid",
      "userid": "userid",
      "status": {},
      "timestamp": 0
    }];
    let enableExamples = false;
    if (enableExamples && Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      processManager.getAllProcessInfo(status, fields, sortBy, sortOrder)
      .then(val => resolve(val))
      .catch(err => reject(writer.respondWithCode(err.statusCode, err)));
    }
  });
}


/**
 * Get information about process
 * Get information about process with the given id
 *
 * pid String id of process
 * fields String Comma separated list of fields from the Process object to return. Eg. `fields=userid,status` (optional)
 * returns Process
 **/
exports.getProcessInfo = function(pid,fields) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      processManager.getProcessInfo(pid, fields)
      .then(val => resolve(val))
      .catch(err => reject(writer.respondWithCode(err.statusCode, err)));
    }
  });
}

/**
 * Create, Enqueue and Dequeue process in one shot
 * Normally one uses the `create` endpoint to spawn a process, `enqueues` it into the process queue and then `dequeues` it to begin execution of the  process. This endpoint conveniently allows one to do all the three steps in one shot rather than do them separately. The body is similar  to that of /process/create.
 *
 * body ProcessRequest Process object that is enqueued for running
 * returns Process
 **/
exports.runProcessPost = function(body) {
  return new Promise(function(resolve, reject) {
    processManager.runProcessPost(body)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}

/**
 * Stop a process
 * Stop a process with the given id
 *
 * pid String id of process
 * returns Process
 **/
exports.stopProcess = function(pid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      processManager.stopProcess(pid)
      .then(val => resolve(val))
      .catch(err => reject(writer.respondWithCode(err.statusCode, err)));
    }
  });
}