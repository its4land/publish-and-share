'use strict';

const dbutils = require('../../implementation/common/dbUtils.js');
const SpatialSources = require('../../implementation/SpatialSources.js');
const AddSpatialSourceDocs = require('../../implementation/AddSpatialSourceDocuments.js');
const writer = require('../utils/writer.js');


/**
 * Removes an additional document for a spatial source.
 * Removes an additional document for a spatial source. By default only the link between additional document and spatial source is removed.
 *
 * spatialsource_uid String SpatialSource UID
 * adddoc_uid String SpatialSource UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * force_delete String Deletes the additional document resource. (optional)
 * returns List
 **/
exports.detachSpatialSourceAddDoc = function(spatialsource_uid,adddoc_uid,envelope,force_delete) {
  return new Promise(function(resolve, reject) {
    AddSpatialSourceDocs.deleteItem(spatialsource_uid, adddoc_uid, force_delete)
    .then((result) => {
      if (result) {
        result = exports.getSpatialSourceByUID(spatialsource_uid, envelope, undefined);
        resolve(result);
      }
      else {
        dbutils.throwError404(null);
      }
    })
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns the additional documents of a spatial source
 * Returns the additional documents of a spatial source
 *
 * spatialsource_uid String SpatialSource UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * returns List
 **/
exports.getSpatialSourceAddDocs = function(spatialsource_uid,envelope,page,sort,fields) {
  return new Promise(function(resolve, reject) {
    AddSpatialSourceDocs.queryItems(envelope, undefined, spatialsource_uid, undefined, page, sort, fields)
    .then((result) => { resolve(result)})
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns a single SpatialSource
 * Returns a single SpatialSource
 *
 * spatialsource_uid String SpatialSource UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns SpatialSourcesEndpointType
 **/
exports.getSpatialSourceByUID = function(spatialsource_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    SpatialSources.queryItemByUID(spatialsource_uid, envelope, embed)
    .then((result) => { resolve(result)})
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns the additional documents of a spatial source
 * Returns the additional documents of a spatial source
 *
 * spatialsource_uid String SpatialSource UID
 * adddoc_uid String SpatialSource UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * fields List Comma separated list of field names (optional)
 * returns List
 **/
exports.getSpatialSourceSingleAddDoc = function(spatialsource_uid,adddoc_uid,envelope,fields) {
  return new Promise(function(resolve, reject) {
    //AddSpatialSourceDocs.queryItems(envelope, addDoc_uid, spatialsource_uid, undefined, undefined, undefined, fields)
    AddSpatialSourceDocs.queryItemByUID(adddoc_uid, envelope)
    .then((result) => { resolve(result)})
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns a list of SpatialSources
 * Returns a list of SpatialSources
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of SpatialSources UID (optional)
 * name List Comma separated list of SpatialSources names (optional)
 * type List Comma separated list of SpatialSources types (optional)
 * projects List Comma separated list of project UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of tags (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getSpatialSources = function(envelope,uid,name,type,projects,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    SpatialSources.queryItems(envelope, uid, name, type, projects, tags, page, sort, fields, embed)
    .then((result) => { resolve(result)})
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Create a new SpatialSource
 * Create a new SpatialSource. To add a new SpatialSources , the content of SpatialSources  must be stored in advanced via the ContentItem endpoint.
 *
 * newspatialsource SpatialSourcesPostRequest New SpatialSource data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * process_uid String deprecated (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialSourcesEndpointType
 **/
exports.newSpatialSource = function(newspatialsource,envelope,embed,process_uid,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    SpatialSources.createNewItemContent(newspatialsource, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Add a new additional document to a spatial source
 * Add a new additional document to a spatial source
 *
 * spatialsource_uid String SpatialSource UID
 * newadddocdata AdditionalDocumentsPost New additional document data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns AdditionalDocumentsEndpointType
 **/
exports.newSpatialSourceAddAddDoc = function(spatialsource_uid,newadddocdata,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    AddSpatialSourceDocs.createNewItemContent(newadddocdata, spatialsource_uid, envelope, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Replace an existing SpatialSource by a newer version
 * An existing SpatialSource will be replaced by a newer version. The UID of SpatialSource remains
 *
 * spatialsource_uid String SpatialSource UID
 * updatedspatialsource SpatialSourcesPostRequest Updated spatial source
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns SpatialSourcesEndpointType
 **/
exports.putSpatialSourceByUID = function(spatialsource_uid,updatedspatialsource,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    SpatialSources.replaceItem(spatialsource_uid,updatedspatialsource,envelope,embed,i4lProcessUid)
    .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}
