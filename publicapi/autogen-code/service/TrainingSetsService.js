'use strict';

const TrainingSets = require('../../implementation/TrainingSets');
const writer = require('../utils/writer.js');

/**
 * Returns a single TrainingSet
 * Returns a single TrainingSet
 *
 * trainingsets_uid String TrainingSet UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns TrainingsSetEndpointType
 **/
exports.getTrainingSetByUID = function(trainingsets_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      TrainingSets.queryItemByUID(trainingsets_uid, envelope, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Returns a list of TrainingSets
 * Returns a list of TrainingSets
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of TrainingSet UID (optional)
 * name List Comma separated list of TrainingSet Names (optional)
 * models List Comma separated list of model UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getTrainingSets = function(envelope,uid,name,models,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      TrainingSets.queryItems(envelope, uid, name, models, tags, page, sort, fields, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Create a new TrainingSet
 * Create a new TrainingSet. To add a new TrainingSet , the content of TrainingSet  must be stored in advanced via the ContentItem endpoint
 *
 * newtrainingset TrainingSetsPostRequest New TrainingSet data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns TrainingsSetEndpointType
 **/
exports.newTrainingSet = function(newtrainingset,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      TrainingSets.createNewItemContent(newtrainingset, envelope, embed,i4lProcessUid)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}

