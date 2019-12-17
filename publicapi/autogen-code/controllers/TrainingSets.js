'use strict';

var utils = require('../utils/writer.js');
var TrainingSets = require('../service/TrainingSetsService');

module.exports.getTrainingSetByUID = function getTrainingSetByUID (req, res, next) {
  var trainingsets_uid = req.swagger.params['trainingsets_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  TrainingSets.getTrainingSetByUID(trainingsets_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTrainingSets = function getTrainingSets (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var models = req.swagger.params['models'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  TrainingSets.getTrainingSets(envelope,uid,name,models,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newTrainingSet = function newTrainingSet (req, res, next) {
  var newtrainingset = req.swagger.params['newtrainingset'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  TrainingSets.newTrainingSet(newtrainingset,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
