'use strict';

var utils = require('../utils/writer.js');
var Info = require('../service/InfoService');

module.exports.pingServer = function pingServer (req, res, next) {
  Info.pingServer()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
