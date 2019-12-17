'use strict';

var utils = require('../utils/writer.js');
var SpatialSources = require('../service/SpatialSourcesService');

module.exports.detachSpatialSourceAddDoc = function detachSpatialSourceAddDoc (req, res, next) {
  var spatialsource_uid = req.swagger.params['spatialsource_uid'].value;
  var adddoc_uid = req.swagger.params['adddoc_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var force_delete = req.swagger.params['force_delete'].value;
  SpatialSources.detachSpatialSourceAddDoc(spatialsource_uid,adddoc_uid,envelope,force_delete)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialSourceAddDocs = function getSpatialSourceAddDocs (req, res, next) {
  var spatialsource_uid = req.swagger.params['spatialsource_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  SpatialSources.getSpatialSourceAddDocs(spatialsource_uid,envelope,page,sort,fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialSourceByUID = function getSpatialSourceByUID (req, res, next) {
  var spatialsource_uid = req.swagger.params['spatialsource_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  SpatialSources.getSpatialSourceByUID(spatialsource_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialSourceSingleAddDoc = function getSpatialSourceSingleAddDoc (req, res, next) {
  var spatialsource_uid = req.swagger.params['spatialsource_uid'].value;
  var adddoc_uid = req.swagger.params['adddoc_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var fields = req.swagger.params['fields'].value;
  SpatialSources.getSpatialSourceSingleAddDoc(spatialsource_uid,adddoc_uid,envelope,fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialSources = function getSpatialSources (req, res, next) {
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
  SpatialSources.getSpatialSources(envelope,uid,name,type,projects,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newSpatialSource = function newSpatialSource (req, res, next) {
  var newspatialsource = req.swagger.params['newspatialsource'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var process_uid = req.swagger.params['process_uid'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialSources.newSpatialSource(newspatialsource,envelope,embed,process_uid,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newSpatialSourceAddAddDoc = function newSpatialSourceAddAddDoc (req, res, next) {
  var spatialsource_uid = req.swagger.params['spatialsource_uid'].value;
  var newadddocdata = req.swagger.params['newadddocdata'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialSources.newSpatialSourceAddAddDoc(spatialsource_uid,newadddocdata,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putSpatialSourceByUID = function putSpatialSourceByUID (req, res, next) {
  var spatialsource_uid = req.swagger.params['spatialsource_uid'].value;
  var updatedspatialsource = req.swagger.params['updatedspatialsource'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialSources.putSpatialSourceByUID(spatialsource_uid,updatedspatialsource,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
