'use strict';

const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const tagsLib = require('./Tags.js');

const TABLEID = 'ADMINSOURCE_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';
const SPUNITS_TABLEID = 'SPATIALUNITS_TABLE';

const PROP_PROJECTS = 'Projects';
const PROP_SPUNITS = 'SpatialUnits';
const RELTYPE_ADMINSOURCE = 'AdminSource';

function AdminSourceHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}

AdminSourceHandler.prototype.constructor = AdminSourceHandler;
AdminSourceHandler.prototype.inheritFrom = reqHnd.RequestHandler;
AdminSourceHandler.prototype = new reqHnd.RequestHandler();

AdminSourceHandler.prototype.updateRelations = async function(itemUID, properties, transaction = null) {
    let table = this.getTable();
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_PROJECTS, dblib.getTable(PROJECTS_TABLEID), RELTYPE_ADMINSOURCE, true, transaction);
    this.changed = await dbrel.updateRelatedLinks(itemUID, properties, table, 
        PROP_SPUNITS, dblib.getTable(SPUNITS_TABLEID), RELTYPE_ADMINSOURCE, true, transaction);
    this.changed = await tagsLib.updateRelatedTags(itemUID, properties, table, true, transaction) || this.changed;
}

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
AdminSourceHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addRelationQuery(clauses, table, properties[PROP_PROJECTS], true);
    dbrel.addRelationQuery(clauses, table, properties[PROP_SPUNITS], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}

AdminSourceHandler.prototype.prepareItem = async function (item, embed, fields) {
    let table = this.getTable();
    if (table != null) {
        if (dbrel.containsPropertyName(PROP_PROJECTS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(PROJECTS_TABLEID), PROP_PROJECTS, embed);
        if (dbrel.containsPropertyName(PROP_SPUNITS, fields, embed))
            await dbrel.setRelationsAsProperty(item, table, dblib.getTable(SPUNITS_TABLEID), PROP_SPUNITS, embed);
        if (dbrel.containsPropertyName(tagsLib.PROP_TAGS, fields))
            await tagsLib.addRelatedTags(item, table);
    }
    return false;
}

const handler = new AdminSourceHandler();

/**
 * Retrieve a single admin source from its UID
 * 
 * @param {String} uid UUID of admin source
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.getAdminSourcesByUID = async function(uid,envelope,embed) {
    let result = {};
    result.body = await handler.queryItemByUID (uid, envelope, embed);
    result.statusCode = 200;
    return result;
}

/**
 * Retrieve a list of admin sources filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of admin source
 * @param {String[]} name Names of admin source
 * @param {String[]} type Types of admin source
 * @param {String[]} projects  PaS project UUIDs
 * @param {String[]} spatialunits Spatial Unit UUIDs
 * @param {String[]} tags list of tags
 * @param {Integer} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.getAdminSources = async function(envelope,uid,name,type,projects,spatialunits,tags,page,sort,fields,embed) {
    let properties = {}
    reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(properties, 'name', name); 
    reqHnd.addQueryValue(properties, 'type', type); 
    reqHnd.addQueryValue(properties, PROP_PROJECTS, projects); 
    reqHnd.addQueryValue(properties, PROP_SPUNITS, spatialunits); 
    reqHnd.addQueryValue(properties, tagsLib.PROP_TAGS, tags); 
    let result = {};
    result.body = await handler.queryItems (envelope, properties, page, sort, fields, embed);
    result.statusCode = 200;
    return result;
}

/**
 * Create a new admin source
 * 
 * @method createNewAdminSource
 * @param {Object} newadminsource 
 */
module.exports.createNewAdminSource = async function(newadminsource,envelope,embed,i4lProcessUid) {
    return await handler.createNewItemContent(newadminsource,envelope,embed,i4lProcessUid);
}