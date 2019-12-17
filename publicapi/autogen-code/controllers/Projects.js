'use strict';

var utils = require('../utils/writer.js');
var Projects = require('../service/ProjectsService');

module.exports.addTagToProject = function addTagToProject (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var newtag = req.swagger.params['newtag'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Projects.addTagToProject(project_uid,newtag,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delProjectByUID = function delProjectByUID (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Projects.delProjectByUID(project_uid,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.detachProjectModel = function detachProjectModel (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var model_uid = req.swagger.params['model_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var force_delete = req.swagger.params['force_delete'].value;
  Projects.detachProjectModel(project_uid,model_uid,envelope,force_delete)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.detachProjectSpatialSource = function detachProjectSpatialSource (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var spatialsource_uid = req.swagger.params['spatialsource_uid'].value;
  var force_delete = req.swagger.params['force_delete'].value;
  Projects.detachProjectSpatialSource(project_uid,spatialsource_uid,force_delete)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.detachProjectTag = function detachProjectTag (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var tag = req.swagger.params['tag'].value;
  var envelope = req.swagger.params['envelope'].value;
  var force_delete = req.swagger.params['force_delete'].value;
  Projects.detachProjectTag(project_uid,tag,envelope,force_delete)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getConnectedObjectsByProjectUID = function getConnectedObjectsByProjectUID (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Projects.getConnectedObjectsByProjectUID(project_uid,envelope,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getModelsByProjectUID = function getModelsByProjectUID (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Projects.getModelsByProjectUID(project_uid,envelope,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProjectTagsByProjectUID = function getProjectTagsByProjectUID (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  Projects.getProjectTagsByProjectUID(project_uid,envelope)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProjects = function getProjects (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var name = req.swagger.params['name'].value;
  var aoi = req.swagger.params['aoi'].value;
  var tags = req.swagger.params['tags'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Projects.getProjects(envelope,uid,name,aoi,tags,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProjectsByUID = function getProjectsByUID (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  Projects.getProjectsByUID(project_uid,envelope,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSpatialSourceByProjectUID = function getSpatialSourceByProjectUID (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var envelope = req.swagger.params['envelope'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  Projects.getSpatialSourceByProjectUID(project_uid,envelope,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newModelUnderProject = function newModelUnderProject (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var newmodel = req.swagger.params['newmodel'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Projects.newModelUnderProject(project_uid,newmodel,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newProject = function newProject (req, res, next) {
  var newproject = req.swagger.params['newproject'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Projects.newProject(newproject,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newSpatialSourceUnderProject = function newSpatialSourceUnderProject (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var newspatialsource = req.swagger.params['newspatialsource'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Projects.newSpatialSourceUnderProject(project_uid,newspatialsource,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateProjects = function updateProjects (req, res, next) {
  var project_uid = req.swagger.params['project_uid'].value;
  var patchproject = req.swagger.params['patchproject'].value;
  var envelope = req.swagger.params['envelope'].value;
  var embed = req.swagger.params['embed'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  Projects.updateProjects(project_uid,patchproject,envelope,embed,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
