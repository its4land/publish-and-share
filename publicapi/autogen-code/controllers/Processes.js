'use strict';

var utils = require('../utils/writer.js');
var Processes = require('../service/ProcessesService');

module.exports.createProcessLog = function createProcessLog (req, res, next) {
  var process_uid = req.swagger.params['process_uid'].value;
  var newlogentry = req.swagger.params['newlogentry'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Processes.createProcessLog(process_uid,newlogentry,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.createProcesses = function createProcesses (req, res, next) {
  var newprocess = req.swagger.params['newprocess'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Processes.createProcesses(req,newprocess,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProcessByUID = function getProcessByUID (req, res, next) {
  var process_uid = req.swagger.params['process_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  Processes.getProcessByUID(process_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProcessLog = function getProcessLog (req, res, next) {
  var process_uid = req.swagger.params['process_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var loglevel = req.swagger.params['loglevel'].value;
  var logsource = req.swagger.params['logsource'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Processes.getProcessLog(process_uid,envelope,loglevel,logsource,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProcesses = function getProcesses (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var project = req.swagger.params['project'].value;
  var status = req.swagger.params['status'].value;
  var tooluid = req.swagger.params['tooluid'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Processes.getProcesses(envelope,uid,project,status,tooluid,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
