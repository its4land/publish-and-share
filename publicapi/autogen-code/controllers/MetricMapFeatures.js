'use strict';

var utils = require('../utils/writer.js');
var MetricMapFeatures = require('../service/MetricMapFeaturesService');

module.exports.getMetricMapFeature = function getMetricMapFeature (req, res, next) {
  var querywindow = req.swagger.params['querywindow'].value;
  var envelope = req.swagger.params['envelope'].value;
  var fgroup = req.swagger.params['fgroup'].value;
  var ftype = req.swagger.params['ftype'].value;
  var fsubtype = req.swagger.params['fsubtype'].value;
  MetricMapFeatures.getMetricMapFeature(querywindow,envelope,fgroup,ftype,fsubtype)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newMetricMapFeature = function newMetricMapFeature (req, res, next) {
  var newmetricmapfeature = req.swagger.params['newmetricmapfeature'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  MetricMapFeatures.newMetricMapFeature(newmetricmapfeature,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateMetricMapFeature = function updateMetricMapFeature (req, res, next) {
  var mmf_uid = req.swagger.params['mmf_uid'].value;
  var patchmetricmapfeature = req.swagger.params['patchmetricmapfeature'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  MetricMapFeatures.updateMetricMapFeature(mmf_uid,patchmetricmapfeature,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
