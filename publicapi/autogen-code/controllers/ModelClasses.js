'use strict';

var utils = require('../utils/writer.js');
var ModelClasses = require('../service/ModelClassesService');

module.exports.getModelClasses = function getModelClasses (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uID = req.swagger.params['UID'].value;
  var nameinmodel = req.swagger.params['nameinmodel'].value;
  var conceptname = req.swagger.params['conceptname'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  ModelClasses.getModelClasses(envelope,uID,nameinmodel,conceptname,page,sort,fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getModelClassesByUID = function getModelClassesByUID (req, res, next) {
  var modelclasses_uid = req.swagger.params['modelclasses_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  ModelClasses.getModelClassesByUID(modelclasses_uid,envelope)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateModelClasses = function updateModelClasses (req, res, next) {
  var modelclasses_uid = req.swagger.params['modelclasses_uid'].value;
  var patchmodelclasses = req.swagger.params['patchmodelclasses'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  ModelClasses.updateModelClasses(modelclasses_uid,patchmodelclasses,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
