'use strict';

var utils = require('../utils/writer.js');
var Classifier = require('../service/ClassifierService');

module.exports.getClassifier = function getClassifier (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var models = req.swagger.params['models'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  Classifier.getClassifier(envelope,uid,name,models,tags,page,sort,fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getClassifierByUID = function getClassifierByUID (req, res, next) {
  var classifier_id = req.swagger.params['classifier_id'].value;
  var envelope = req.swagger.params['envelope'].value;
  Classifier.getClassifierByUID(classifier_id,envelope)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newClassifier = function newClassifier (req, res, next) {
  var newclassifier = req.swagger.params['newclassifier'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Classifier.newClassifier(newclassifier,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
