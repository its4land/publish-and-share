'use strict';

const util = require('util');

const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const tagsLib = require('./Tags.js');
const ModelClasses = require('./ModelClasses.js');

module.exports.TRANINGSET_COLUMN = 'trainingset'
module.exports.CLASSIFIER_COLUMN = 'classifier'

const TABLEID = 'MODELS_TABLE';
const MODELCLASSES_TABLEID = 'MODELCLASSES_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';
const TRAININGSETS_TABLEID = 'TRAININGSETS_TABLE';
const TOOLS_TABLEID = 'TOOLS_TABLE';

const PROP_MODELCLASSES = 'ModelClasses';
const PROP_NUMMODELCLASSES = 'NumModelClasses';
const PROP_TRAININGSET = 'TrainingSet';
const PROP_TOOLS = 'Tools';
const PROP_PROJECTS = 'Projects';
const RELTYPE_MODEL = 'Model';
const RELTYPE_TOOL = 'Tool';

function ModelsHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
ModelsHandler.prototype.constructor = ModelsHandler;
ModelsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ModelsHandler.prototype = new reqHnd.RequestHandler();

ModelsHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    await dbrel.updateChildItems(itemUID, properties[PROP_MODELCLASSES], dblib.getTable(MODELCLASSES_TABLEID), ModelClasses.MODELUID_COLUMN, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_PROJECTS, dblib.getTable(PROJECTS_TABLEID), RELTYPE_MODEL, true, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_TOOLS, dblib.getTable(TOOLS_TABLEID), RELTYPE_TOOL, false, transaction) || this.changed;
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
ModelsHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addLinkQuery(clauses, properties[PROP_MODELCLASSES], dblib.getTable(MODELCLASSES_TABLEID), ModelClasses.MODELUID_COLUMN);
    dbrel.addRelationQuery(clauses, table, properties[PROP_TOOLS], true);
    dbrel.addRelationQuery(clauses, table, properties[PROP_PROJECTS], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

ModelsHandler.prototype.prepareItem = async function (item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        let result = await dbrel.setDirectRelationsAsProperty(
            item, 
            dblib.getTable(MODELCLASSES_TABLEID), ModelClasses.MODELUID_COLUMN, 
            dbrel.containsPropertyName(PROP_MODELCLASSES, fields, embed) ? PROP_MODELCLASSES : undefined, 
            embed);
        if (dbrel.containsPropertyName(PROP_NUMMODELCLASSES, fields))
            dblib.setItemProperty(item, PROP_NUMMODELCLASSES, Array.isArray(result) ? result.length : 0);
        
        if (dbrel.containsPropertyName(PROP_TRAININGSET, fields, embed))
            await dbrel.setDirectRelationAsProperty(item, PROP_TRAININGSET, 
                dblib.getTable(TRAININGSETS_TABLEID), embed, false);

        if (dbrel.containsPropertyName(PROP_TOOLS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(TOOLS_TABLEID), PROP_TOOLS, embed);
        if (dbrel.containsPropertyName(PROP_PROJECTS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(PROJECTS_TABLEID), PROP_PROJECTS, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
        return true;
    }
    return false;
}

const handler = new ModelsHandler();


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
 * Retrieve a list of models filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of models
 * @param {String[]} name Names of models
 * @param {String[]} tools UUIDs of tools related to the model
 * @param {String[]} projects UUIDs of projects related to the model
 * @param {String[]} tags Comma separated list of tags
 * @param {Number} page Page number of results
 * @param {String} sort comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function (envelope, uid, name, tools, projects,
    tags, page, sort, fields, embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    reqHnd.addQueryValue(properties, PROP_TOOLS, tools); 
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projects); 
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags); 
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
}

/**
 * Retrieve a single model from its UID
 * 
 * @param {String} uid UUID string of model
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}
