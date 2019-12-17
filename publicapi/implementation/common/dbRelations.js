'use strict';

/**
 * This module handles n:m relations between items via the ITEM2ITEM table
 */

const util = require('util');

const dblib = require('./dbLib');
const dbcfg = require('./dbConfig');

const TABLEID = 'ITEM2ITEM_TABLE';
const COL_FROMUID = 'fromuid'; 
const COL_TOUID = 'touid'; 
const COL_FROMTYPE = 'fromtype'; 
const COL_TOTYPE = 'totype'; 
const COL_RELATIONTYPE = 'relationtype';
const PROP_OBJTYPE = 'ObjectType';
const PROP_OBJUID = 'ObjectUUID';

module.exports.PROP_OBJTYPE = PROP_OBJTYPE;
module.exports.PROP_OBJUID = PROP_OBJUID;

function getColSourceUid (reverse) { return reverse ? COL_TOUID : COL_FROMUID; }
function getColTargetUid (reverse) { return reverse ? COL_FROMUID : COL_TOUID; }
function getColSourceType (reverse) { return reverse ? COL_TOTYPE : COL_FROMTYPE; }
function getColTargetType (reverse) { return reverse ? COL_FROMTYPE : COL_TOTYPE; }

/**
 * function to create a new relation between two items
 * 
 * @method createRelation
 * @param {String} fromUID uid of the source item
 * @param {String} fromType tablename of the source type
 * @param {String} toUID uid of the target item
 * @param {String} toType tablename of the target type
 * @param {String} relationType
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} the new relation object
 */
async function createRelation(fromUID, fromType, toUID, toType, relationType, transaction  = null) {
    let table = dblib.getTable(TABLEID);
    if (table != null && fromUID && toUID) {
        let props = {};
        props[COL_FROMUID] = fromUID;
        props[COL_TOUID] = toUID;
        props[COL_FROMTYPE] = fromType instanceof dblib.Table ? fromType.name : fromType;
        props[COL_TOTYPE] = toType instanceof dblib.Table ? toType.name : toType;
        props[COL_RELATIONTYPE] = relationType;
        return await table.createNewItem(props, transaction);
    }
    return null;
}

/**
 * function to delete relations between items
 * 
 * @method deleteRelations
 * @param {String} fromUID uid of the source item
 * @param {String} fromType tablename of the source type
 * @param {String} toUID uid of the target item
 * @param {String} toType tablename of the target type
 * @param {String} relationType
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Number} number of deleted relations
 */
async function deleteRelations (fromUID, fromType, toUID, toType, relationType, transaction  = null) {
    let table = dblib.getTable(TABLEID);
    if (table != null && (fromUID || toUID)) {
        let clauses = {};
        clauses[COL_FROMUID] = fromUID;
        clauses[COL_TOUID] = toUID;
        clauses[COL_FROMTYPE] = fromType;
        clauses[COL_TOTYPE] = toType;
        clauses[COL_RELATIONTYPE] = relationType;
        return await table.deleteItems(clauses, transaction);
    }
    return null;
}

/**
 * function adds a clause with a subquery for the 'item2item' table if related UIDs are given.
 * 
 * @method addRelationQuery
 * @param {Object} clauses where clauses for the main query (can be empty '{}' but not null)
 * @param {Object} itemTable table of the main query
 * @param {String[]} relatedUIDs one or more uids of potentially related items
 * @param {Boolean} reverse: if true, relation "from->to" is iverted to "to->from" 
 */
module.exports.addRelationQuery = function (clauses, itemTable, relatedUIDs, reverse) {
    let table = dblib.getTable(TABLEID);
    if (table != null && Array.isArray(relatedUIDs) && relatedUIDs.length > 0) {
        let relClauses = {};
        relClauses[getColTargetUid(reverse)] = relatedUIDs;
        itemTable = dblib.getTableByName(itemTable);
        clauses[itemTable != null ? itemTable.uidColumnName : dbcfg.UID_COLUMN] = 
            table.createQuery([getColSourceUid(reverse)], relClauses, undefined);
    }
}

/**
 * function adds a clause with a subquery for the 'item2item' table if related UIDs are given.
 * 
 * @method addRelationQuery
 * @param {Object} clauses where clauses for the main query (can be empty '{}' but not null)
 * @param {Object} itemTable table of the main query
 * @param {String[]} relatedUIDs one or more uids of potentially related items
 * @param {Boolean} reverse: if true, relation "from->to" is iverted to "to->from" 
 */
module.exports.addRelatedTypesQuery = function (clauses, itemTable, relatedTypes, reverse) {
    let table = dblib.getTable(TABLEID);
    if (table != null && Array.isArray(relatedTypes) && relatedTypes.length > 0) {
        let relClauses = {};
        relClauses[getColTargetType(reverse)] = relatedTypes;
        itemTable = dblib.getTableByName(itemTable);
        clauses[itemTable != null ? itemTable.uidColumnName : dbcfg.UID_COLUMN] = 
            table.createQuery([getColSourceUid(reverse)], relClauses, undefined);
    }
}

/**
 * function adds a clause with a subquery for another table if related UIDs are given.
 * 
 * @method addLinkQuery
 * @param {Object} clauses where clauses for the main query (can be empty '{}' but not null)
 * @param {String[]} relatedUIDs one or more uids of potentially related items
 * @param {String} relatedTableName name of the related table
 * @param {String} relatedColName foreign key in the related table
 */
module.exports.addLinkQuery = function (clauses, relatedUIDs, relatedTable, relatedColName) {
    relatedTable = dblib.getTableByName(relatedTable);
    if (relatedTable != null && relatedUIDs) {
        let relClauses = {}
        relClauses[relatedTable.uidColumnName] = relatedUIDs;
        clauses[dbcfg.UID_COLUMN] = 
            relatedTable.createQuery([relatedColName], relClauses, undefined);
    }
}

/**
 * Creates links for new (just created) items to existing or new related items
 * This relationship uses the item2item table, can represent m:n relations
 * 
 * @method createRelatedLinks
 * @param {String} itemUID uid of the item to be linked
 * @param {String} itemTable table name of the item to be linked
 * @param {Object[]} related items to be linked
 * @param {String} relatedTable table name of the related items
 * @param {String} relationType type of the relation
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.createRelatedLinks = async function (itemUID, itemTable, relatedItems, relatedTable, relationType, reverse, 
    transaction = null) {
    if (Array.isArray(relatedItems)) {
        for (let relatedItem of relatedItems) 
            await module.exports.createRelatedLink(itemUID, itemTable, relatedItem, relatedTable, relationType, reverse, 
                transaction);
        return true;
    }
    else
        return await module.exports.createRelatedLink(itemUID, itemTable, relatedItems, relatedTable, relationType, reverse, 
            transaction);
}

/**
 * Creates a link for new (just created) items to an existing or new related item
 * 
 * @method createRelatedLink
 * @param {String} itemUID uid of the item to be linked
 * @param {String} itemTable table name of the item to be linked
 * @param {Object} related item to be linked
 * @param {String} relatedTable table name of the related items
 * @param {String} relationType type of the relation
 * @param {boolean} reverse switch from/to --> to/from
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.createRelatedLink = async function (itemUID, itemTable, relatedItem, relatedTable, relationType, reverse, transaction = null) {
    itemTable = dblib.getTableByName(itemTable);
    relatedTable = dblib.getTableByName(relatedTable);
    if (itemUID && itemTable != null && relatedTable != null && relatedItem != null)
    {
        try {
            let relatedUID = relatedTable.getRecordUID(relatedItem);
            if (!relatedUID)
                relatedUID = await relatedTable.createNewItem(relatedItem, transaction);
            if (relatedUID) {
                return await createRelation(
                    reverse ? relatedUID: itemUID, 
                    reverse ? relatedTable.name : itemTable.name, 
                    reverse ? itemUID : relatedUID, 
                    reverse ? itemTable.name : relatedTable.name, 
                    relationType, transaction);
            }
        }
        catch (err) { console.log(err); }
    }
    return null;
}

/**
 * Updates links of an item to existing or new related items
 * 
 * @method updateRelations
 * @param {String} itemUID uid of the item to be linked
 * @param {Object} properties properties of the item 
 * @param {String} itemTable table name of the item to be linked
 * @param {String} relationProperty item property containing related items
 * @param {String} relatedTable table name of the related items
 * @param {String} relationType type of the relation
 * @param {boolean} reverse switch from/to --> to/from
 * @param {Function} createFunc to create new related Items, if the item has no uid yet
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 * @returns {boolean} true if the property exists and the relations are updated
 */
module.exports.updateRelatedLinks = async function(itemUID, properties, itemTable, relationProperty, relatedTable, relationType, reverse, 
    transaction = null) {
    let relatedUIDs = dblib.getItemProperty(properties, relationProperty);
    if (itemUID && relatedUIDs !== undefined) {
        let result = await module.exports.deleteRelatedLinks(itemUID, undefined, relatedTable, relationType, reverse, transaction);
        if (relatedUIDs) {
            properties = {}
            properties[relationProperty] = relatedUIDs;
            await module.exports.createRelatedLinks(itemUID, itemTable, properties[relationProperty], 
                relatedTable, relationType, reverse, transaction);
            return true;
        }
        return Boolean(result);
    }
    return false;
}

/**
 * Deletes links of an item to other items of a specific type
 * This relationship uses the item2item table
 * 
 * @method deleteRelatedLinks
 * @param {String} itemUID uid of the item to be linked
 * @param {String} itemTable table name of the item to be linked
 * @param {Object[]} related items to be linked
 * @param {String} relatedTable table name of the related items
 * @param {String} relationType type of the relation
 * @param {boolean} reverse switch from/to --> to/from
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 * @returns {Number} number of deleted relations
 */
module.exports.deleteRelatedLinks = async function (itemUID, relatedUIDs, relatedTable, relationType, reverse, transaction = null) {
    relatedTable = dblib.getTableByName(relatedTable);
    if (itemUID && relatedTable != null) {
        try {
            return await deleteRelations(
                            reverse ? relatedUIDs: itemUID, 
                            reverse ? relatedTable.name : undefined, 
                            reverse ? itemUID : relatedUIDs, 
                            reverse ? undefined : relatedTable.name, 
                            relationType, transaction);
        }
        catch (err) { console.log(err); }
    }
    return null;
}

/**
 * Deletes all links of an item with the given UID from the item2item table
 *
 * @method deleteAllRelatedLinks
 * @param {String} itemUID UUID of the item to delete
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.deleteAllRelatedLinks = async function (itemUID, transaction = null) {
    try {
        let table = dblib.getTable(TABLEID);
        if (table != null) {
            // First, delete all rows where uid is in the fromuid column
            let clauses = {};
            clauses[COL_FROMUID] = itemUID;
            await table.deleteItems(clauses, transaction);

            // Next, delete all rows where uid is in the fromuid column
            clauses = {};
            clauses[COL_TOUID] = itemUID;
            return await table.deleteItems(clauses, transaction);
        }
        return null;
    } catch (err) {
        console.log(err);
        throw(err);
    }
}

/**
 * function executes a query for retrieving the related items in the 'item2item' table
 * 
 * @method getRelationsOfItem
 * @param {String} uid of the item whose relations to be retrieved
 * @param {String} toType tablename of the target type
 * @param {String} relationType
 * @param {Boolean} reverse: if true, relation "from->to" is inverted to "to->from". If null, 
 *          both variants are evaluated (first 'false', then 'true' if 'false' has no result)
 * @param {Boolean} loadRelated: if true, the related items are loaded from their tables, 
 *          else the relations are returned
 * @returns {Array} array of relations or related items
 */
module.exports.getRelationsOfItem = async function (uid, toType, relationType, reverse, loadRelated = false) {
    if (reverse == null) {
        let result = await module.exports.getRelationsOfItem(uid, toType, relationType, false, loadRelated);
        if (result == null || result.length <= 0)
            return await module.exports.getRelationsOfItem(uid, toType, relationType, true, loadRelated);
        return result;
    }
    try {
        let table = dblib.getTable(TABLEID);
        if (table != null && uid) {
            let clauses = {};
            clauses[getColSourceUid(reverse)] = uid;
            if (toType)
                clauses[getColTargetType(reverse)] = toType instanceof dblib.Table ? toType.name : toType;
            if (relationType != null)
                clauses[COL_RELATIONTYPE] = relationType;
            
            let result = await table.getQueryResult(null, clauses, undefined, false, false);
            let items = [];
            if (Array.isArray(result)) {
                for (let record of result) {
                    let relatedUID = record.properties[getColTargetUid(reverse)];
                    let relatedTableName = record.properties[getColTargetType(reverse)];
                    if (loadRelated) {
                        let relatedTable = dblib.getTableByName(relatedTableName);
                        let item = await relatedTable.getItemByID(relatedUID, null, true, false);
                        if (item instanceof dblib.Record) {
                            item = item.properties;
                            if (relationType == null) {
                                item[PROP_OBJTYPE] = relatedTableName;
                                item[PROP_OBJUID] = relatedUID;
                                delete item[relatedTable.uidColumnDisplayName()];
                            }
                            items.push(item)
                        }
                    } else {
                        if (relationType != null) 
                            items.push(relatedUID);
                        else
                        {
                            let item = {};
                            item[PROP_OBJTYPE] = relatedTableName;
                            item[dbcfg.UID_COLUMN] = relatedUID;
                            items.push(item)
                        }
                    }
                }
            }
            return items;
        }
        return null;
    } catch (err) {
        throw (err);
    }
}

/**
 * retrieve all related items from the 'item2item' table
 * 
 * @method getAllRelationsOfItem
 * @param {String} uid of the item whose relations to be retrieved
 * @param {Boolean} reverse: if true, relation "from->to" is inverted to "to->from". If null, 
 *          both variants are evaluated (first 'false', then 'true' if 'false' has no result)
 * @param {Boolean} loadRelated: if true, the related items are loaded from their tables, 
 *          else the relations are returned
 * @returns {Array} array of relations or related items
 */
module.exports.getAllRelationsOfItem = async function (uid, reverse, loadRelated = false) {
    try {
        let table = dblib.getTable(TABLEID);
        let clauses = {};
        clauses[getColSourceUid(reverse)] = uid;
        let items = [];
        let result = await table.getQueryResult(null, clauses, undefined, false, false);
        if (Array.isArray(result)) {
            for (let record of result) {
                let relatedUID = record.properties[getColTargetUid(reverse)];
                let relatedTableName = record.properties[getColTargetType(reverse)];
                let item = record.properties;
                if (loadRelated) {
                    let relatedTable = dblib.getTableByName(relatedTableName);
                    let relatedItem = await relatedTable.getItemByID(relatedUID, null, true, false);
                    if (relatedItem instanceof dblib.Record) {
                        relatedItem = relatedItem.properties;
                        relatedItem[PROP_OBJTYPE] = relatedTable.displayName;
                        relatedItem[PROP_OBJUID] = relatedUID;
                        delete relatedItem[relatedTable.uidColumnDisplayName()];
                        // items.push(relatedItem)
                        Object.assign(item, relatedItem);
                    }
                    items.push(item);
                } else {
                    let item = {};
                    item[PROP_OBJTYPE] = relatedTableName;
                    item[dbcfg.UID_COLUMN] = relatedUID;
                    items.push(item)
                }
            }
        }
        return items;
    }
    catch (err) {
        throw (err);
    }
}

/**
 * function to check if an item is related to other items contained in a list
 * 
 * @method checkRelation
 * @param {String} uid of the item whose relations to be checked
 * @param {String[]} testUIDs uids of items other which can be related to the item or not
 * @param {String} relatedTableName tablename of the related items
 * @param {Boolean} reverse: if true, relation "from->to" is iverted to "to->from" 
 * @returns {Boolean} true if the item is related to at least one of the testUIDs
 */
module.exports.checkRelation = async function (uid, testUIDs, relatedTableName, reverse) {
    if (uid && testUIDs && relatedTableName) {
        let result = await module.exports.getRelationsOfItem(uid, relatedTableName, undefined, reverse, false);
        if (result) {
            for (let i in result) {
                if (testUIDs.indexOf(result[i]) >= 0)
                    return true;
            }
        }
        return false;
    }
    return true;
}

/**
 * function to check if items are related to other items contained in a list.
 * Not-related items will be removed from the list
 * 
 * @method filterRelation
 * @param {String[]} uids of the items whose relations to be checked
 * @param {String} itemsTableName tablename of the items
 * @param {String[]} testUIDs uids of items other which can be related to the item or not
 * @param {String} relatedTableName tablename of the related items
 * @param {Boolean} reverse: if true, relation "from->to" is iverted to "to->from" 
 */
module.exports.filterRelation = async function (items, itemsTableName, testUIDs, relatedTableName, reverse) {
    let itemsTable = dblib.getTableByName(itemsTableName);
    if (itemsTable != null && testUIDs && relatedTableName && Array.isArray(items)) {
        let i = items.length;
        while (i > 0) {
            i--;
            let itemUID = itemsTable.getRecordUID(items[i]);
            if (!await module.exports.checkRelation(itemUID, testUIDs, relatedTableName, reverse)) {
                items.splice(i, 1);
            }
        }
    }
}


/**
 * Creates direct links for new (just created) items to existing or new related items
 * This relationship does not use the item2item table, but a direct relation via a foreign key
 * 
 * @method createDirectLinks
 * @param {String} itemUID uid of the item to be linked
 * @param {Object[]} related items to be linked
 * @param {String} relatedTable table name of the related items
 * @param {String} relatedColumn name of the foreign key column in the relatedTable
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.createDirectLinks = async function (itemUID, relatedItems, relatedTable, relatedColumn, transaction = null) {
    if (Array.isArray(relatedItems))
        for (let relatedItem of relatedItems) 
            await module.exports.createDirectLink(itemUID, relatedItem, relatedTable, relatedColumn, transaction);
    else
        await module.exports.createDirectLink(itemUID, relatedItems, relatedTable, relatedColumn, transaction);
}

/**
 * Creates direct links for new (just created) items to existing or new related items
 * This relationship does not use the item2item table, but a direct relation via a foreign key
 * 
 * @method createDirectLink
 * @param {String} itemUID uid of the item to be linked
 * @param {Object} relatedItem item to be linked
 * @param {String} relatedTable table name of the related items
 * @param {String} relatedColumn name of the foreign key column in the relatedTable
 * @param {Function} createFunc to create new related Items, if the item has no uid yet
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.createDirectLink = async function (itemUID, relatedItem, relatedTable, relatedColumn, transaction = null) {
    relatedTable = dblib.getTableByName(relatedTable);
    if (relatedTable != null && itemUID && relatedItem && relatedColumn)
    {
        try {
            let relatedUID = relatedTable.getRecordUID(relatedItem);
            if (relatedUID) {
                relatedItem = {};
                relatedItem[relatedColumn] = itemUID;
                await relatedTable.updateItemByUID(relatedUID, relatedItem, transaction);
            }
            else {
                dblib.setItemProperty(relatedItem, relatedColumn, itemUID);
                relatedUID = await relatedTable.createNewItem(relatedItem, transaction);
            }
            return relatedUID;
        }
        catch (err) { 
            console.log(err); 
            dblib.setItemProperty(relatedItem, relatedColumn, err);
        }
    }
    return null;
}


/**
 * Checks if a term is contained in a list terms.
 * The terms can include additional statements line "Name desc" for descending order
 * 
 * @method contains
 * @param {Any} terms list of terms (typically an array of strings)
 * @param {String} term term to be checked
 * @returns {boolean} true, if "term" is contained in the terms list 
 */
module.exports.contains = function (terms, term) {
    if (terms != null && term) {
        if (Array.isArray(terms)) {
            if (terms.includes(term))
                return true;
            for (let item of terms) {
                switch (typeof terms) {
                    case 'string':
                        let i = item.indexOf(' ');
                        if (i > 0)
                            item = name.slice(0, i);
                        if (item == term)
                            return true;
                        break;
                    case 'object':
                        if (term == item.column_name || term == item.displayName)
                            return true;
                        break;
                }
            }
        }
        else {
            switch (typeof terms) {
                case 'string':
                    return module.exports.contains(terms.split(','), term);
                case 'object':
                    return module.exports.contains(terms["embed"], term);
            }
        }
    }
    return false;
}

/**
 * Checks if a property name is contained in an embed list or on a fields list. 
 * The result is true, if the fields list is undefined or empty.
 * 
 * @method containsPropertyName
 * @param {String} propertyName property name to be checked
 * @param {Any} fields list of property names to be displayed; if the list is empty, all properties will be displayed
 * @param {Any} embed list of property names with linked objects to be embedded
 * @returns {boolean} true, if "what" is contained in the embed list 
 */
module.exports.containsPropertyName = function (propertyName, fields, embed = null) {
    return fields == null || module.exports.contains(fields, propertyName) || module.exports.contains(embed, propertyName);
}

/**
 * Set related target items of given type as a property of the given source item
 * This relationship uses the item2item table, can represent m:n relations.
 * This function only reads from the database
 * 
 * @method setRelationsAsProperty
 * @param {Object} item source item to which property should be added
 * @param {String} itemType Type of item (table name)
 * @param {String} targetType Type of target item (table name)
 * @param {String} relationLabel Label of target property in source item
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @returns {Array} Related Items
 */
module.exports.setRelationsAsProperty = async function(item, itemType, targetType, relationLabel, embed) {
    itemType = dblib.getTableByName(itemType);
    targetType = dblib.getTableByName(targetType);
    if (itemType != null)
        try {
            let itemUID = item instanceof dblib.Record ? item.id : itemType.getRecordUID(item);
            let embedItems = module.exports.contains(embed, relationLabel);
            let result = await module.exports.getRelationsOfItem(itemUID, targetType, undefined, null, embedItems);
            let relatedItems = [];
            if (embedItems) {
                relatedItems = result;
            }
            else {
                for (let uid of result) {
                    let related = {}
                    if (targetType != null)
                        targetType.setRecordUID(related, uid, true);
                    else if (typeof uid === 'string')
                        related[dbcfg.UID_COLUMN] = uid;
                    else if (uid[PROP_OBJTYPE])
                        related[uid[PROP_OBJTYPE]] = uid[dbcfg.UID_COLUMN];
                    else
                        related = null;
                    if (related != null)
                        relatedItems.push(related)
                }
            }
            dblib.setItemProperty(item, relationLabel, relatedItems);
            return relatedItems;
        } catch (err) {
            console.log(err); 
            dblib.setItemProperty(item, relationLabel, err);
        }
}

/**
 * Set 1:n related target items of given type as a property of the given source item.
 * This relationship does not use the item2item table, but a direct relation via a foreign key
 * This function only reads from the database
 * 
 * @method setDirectRelationsAsProperty
 * @param {Object} item source item to which property should be added
 * @param {String} targetType Type of target item (table name)
 * @param {String} targetProperty Column name of the foreign key
 * @param {String} relationLabel Label of target property in source item
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @returns {Array} Related Items
 */
module.exports.setDirectRelationsAsProperty = async function(item, targetType, targetProperty, relationLabel, embed) {
    if (item instanceof dblib.Record) {
        let targetTable = dblib.getTableByName(targetType);
        let loadRelated = module.exports.contains(embed, relationLabel)
        return await item.setDirectRelations(relationLabel, 
            targetTable, targetProperty, loadRelated);
    }
    return false;
}

/**
 * Set n:1 related target item of given type as a property of the given source item.
 * This relationship does not use the item2item table, but a direct relation via a foreign key
 * This function only reads from the database if the related item is embedded
 * 
 * @method setDirectRelationAsProperty
 * @param {Object} item source item to which property should be added
 * @param {String} relationLabel Label of relation property in item
 * @param {String} relatedType Type of the related item (table name)
 * @param {Any[]} relatedColumns Columns or column names of the related item table
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @returns {boolean} true, if the related item could be set to the property
 */
module.exports.setDirectRelationAsProperty = async function(item, relationLabel, relatedType, embed, asObject = false) {
    if (item instanceof dblib.Record) {
        return await item.queryParentItem(dblib.getTableByName(relatedType), 
            relationLabel, 
            module.exports.contains(embed, relationLabel), 
            asObject);
    }
    return false;
}

module.exports.updateChildItems = async function (parentUID, childItems, childTable, childProperty, transaction = null) {
    let table = dblib.getTable(childTable);
    if (table != null) {
        let properties = {};
        properties[childProperty] = parentUID;
        let clauses = table.fillProperties(properties, false);
        properties[childProperty] = null;
        await table.updateItems(properties, clauses, transaction);
    }
    if (Array.isArray(childItems))
        for (let childItem of childItems) {
            dblib.setItemProperty(childItem, childProperty, parentUID);
            await table.createNewItem(childItem, transaction);
        }
    else if (childItems) {
        dblib.setItemProperty(childItems, childProperty, parentUID);
        await table.createNewItem(childItems, transaction);
    }
}

