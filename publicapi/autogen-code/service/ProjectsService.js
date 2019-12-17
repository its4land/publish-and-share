'use strict';

const Projects = require('../../implementation/Projects');
const Models = require('../../implementation/Models');
const SpatialSources = require('../../implementation/SpatialSources.js');
const writer = require('../utils/writer.js');

/**
 * Adds a tag to the project
 * Creates a new tag and attach it to the project. If the tag already exist, the existing tag will be attached to the project.
 *
 * project_uid String Project UID
 * newtag TagsPostRequest New Tag data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ProjectsEndpointType
 **/
exports.addTagToProject = function(project_uid,newtag,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Projects.attachTag(project_uid, newtag, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(201, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}

/**
 * Deletes a single e project by its UID
 * A single project is deleted. This endpoint deletes the project itself and the connected to subordered data like SpatialSources, etc. The subordered data itself are not deleted
 *
 * project_uid String UID of the project
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ProjectsEndpointType
 **/
exports.delProjectByUID = function(project_uid,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Projects.deleteProject(project_uid,envelope,embed,i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(200, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}

/**
 * Removes a model from a project.
 * Removes a model from a project. By default only the link between model and project is removed.
 *
 * project_uid String Project UID
 * model_uid String Model UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * force_delete String Deletes the model resource. ********* What's about subordinate resources? ********* (optional)
 * returns ProjectsEndpointType
 **/
exports.detachProjectModel = function(project_uid,model_uid,envelope,force_delete) {
  return new Promise(function(resolve, reject) {
    Projects.detachModel(project_uid, model_uid, envelope, force_delete)
      .then((result) => { resolve(writer.respondWithCode(200, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Removes a spatialsource from a project.
 * Removes a spatial from a project. By default only the link between spatialsource and project is removed.
 *
 * project_uid String Project UID
 * spatialsource_uid String SpatialSource UID
 * force_delete String Deletes the spatialsource resource. ********* What's about subordinate resources? ********* (optional)
 * returns ProjectsEndpointType
 **/
exports.detachProjectSpatialSource = function(project_uid,spatialsource_uid,force_delete) {
  return new Promise(function(resolve, reject) {
    let envelope = false;
    Projects.detachSpatialSource(project_uid, spatialsource_uid, envelope, force_delete)
      .then((result) => { resolve(writer.respondWithCode(200, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Removes a tag from a project.
 * Removes a tag from a project. By default only the link between tag and project is removed.
 *
 * project_uid String Project UID
 * tag String tag value
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * force_delete String Deletes the tag resource. ********* Only possible, when tag is not attached to any other resource. ********* (optional)
 * returns ProjectsEndpointType
 **/
exports.detachProjectTag = function(project_uid,tag,envelope,force_delete) {
  return new Promise(function(resolve, reject) {
    Projects.removeTag(project_uid, tag, envelope, force_delete)
      .then((result) => { resolve(writer.respondWithCode(200, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns an array of connect objects
 * Returns an array of connect objects of a project. For each connected object the endpoint returns the type, name and uuid
 *
 * project_uid String Project UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns ConnectedObjectsEndpointType
 **/
exports.getConnectedObjectsByProjectUID = function(project_uid,envelope,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    Projects.getConnectedObjects(project_uid,envelope,page,sort,fields,embed)
    .then((result) => { resolve(writer.respondWithCode(200, result)) })
    .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns the models of a project
 * Returns the models of a project
 *
 * project_uid String Project UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getModelsByProjectUID = function(project_uid,envelope,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    let projects = [];
    projects.push(project_uid);
    Models.queryItems(envelope, undefined, undefined, undefined, projects, undefined, page, sort, fields, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns the tags of a project.
 * Is this method really necessary? Returns the tags of a project.
 *
 * project_uid String Project UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * returns TagsListResponse
 **/
exports.getProjectTagsByProjectUID = function(project_uid,envelope) {
  return new Promise(function(resolve, reject) {
    Projects.getTags(project_uid, envelope)
      .then((result) => { resolve(result) })
      .catch((err) => {reject(handleErr(err)) });
  });
}


/**
 * Get a GeoJSON structure containing a list of Projects.
 * Get a GeoJSON structure containing a list of Projects. A single project is modeled as a GeoJSON feature.
 *
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * uid List Comma separated list of UID (optional)
 * name List Comma separated list of names (optional)
 * aoi String Polygon. The polygon is encoded a comma separated list of coordinates. X1, Y1, X2, Y2, ..., Xn, Yn, X1, Y1 (optional)
 * tags List Comma separated list of tags (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns ProjectsEndpointType
 **/
exports.getProjects = function(envelope,uid,name,aoi,tags,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    Projects.queryItems(envelope,uid,name,aoi,tags,page,sort,fields,embed)
      .then((result) => { resolve(result) })
      .catch((err) => {reject(handleErr(err)) });
  });
}


/**
 * Getting single Projects by its UID
 * Getting single Projects by its UID. The project is modeled as a feature in a GeoJSON structure.
 *
 * project_uid String UID of the project
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns ProjectsEndpointType
 **/
exports.getProjectsByUID = function(project_uid,envelope,embed) {
  return new Promise(function(resolve, reject) {
    Projects.queryItemByUID(project_uid, envelope, embed)
      .then((result) => { resolve(writer.respondWithCode(200, result)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Returns the SpatialSources of a Project.
 * Returns the SpatialSources of a Project.
 *
 * project_uid String Project UID
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * page Integer Requests for collections can return between 0 and N results, controlled using the per_page and page query parameters. All endpoints are limited to 10 results by default. (optional)
 * sort String The sorting is initiated by the sort query parameter and a list of comma separated list of fields to sort by. (optional)
 * fields List Comma separated list of field names (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * returns List
 **/
exports.getSpatialSourceByProjectUID = function(project_uid,envelope,page,sort,fields,embed) {
  return new Promise(function(resolve, reject) {
    let projects = [];
    projects.push(project_uid);
    SpatialSources.queryItems(envelope, undefined, undefined, undefined, projects, undefined, page, sort, fields, embed)
      .then((result) => { resolve(result)})
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Create a new model
 * Create a new model.  To add a new Model , the content of Models  must be stored in advanced via the ContentItem endpoint
 *
 * project_uid String Project UID
 * newmodel ModelsPostRequest New model data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ProjectsEndpointType
 **/
exports.newModelUnderProject = function(project_uid,newmodel,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Projects.createModelInProject(project_uid, newmodel, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Create a new project
 * Create a new project. The new project is modeled as a feature in a GeoJSON structure. Currently only one project feature is allowed.
 *
 * newproject ProjectsPostRequest New project data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ProjectsEndpointType
 **/
exports.newProject = function(newproject,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Projects.createNewItemContent(newproject, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Create a new SpatialSource
 * Create a new SpatialSource. To add a new SpatialSource , the content of SpatialSource  must be stored in advanced via the ContentItem endpoint
 *
 * project_uid String Project UID
 * newspatialsource SpatialSourcesPostRequest New SpatialSource data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ProjectsEndpointType
 **/
exports.newSpatialSourceUnderProject = function(project_uid,newspatialsource,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Projects.createSpatialSourceInProject(project_uid, newspatialsource, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}


/**
 * Update a project
 * Updates some attributes of a project.
 *
 * project_uid String Project UID to be patched
 * patchproject RFC6902PatchRequest Update data
 * envelope String The endpoint can package everything (header, status code) neatly into the response body. Include envelope=true as a request parameter. The API will always return a 200 HTTP status code. The real status, headers and response will be within the body. (optional)
 * embed List Embedding is triggered by passing in an embed query parameter, which takes a comma separated list of endpoint types. Single fields can be selected a dot-notation (endpoint-type.property-name) (optional)
 * i4lProcessUid String Process UID. This parameter can be used by an its4land tool running inside the runtime environment to pass the process uid to the endpoint. With this information the endpoint can associate the newly created or updated resource with the process. (optional)
 * returns ProjectsEndpointType
 **/
exports.updateProjects = function(project_uid,patchproject,envelope,embed,i4lProcessUid) {
  return new Promise(function(resolve, reject) {
    Projects.updateItem(project_uid, patchproject, envelope, embed, i4lProcessUid)
      .then((result) => { resolve(writer.respondWithCode(result.statusCode, result.body)) })
      .catch((err) => { reject(writer.respondWithCode(err.statusCode, err)) });
  });
}

function handleErr(err) {
  if ('summary' in err && err.summary) {
    return writer.respondWithCode(err.statusCode, err);
  }
  else {
    return writer.respondWithCode(err.statusCode);
  }
}