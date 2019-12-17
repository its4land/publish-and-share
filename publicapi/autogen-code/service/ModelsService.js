'use strict';

const Models = require('../../implementation/Models');
const ModelClasses = require('../../implementation/ModelClasses');
const writer = require('../utils/writer.js');

/**
 * Returns a list of models.
 * Returns a list of models.
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of model UID (optional)
 * name List Comma separated list of model names (optional)
 * tools List Comma separated list tool names which can make use of the model. (optional)
 * projects List Comma separated list of project UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getModels = function(envelope,uid,name,tools,projects,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Models.queryItems(envelope, uid, name, tools, projects, tags, page, sort, fields, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Returns a single model
 * Returns a single model
 *
 * model_uid String Model  UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns ModelsEndpointType
 **/
exports.getModelsByUID = function(model_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Models.queryItemByUID(model_uid, envelope, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Returns the model classes of the classifier.
 * Returns the model classes of the classifier.
 *
 * model_uid String Model  UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getModelsClassesByModel = function(model_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    ModelClasses.queryItems(envelope, undefined, model_uid)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Create a new model
 * Create a new model. The model can be assigned to a project via the patch://project method. To add a new SpatialSources , the content of Models  must be stored in advanced via the ContentItem endpoint
 *
 * newmodel ModelsPostRequest New Model data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ModelsEndpointType
 **/
exports.newModel = function(newmodel,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};

    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Models.createNewItemContent(newmodel, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)); })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)); });
    }
  });
}


/**
 * Create a new ModelClass under a model
 * Create a new ModelClass under a model
 *
 * model_uid String Model  UID
 * newmodelclass ModelClassesPostRequest New ModelClass data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ModelClassesEndpointType
 **/
exports.newModelClassUnderModel = function (model_uid, newmodelclass, envelope, embed, i4lProcessUid) {
  return new Promise(function (resolve, reject) {
    ModelClasses.createNewItemContent(newmodelclass, model_uid, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)); })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Updates some attributes of a model
 * Updates some attributes of a model
 *
 * model_uid String Model  UID
 * patchmodel RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ModelsEndpointType
 **/
exports.updateModels = function(model_uid,patchmodel,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Models.updateItem(model_uid, patchmodel, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}

