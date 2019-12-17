'use strict';

var utils = require('../utils/writer.js');
var AdminSources = require('../service/AdminSourcesService');

module.exports.getAdminSourceByUID = function getAdminSourceByUID (req, res, next) {
  var adminsource_uid = req.swagger.params['adminsource_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  AdminSources.getAdminSourceByUID(adminsource_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAdminSources = function getAdminSources (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var type = req.swagger.params['type'].value;
  var projects = req.swagger.params['projects'].value;
  var spatialunits = req.swagger.params['spatialunits'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  AdminSources.getAdminSources(envelope,uid,name,type,projects,spatialunits,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newAdminSource = function newAdminSource (req, res, next) {
  var newadminsource = req.swagger.params['newadminsource'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  AdminSources.newAdminSource(newadminsource,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateAdminSource = function updateAdminSource (req, res, next) {
  var adminsource_uid = req.swagger.params['adminsource_uid'].value;
  var patchadminsource = req.swagger.params['patchadminsource'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  AdminSources.updateAdminSource(adminsource_uid,patchadminsource,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
