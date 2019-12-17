/**
 * Implementation of Tools endpoint
 */

'use strict';

const dbutils = require('./common/dbUtils');


const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');
const _ = require('lodash');

const TABLEID = 'TOOLS_TABLE';
const TOOLIMAGES_TABLEID = 'TOOLIMAGES_TABLE';
const ENTRYPOINT_TABLEID = 'ENTRYPOINT_TABLE';

function ToolsHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
ToolsHandler.prototype.constructor = ToolsHandler;
ToolsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ToolsHandler.prototype = new reqHnd.RequestHandler();

ToolsHandler.prototype.prepareItems = async function (items, embed, fields) {
    items = await this.constructor.prototype.prepareItems.call(this, items, embed, fields);
    let result = [];
    for (let item of items) {
        if (Array.isArray(item.images) && item.images.length > 0) {
            for (let imageInfo of item.images) {
                let info = Object.assign({}, item.properties); 
                info['Version'] = imageInfo.Version;
                info['Image'] = {
                    "UID": imageInfo.UID,
                    "ReleaseDate": imageInfo.ReleaseDate,
                    "Image": imageInfo.image,
                }
                info["EntryPoints"] = imageInfo.EntryPoints
                result.push(info);
            }
        } else {
            item.properties['Image'] = {};
            result.push(item.properties);
        }
    }
    return result;
}

ToolsHandler.prototype.prepareItem = async function (item, embed, fields) {
    let toolUID = item.id;
    let toolImages = await this.getToolImagesForTool(toolUID, this.toolVersionQuery);
    if (toolImages.length > 0) {
        for (let toolImage of toolImages) {
            toolImage.EntryPoints = await this.getEntryPointsForToolImage(toolImage.UID);
        }
    }
    item.images = toolImages;
    return true;
}

/**
 * Get tool-images associated with a given tool. If version is
 * not specified, get the latest version of the tool
 * 
 * @param {String} tooluid UUID of tool
 * @param {String} version version of tool to retrieve
 */
ToolsHandler.prototype.getToolImagesForTool = async function (tooluid, version) {
    let returnAllImages = false;
    if (version === '*') {
        // return all results
        version = undefined;
        returnAllImages = true;
    }
    let table = dblib.getTable(TOOLIMAGES_TABLEID);
    if (table != null) {
        let properties = {}
        reqHnd.addQueryValue(properties, 'tooluid', tooluid);
        reqHnd.addQueryValue(properties, 'version', version); 
        let clauses = table.fillProperties(properties, false);
        let result = await table.getQueryResult(null, clauses, 'version desc', true, false);
        if (Array.isArray(result) && result.length > 0 && !version && !returnAllImages) {
            // return latest version
            result = result.slice(0,1);
        }
        return dblib.publishItems(result);
    }
    return null;
}

/**
 * Query and return entrypoints associated with an image of a tool
 * 
 * @param {String} toolImageUid UID of Tool Image
 */
ToolsHandler.prototype.getEntryPointsForToolImage = async function (toolImageUid) {
    let table = dblib.getTable(ENTRYPOINT_TABLEID);
    if (table != null) {
        let properties = {}
        reqHnd.addQueryValue(properties, 'toolimageuid', toolImageUid);
        let clauses = table.fillProperties(properties, false);
        let result = await table.getQueryResult(['name', 'description', 'entrypoint'], clauses, null, true, false);
        return dblib.publishItems(result);
    }
    return null;
}

/**
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid Tool UUIDs
 * @param {String[]} name Names of Tools
 * @param {String[]} version Versions of Tool
 * @param {String[]} supplier Names of tool providers
 * @param {Number} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function (envelope, uid, name, version, supplier, page, sort, fields, embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    //reqHnd.addQueryValue(properties, 'version', version); 
    reqHnd.addQueryValue(properties, 'supplier', supplier);
    var handler = new ToolsHandler();
    handler.toolVersionQuery = version;
    return await handler.queryItems (envelope, properties, page, sort, fields, embed);
};