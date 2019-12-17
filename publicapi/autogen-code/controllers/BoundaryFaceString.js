'use strict';

var utils = require('../utils/writer.js');
var BoundaryFaceString = require('../service/BoundaryFaceStringService');

module.exports.getBoundaryFaceString = function getBoundaryFaceString (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var projects = req.swagger.params['projects'].value;
  var spatialunit = req.swagger.params['spatialunit'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  BoundaryFaceString.getBoundaryFaceString(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBoundaryFaceStringByUID = function getBoundaryFaceStringByUID (req, res, next) {
  var boundaryfacestring_uid = req.swagger.params['boundaryfacestring_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  BoundaryFaceString.getBoundaryFaceStringByUID(boundaryfacestring_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newBoundaryFaceString = function newBoundaryFaceString (req, res, next) {
  var newboundaryfacestring = req.swagger.params['newboundaryfacestring'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  BoundaryFaceString.newBoundaryFaceString(newboundaryfacestring,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putBoundaryFaceStringByUID = function putBoundaryFaceStringByUID (req, res, next) {
  var boundaryfacestring_uid = req.swagger.params['boundaryfacestring_uid'].value;
  var updatedboundaryfacestring = req.swagger.params['updatedboundaryfacestring'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  BoundaryFaceString.putBoundaryFaceStringByUID(boundaryfacestring_uid,updatedboundaryfacestring,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateBoundaryFaceString = function updateBoundaryFaceString (req, res, next) {
  var boundaryfacestring_uid = req.swagger.params['boundaryfacestring_uid'].value;
  var patchboundaryfacestring = req.swagger.params['patchboundaryfacestring'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  BoundaryFaceString.updateBoundaryFaceString(boundaryfacestring_uid,patchboundaryfacestring,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
