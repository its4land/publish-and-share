const util = require('util');

const dbcfg = require('./common/dbConfig');
const dbconn = require('./common/dbConnection');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');
const apiUtils = require('./common/apiUtils');
const tagsLib = require('./Tags.js');

const BFS_TABLEID = 'BOUNDARYFACESTRING_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';
const SPATIALUNIT_TABLEID = 'SPATIALUNITS_TABLE'

const PROP_GEOMETRY = 'geometry';
const PROP_NAME = 'name';
const PROP_PROJECTS = 'Projects';
const PROP_SPATIALUNITS = 'SpatialUnits';

const RELTYPE_BFS = 'BoundaryFaceString';

function BoundaryFaceStringsHandler () {
    reqHnd.RequestHandler.call(this, BFS_TABLEID);
}

BoundaryFaceStringsHandler.prototype.constructor = BoundaryFaceStringsHandler;
BoundaryFaceStringsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
BoundaryFaceStringsHandler.prototype = new reqHnd.RequestHandler();

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
BoundaryFaceStringsHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addRelationQuery(clauses, table, properties[PROP_PROJECTS], true);
    dbrel.addRelationQuery(clauses, table, properties[PROP_SPATIALUNITS], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

/**
 * prepare query result(s) for response
 * 
 * @param {Array} result of a query (Array of records, or a single record)
 * @param {Array} Array of items or a single item (Record.properties), prepared for response
 */
BoundaryFaceStringsHandler.prototype.publishResult = function(result) {
    return this.createGeoJSON(dblib.publishItems(result), PROP_GEOMETRY, 
        Array.isArray(result) ? null : "BoundaryFaceString");
}

BoundaryFaceStringsHandler.prototype.prepareFeature = function (featureCollection) {
    if (typeof featureCollection === 'object') {
        if (featureCollection['type'] == 'FeatureCollection') {
            features = featureCollection['features'];
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

BoundaryFaceStringsHandler.prototype.postProcessing = function(itemUID, properties, isNew) {
    // Do nothing as of now
}

const handler = new BoundaryFaceStringsHandler();

BoundaryFaceStringsHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_PROJECTS, dblib.getTable(PROJECTS_TABLEID), RELTYPE_BFS, true, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_SPATIALUNITS, dblib.getTable(SPATIALUNIT_TABLEID), RELTYPE_BFS, true, transaction) || this.changed;
    this.changed = await tagsLib.updateRelatedTags(itemUID, properties, table, true, transaction) || this.changed;
    return true;
}

/**
 * 
 * @param {Object} properties Request body describing the boundary face string
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
module.exports.queryItems = async function(envelope,uid,name,projects,spatialunit,tags,page,sort,fields,embed) {
    let properties = {};
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, PROP_NAME, name);
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projects);
    reqHnd.addQueryValue(properties, PROP_SPATIALUNITS, spatialunit);
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags);
    
    let features = await handler.queryItems(envelope, properties, page, sort, fields, embed);
    return dblib.wrapFeatures("BoundaryFaceString", features);
}

BoundaryFaceStringsHandler.prototype.prepareItem = async function(item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        if (dbrel.containsPropertyName(PROP_PROJECTS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(PROJECTS_TABLEID), PROP_PROJECTS, embed);
        if (dbrel.containsPropertyName(PROP_SPATIALUNITS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(SPATIALUNIT_TABLEID), PROP_SPATIALUNITS, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
    }
    return false;
}

BoundaryFaceStringsHandler.prototype.queryItemByUID = async function(uid, envelope, embed) {
    let table = this.getTable();
    if (table != null && uid) {
        let result = await table.getItemByID(uid);
        await this.prepareItem (result, embed);
        return this.publishResult(result);
    }
    return null;
}

module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID(uid, envelope, embed);
}

BoundaryFaceStringsHandler.prototype.replaceItem = async function(boundaryfacestring_uid, updatedboundaryfacestring, envelope, embed, i4lProcessUid) {
    try {
        // Create a transaction
        var replaceTransaction = await dbconn.startTransaction();

        // Check if item exists first
        let qryResult = await this.queryItemByUID(spatialsource_uid, null, null);

        // First delete related items in the item2item table
        await dbrel.deleteAllRelatedLinks(boundaryfacestring_uid, replaceTransaction);

        // Update the BFS table
        let featureProperties = this.prepareFeature(updatedboundaryfacestring)[0];
        let allTableProperties = dblib.getTable(this.tableID).getAllColumns();
        let extendedfeatureProperties = apiUtils.setAllPropertiesExplicitly(featureProperties, allTableProperties);
        let result = await this.updateItemByUID(boundaryfacestring_uid, extendedfeatureProperties, replaceTransaction)

        // Add related links again
        await this.updateRelations(boundaryfacestring_uid, featureProperties, replaceTransaction);

        // Finish the transaction
        await dbconn.finishTransaction(replaceTransaction);

        // Query and send results
        let item = await this.queryItemByUID(boundaryfacestring_uid, envelope, embed);
        return dblib.wrapContent(item, false, 200);
    } catch (err) {
        if (replaceTransaction) { dbconn.cancelTransaction(replaceTransaction); }
        console.log(err);
        throw(err);
    }
}

module.exports.replaceItem = async function(boundaryfacestring_uid, updatedboundaryfacestring, envelope, embed, i4lProcessUid) {
    return await handler.replaceItem(boundaryfacestring_uid, updatedboundaryfacestring, envelope, embed, i4lProcessUid);
}

/**
 * Overrides the 'transactionFrame' method in RequestHandler.js
 * 
 * Difference is that instead of a single feature, multiple features can be inserted
 * at one shot in a single transaction
 * 
 */

BoundaryFaceStringsHandler.prototype.transactionFrame = async function(itemUID, properties, infos, envelope, embed, 
    transaction, internalFunction, reloadItem = true) {
    let ownTransaction = (transaction == null);
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
                    out.body = dblib.wrapFeatures("BoundaryFaceString", features);
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