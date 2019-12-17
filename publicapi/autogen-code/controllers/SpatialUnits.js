'use strict';

var utils = require('../utils/writer.js');
var SpatialUnits = require('../service/SpatialUnitsService');

module.exports.create2PpolygonSPUfromBFS = function create2PpolygonSPUfromBFS (req, res, next) {
  var spatialunitdata = req.swagger.params['spatialunitdata'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  var embed = req.swagger.params['embed'].value;
  SpatialUnits.create2PpolygonSPUfromBFS(spatialunitdata,envelope,i4lProcessUid,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialUnitByUID = function getSpatialUnitByUID (req, res, next) {
  var spatialunit_uid = req.swagger.params['spatialunit_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  SpatialUnits.getSpatialUnitByUID(spatialunit_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialUnitConceptByUID = function getSpatialUnitConceptByUID (req, res, next) {
  var concept_uid = req.swagger.params['concept_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  SpatialUnits.getSpatialUnitConceptByUID(concept_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialUnits = function getSpatialUnits (req, res, next) {
  var querywindow = req.swagger.params['querywindow'].value;
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var concept = req.swagger.params['concept'].value;
  var level = req.swagger.params['level'].value;
  var projects = req.swagger.params['projects'].value;
  var adminsource = req.swagger.params['adminsource'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  SpatialUnits.getSpatialUnits(querywindow,envelope,uid,name,concept,level,projects,adminsource,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialUnitsByUUID = function getSpatialUnitsByUUID (req, res, next) {
  var spatialunit_uid = req.swagger.params['spatialunit_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  SpatialUnits.getSpatialUnitsByUUID(spatialunit_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialUnitsConcepts = function getSpatialUnitsConcepts (req, res, next) {
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
  SpatialUnits.getSpatialUnitsConcepts(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialUnitsQualitative = function getSpatialUnitsQualitative (req, res, next) {
  var querywindow = req.swagger.params['querywindow'].value;
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var concept = req.swagger.params['concept'].value;
  var level = req.swagger.params['level'].value;
  var projects = req.swagger.params['projects'].value;
  var adminsource = req.swagger.params['adminsource'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  SpatialUnits.getSpatialUnitsQualitative(querywindow,envelope,uid,name,concept,level,projects,adminsource,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newSpatialUnit = function newSpatialUnit (req, res, next) {
  var newspatialunit = req.swagger.params['newspatialunit'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialUnits.newSpatialUnit(newspatialunit,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newSpatialUnitConcept = function newSpatialUnitConcept (req, res, next) {
  var newspatialunitconcept = req.swagger.params['newspatialunitconcept'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialUnits.newSpatialUnitConcept(newspatialunitconcept,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newSpatialUnitQualitative = function newSpatialUnitQualitative (req, res, next) {
  var newspatialunit = req.swagger.params['newspatialunit'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialUnits.newSpatialUnitQualitative(newspatialunit,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateSpatialUnit = function updateSpatialUnit (req, res, next) {
  var spatialunit_uid = req.swagger.params['spatialunit_uid'].value;
  var patchspatialunit = req.swagger.params['patchspatialunit'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialUnits.updateSpatialUnit(spatialunit_uid,patchspatialunit,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateSpatialUnitConcept = function updateSpatialUnitConcept (req, res, next) {
  var concept_uid = req.swagger.params['concept_uid'].value;
  var patchspatialunitconcept = req.swagger.params['patchspatialunitconcept'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialUnits.updateSpatialUnitConcept(concept_uid,patchspatialunitconcept,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateSpatialUnitQualitative = function updateSpatialUnitQualitative (req, res, next) {
  var spatialunit_uid = req.swagger.params['spatialunit_uid'].value;
  var patchspatialunit = req.swagger.params['patchspatialunit'].value;
  var envelope = req.swagger.params['envelope'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  SpatialUnits.updateSpatialUnitQualitative(spatialunit_uid,patchspatialunit,envelope,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
