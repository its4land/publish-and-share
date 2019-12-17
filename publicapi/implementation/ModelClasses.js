'use strict';

const dbcfg = require('./common/dbConfig');
const dbrel = require('./common/dbRelations');
const dblib = require('./common/dbLib.js');
const reqHnd = require('./common/RequestHandler.js');


const TABLEID = 'MODELCLASSES_TABLE';
const MODELTABLEID = 'MODELS_TABLE';

const PROP_MODEL = 'Model';
const MODELUID_COLUMN = 'modeluid';

module.exports.MODELUID_COLUMN = MODELUID_COLUMN;

function ModelClassesHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
ModelClassesHandler.prototype.constructor = ModelClassesHandler;
ModelClassesHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ModelClassesHandler.prototype = new reqHnd.RequestHandler();

ModelClassesHandler.prototype.prepareItem = async function (item, embed, fields) {
    if (dbrel.containsPropertyName(PROP_MODEL, fields, embed)) {
        await dbrel.setDirectRelationAsProperty(item, PROP_MODEL, dblib.getTable(MODELTABLEID), embed, true);
    }
}

const handler = new ModelClassesHandler();

/**
 * 
 * @param {Object} contentBody modelclass metadata
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function(properties, modelUID, envelope, embed, processUID, transaction = null) {
    properties[MODELUID_COLUMN] = modelUID;
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
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} properties of the item
 */
module.exports.updateItem = async function(itemUID, properties, envelope, embed, transaction = null) {
    return await handler.updateItem (itemUID, properties, envelope, embed, null, transaction);
}

/**
 * Retrieve a list of modelclasses filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of modelclass
 * @param {String[]} modelUID UUIDs of models
 * @param {String[]} nameInModel Names in Model of modelclass
 * @param {String[]} conceptName Concept names of modelclass
 * @param {String[]} tags list of tags
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function (envelope, uid, modelUID, nameInModel, conceptName, conceptImage, 
    page, sort, fields, embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, MODELUID_COLUMN, modelUID); 
    reqHnd.addQueryValue(properties, 'nameInModel', nameInModel); 
    reqHnd.addQueryValue(properties, 'conceptName', conceptName); 
    reqHnd.addQueryValue(properties, 'conceptImage', conceptImage); 
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
}

/**
 * Retrieve a single modelclass from its UID
 * 
 * @param {String} uid UUID string of modelclass
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}

