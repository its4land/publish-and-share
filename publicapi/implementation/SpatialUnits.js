'use strict';

const util = require('util');

const dbcfg = require('./common/dbConfig');
const dbconn = require('./common/dbConnection');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const tagsLib = require('./Tags.js');
const docsLib = require('./AddSpatialSourceDocuments.js');
const procsLib = require('./Processes.js');
const bfsLib = require('./BoundaryFaceStrings.js');

const SPATUNITS_TABLEID = 'SPATIALUNITS_TABLE';
const SPUNIT_CONCEPTS_TABLEID = 'SPATIALUNITCONCEPTS_TABLE';
const ADMINSRC_TABLEID = 'ADMINSOURCE_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';

const PROP_PROJECTS = 'Projects';
const PROP_NAME = 'name';
const PROP_CONCEPT = 'Concept';
const PROP_LEVEL = 'level';
const PROP_GEOMETRY = 'geometry';
const PROP_ADMINSRC = 'AdminSource';
const RELTYPE_SPUNIT = 'SpatialUnit';


function SpatialUnitsHandler () {
    reqHnd.RequestHandler.call(this, SPATUNITS_TABLEID);
}

function SpatialUnitConceptsHandler () {
    reqHnd.RequestHandler.call(this, SPUNIT_CONCEPTS_TABLEID);
}

SpatialUnitsHandler.prototype.constructor = SpatialUnitsHandler;
SpatialUnitsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
SpatialUnitsHandler.prototype = new reqHnd.RequestHandler();

SpatialUnitConceptsHandler.prototype.constructor = SpatialUnitConceptsHandler;
SpatialUnitConceptsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
SpatialUnitConceptsHandler.prototype = new reqHnd.RequestHandler();

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
SpatialUnitsHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addRelationQuery(clauses, table, properties[PROP_PROJECTS], true);
    dbrel.addRelationQuery(clauses, table, properties[PROP_ADMINSRC], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

/**
 * prepare query result(s) for response
 * 
 * @param {Array} result of a query (Array of records, or a single record)
 * @param {Array} Array of items or a single item (Record.properties), prepared for response
 */
SpatialUnitsHandler.prototype.publishResult = function(result) {
    return this.createGeoJSON(dblib.publishItems(result), PROP_GEOMETRY, 
        Array.isArray(result) ? null : "SpatialUnitFeatures");
}

SpatialUnitsHandler.prototype.prepareFeature = function (featureCollection) {
    if (typeof featureCollection === 'object') {
        if (featureCollection['type'] == 'FeatureCollection') {
            let features = featureCollection['features'];
            let result = [];
            for (let feature of features) {
                let featProps = feature['properties'];
                if (typeof feature === 'object') {
                    let geometry = feature['geometry'];
                    featProps[PROP_GEOMETRY] = this.prepareGeometry(geometry);
                }
                result.push(featProps);
            }
            return result;
        }
    }
    return featureCollection;
}

SpatialUnitsHandler.prototype.prepareBFSFeature = async function (postRequestBody) {
    if (typeof postRequestBody === 'object') {
        // Get existing BFS as GeoJSON
        let bfsFeatCollection = await bfsLib.queryItemByUID(postRequestBody.BoundaryFaceString);
        bfsFeatCollection.features[0].properties = postRequestBody;
        bfsFeatCollection.name = "SpatialUnitFeatures"
        return bfsFeatCollection;
    }
    return postRequestBody;
}

SpatialUnitsHandler.prototype.postProcessing = function(itemUID, properties, isNew) {
    // Do nothing as of now
}

SpatialUnitsHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_CONCEPT, dblib.getTable(SPUNIT_CONCEPTS_TABLEID), RELTYPE_SPUNIT, true, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_PROJECTS, dblib.getTable(PROJECTS_TABLEID), RELTYPE_SPUNIT, true, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_ADMINSRC, dblib.getTable(ADMINSRC_TABLEID), RELTYPE_SPUNIT, true, transaction) || this.changed;
    this.changed = await tagsLib.updateRelatedTags(itemUID, properties, table, true, transaction) || this.changed;
    return true;
}


SpatialUnitsHandler.prototype.prepareItem = async function(item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        if (dbrel.containsPropertyName(PROP_CONCEPT, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(SPUNIT_CONCEPTS_TABLEID), PROP_CONCEPT, embed);
        if (dbrel.containsPropertyName(PROP_PROJECTS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(PROJECTS_TABLEID), PROP_PROJECTS, embed);
        if (dbrel.containsPropertyName(PROP_ADMINSRC, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(ADMINSRC_TABLEID), PROP_ADMINSRC, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
    }
    return false;
}

SpatialUnitsHandler.prototype.queryItemByUID = async function(uid, envelope, embed) {
    let table = this.getTable();
    if (table != null && uid) {
        let result = await table.getItemByID(uid);
        await this.prepareItem (result, embed);
        return this.publishResult(result);
    }
    return null;
}

/**
 * Overrides the 'transactionFrame' method in RequestHandler.js
 * 
 * Difference is that instead of a single feature, multiple features can be inserted
 * at one shot in a single transaction
 * 
 */

SpatialUnitsHandler.prototype.transactionFrame = async function(itemUID, properties, infos, envelope, embed, 
    transaction, internalFunction, reloadItem = true) {
    let ownTransaction = transaction == null;
    try {
        let isNew = itemUID == null;
        if (ownTransaction) { transaction = await dbconn.startTransaction(); }
        this.changed = false;
        let result = null;
        if (Array.isArray(properties)) {
            result = [];
            for (let prop of properties) {
                result.push(await internalFunction(this, itemUID, prop, infos, transaction));
                await this.saveProcessResult(isNew ? result : itemUID, this._processUID, transaction);
            }
        } else {
            result = await internalFunction(this, itemUID, properties, infos, transaction);
            await this.saveProcessResult(isNew ? result : itemUID, this._processUID, transaction);
        }
        if (ownTransaction) { await dbconn.finishTransaction(transaction); }       

        if (reloadItem) {
            if (result || this.changed) {
                if (isNew) 
                    itemUID = result;
                if (Array.isArray(result)) {
                    let table = this.getTable();
                    let items = [];
                    for (let itemUID of result) {
                        // this.postProcessing(itemUID, properties, isNew);
                        let item = dblib.publishItems(await table.getItemByID(itemUID));
                        await this.prepareItem(item, embed);
                        items.push(this.createFeature(item, PROP_GEOMETRY));
                    }
                    let features = dblib.publishItems(items)
                    let out = {};
                    out.body = dblib.wrapFeatures("SpatialUnitFeatures", features);
                    out.statusCode = 201;
                    return out;
                } else {
                    // this.postProcessing(itemUID, properties, isNew);
                    let item = await this.queryItemByUID(itemUID, envelope, embed);
                    return dblib.wrapContent(item, false);
                }
            }
            else
                dblib.throwError404(null);
        }
        return result;
    } catch (err) {
        if (ownTransaction) { dbconn.cancelTransaction(transaction); }
        console.log(err);
        throw(err);
    }
}

SpatialUnitConceptsHandler.prototype.createNewConcept = async function(properties, envelope, embed, processUID, transaction=null) {
    return await conceptsHandler.createNewItemContent (properties, envelope, embed, processUID, transaction);
}

/**
 * 
 * @param {Object} properties Request body describing the spatial unit
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function(properties, envelope, embed, processUID, transaction = null) {
    return await handler.createNewItemContent (handler.prepareFeature (properties), envelope, embed, processUID, transaction);
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
    return await handler.updateItem (itemUID, handler.prepareFeature (properties), envelope, embed, processUID, transaction);
}

/**
 * Retrieve a list of metric map features filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String} queryWindow polygon coordinates
 */
module.exports.queryItems = async function(queryWindow,envelope,uid,name,concept,level,projects,adminsource,tags,page,sort,fields,embed) {
    let properties = {};
    let queryPolygon = getPolygonFromPoints(getWindowPoints(queryWindow));
    handler.queryPolygonClause = util.format('NOT ST_Disjoint(geom, %s)', getPolygonQuery(queryPolygon));
    handler.typeName = 'Polygon';
    //let polygons = await handler.queryItems (envelope, properties, page, sort, fields, embed);
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, PROP_NAME, name);
    reqHnd.addQueryValue(properties, PROP_CONCEPT, concept);
    reqHnd.addQueryValue(properties, PROP_LEVEL, level);
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projects);
    reqHnd.addQueryValue(properties, PROP_ADMINSRC, adminsource);
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags);
    
    let features = await handler.queryItems(envelope, properties, page, sort, fields, embed);
    return dblib.wrapFeatures("SpatialUnitFeatures", features);
}

module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID(uid, envelope, embed);
}

module.exports.createItemFromBFS = async function(spatialunitdata,envelope,i4lProcessUid,embed, transaction=null) {
    let bfsGeoJSON = await handler.prepareBFSFeature (spatialunitdata);
    let spUnitGeoJSON = createPolygonFromBoundaryFaceString(bfsGeoJSON);
    return await handler.createNewItemContent(handler.prepareFeature(spUnitGeoJSON), envelope, embed, i4lProcessUid, transaction);
}

module.exports.createNewConcept = async function(spatialunitdata,envelope,i4lProcessUid,embed) {
    return await conceptsHandler.createNewConcept(spatialunitdata,envelope,embed, i4lProcessUid);
}

module.exports.queryConcepts = async function(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projects); 
    reqHnd.addQueryValue(properties, RELTYPE_SPUNIT, spatialunit); 
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags); 
    return await conceptsHandler.queryItems (envelope, properties, page, sort, fields, embed);
}

module.exports.queryConceptsByUID = async function(uid, envelope, embed) {
    return await conceptsHandler.queryItemByUID(uid, envelope, embed);
}

module.exports.updateConcept = async function(itemUID, patch, envelope, embed=null, processUID, transaction = null) {
    return await handler.updateConcept (itemUID, patch, envelope, embed, processUID, transaction);
}

const handler = new SpatialUnitsHandler();
const conceptsHandler = new SpatialUnitConceptsHandler();

function getWindowPoints (queryWindow) {
    let points = queryWindow.split(',');
    for (let i=0; i<points.length-1; i++){
        if (i % 2 == 1) {
            points[i] = points[i].concat(',');
        }
        points[i] = points[i].concat(' ');
    }
    return points;
}

function getPolygonFromPoints (points) {
    let polygonStr = '';
    for (let point of points)
        polygonStr = polygonStr.concat(point);
    return polygonStr;
}

function getPolygonQuery (queryPolygon) {
    return util.format('ST_GeomFromEWKT(\'SRID=4326;POLYGON((%s))\')', queryPolygon);
}

/**
 * Create a Polygon feature by closing BoundaryFaceString vertices
 * 
 * @param {Object} feat GeoJSON feature
 */
function createPolygonFromBoundaryFaceString(feat) {
    let polyLineGeom = feat.features[0].geometry;
    let coords = polyLineGeom.coordinates;
    let vertexStart = coords[0];
    coords.push(vertexStart);
    let newPolygonGeom = {
      'type': 'Polygon',
      'coordinates': [coords]
    };
    let newFeature = feat;
    feat.features[0].geometry = newPolygonGeom;
    return newFeature;
}