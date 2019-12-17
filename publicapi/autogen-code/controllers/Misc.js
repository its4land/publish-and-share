'use strict';

var utils = require('../utils/writer.js');
var Misc = require('../service/MiscService');

module.exports.getDDILayers = function getDDILayers (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var type = req.swagger.params['type'].value;
  var projects = req.swagger.params['projects'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Misc.getDDILayers(envelope,uid,name,type,projects,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPuSConfig = function getPuSConfig (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Misc.getPuSConfig(envelope,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newDDILayers = function newDDILayers (req, res, next) {
  var newDDILayer = req.swagger.params['newDDILayer'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Misc.newDDILayers(newDDILayer,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
