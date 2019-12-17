'use strict';

var utils = require('../utils/writer.js');
var Tags = require('../service/TagsService');

module.exports.getTagByName = function getTagByName (req, res, next) {
  var tag_name = req.swagger.params['tag_name'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  Tags.getTagByName(tag_name,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTags = function getTags (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var displayvalue = req.swagger.params['displayvalue'].value;
  var objecttypes = req.swagger.params['objecttypes'].value;
  var objectuuid = req.swagger.params['objectuuid'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Tags.getTags(envelope,uid,displayvalue,objecttypes,objectuuid,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.mergeTagByUID = function mergeTagByUID (req, res, next) {
  var tag_uid = req.swagger.params['tag_uid'].value;
  var mergetag = req.swagger.params['mergetag'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Tags.mergeTagByUID(tag_uid,mergetag,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateTagByName = function updateTagByName (req, res, next) {
  var tag_name = req.swagger.params['tag_name'].value;
  var patchtag = req.swagger.params['patchtag'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Tags.updateTagByName(tag_name,patchtag,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
