'use strict';

var utils = require('../utils/writer.js');
var WP5ValidationSets = require('../service/WP5ValidationSetsService');

module.exports.getWP5ValidationSetByUID = function getWP5ValidationSetByUID (req, res, next) {
  var wp5validationset_uid = req.swagger.params['wp5validationset_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  WP5ValidationSets.getWP5ValidationSetByUID(wp5validationset_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getWP5ValidationSets = function getWP5ValidationSets (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var models = req.swagger.params['models'].value;
  var projects = req.swagger.params['projects'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  WP5ValidationSets.getWP5ValidationSets(envelope,uid,name,models,projects,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newWP5ValidationSets = function newWP5ValidationSets (req, res, next) {
  var newwp5validationsets = req.swagger.params['newwp5validationsets'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  WP5ValidationSets.newWP5ValidationSets(newwp5validationsets,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
