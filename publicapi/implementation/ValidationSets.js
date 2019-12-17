'use strict';

const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const tagsLib = require('./Tags.js');
const modelsLib = require('./Models.js');

const TABLEID = 'VALIDATIONSETS_TABLE';
const MODELS_TABLEID = 'MODELS_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';

const PROP_MODELS = 'Models';
const PROP_PROJECTS = 'Projects';
const RELTYPE_VALIDATIONSET = 'ValidationSet';

function ValidationSetsHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
ValidationSetsHandler.prototype.constructor = ValidationSetsHandler;
ValidationSetsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ValidationSetsHandler.prototype = new reqHnd.RequestHandler();

ValidationSetsHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_MODELS, dblib.getTable(MODELS_TABLEID), RELTYPE_VALIDATIONSET, true, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_PROJECTS, dblib.getTable(PROJECTS_TABLEID), RELTYPE_VALIDATIONSET, true, transaction);
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
ValidationSetsHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addRelationQuery(clauses, table, properties[PROP_MODELS], true);
    dbrel.addRelationQuery(clauses, table, properties[PROP_PROJECTS], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

ValidationSetsHandler.prototype.prepareItem = async function (item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        if (dbrel.containsPropertyName(PROP_MODELS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(MODELS_TABLEID), PROP_MODELS, embed);
        if (dbrel.containsPropertyName(PROP_PROJECTS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(PROJECTS_TABLEID), PROP_PROJECTS, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
        return true;
    }
    return false;
}

const handler = new ValidationSetsHandler();

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
 * Retrieve a list of validationsets filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of validationset
 * @param {String[]} name Names of validationset
 * @param {String[]} models UUIDs of models related to the validation set
 * @param {String[]} projects UUIDs of projects related to the validation set
 * @param {String[]} tags list of tags
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function (envelope, uid, name, models, projects, tags, page, sort, fields, embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    reqHnd.addQueryValue(properties, PROP_MODELS, models); 
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projects); 
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags); 
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
}

/**
 * Retrieve a single validationset from its UID
 * 
 * @param {String} uid UUID string of validationset
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}


