'use strict';

const Tags = require('../../implementation/Tags');
const writer = require('../utils/writer.js');

/**
 * Returns a single tag
 * Returns a tag
 *
 * tag_name String Tag Name
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns TagsEndpointType
 **/
exports.getTagByName = function(tag_name,envelope,embed) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Tags.queryItemByName(tag_name, envelope, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Get a list of tags
 * Get a list of tags
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of Tag UID (optional)
 * displayvalue List Comma separated list of Tag display value (optional)
 * objecttypes List Comma separated list of objects types (optional)
 * objectuuid List Comma separated list of object UID (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of tags (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getTags = function(envelope,uid,displayvalue,objecttypes,objectuuid,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Tags.queryItems(envelope, uid, displayvalue, objecttypes, objectuuid, page, sort, fields, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Merge tags
 * merge tags
 *
 * tag_uid String Tag UID
 * mergetag RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns TagsEndpointType
 **/
exports.mergeTagByUID = function(tag_uid,mergetag,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Updates a tag
 * Updates a tag
 *
 * tag_name String Tag UID
 * patchtag RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns TagsEndpointType
 **/
exports.updateTagByName = function(tag_name,patchtag,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

