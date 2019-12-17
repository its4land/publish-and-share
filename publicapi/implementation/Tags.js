'use strict';

const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const TABLEID = 'TAGS_TABLE';

const PROP_TAGS = 'Tags';
const PROP_TAGVALUE = 'TagValue';
const PROP_TAGGEDOBJECTS = 'TaggedObjects';
const PROP_TAGGEDOBJECTSSUM = 'TaggedObjectsSum';
const PROP_OBJECTTYPES = 'objectTypes';
const TAGVALUE_COLUMN = 'tags';
const RELTYPE_TAG = 'Tag';

module.exports.PROP_TAGS = PROP_TAGS;
module.exports.PROP_TAGVALUE = PROP_TAGVALUE;

function TagsHandler () {
    reqHnd.RequestHandler.call(this, TABLEID);
}
TagsHandler.prototype.constructor = TagsHandler;
TagsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
TagsHandler.prototype = new reqHnd.RequestHandler();

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
TagsHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    dbrel.addRelationQuery(clauses, this.getTable(), properties[PROP_TAGGEDOBJECTS], true);
    dbrel.addRelatedTypesQuery(clauses, this.getTable(), properties[PROP_OBJECTTYPES], true);
}

TagsHandler.prototype.prepareItem = async function (item, embed, fields) {
    let table = this.getTable();
    if (table != null && item != null) {
        if (item instanceof dblib.Record)
            item = item.properties;
        try {
            embed = PROP_TAGGEDOBJECTS;
            await dbrel.setRelationsAsProperty(item, table, null, PROP_TAGGEDOBJECTS, embed);
            let relatedItems = item[PROP_TAGGEDOBJECTS];
            if (relatedItems != null) {
                let sums = [];
                let items = [];
                for (let item of relatedItems) {
                    let tableName = item[dbrel.PROP_OBJTYPE];
                    if (tableName) {
                        let found = false;
                        for (let typeSum of sums) {
                            if (typeSum[dbrel.PROP_OBJTYPE] == tableName) {
                                found = true;
                                typeSum['Count']++;
                                break;
                            }
                        }
                        if (!found) {
                            let newType = {};
                            newType[dbrel.PROP_OBJTYPE] = tableName;
                            newType['Count'] = 1;
                            sums.push(newType);
                        }
                        let newItem = {};
                        newItem[dbrel.PROP_OBJTYPE] = tableName;
                        newItem[dbrel.PROP_OBJUID] = item[dbrel.PROP_OBJUID];
                        newItem['Name'] = item['Name'];
                        newItem['Description'] = item['Description'];
                        items.push(newItem);
                    }
                }
                item[PROP_TAGGEDOBJECTS] = items;
                item[PROP_TAGGEDOBJECTSSUM] = sums;
            }
        } catch (err) {
            console.log("add relations error", err);
        }
    }
}

const handler = new TagsHandler();


/**
 * 
 * @param {Object} contentBody tags metadata
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function(properties, envelope, embed, transaction = null) {
    return await handler.createNewItemContent (properties, envelope, embed, null, transaction);
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
 * Retrieve a list of tags filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String[]} uid UUIDs of tags
 * @param {String[]} displayValue values of tags
 * @param {String[]} objectTypes Types of tags
 * @param {String[]} objectUUID UUIDs of tagged items
 * @param {Integer} page Page number of results
 * @param {String} sort Comma separated list of fields to sort by
 * @param {String[]} fields list of field names to output
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItems = async function (envelope, uid, displayValue, objectTypes, objectUUID, page, sort, fields, embed) {
    let clauses = {}
    reqHnd.addQueryValue(clauses, dbcfg.UID_COLUMN, uid);
    reqHnd.addQueryValue(clauses, PROP_TAGVALUE, displayValue); 
    reqHnd.addQueryValue(clauses, PROP_TAGGEDOBJECTS, objectUUID); 
    reqHnd.addQueryValue(clauses, PROP_OBJECTTYPES, objectTypes); 
    return await handler.queryItems (envelope, clauses, page, sort, fields, embed);
}

/**
 * Retrieve a single spatial source from its UID
 * 
 * @param {String} display name of a tag
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 */
module.exports.queryItemByName = async function(name, envelope, embed) {
    let result = await module.exports.queryItems(envelope, undefined, name, undefined, undefined);
    if (Array.isArray(result) && result.length > 0) {
        result = result[0]; 
        await handler.prepareItem (result, embed);
    }
    return result;
}


/**
 * Queries the uid of a single tag, inserts the tag into the database, if it not exists yet.
 * 
 * @method getTagUid
 * @param {Object} tag any value for a tag
 * @param {boolean} create: if the tag does not exist, insert it (true) or return null (false)
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {String} uid of the tag
 */
module.exports.getTagUid = async function (tag, create, transaction = null) {
    let table = handler.getTable();
    if (table != null && tag) {
        let clauses = {};
        clauses[TAGVALUE_COLUMN] = tag.toLowerCase();
        let result = await table.getQueryResult([table.uidColumnName], clauses, null, true, false);
        if (Array.isArray(result))
            for (let item of result)
                return item.id;
        if (create)
            return await table.createNewItem(clauses, transaction);
    }
    return null;
}

/**
 * Queries the uids of one or more tag(s)
 * 
 * @method getUidsOfTags
 * @param {Array} tags any values for tags
 * @param {boolean} create: if the tag does not exist, insert it (true) or return null (false)
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Array of String} uids of the tags
 */
module.exports.getUidsOfTags = async function (tags, create, transaction = null) {
    let uids = [];
    if (tags) {
        let tagValues = [];
        if (Array.isArray(tags)) {
            for (let tag of tags) {
                tagValues.push(tag.toLowerCase());
            }
        }
        else
            tagValues.push(tags.toLowerCase());
        if (tagValues.length > 0) {
            let table = handler.getTable();
            if (table != null) {
                if (create) {
                    for (let tag of tagValues) {
                        let uid = await module.exports.getTagUid(tag, create, transaction);
                        uids.push(uid);
                    }
                }
                else {
                    let clauses = {};
                    clauses[TAGVALUE_COLUMN] = tagValues;
                    let result = await table.getQueryResult([table.uidColumnName], clauses, null, true, false);
                    if (Array.isArray(result)) {
                        for (let item of result) 
                            uids.push(item.id);
                    }
                }
            }
        }
    }
    return uids;
}

/**
 * Queries the tags of one or more tag uid(s)
 * 
 * @method getTagsOfUids
 * @param {Array of String} uids of tags
 * @returns {Array} tags referenced by the uids
 */
module.exports.getTagsOfUids = async function (uids) {
    let tags = [];
    let table = handler.getTable();
    if (table != null && uids && (!Array.isArray(uids) || uids.length > 0)) {
        let clauses = {};
        clauses[table.uidColumnName] = uids;
        let result = await table.getQueryResult([TAGVALUE_COLUMN], clauses, TAGVALUE_COLUMN, true, false);
        if (Array.isArray(result)) {
            for (let item of result) 
                tags.push(item.properties[PROP_TAGVALUE]);
        }
    }
    return tags;
}

/**
 * Queries the tag uids related to an item
 * 
 * @method getRelatedTagUids
 * @param {String} uid of the item
 * @returns {Array of String} uids of the related tags
 */
module.exports.getRelatedTagUids = async function (itemUID) {
    return await dbrel.getRelationsOfItem (itemUID, handler.getTable(), RELTYPE_TAG, false, false)
}

/**
 * Queries the tags related to an item
 * 
 * @method getRelatedTags
 * @param {String} uid of the item
 * @returns {Array} the related tags
 */
module.exports.getRelatedTags = async function (itemUID) {
    let relatedUIDs = await module.exports.getRelatedTagUids(itemUID);
    if (Array.isArray(relatedUIDs)) {
        return await module.exports.getTagsOfUids(relatedUIDs);
    }
    return null;
}

/**
 * Queries the tags related to an item and adds the "Tags" property to the item
 * 
 * @method addRelatedTags
 * @param {Object} item
 * @param {String} itemType type/table name of the item
 * @returns {Array} the related tags
 */
module.exports.addRelatedTags = async function (item, itemType) {
    let table = dblib.getTableByName(itemType);
    if (table != null && item != null) {
        let itemUID = table.getRecordUID(item);
        let relatedTags = await module.exports.getRelatedTags(itemUID);
        dblib.setItemProperty(item, PROP_TAGS, relatedTags);
        return relatedTags;
    }
    return null;
}

/**
 * Creates tags for an item of a specific table
 * 
 * @method createRelatedTags
 * @param {Object} item uid of the item to be tagged
 * @param {String[]} tags list of tags
 * @param {String} itemTable table name of the item to be tagged
 * @param {boolean} create: if the tag does not exist, insert it (true) or return null (false)
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createRelatedTags = async function (itemUID, properties, itemTable, create, transaction = null) {
    return await module.exports.updateRelatedTags(itemUID, properties, itemTable, create, transaction);
}

/**
 * Creates tags for an item of a specific table
 * 
 * @method updateRelatedTags
 * @param {uuid} itemUID uid of the item to be tagged
 * @param {Object} properties property values of the item
 * @param {String} itemTable table name of the item to be tagged
 * @param {boolean} create if the tag does not exist, insert it (true) or return null (false)
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {boolean} true if the property 'Tags' exists and the tags are updated
 */
module.exports.updateRelatedTags = async function (itemUID, properties, itemTable, create, transaction = null) {
    let tags = Array.isArray(properties) ? properties : dblib.getItemProperty(properties, PROP_TAGS);
    if (itemUID && tags != null) {
        let tagUids = await module.exports.getUidsOfTags(tags, create, transaction);
        properties = {}
        properties[PROP_TAGS] = tagUids;
        return await dbrel.updateRelatedLinks(itemUID, properties, itemTable, PROP_TAGS, handler.getTable(), RELTYPE_TAG, false, transaction);
    }
    return false;
}

/**
 * Removes tag links for an item; the tag itself will not be deleted.
 * 
 * @method removeRelatedTags
 * @param {uuid} itemUID uid of the item to be tagged
 * @param {String or Array of Strings} tags to be removed
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns number of removed tags
*/
module.exports.removeRelatedTags = async function (itemUID, tags, transaction = null) {
    let tagUids = await module.exports.getUidsOfTags(tags, false, transaction);
    return await dbrel.deleteRelatedLinks(itemUID, tagUids, handler.getTable(), RELTYPE_TAG, false, transaction);
}

/**
 * adds a subquery to the clauses, if there are tags to query for. Converts tag values to tag uids.
 * 
 * @method addTagsQuery
 * @param {Array} clauses list of where conditions (can be empty but not null)
 * @param {Object} itemTable table of the main query
 * @param {Array} tags list of tags to be queried
 */
module.exports.addTagsQuery = async function (clauses, itemTable, tags) {
    tags = await module.exports.getUidsOfTags(tags, false);
    dbrel.addRelationQuery(clauses, itemTable,tags, false);
}   

