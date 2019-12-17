'use strict';

const Features = require('../../implementation/MetricMapFeatures');
const writer = require('../utils/writer.js');

/**
 * Returns MetricMapFeature
 * Returns MetricMapFeature in a GeoJSON structure. A metric map feature is modeled as a feature in  the GeoJSON structure.
 *
 * querywindow String Polygon. The polygon is encoded a comma separated list of coordinates. X1, Y1, X2, Y2, ..., Xn, Yn, X1, Y1
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * fgroup String Restricts the output to the listed feature group (optional)
 * ftype String Restricts the output to the listed feature types. When used in combination with fgroup, output contains only those ftype which are contained in the feature groups (optional)
 * fsubtype String Restricts the output to the listed feature types. When used in combination with fgroup and/or ftype, output contains only those fsubtype which are contained in the feature groups and feature types (optional)
 * returns MetricMapFeaturesEndpointType
 **/
exports.getMetricMapFeature = function(querywindow,envelope,fgroup,ftype,fsubtype) {
  return new Promise(function(resolve, reject) {
      //var features = Features.getMetricMapFeatures(envelope, querywindow).then(
      var features = Features.queryItems(envelope, querywindow).then(
          function(features) {
              resolve(features);
          }
      )
          .catch(e => {
              console.log(e);
              reject(e);
          });
  });
}


/**
 * Create a new metricMapFeature
 * Create a new MetricMapFeature. The new metric map feature is a feature in the GeoJSON structure. Currently ony one new feature per request is allowed.
 *
 * newmetricmapfeature MetricMapFeaturePostRequest New MetricMap Feature data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns MetricMapFeaturesEndpointType
 **/
exports.newMetricMapFeature = function(newmetricmapfeature,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Features.createNewItemContent(newmetricmapfeature, envelope, undefined, i4lProcessUid)
        .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
        .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}


/**
 * Updates a metric map feature
 * Updates a metric map feature. Only fgroup, fname, ftype, fsubtype and fURI can be updated
 *
 * mmf_uid String MetricMapFeature UID
 * patchmetricmapfeature RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns MetricMapFeaturesEndpointType
 **/
exports.updateMetricMapFeature = function(mmf_uid,patchmetricmapfeature,envelope,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      Features.updateItem(mmf_uid, patchmetricmapfeature, envelope, undefined, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
    }
  });
}

