'use strict';

const MiscLib = require('../../implementation/Misc');
const DDILib = require('../../implementation/DDILib');
const writer = require('../utils/writer.js');

/**
 * Return a list of registered DDI (WFS/WMS) Layer
 * Return a list of registered DDI (WFS/WMS) Layer
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of TrainingSet UID (optional)
 * name List Comma separated list of WP5ValidationSets Names (optional)
 * type List Comma separated list OGC types (optional)
 * projects List Comma separated list of project UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getDDILayers = function(envelope,uid,name,type,projects,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    DDILib.getLayers(envelope,uid,name,type,projects,tags,page,sort,fields,embed)
    .then((data) => resolve(writer.respondWithCode(200,data.body)))
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err))});
  });
}


/**
 * Returns a list of configuration parameters as Key Value
 * Returns a list of configuration parameters as Key Value. E.g. URL of the DDI server
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getPuSConfig = function(envelope,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    MiscLib.getConfig(envelope,page,sort,fields,embed)
    .then((configData) => { resolve(configData)})
    .catch((err) => { reject(err) });
  });
}


/**
 * Register a new DDI (WFS/WMS) Layer
 * Register DDI (WFS/WMS) Layer
 *
 * newDDILayer DDILayersPostRequest New image metadata
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns DDILayersEndpointType
 **/
exports.newDDILayers = function(newDDILayer,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    DDILib.createNewLayer(newDDILayer,envelope,embed,i4lProcessUid)
    .then((data) => resolve(writer.respondWithCode(data.statusCode,data.body)))
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err))});
  });
}

