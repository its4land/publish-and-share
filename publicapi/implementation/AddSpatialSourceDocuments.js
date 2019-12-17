'use strict';

const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const TABLEID = 'SPATIALSOURCEADDDOCS_TABLE';
const SPATIALSOURCES_TABLEID = 'SPATIALSOURCES_TABLE';

const SPATIALSOURCE_COLUMN = 'spatialsourceuid';
const PROP_CONTENTITEM = 'ContentItem';

module.exports.SPATIALSOURCE_COLUMN = SPATIALSOURCE_COLUMN;

function AddDocsHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
AddDocsHandler.prototype.constructor = AddDocsHandler;
AddDocsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
AddDocsHandler.prototype = new reqHnd.RequestHandler();

/**
 * 
 * @param {Object} properties item metadata
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {String} uid of the new item
 */
AddDocsHandler.prototype.createNewItem = async function(properties, transaction = null) {
    let spSrcUID = properties[SPATIALSOURCE_COLUMN];
    return await dbrel.createDirectLink(spSrcUID, properties, this.getTable(), SPATIALSOURCE_COLUMN, transaction);
}

AddDocsHandler.prototype.prepareItem = async function (item, embed, fields) {
    let spSrcUID = dblib.getItemProperty(item, SPATIALSOURCE_COLUMN);
    if (spSrcUID){
        delete item.properties[SPATIALSOURCE_COLUMN];
        if (dblib.getItemProperty(item, PROP_CONTENTITEM) == null)
            dblib.setItemProperty(item, PROP_CONTENTITEM, '');
        return true;
    }
}

const handler = new AddDocsHandler();

/**
 * 
 * @param {Object} contentBody spatial source document metadata
 * @param {Boolean} envelope 
 * @param {String} embed 
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function(properties, spSrcUID, envelope, embed, processUID, transaction = null) {
    if (spSrcUID) {
        if (typeof properties === "string") {
            let docUID = properties;
            properties = {};
            properties[SPATIALSOURCE_COLUMN] = spSrcUID;
            let table = handler.getTable();
            return table != null ? await table.updateItemByUID(docUID, properties, transaction) : null;
        }
        if (properties == null)
            properties = {};
        properties[SPATIALSOURCE_COLUMN] = spSrcUID;
        return await handler.createNewItemContent (properties, envelope, embed, processUID, transaction);
    }
    return null;
}

/**
 * 
 * @param {String} spSrcUID UUID of the spatial source
 * @param {String} docUID UUID of the document
 * @param {Boolean} force: delete physically 
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.deleteItem = async function(spSrcUID, docUID, force, transaction = null) {
    let table = handler.getTable();
    if (table != null && docUID) {
        try {
            if (force) {
                return await table.deleteItemByUID(docUID, transaction);
            }
            else {
                let properties = {};
                properties[SPATIALSOURCE_COLUMN] = null;
                return await table.updateItemByUID(docUID, properties, transaction);
            }
            return result;
        } catch (err) {
            console.log(err);
            throw(err);
        }
    }
    return null;
}

/**
 * Retrieve a list of spatial source documents filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of spatial source documents
 * @param {String[]} spSrcUID UUIDs of spatial sources
 * @param {String[]} type list of document types
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 */
module.exports.queryItems = async function (envelope, uid, spSrcUID, type, page, sort, fields) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, SPATIALSOURCE_COLUMN, spSrcUID); 
    reqHnd.addQueryValue(properties, 'type', type); 
    return await handler.queryItems (envelope, properties, page, sort, fields, null);
}

/**
 * Retrieve a single spatial source document from its UID
 * 
 * @param {String} uid UUID string of spatial source document
 * @param {Boolean} envelope 
 */
module.exports.queryItemByUID = async function(uid, envelope, embed) {
    return await handler.queryItemByUID (uid, envelope, embed);
}

