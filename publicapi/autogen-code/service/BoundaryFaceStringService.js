'use strict';

const bfs_lib = require('../../implementation/BoundaryFaceStrings');
const writer = require('../utils/writer.js');

/**
 * Returns a list of boundary face strings in a GeoJSON structure.
 * Returns a list of boundary face strings. A boundary face string is modeled as a GeoJSON feature.
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of Spatial unit UID (optional)
 * name List Comma separated list of AdminSources names (optional)
 * projects List Comma separated list of project UID (optional)
 * spatialunit List Comma separated list of SpatialSource UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of tags (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns BoundaryFaceStringEndpointType
 **/
exports.getBoundaryFaceString = function(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    bfs_lib.queryItems(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed)
    .then((result)=> {resolve (result)})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Returns a single boundary face string
 * Returns a boundary face string as GeoJSON as a feature in a GeoJSON structure.
 *
 * boundaryfacestring_uid String Boundary face string UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns BoundaryFaceStringEndpointType
 **/
exports.getBoundaryFaceStringByUID = function(boundaryfacestring_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    bfs_lib.queryItemByUID(boundaryfacestring_uid,envelope,embed)
    .then((result)=> {resolve (result)})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Create a new concept for a boundary face string
 * Create a new concept for a boundary face string.
 *
 * newboundaryfacestring BoundaryFaceStringPostRequest New boundary face string
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns BoundaryFaceStringEndpointType
 **/
exports.newBoundaryFaceString = function(newboundaryfacestring,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    bfs_lib.createNewItemContent(newboundaryfacestring,envelope,embed,i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Replace an existing BoundaryFaceString by a newer version
 * An existing BoundaryFaceString will be replaced by a newer version. The UID of BoundaryFaceString remains
 *
 * boundaryfacestring_uid String Boundary face string UID
 * updatedboundaryfacestring BoundaryFaceStringPostRequest Updated boundary face string
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns BoundaryFaceStringEndpointType
 **/
exports.putBoundaryFaceStringByUID = function(boundaryfacestring_uid,updatedboundaryfacestring,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    bfs_lib.replaceItem(boundaryfacestring_uid, updatedboundaryfacestring, envelope, embed,i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Updates a boundary face string
 * Updates a boundary face string
 *
 * boundaryfacestring_uid String Boundary face string UID
 * patchboundaryfacestring RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns BoundaryFaceStringEndpointType
 **/
exports.updateBoundaryFaceString = function(boundaryfacestring_uid,patchboundaryfacestring,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    bfs_lib.updateItem(boundaryfacestring_uid, patchboundaryfacestring, envelope, null, i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}