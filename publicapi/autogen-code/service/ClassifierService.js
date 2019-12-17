'use strict';

const Classifier = require('../../implementation/Classifier');
const writer = require('../utils/writer.js');

/**
 * Returns a list of classifier
 * Returns a list of classifier
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of classifier UID (optional)
 * name List Comma separated list of classifier names (optional)
 * models List Comma separated list of model UID (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * returns List
 **/
exports.getClassifier = function(envelope,uid,name,models,tags,page,sort,fields) {
  return new Promise(function(resolve, reject) {
    Classifier.queryItems(envelope,uid,name,models,tags,page,sort,fields)
    .then((result) => {resolve(result)})
    .catch((err) => {reject (err)});
  });
}


/**
 * Returns a single classifier.
 * Returns a single classifier.
 *
 * classifier_id String Classifier UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * returns ClassifierEndpointType
 **/
exports.getClassifierByUID = function(classifier_id,envelope) {
  return new Promise(function(resolve, reject) {
    Classifier.queryItemByUID(classifier_id, envelope)
    .then((result) => { resolve(result)})
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Create a new classifier
 * Create a new classifier. To add a new Classifier , the content of Classifier must be stored in advanced via the ContentItem endpoint
 *
 * newclassifier ClassifierPostRequest New Classifier data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ClassifierEndpointType
 **/
exports.newClassifier = function(newclassifier,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Classifier.createNewItemContent(newclassifier, envelope, i4lProcessUid)
    .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body))})
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}

