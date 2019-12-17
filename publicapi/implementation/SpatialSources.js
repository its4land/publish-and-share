'use strict';

const apiUtils = require('./common/apiUtils');
const dbcfg = require('./common/dbConfig');
const dbconn = require('./common/dbConnection');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const tagsLib = require('./Tags.js');
const docsLib = require('./AddSpatialSourceDocuments.js');
const procsLib = require('./Processes.js');

const TABLEID = 'SPATIALSOURCES_TABLE';
const TAGS_TABLEID = 'TAGS_TABLE';
const ADDDOCS_TABLEID = 'SPATIALSOURCEADDDOCS_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';

const PROP_PROJECTS = 'Projects';
const PROP_ADDDOCS = 'AdditionalDocuments';
const RELTYPE_SPATIALSOURCE = 'SpatialSource';

function SpatSourcesHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
SpatSourcesHandler.prototype.constructor = SpatSourcesHandler;
SpatSourcesHandler.prototype.inheritFrom = reqHnd.RequestHandler;
SpatSourcesHandler.prototype = new reqHnd.RequestHandler();

/**
 * does some post processing if necessary, after the transaction is finished
 * 
 * @param {String} uid UUID of the item to be updated
 * @param {Object} properties to be updated
 * @param {boolean} isNew true after 'insert', false after 'update'
 * @returns {boolean} success
 */
SpatSourcesHandler.prototype.postProcessing = async function(itemUID, properties, isNew) {
    if (isNew) {
        if (this._processUID)
            await procsLib.addItemToComputationResults(this._processUID, itemUID, 'spatialsource', transaction);
    }
    return true;
}

SpatSourcesHandler.prototype.updateAdditionalDocuments = async function (spsourceUID, documents, transaction = null) {
    let table = dblib.getTable(ADDDOCS_TABLEID);
    if (table != null) {
        let properties = {};
        properties[docsLib.SPATIALSOURCE_COLUMN] = spsourceUID;
        let clauses = table.fillProperties(properties, false);
        properties[docsLib.SPATIALSOURCE_COLUMN] = null;
        table.updateItems(properties, clauses, transaction);
    }
    if (Array.isArray(documents))
        for (let document of documents){
            await this.createAdditionalDocument(spsourceUID, document, transaction);
        }
    else
        await this.createAdditionalDocument(spsourceUID, documents, transaction);
}

SpatSourcesHandler.prototype.createAdditionalDocument = async function (spsourceUID, document, transaction = null) {
    if (spsourceUID && document)
        await docsLib.createNewItemContent(document, spsourceUID, false, null, null, transaction);
}

SpatSourcesHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    await dbrel.updateChildItems(itemUID, properties[PROP_ADDDOCS], dblib.getTable(ADDDOCS_TABLEID), docsLib.SPATIALSOURCE_COLUMN, transaction);
    //await this.updateAdditionalDocuments(itemUID, properties[PROP_ADDDOCS], transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_PROJECTS, dblib.getTable(PROJECTS_TABLEID), RELTYPE_SPATIALSOURCE, true, transaction);
    this.changed = await await tagsLib.updateRelatedTags(itemUID, properties, table, true, transaction) || this.changed;
}

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
SpatSourcesHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addLinkQuery(clauses, properties[PROP_ADDDOCS], dblib.getTable(ADDDOCS_TABLEID), docsLib.SPATIALSOURCE_COLUMN);
    dbrel.addRelationQuery(clauses, table, properties[PROP_PROJECTS], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

SpatSourcesHandler.prototype.prepareItem = async function (item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        if (dbrel.containsPropertyName(PROP_ADDDOCS, fields, embed))
            await dbrel.setDirectRelationsAsProperty(
                item, 
                dblib.getTable(ADDDOCS_TABLEID), docsLib.SPATIALSOURCE_COLUMN, 
                PROP_ADDDOCS, embed);            
        if (dbrel.containsPropertyName(PROP_PROJECTS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(PROJECTS_TABLEID), PROP_PROJECTS, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
    }
    return false;
}

SpatSourcesHandler.prototype.replaceItem = async function (spatialsource_uid,updatedspatialsource,envelope,embed,i4lProcessUid) {
    try {
        // Create a transaction
        var replaceTransaction = await dbconn.startTransaction();

        // Check if item exists first
        let qryResult = await this.queryItemByUID(spatialsource_uid, null, null);

        // First delete related items in the item2item table. Only tags in case of spatial sources
        await dbrel.deleteRelatedLinks(spatialsource_uid,
            undefined,
            dblib.getTable(TAGS_TABLEID),
            undefined,
            false,
            replaceTransaction);

        // Update the SpatialSources table
        let featureProperties = updatedspatialsource;
        let allTableProperties = dblib.getTable(this.tableID).getAllColumns();
        let extendedfeatureProperties = apiUtils.setAllPropertiesExplicitly(featureProperties, allTableProperties);
        let result = await this.updateItemByUID(spatialsource_uid, extendedfeatureProperties, replaceTransaction)

        // Add related links again
        await this.updateRelations(spatialsource_uid, featureProperties, replaceTransaction);

        // Finish the transaction
        await dbconn.finishTransaction(replaceTransaction);

        // Query and send results
        let item = await this.queryItemByUID(spatialsource_uid, envelope, embed);
        return dblib.wrapContent(item, false, 200);
    } catch (err) {
        if (replaceTransaction) { dbconn.cancelTransaction(replaceTransaction); }
        console.log(err);
        throw(err);
    }
}


const handler = new SpatSourcesHandler();

/**
 * 
 * @param {Object} properties Request body describing the spatial source
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function(properties, envelope, embed, processUID, transaction = null) {
    return await handler.createNewItemContent (properties, envelope, embed, processUID, transaction);
}

/**
 * 
 * @param {Object} properties item metadata
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {String} uid of the new item
 */
module.exports.createNewItem = async function(properties, transaction = null) {
    return await handler.createNewItem (properties, transaction);
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
 * Retrieve a list of spatial sources filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of spatial source
 * @param {String[]} name Names of spatial source
 * @param {String[]} type Types of spatial source
 * @param {String[]} tags list of tags
 * @param {Integer} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function(envelope, uid, name, type, projects, tags, page, sort, fields, embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    reqHnd.addQueryValue(properties, 'type', type); 
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projects); 
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags); 
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
}

/**
 * Retrieve a single spatial source from its UID
 * 
 * @param {String} uid UUID of spatial source
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}


/**
 * Replace Spatial Source info
 *
 * @param {String} spatialsource_uid UUID of spatial source
 * @param {Object} updatedspatialsource Updated spatial source object
 * @param {Boolean} envelope
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.replaceItem = async function(spatialsource_uid,updatedspatialsource,envelope,embed,i4lProcessUid) {
    return await handler.replaceItem (spatialsource_uid,updatedspatialsource,envelope,embed,i4lProcessUid);
}
