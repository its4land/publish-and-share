'use strict';

const ModelClasses = require('../../implementation/ModelClasses');
const writer = require('../utils/writer.js');


/**
 * Returns ModelClasses
 * Returns ModelClasses
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of ModelClasses UID (optional)
 * nameinmodel List Comma separated list of ModelClasses names (optional)
 * conceptname List Comma separated list of ModelClasses concept names (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * returns List
 **/
exports.getModelClasses = function(envelope,uid,nameinmodel,conceptname,page,sort,fields) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      ModelClasses.queryItems(envelope, uid, undefined, nameinmodel, conceptname, undefined, page, sort, fields)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Returns a single model class
 * Returns a single model class
 *
 * modelclasses_uid String ModelClass UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * returns ModelClassesEndpointType
 **/
exports.getModelClassesByUID = function(modelclasses_uid,envelope) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      ModelClasses.queryItemByUID(modelclasses_uid, envelope)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Updates some attributes of a ModelClass
 * Updates some attributes of a ModelClass
 *
 * modelclasses_uid String ModelClass UID
 * patchmodelclasses RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ModelClassesEndpointType
 **/
exports.updateModelClasses = function(modelclasses_uid,patchmodelclasses,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      ModelClasses.updateItem(modelclasses_uid, patchmodelclasses, envelope, i4lProcessUid)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}

