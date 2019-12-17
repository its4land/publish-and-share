'use strict';

var Features = require('../../implementation/ContentItems');
const writer = require('../utils/writer.js');

/**
 * Returns a single content from the object storage.
 * Returns a single content from the object storage.
 *
 * contentitem_id String UID of the ContentItem
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * returns File
 **/
exports.getContentItem = function (contentitem_id, envelope) {
    return Features.getContentItem(contentitem_id, envelope);
};

/**
 * Returns a list of contentitems
 * Returns a list of contentitem metadata based on the filter criteria
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List UID of a ContentItem (optional)
 * contentname List Name of File (optional)
 * contenttype List mime/type of the content (optional)
 * contentdescription String Free text for description. Only plain text. (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getContentItems = function(envelope,uid,contentname,contenttype,contentdescription,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    Features.listContentItems(envelope,uid,contentname,contenttype,contentdescription,page,sort,fields,embed)
      .then((res) => {resolve(writer.respondWithCode(res.statusCode, res.body))})
      .catch((err) => {reject(writer.respondWithCode(err.statusCode, err))});
  });
}


/**
 * Create a new content in the object storage
 * Create a new content in the object storage
 *
 * newcontent File Content as multipart from-data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * description String Description of content (optional) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ContentItemEndpointType
 **/
exports.newContentItem = function(newcontent,envelope,description,i4lProcessUid) {
    return new Promise(function (resolve, reject) {
        Features.postContentItem(newcontent, envelope, description)
            .then((res) => {resolve(writer.respondWithCode(res.statusCode, res.body))})
            .catch((err) => {reject(writer.respondWithCode(err.statusCode, err))});
    });
}

