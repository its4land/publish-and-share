'use strict';

const util = require('util');

const apiUtils = require('./common/apiUtils');
const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const modelsLib = require('./Models.js');
const spatialSourcesLib = require('./SpatialSources.js');
const tagsLib = require('./Tags.js');

const TABLEID = 'PROJECTS_TABLE';
const MODELS_TABLEID = 'MODELS_TABLE';
const SPATIALSOURCES_TABLEID = 'SPATIALSOURCES_TABLE';

const PROP_PROJECTS = 'Projects';
const PROP_MODELS = 'Models';
const PROP_SPATIALSOURCES = 'SpatialSources';
const PROP_GEOMETRY = 'aoi';
const RELTYPE_MODEL = 'Model';
const RELTYPE_SPATIALSOURCE = 'SpatialSource';

/**
 * PostGIS does not support OGC CRS URN style - bug or feature???
 * 
 * GeoJSON standardizes on the mentioned style. To be able to create geometries from GeoJSON 
 * in PostGIS, we need a mapping from the recommended style to a legacy style. Currently we
 * hardcode these mapping only for the WGS84 crs.
 */
const CRS_MAP = {
    "urn:ogc:def:crs:OGC:1.3:CRS84" : "urn:ogc:def:crs:EPSG::4326",
    "urn:ogc:def:crs:OGC::CRS84" : "urn:ogc:def:crs:EPSG::4326",
}

function ProjectsHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
ProjectsHandler.prototype.constructor = ProjectsHandler;
ProjectsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ProjectsHandler.prototype = new reqHnd.RequestHandler();

ProjectsHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_MODELS, dblib.getTable(MODELS_TABLEID), RELTYPE_MODEL, false, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_SPATIALSOURCES, dblib.getTable(SPATIALSOURCES_TABLEID), RELTYPE_SPATIALSOURCE, false, transaction) || this.changed;
    this.changed = await await tagsLib.updateRelatedTags(itemUID, properties, table, true, transaction) || this.changed;
    return true;
}

ProjectsHandler.prototype.attachTagInternal = async function(itemUID, tags, transaction = null) {
    //return await tagsLib.createRelatedTags(itemUID, dblib.getItemProperty(tags, tagsLib.PROP_TAGVALUE), this.getTable(), true, transaction);
    return await tagsLib.createRelatedTags(itemUID, tags, this.getTable(), true, transaction);
}

ProjectsHandler.prototype.removeTagInternal = async function(itemUID, tags, forceDelete, transaction = null) {
    return await tagsLib.removeRelatedTags(itemUID, tags, transaction);
}

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
ProjectsHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addRelationQuery(clauses, table, properties[PROP_MODELS], true);
    dbrel.addRelationQuery(clauses, table, properties[PROP_SPATIALSOURCES], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

ProjectsHandler.prototype.prepareItem = async function (item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        if (dbrel.containsPropertyName(PROP_MODELS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(MODELS_TABLEID), PROP_MODELS, embed);
        if (dbrel.containsPropertyName(PROP_SPATIALSOURCES, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(SPATIALSOURCES_TABLEID), PROP_SPATIALSOURCES, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
    }
    return false;
}

/**
 * prepare query result(s) for response
 * 
 * @param {Array} result of a query (Array of records, or a single record)
 * @param {Array} Array of items or a single item (Record.properties), prepared for response
 */
ProjectsHandler.prototype.publishResult = function(result) {
    result = this.constructor.prototype.publishResult.call(this, result);
    return this.createGeoJSON(result, PROP_GEOMETRY, 'i4lProject');
}

/**
 * Get all resources connected to a project by querying the item2item table
 */
ProjectsHandler.prototype.getConnectedObjects = async function(projectUID) {
    let results = await dbrel.getAllRelationsOfItem(projectUID, false, true);
    if (results) {
        let keyMap = {
            'fromuid' : 'projectUID',
            'relationtype': 'TypeOfConnectedObject',
            'Name': 'NameOfConnectedObject',
            'touid': 'UUIDofConnectObject',
            'TagValue': 'NameOfConnectedObject'
        }
        let connObjects = [];
        for (let obj of results) {
            let modifiedObj = {};
            for (let key of Object.keys(keyMap)) {
                if (key in obj) {
                    modifiedObj[keyMap[key]] = obj[key];
                }
            }
            connObjects.push(modifiedObj);
        }
        return connObjects;
    } else {
        throw new Error("no connected objects")
    }
}

const handler = new ProjectsHandler();

/**
 * 
 * @param {Object} contentBody project metadata
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function(contentBody, envelope, embed, processUID, transaction = null) {
    let feature = contentBody.features[0];
    let geometry = feature.geometry;
    geometry.crs = contentBody.crs;
    // If a mapping is found for the unsupported OGC crs style, use the legacy EPSG code
    if (geometry.crs.properties.name in CRS_MAP) {
        geometry.crs.properties.name = CRS_MAP[geometry.crs.properties.name]
    }
    feature.properties[PROP_GEOMETRY] = JSON.stringify(geometry);
    return await handler.createNewItemContent (feature.properties, envelope, embed, processUID, transaction);
}

/**
 * updateItem modifies properties of an existing item.
 * 
 * @param {String} uid UUID of the item to be updated
 * @param {Object} properties to be updated
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} properties of the item
 */
module.exports.updateItem = async function(itemUID, properties, envelope, embed, processUID, transaction = null) {
    return await handler.updateItem (itemUID, properties, envelope, embed, processUID, transaction);
}

/**
 * Retrieve a list of projects filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of projects
 * @param {String[]} name Names of projects
 * @param {String} aoi Area of Interest containing project
 * @param {String[]} tags list of tags
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function (envelope, uid, name, aoi, tags, page, sort, fields, embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    reqHnd.addQueryValue(properties, PROP_GEOMETRY, aoi); 
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags); 
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
}

/**
 * Retrieve a single project from its UID
 * 
 * @param {String} uid UUID string of project
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}

/**
 * Add relationship between a model and the given project
 * 
 * @method createModelInProject
 * @param {String} uid UUID of project
 * @param {Object} model Properties of the model
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createModelInProject = async function(projectUID, model, envelope, embed, processUID, transaction = null) {
    if (model) {
        dblib.setItemProperty(model, PROP_PROJECTS, projectUID);
        await modelsLib.createNewItemContent(model, envelope, embed, processUID, transaction);
        return dblib.wrapContent(await handler.queryItemByUID(projectUID, envelope, embed), false);
    }
    return null;
}

/**
 * Create a spatial source and link it to the project
 * 
 * @param {String} projectUID UUID of project
 * @param {Object} sourceInfo information about the spatial source
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createSpatialSourceInProject = async function(projectUID, sourceInfo, envelope, embed, processUID, transaction = null) {
    if (sourceInfo) {
        dblib.setItemProperty(sourceInfo, PROP_PROJECTS, projectUID);
        await spatialSourcesLib.createNewItemContent(sourceInfo, envelope, embed, processUID, transaction);
        return dblib.wrapContent(await handler.queryItemByUID(projectUID, envelope, embed), false);
    }
    return null;
}

/**
 * Removes the link between project and a model and deletes the model (optional)
 * 
 * @method detachModel
 * @param {String} itemUID uid of project
 * @param {String} relatedUID uid of the model to be detached
 * @param {Boolean} envelope 
 * @param {Boolean} forceDelete if true, the model is deleted 
 * @param {Array} embed 
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.detachModel = async function(itemUID, relatedUID, envelope, forceDelete, transaction = null) {
    return await handler.detachRelation(itemUID, relatedUID, dblib.getTable(MODELS_TABLEID), envelope, forceDelete, transaction);
}

/**
 * Removes the link between project and a spatial source and deletes the model (optional)
 * 
 * @method detachSpatialSource
 * @param {String} itemUID uid of project
 * @param {String} relatedUID uid of the spatial source to be detached
 * @param {Boolean} envelope 
 * @param {Boolean} forceDelete if true, the spatial source is deleted 
 * @param {Array} embed 
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.detachSpatialSource = async function(itemUID, relatedUID, envelope, forceDelete, transaction = null) {
    return await handler.detachRelation(itemUID, relatedUID, dblib.getTable(SPATIALSOURCES_TABLEID), envelope, forceDelete, transaction);
}

/**
 * Retrieves all tags of the project
 * 
 * @method getTags
 * @param {String} projectUID uid of project
 * @param {Boolean} envelope 
 */
module.exports.getTags = async function(itemUID, envelope) {
    return await tagsLib.getRelatedTags(itemUID);
}

/**
 * Adds a tag to the project
 * 
 * @method attachTag
 * @param {String} projectUID uid of project
 * @param {String[]} tags to be attached
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.attachTag = async function(itemUID, tags, envelope, embed, transaction = null) {
    return await handler.attachTag(itemUID, tags, envelope, embed, transaction);
}

/**
 * Removes a tag from the project
 * 
 * @method removeTag
 * @param {String} projectUID uid of project
 * @param {String} tag to be removed
 * @param {Boolean} envelope 
 * @param {Boolean} forceDelete if true, the model is deleted 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.removeTag = async function(itemUID, tag, envelope, forceDelete, transaction = null) {
    return await handler.removeTag(itemUID, tag, envelope, forceDelete, transaction);
}

/**
 * @method getConnectedObjects
 * @param {String} project_uid uid of project
 * @param {Boolean} envelope 
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded

 * 
 */
module.exports.getConnectedObjects = async function(project_uid,envelope,page,sort,fields,embed) {
    return await handler.getConnectedObjects(project_uid);
}

/**
 * Delete a project
 *
 * @method deleteProject
 * @param {String] project_uid UID of project to remove
 */
module.exports.deleteProject = async function(project_uid,envelope,embed,i4lProcessUid) {
    let result = await handler.deleteItem(project_uid, false);
    if (!result) {
        throw(apiUtils.customErr(404, `No such project with ID: ${project_uid}`));
    }
    return result;
}