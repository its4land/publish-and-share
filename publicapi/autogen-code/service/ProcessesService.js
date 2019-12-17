'use strict';

const Processes = require('../../implementation/Processes');
const writer = require('../utils/writer.js');

/**
 * Writes a single log entry
 * Writes a single log entry
 *
 * process_uid String Process UID
 * newlogentry LogEntryPostRequest New log entry
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns LogEntryEndpointType
 **/
exports.createProcessLog = function (process_uid, newlogentry, envelope, i4lProcessUid) {
  return new Promise(function (resolve, reject) {
    Processes.createProcessLog(process_uid, newlogentry, envelope)
      .then((result) => resolve(result))
      .catch((err) => reject(writer.respondWithCode(500, err)));
  });
}


/**
 * Creates a new  processes
 * Creates a new  processes
 *
 * newprocess ProcessPostRequest New process metadata
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ProcessEndpointType
 **/
exports.createProcesses = function(request,newprocess,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Processes.createNewItemContent(request,newprocess, envelope, embed, i4lProcessUid)
      .then((response) => resolve(writer.respondWithCode(response.statusCode, response.body)))
      .catch((err) => { 
        if ('statusCode' in err)
          reject(writer.respondWithCode(err.statusCode, err));
        else
          reject(writer.respondWithCode(500, err));
      });
  });
}


/**
 * Returns metadata for a single process
 * Returns metadata for a single process
 *
 * process_uid String Process UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns ProcessEndpointType
 **/
exports.getProcessByUID = function (process_uid,envelope,embed) {
  return new Promise(function (resolve, reject) {
    Processes.queryItemByUID(process_uid, envelope, embed)
      .then((result) => resolve(result))
      .catch((err) => reject(writer.respondWithCode(err.statusCode, err)));
  });
}


/**
 * Get the full log of a process
 * Get the full log of a process. Oldest entry first
 *
 * process_uid String Process UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * loglevel List LogLevel : error, info, warning, debug. Default is info. The higher order level includes the lower level (optional)
 * logsource List Source of the log entry. Values: GUI, <ToolName> (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getProcessLog = function(process_uid,envelope,loglevel,logsource,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    Processes.getProcessLogs(process_uid,envelope,loglevel,logsource,page,sort,fields,embed)
      .then((result) => { resolve(result) })
      .catch((err) => { reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Get a list of processes
 * Get a list of processes
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of Tag UID (optional)
 * project List Comma separated list of project uid (optional)
 * status String Status of the project. Can be one of:   * WAITING: Process is queued for execution   * RUNNING: Process is currently executing   * FINISHED: Process terminated normally   * ABORTED: Process terminated unexpectedly   * ZOMBIE: Process is listed in the platform process table, but the internal (process) API has no information about it. Possible in case of historical/archived processes or due to platform error.  (optional)
 * tooluid List Comma separated list of tool UID (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of fields (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getProcesses = function(envelope,uid,project,status,tooluid,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    Processes.queryItems(envelope, uid, project, status, tooluid, page, sort, fields, embed)
      .then((result) => resolve(result))
      .catch((err) => { reject(writer.respondWithCode(500, err)) });
  });
}