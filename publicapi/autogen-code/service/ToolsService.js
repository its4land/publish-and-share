'use strict';

const Tools = require('../../implementation/Tools');

/**
 * Get a list of tools
 * Get a list of tools
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of Tag UID (optional)
 * name List Comma separated list of tool names (optional)
 * version String Tool version. By default, the latest version will be returned. * returns all versions. (optional)
 * supplier List Comma separated list of supplier (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of fields (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getTools = function(envelope,uid,name,version,supplier,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
      Tools.queryItems(envelope,uid,name,version,supplier,page,sort,fields,embed)
        .then((result) => {resolve(result)})
        .catch((err) => {reject(err)} );
  });
}

