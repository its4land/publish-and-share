'use strict';

var utils = require('../utils/writer.js');
var Tools = require('../service/ToolsService');

module.exports.getTools = function getTools (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var version = req.swagger.params['version'].value;
  var supplier = req.swagger.params['supplier'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Tools.getTools(envelope,uid,name,version,supplier,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
