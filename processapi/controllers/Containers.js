'use strict';

var utils = require('../utils/writer.js');
var Containers = require('../service/ContainersService');

module.exports.createContainer = function createContainer (req, res, next) {
  var containerRequest = req.swagger.params['ContainerRequest'].value;
  Containers.createContainer(containerRequest)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getToolImages = function getToolImages (req, res, next) {
  var toolName = req.swagger.params['toolName'].value;
  var tag = req.swagger.params['tag'].value;
  var latestByTag = req.swagger.params['latestByTag'].value;
  var latestByVersion = req.swagger.params['latestByVersion'].value;
  var latestByCreated = req.swagger.params['latestByCreated'].value;
  Containers.getToolImages(toolName,tag,latestByTag,latestByVersion,latestByCreated)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getToolImagesById = function getToolImagesById (req, res, next) {
  var id = req.swagger.params['id'].value;
  Containers.getToolImagesById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.killContainer = function killContainer (req, res, next) {
  var cid = req.swagger.params['cid'].value;
  Containers.killContainer(cid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.removeContainer = function removeContainer (req, res, next) {
  var cid = req.swagger.params['cid'].value;
  Containers.removeContainer(cid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.startContainer = function startContainer (req, res, next) {
  var cid = req.swagger.params['cid'].value;
  Containers.startContainer(cid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.stopContainer = function stopContainer (req, res, next) {
  var cid = req.swagger.params['cid'].value;
  Containers.stopContainer(cid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
