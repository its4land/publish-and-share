'use strict';

const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const tagsLib = require('./Tags.js');
const modelsLib = require('./Models.js');

const TABLEID = 'TRAININGSETS_TABLE';
const MODELS_TABLEID = 'MODELS_TABLE';
const TOOLS_TABLEID = 'TOOLS_TABLE';

const PROP_MODELS = 'Models';
const PROP_TOOLS = 'Tools';
const RELTYPE_TOOL = 'Tool';

function TrainingSetsHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
TrainingSetsHandler.prototype.constructor = TrainingSetsHandler;
TrainingSetsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
TrainingSetsHandler.prototype = new reqHnd.RequestHandler();

TrainingSetsHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    await dbrel.createDirectLinks(itemUID, properties[PROP_MODELS], 
        dblib.getTable(MODELS_TABLEID), modelsLib.TRANINGSET_COLUMN, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_TOOLS, dblib.getTable(TOOLS_TABLEID), RELTYPE_TOOL, false, transaction);
    this.changed = await tagsLib.updateRelatedTags(itemUID, properties, table, true, transaction) || this.changed;
    return true;
}

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
TrainingSetsHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addLinkQuery(clauses, properties[PROP_MODELS], dblib.getTable(MODELS_TABLEID), modelsLib.TRANINGSET_COLUMN);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

TrainingSetsHandler.prototype.prepareItem = async function (item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        if (dbrel.containsPropertyName(PROP_MODELS, fields, embed))
            await dbrel.setDirectRelationsAsProperty(item, dblib.getTable(MODELS_TABLEID), modelsLib.TRANINGSET_COLUMN, PROP_MODELS, embed);
        if (dbrel.containsPropertyName(PROP_TOOLS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(TOOLS_TABLEID), PROP_TOOLS, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
        return true;
    }
    return false;
}

const handler = new TrainingSetsHandler();

/**
 * 
 * @param {Object} properties modelclass metadata
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
 * Retrieve a list of trainingsets filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of trainingset
 * @param {String[]} name Names of trainingset
 * @param {String[]} models UUIDs of models related to the model
 * @param {String[]} tags list of tags
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function (envelope, uid, name, models, tags, page, sort, fields, embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    reqHnd.addQueryValue(properties, PROP_MODELS, models); 
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags); 
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
}

/**
 * Retrieve a single trainingset from its UID
 * 
 * @param {String} uid UUID string of trainingset
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}


