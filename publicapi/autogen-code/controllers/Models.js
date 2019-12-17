'use strict';

var utils = require('../utils/writer.js');
var Models = require('../service/ModelsService');

module.exports.getModels = function getModels (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var tools = req.swagger.params['tools'].value;
  var projects = req.swagger.params['projects'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Models.getModels(envelope,uid,name,tools,projects,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getModelsByUID = function getModelsByUID (req, res, next) {
  var model_uid = req.swagger.params['model_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  Models.getModelsByUID(model_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getModelsClassesByModel = function getModelsClassesByModel (req, res, next) {
  var model_uid = req.swagger.params['model_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  Models.getModelsClassesByModel(model_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newModel = function newModel (req, res, next) {
  var newmodel = req.swagger.params['newmodel'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Models.newModel(newmodel,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newModelClassUnderModel = function newModelClassUnderModel (req, res, next) {
  var model_uid = req.swagger.params['model_uid'].value;
  var newmodelclass = req.swagger.params['newmodelclass'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Models.newModelClassUnderModel(model_uid,newmodelclass,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateModels = function updateModels (req, res, next) {
  var model_uid = req.swagger.params['model_uid'].value;
  var patchmodel = req.swagger.params['patchmodel'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Models.updateModels(model_uid,patchmodel,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
