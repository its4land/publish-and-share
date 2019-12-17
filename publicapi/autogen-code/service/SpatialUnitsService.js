'use strict';

const spatialUnits_lib = require('../../implementation/SpatialUnits');
const writer = require('../utils/writer.js');

/**
 * Creates a spatial unit
 * Create a 2D polygon base spatial unit from a boundary face string  as GeoJSON
 *
 * spatialunitdata SpatialUnitBaseFeaturePostRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns SpatialUnitsFeatureEndpointType
 **/
exports.create2PpolygonSPUfromBFS = function(spatialunitdata,envelope,i4lProcessUid,embed) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.createItemFromBFS(spatialunitdata,envelope,i4lProcessUid,embed)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});    
  });
}


/**
 * Returns a single spatial unit
 * Returns a single spatial unit with qualitative base qualitative base spatial profile
 *
 * spatialunit_uid String Spatial unit UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns SpatialUnitsFeatureEndpointType
 **/
exports.getSpatialUnitByUID = function(spatialunit_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.queryItemByUID(spatialunit_uid,envelope,embed)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err))});    
  });
}


/**
 * Returns a single spatial unit concept
 * Returns a single spatial unit concept
 *
 * concept_uid String Spatial unit concept UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns SpatialUnitConceptEndpointType
 **/
exports.getSpatialUnitConceptByUID = function(concept_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.queryConceptsByUID(concept_uid,envelope,embed)
    .then((result)=> {resolve (writer.respondWithCode(200, result))})
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err))});    
  });
}


/**
 * Returns a list of SpatialUnits in a GeoJSON structure.
 * Returns a list of SpatialUnits as GeoJSON feature with 2D polygon base spatial profile
 *
 * querywindow String Polygon. The polygon is encoded a comma separated list of coordinates. X1, Y1, X2, Y2, ..., Xn, Yn, X1, Y1
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of AdminSources UID (optional)
 * name List Comma separated list of AdminSources names (optional)
 * concept List Comma separated list of Spatial Unit concepts (optional)
 * level List Comma separated list of LADM Levels (optional)
 * projects List Comma separated list of project UID (optional)
 * adminsource List Comma separated list of SpatialSource UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of tags (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getSpatialUnits = function(querywindow,envelope,uid,name,concept,level,projects,adminsource,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.queryItems(querywindow,envelope,uid,name,concept,level,projects,adminsource,tags,page,sort,fields,embed)
    .then((result)=> {resolve (result)})
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err))});
  });
}


/**
 * Returns a list of SpatialUnits
 * Returns a list of SpatialUnits as feature with 2d polygon base spatial profile
 *
 * spatialunit_uid String Spatial unit UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getSpatialUnitsByUUID = function(spatialunit_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.queryItemByUID(spatialunit_uid,envelope,embed)
    .then((data) => {resolve(data)})
    .catch((err) => {reject(writer.respondWithCode(err.statusCode, err.info))});
  });
}


/**
 * Returns a list of spatial units concepts
 * Returns a list of spatial units concepts
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
 * returns List
 **/
exports.getSpatialUnitsConcepts = function(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.queryConcepts(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed)
    .then((result)=> {resolve (result)})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Returns a list of SpatialUnits
 * Returns a list of SpatialUnits as feature with geometry
 *
 * querywindow String Polygon. The polygon is encoded a comma separated list of coordinates. X1, Y1, X2, Y2, ..., Xn, Yn, X1, Y1
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of Spatial unit UID (optional)
 * name List Comma separated list of AdminSources names (optional)
 * concept List Comma separated list of Spatial Unit concepts (optional)
 * level List Comma separated list of LADM Levels (optional)
 * projects List Comma separated list of project UID (optional)
 * adminsource List Comma separated list of SpatialSource UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of tags (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getSpatialUnitsQualitative = function(querywindow,envelope,uid,name,concept,level,projects,adminsource,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.queryItems(querywindow,envelope,uid,name,concept,level,projects,adminsource,tags,page,sort,fields,embed)
    .then((result)=> {resolve (result)})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Create a new SpatialUnit
 * Create a new SpatialUnit with 2d polygon base spatial profile. The spatial unit is modeled as a GeoJSON feature. The endpoint currently allows only one spatial unit per request.
 *
 * newspatialunit SpatialUnitsFeaturePostRequest New Spatial Unit data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialUnitsFeatureEndpointType
 **/
exports.newSpatialUnit = function(newspatialunit,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.createNewItemContent(newspatialunit,envelope,embed,i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Create a new concept for a spatial unit
 * Create a new concept for a spatial unit.
 *
 * newspatialunitconcept SpatialUnitConceptPostRequest New Spatial Unit concept data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialUnitConceptEndpointType
 **/
exports.newSpatialUnitConcept = function(newspatialunitconcept,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.createNewConcept(newspatialunitconcept,envelope,embed,i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Create a new SpatialUnit
 * Create a new SpatialUnit with qualitative base spatial profile
 *
 * newspatialunit SpatialUnitsFeaturePostRequest New Spatial Unit data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialUnitsFeatureEndpointType
 **/
exports.newSpatialUnitQualitative = function(newspatialunit,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.createNewItemContent(newspatialunit,envelope,embed,i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Update an spatial unit
 * Update an spatial unit with 2d polygon base spatial profile
 *
 * spatialunit_uid String Spatial unit UID
 * patchspatialunit RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialUnitsFeatureEndpointType
 **/
exports.updateSpatialUnit = function(spatialunit_uid,patchspatialunit,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.updateItem(spatialunit_uid, patchspatialunit, envelope, null, i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Updates a new spatial unit concept
 * Updates a spatial unit concept
 *
 * concept_uid String Spatial unit concept UID
 * patchspatialunitconcept RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialUnitConceptEndpointType
 **/
exports.updateSpatialUnitConcept = function(concept_uid,patchspatialunitconcept,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.updateConcept(concept_uid, patchspatialunitconcept, envelope, null, i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}


/**
 * Updates a new SpatialUnit
 * Updates SpatialUnit with qualitative base spatial profile
 *
 * spatialunit_uid String Spatial unit UID
 * patchspatialunit RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialUnitsFeatureEndpointType
 **/
exports.updateSpatialUnitQualitative = function(spatialunit_uid,patchspatialunit,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    spatialUnits_lib.updateItem(spatialunit_uid, patchspatialunit, envelope, null, i4lProcessUid)
    .then((result)=> {resolve (writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => {reject(writer.respondWithCode(500, err))});
  });
}

