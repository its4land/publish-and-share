'use strict';

const dbconn = require('./dbConnection');
const dblib = require('./dbLib');
const dbrel = require('./dbRelations');

const PROCESSES_TABLEID = 'PROCESSES_TABLE';
const COMPRESULTS_TABLEID = 'RESULTS_TABLE';

module.exports.RequestHandler = RequestHandler;

module.exports.addQueryValue = function (clauses, property, value) {
    if (value != null)
        clauses[property] = value;
}

// class RequestHandler

function RequestHandler (tableID) {
    this.tableID = tableID;
    this._processUID = undefined;
}

RequestHandler.prototype.constructor = RequestHandler;

RequestHandler.prototype.getTable = function () { 
    return dblib.getTable(this.tableID); 
}

RequestHandler.prototype.transactionFrame = async function(itemUID, properties, infos, envelope, embed, 
    transaction, internalFunction, reloadItem = true) {
    let ownTransaction = (transaction == null);
    try {
        let isNew = itemUID == null;
        if (ownTransaction) { transaction = await dbconn.startTransaction(); }
        this.changed = false;
        let result = await internalFunction(this, itemUID, properties, infos, transaction);
        await this.saveProcessResult(isNew ? result : itemUID, this._processUID, transaction);
        if (ownTransaction) { await dbconn.finishTransaction(transaction); }       

        if (reloadItem) {
            if (result || this.changed) {
                if (isNew)
                    itemUID = result;
                await this.postProcessing(itemUID, properties, isNew);
                let item = await this.queryItemByUID(itemUID, envelope, embed);
                return dblib.wrapContent(item, false);
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

/**
 * 
 * @param {Object} properties item metadata
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} success
 */
RequestHandler.prototype.createNewItemContent = async function(properties, envelope, embed, processUID, transaction = null) {
    this._processUID = processUID;
    return this.transactionFrame(null, properties, null, envelope, embed, transaction, _intFunc_createNewItem);
}

async function _intFunc_createNewItem(handler, itemUID, properties, infos, transaction) {
    itemUID = await handler.createNewItem(properties, transaction);
    return itemUID;
}

/**
 * 
 * @param {Object} properties item metadata
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {String} uid of the new item
 */
RequestHandler.prototype.createNewItem = async function(properties, transaction = null) {
    let table = this.getTable();
    if (table != null) {
        let itemUID = await table.createNewItem(properties, transaction);
        await this.updateRelations(itemUID, properties, transaction);
        return itemUID;
    }
    return null;
}

/**
 * 
 * @param {String} itemUID UUID of the new item
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} success
 */
RequestHandler.prototype.saveProcessResult = async function(itemUID, processUID, transaction = null) {
    if (itemUID && processUID) {
        let table = this.getTable();
        let table2 = dblib.getTable(PROCESSES_TABLEID);
        if (table2 != null) {
            let process = await table2.getItemByID(processUID);
            if (process != null) {
                table2 = dblib.getTable(COMPRESULTS_TABLEID);
                if (table2 != null) {
                    let properties = {};
                    properties["projectuid"] = process.properties["Project"];
                    properties["computedate"] = 'LOCALTIMESTAMP';  // = Date.now(); 
                    properties["processuid"] = processUID;
                    properties["resulttype"] = table.name;
                    properties["resultuid"] = itemUID;
                    let result = await table2.createNewItem(properties, transaction);
                    return result != null;
                }
            }
        }
    }
    return false;
}

/**
 * updateItem modifies properties of an existing item.
 * 
 * @param {String} itemUID UUID of the item to be updated
 * @param {Object} properties to be updated
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} properties of the item
 */
RequestHandler.prototype.updateItem = async function(itemUID, properties, envelope, embed, processUID, transaction = null) {
    /*try {
        properties = dblib.fromRFCpatch(properties);
    } catch (err) {
        console.log(err);
        throw(err);
    }*/
    this._processUID = processUID;
    return this.transactionFrame(itemUID, properties, null, envelope, embed, transaction, _intFunc_updateItem);
}

async function _intFunc_updateItem(handler, itemUID, properties, infos, transaction) {
    return await handler.updateItemInternal(itemUID, properties, transaction);
}

RequestHandler.prototype.updateItemInternal = async function(itemUID, properties, transaction = null) {
    let relProps = properties;
    try {
        relProps = dblib.fromRFCpatch(relProps);
    } catch (err) {
        console.log(err);
        throw(err);
    }
    return await this.updateRelations(itemUID, relProps, transaction)
        && await this.updateItemByUID(itemUID, properties, transaction);
}

/**
 * modifies properties of an existing item.
 * 
 * @param {String} uid UUID of the item to be updated
 * @param {Object} properties to be updated
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {boolean} success
 */
RequestHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    return true;
}

/**
 * updateItem modifies properties of an existing item.
 * 
 * @param {String} uid UUID of the item to be updated
 * @param {Object} properties to be updated
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} properties of the item
 */
RequestHandler.prototype.updateItemByUID = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    if (table != null) {
        if (Array.isArray(properties))
            return await table.patchItem(itemUID, properties, transaction);
        else
            return await table.updateItemByUID(itemUID, properties, transaction);
    }
    return null;
}

/**
 * 
 * @param {String} itemUID UUID of the item to be deleted
 * @param {Boolean} force: delete physically 
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
RequestHandler.prototype.deleteItem = async function(itemUID, force, transaction = null) {
    return this.transactionFrame(itemUID, null, null, false, null, transaction, _intFunc_deleteItem, false);
}

async function _intFunc_deleteItem(handler, itemUID, properties, infos, transaction) {
    return await handler.deleteItemInternal(itemUID, transaction);
}

RequestHandler.prototype.deleteItemInternal = async function(itemUID, transaction = null) {
    let table = this.getTable();
    if (table != null && itemUID) {
        // First, delete all related links in the item2item table (if any)
        await dbrel.deleteAllRelatedLinks(itemUID, transaction);

        // Next, delete reocrds from the the resource table and return
        return await table.deleteItemByUID(itemUID, transaction);
    }
    return null;
}

/**
 * Removes the link between items and deletes the related item (optional)
 * 
 * @method detachRelation
 * @param {String} itemUID uid of this item
 * @param {String} relatedUID uid of the item to be detached
 * @param {Object} relatedTable table of the item to be detached
 * @param {Boolean} envelope 
 * @param {Boolean} forceDelete if true, the item is deleted 
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
RequestHandler.prototype.detachRelation = async function(itemUID, relatedUID, relatedTable, 
    envelope, forceDelete, transaction = null) {
    let infos = {};
    infos.relatedUID = relatedUID;
    infos.relatedTable = relatedTable;
    infos.forceDelete = forceDelete;
    return this.transactionFrame(itemUID, null, infos, envelope, null, transaction, _intFunc_detachRelation);
}

async function _intFunc_detachRelation(handler, itemUID, properties, infos, transaction) {
    return await handler.detachRelationInternal(itemUID, infos.relatedUID, infos.relatedTable, 
        infos.forceDelete, transaction);
}

/**
 * Removes the link between items and deletes the related item (optional)
 * 
 * @method detachRelationInternal
 * @param {String} itemUID uid of this item
 * @param {String} relatedUID uid of the item to be detached
 * @param {Object} relatedTable table of the item to be detached
 * @param {Boolean} forceDelete if true, the item is deleted 
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
RequestHandler.prototype.detachRelationInternal = async function(itemUID, relatedUID, relatedTable, forceDelete, transaction = null) {
    if (relatedTable instanceof dblib.Table) {
        let result = await dbrel.deleteRelatedLinks(itemUID, relatedUID, relatedTable, undefined, false, transaction);
        if (forceDelete) {
            await relatedTable.deleteItemByUID(relatedUID, transaction);
        }
        return result;
    }
    return false;
}

/**
 * Adds a tag to an item
 * 
 * @method attachTag
 * @param {String} itemUID uid of item to be tagged
 * @param {String[]} tags to be attached
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
RequestHandler.prototype.attachTag = async function(itemUID, tags, envelope, embed, transaction = null) {
    return this.transactionFrame(itemUID, tags, null, envelope, embed, transaction, _intFunc_attachTag);
}

async function _intFunc_attachTag(handler, itemUID, properties, infos, transaction) {
    return await handler.attachTagInternal(itemUID, properties, transaction);
}

/**
 * must be implemented in concrete handler
 */
RequestHandler.prototype.attachTagInternal = async function(itemUID, tags, transaction = null) {
    return null;
}

/**
 * Removes a tag from an item
 * 
 * @method removeTag
 * @param {String} itemUID uid of the item
 * @param {String} tags to be removed
 * @param {Boolean} envelope 
 * @param {Boolean} forceDelete if true, the item is deleted 
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
RequestHandler.prototype.removeTag = async function(itemUID, tags, envelope, forceDelete, transaction = null) {
    let infos = {};
    infos.forceDelete = forceDelete;
    return this.transactionFrame(itemUID, tags, infos, envelope, null, transaction, _intFunc_removeTag);
}

async function _intFunc_removeTag(handler, itemUID, properties, infos, transaction) {
    return await handler.removeTagInternal(itemUID, properties, infos.forceDelete, transaction);
}

/**
 * must be implemented in concrete handler
 */
RequestHandler.prototype.removeTagInternal = async function(itemUID, tags, forceDelete, transaction = null) {
    return null;
}

/**
 * does some post processing if necessary, after the transaction is finished
 * 
 * @param {String} uid UUID of the item to be updated
 * @param {Object} properties to be updated
 * @param {boolean} isNew true after 'insert', false after 'update'
 * @returns {boolean} success
 */
RequestHandler.prototype.postProcessing = async function(itemUID, properties, isNew) {
    return true;
}

/**
 * Retrieve a list of items filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} properties property values to be searched for
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
RequestHandler.prototype.queryItems = async function (envelope, properties, page, sort, fields, embed) {
    let table = this.getTable();
    if (table != null) {
        let clauses = table.fillProperties(properties, false);
        await this.prepareQueryClauses(clauses, properties);
        let result = await table.getQueryResult(fields, clauses, sort);
        result = await this.prepareItems (result, embed, fields);
        return this.publishResult(result);
    }
    return null;
}

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
RequestHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
}

/**
 * Retrieve a single item from its UID
 * 
 * @param {String} uid UUID string of item
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
RequestHandler.prototype.queryItemByUID = async function(uid, envelope, embed) {
    let table = this.getTable();
    if (table != null && uid) {
        let result = await table.getItemByID(uid);
        await this.prepareItem (result, embed);
        return this.publishResult(result);
    }
    return null;
}

RequestHandler.prototype.prepareItems = async function (items, embed, fields) {
    if (Array.isArray(items)) {
        for (let item of items) {
            await this.prepareItemWrap (item, embed, fields);
        }
    }
    else
        await this.prepareItemWrap (items, embed, fields);
    return items;
}

RequestHandler.prototype.prepareItemWrap = async function (item, embed, fields) {
    if (item) {
        try {
            return await this.prepareItem (item, embed, fields);
        } catch (err) {
            console.log("prepareItem error", err);
            if (item)
                item['error'] = err;
        }
    }
    return null;
}

RequestHandler.prototype.prepareItem = async function (item, embed, fields) {
    return true;
}

/**
 * prepare query result(s) for response
 * 
 * @param {Array} result of a query (Array of records, or a single record)
 * @param {Array} Array of items or a single item (Record.properties), prepared for response
 */
RequestHandler.prototype.publishResult = function(result) {
    return dblib.publishItems(result);
}

/**
 * Accept an array of project metadata and return a GeoJSON object
 * 
 * @method createGeoJSON
 * @param {Array} items Array of objects containing geometry and metadata
 * @param {String} geometryProperty name of the property containing geometry data
 * @param {String} collectionName name of the new feature collection
 * @returns {Array or Object} array of features (collectionName == null) or a named feature collection
 */
RequestHandler.prototype.createGeoJSON = function (items, geometryProperty, collectionName = null) {
    try {
        let features = [];
        if (Array.isArray(items)) {
            items.forEach(properties => {
                features.push(this.createFeature(properties, geometryProperty));
            });
        } else
            features.push(this.createFeature(items, geometryProperty));
        return collectionName != null ? dblib.wrapFeatures(collectionName, features) : features;
    } catch (err) {
        if (err instanceof SyntaxError) {
            throw dblib.customErr(500);
        }
    }
}

/**
 * Create a GeoJSON feature from single item's metadata
 * 
 * @param {Object} properties Object containing geometry and metadata
 * @param {String} geometryProperty name of the property containing geometry data
 * @returns {Object} feature
 */
RequestHandler.prototype.createFeature = function (properties, geometryProperty) {
    let geom = {};
    if (geometryProperty in properties) {
        geom = JSON.parse(properties[geometryProperty]);
        delete properties[geometryProperty];
    }
    let feature = {
        "type": "Feature",
        "properties": properties,
        "geometry": geom
    }
    return feature;
}

/**
 * convert a json geometry structure to a string and remove odd brackets
 * 
 * @param {Object} geometry Object containing geometry
 * @returns {String} string representance of the geometry
 */
RequestHandler.prototype.prepareGeometry = function (geometry) {
    let json = JSON.stringify(geometry);
    if (json.indexOf('[[[') >= 0)
        switch (geometry.type) {
            case "Point":
                json = json.replace('[[[', '[').replace(']]]', ']');
                break;
            case "LineString":
                json = json.replace('[[[', '[[').replace(']]]', ']]');
                break;
        }
    return json;
}

