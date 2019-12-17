'use strict';

var utils = require('../utils/writer.js');
var ProcessManagement = require('../service/ProcessManagementService');

module.exports.createProcess = function createProcess (req, res, next) {
  var body = req.swagger.params['body'].value;
  ProcessManagement.createProcess(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.dequeueProcess = function dequeueProcess (req, res, next) {
  ProcessManagement.dequeueProcess()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.enqueueProcess = function enqueueProcess (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  ProcessManagement.enqueueProcess(pid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAllProcessStatus = function getAllProcessStatus (req, res, next) {
  var status = req.swagger.params['status'].value;
  var fields = req.swagger.params['fields'].value;
  var sortBy = req.swagger.params['sortBy'].value;
  var sortOrder = req.swagger.params['sortOrder'].value;
  ProcessManagement.getAllProcessStatus(status,fields,sortBy,sortOrder)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProcessInfo = function getProcessInfo (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var fields = req.swagger.params['fields'].value;
  ProcessManagement.getProcessInfo(pid,fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.runProcessPost = function runProcessPost (req, res, next) {
  var body = req.swagger.params['body'].value;
  ProcessManagement.runProcessPost(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.stopProcess = function stopProcess (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  ProcessManagement.stopProcess(pid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
