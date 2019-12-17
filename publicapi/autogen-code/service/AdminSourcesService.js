'use strict';

const AdminSourceLib = require('../../implementation/AdminSources');
const writer = require('../utils/writer');

/**
 * Returns a single Admin Source
 * Returns a single Admin Source
 *
 * adminsource_uid String AdminSource UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns AdminSourcesEndpointType
 **/
exports.getAdminSourceByUID = function(adminsource_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    AdminSourceLib.getAdminSourcesByUID(adminsource_uid,envelope,embed)
    .then((res) => { resolve(writer.respondWithCode(res.statusCode, res.body))})
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err))});
  });
}


/**
 * Returns a list of AdminSource document indizes
 * Returns a list of AdminSource document indizes
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of AdminSources UID (optional)
 * name List Comma separated list of AdminSources names (optional)
 * type List Comma separated list of AdminSources types (optional)
 * projects List Comma separated list of project UID (optional)
 * spatialunits List Comma separated list of SpatialUnit UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of tags (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getAdminSources = function(envelope,uid,name,type,projects,spatialunits,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    AdminSourceLib.getAdminSources(envelope,uid,name,type,projects,spatialunits,tags,page,sort,fields,embed)
     .then((res) => { resolve(writer.respondWithCode(res.statusCode, res.body))})
     .catch((err) => { reject(writer.respondWithCode(err.statusCode, err))});
  });
}


/**
 * Creates a new AdminSource
 * Creates a new AdminSource
 *
 * newadminsource AdminSourcesPostRequest New AdminSource data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns AdminSourcesEndpointType
 **/
exports.newAdminSource = function(newadminsource,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    AdminSourceLib.createNewAdminSource(newadminsource,envelope,embed,i4lProcessUid)
     .then((res) => { resolve(writer.respondWithCode(res.statusCode, res.body))})
     .catch((err) => { reject(writer.respondWithCode(err.statusCode, err))})
  });
}

/**
 * Update an Admin Source
 * Update an Admin Source
 *
 * adminsource_uid String AdminSource UID
 * patchadminsource RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns AdminSourcesEndpointType
 **/
exports.updateAdminSource = function(adminsource_uid,patchadminsource,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "Concept" : "Concept",
  "UID" : "UID",
  "Type" : "Type",
  "Description" : "Description",
  "LongDescription" : "LongDescription",
  "ExtDescriptionURL" : "ExtDescriptionURL",
  "Projects" : [ {
    "UID" : "UID"
  }, {
    "UID" : "UID"
  } ],
  "SpatialUnits" : [ {
    "UID" : "UID"
  }, {
    "UID" : "UID"
  } ],
  "ContentItem" : "ContentItem",
  "Tags" : [ "Tags", "Tags" ],
  "Name" : "Name"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

