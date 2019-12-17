'use strict';

/**
 * This module implements utility functions common to the Public API
 * 
 */

const dblib = require('./dbLib');
const dbutils = require('./dbUtils.js');
const dbrel = require('./dbRelations.js');

/**
 * Creates content wrapper from a single item or an item array.
 * 
 * @method wrapContent
 * @param {Object} item: single item or item array to be wrapped
 * @param {boolean} asArray return content as Array if true
 * @returns {dictionary} content with items as body
 */
module.exports.wrapContent = function(item, asArray=true) {
    if (item) {
        let content = {};
        content.body = Array.isArray(item) ? item : (asArray ? [item]: item);
        content.statusCode = 201;
        return content;
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
    try {
        let itemUID = dbutils.getUidOfTableItem(item, itemType);
        let embedItems = module.exports.contains(embed, relationLabel);
        let result = await dbutils.getRelationsOfItem(itemUID, targetType, undefined, null, embedItems);
        let relatedItems = [];
        if (embedItems) {
            relatedItems = result;
        }
        else {
            let uidColName = dbutils.getUidColumnNameOfTable(targetType);
            for (let uid of result) {
                let related = {}
                related[uidColName] = uid;
                relatedItems.push(related)
            }
        }
        if (relationLabel)
            item[relationLabel] = relatedItems;
        return relatedItems;
    } catch (err) {
        if (relationLabel)
            item[relationLabel] = err;
    }
}

/**
 * Set 1:n related target items of given type as a property of the given source item.
 * This relationship does not use the item2item table, but a direct relation via a foreign key
 * This function only reads from the database
 * 
 * @method setDirectRelationsAsProperty
 * @param {Object} item source item to which property should be added
 * @param {String} itemType Type of item (table name)
 * @param {String} targetType Type of target item (table name)
 * @param {String} targetProperty Column name of the foreign key
 * @param {String} relationLabel Label of target property in source item
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @returns {Array} Related Items
 */
module.exports.setDirectRelationsAsProperty = async function(item, itemType, targetType, targetProperty, relationLabel, embed) {
    try {
        let itemTable = dbutils.getTableByName(itemType);
        let targetTable = dbutils.getTableByName(targetType);
        let clauses = {};
        clauses[targetProperty] = itemTable.getRecordUID(item);
        let relatedItems = await targetTable.getQueryResult(
            module.exports.contains(embed, relationLabel) ? null : [targetTable.uidColumnName], 
            clauses, undefined, true, false);
        if (relationLabel)
            if (item instanceof dblib.Record)
                item.properties[relationLabel] = dblib.publishItems(relatedItems);
            else
                item[relationLabel] = dblib.publishItems(relatedItems);
        return relatedItems;
    } catch (err) {
        if (relationLabel)
            if (item instanceof dblib.Record)
                item.properties[relationLabel] = err;
            else
                item[relationLabel] = err;
    }
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
module.exports.setDirectRelationAsProperty = async function(item, relationLabel, relatedType, relatedColumns, embed, asObject = false) {
    if (item) {
        let relatedUID = item[relationLabel];
        if (relatedUID) {
            if (module.exports.contains(embed, relationLabel)) {
                let result = null;
                if (relatedType instanceof dblib.Table) {
                    if (item instanceof dblib.Record)
                        result = await item.queryRelatedItems(relatedType, relationLabel, true);
                    else {
                        result = await relatedType.getItemByID(relatedUID, null, true, false);
                        if (result != null)
                            item[relationLabel] = result;
                    }
                }
                else {
                    result = await dbutils.getItemByID(relatedType, relatedColumns, relatedUID, true, false);
                    if (result != null)
                        item[relationLabel] = result;
                }
            }
            else if (asObject) {
                let obj = {};
                dbutils.setUidOfItem(relatedUID, obj, relatedColumns);
                item[relationLabel] = obj;
            }
            return true;
        }
    }
    return false;
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
 * @param {Function} createFunc to create new related Items, if the item has no uid yet
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.createRelatedLinks = async function (itemUID, itemTable, relatedItems, relatedTable, relationType, reverse, 
    createFunc, transaction = null) {
    if (Array.isArray(relatedItems))
        for (let relatedItem of relatedItems) 
            await module.exports.createRelatedLink(itemUID, itemTable, relatedItem, relatedTable, relationType, reverse, 
                createFunc, transaction);
    else
        await module.exports.createRelatedLink(itemUID, itemTable, relatedItems, relatedTable, relationType, reverse, 
            createFunc, transaction);
}

/**
 * Creates links for new (just created) items to existing or new related items
 * 
 * @method createRelatedLink
 * @param {String} itemUID uid of the item to be linked
 * @param {String} itemTable table name of the item to be linked
 * @param {Object} related item to be linked
 * @param {String} relatedTable table name of the related items
 * @param {String} relationType type of the relation
 * @param {boolean} reverse switch from/to --> to/from
 * @param {Function} createFunc to create new related Items, if the item has no uid yet
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.createRelatedLink = async function (itemUID, itemTable, relatedItem, relatedTable, relationType, reverse, 
    createFunc, transaction = null) {
    return dbrel.createRelatedLink(itemUID, itemTable, relatedItem, relatedTable, relationType, reverse, transaction);
}

/**
 * Updates links of an item to existing or new related items
 * 
 * @method updateRelations
 * @param {String} itemUID uid of the item to be linked
 * @param {String} itemTable table name of the item to be linked
 * @param {String} relationProperty item property containing related items
 * @param {String} relatedTable table name of the related items
 * @param {String} relationType type of the relation
 * @param {boolean} reverse switch from/to --> to/from
 * @param {Function} createFunc to create new related Items, if the item has no uid yet
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 * @returns {boolean} true if the property exists and the relations are updated
 */
module.exports.updateRelations = async function(itemUID, properties, itemTableName, relationProperty, relatedTable, relationType, reverse, 
    createFunc, transaction = null) {
    if (itemUID && properties && properties.hasOwnProperty(relationProperty)) {
        await module.exports.deleteRelatedLinks(itemUID, undefined, relatedTable, relationType, reverse, transaction);
        await module.exports.createRelatedLinks(itemUID, itemTableName, properties[relationProperty], 
            relatedTable, relationType, reverse, createFunc, transaction);
        return true;
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
 */
module.exports.deleteRelatedLinks = async function (itemUID, relatedUIDs, relatedTable, relationType, reverse, transaction = null) {
    if (itemUID) {
        try {
            await dbrel.deleteRelations(
                    reverse ? relatedUIDs: itemUID, 
                    reverse ? relatedTable : undefined, 
                    reverse ? itemUID : relatedUIDs, 
                    reverse ? undefined : relatedTable, 
                    relationType, transaction);
        }
        catch (err) { console.log(err); }
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
 * @param {Function} createFunc to create new related Items, if the item has no uid yet
 * @param {Object} transaction: a "client" object, created by dbConnection.startTransaction()
 */
module.exports.createDirectLinks = async function (itemUID, relatedItems, relatedTable, relatedColumn, 
    createFunc, transaction = null) {
    if (Array.isArray(relatedItems))
        for (let relatedItem of relatedItems) 
            await module.exports.createDirectLink(itemUID, relatedItem, relatedTable, relatedColumn, createFunc, transaction);
    else
        await module.exports.createDirectLink(itemUID, relatedItems, relatedTable, relatedColumn, createFunc, transaction);
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
module.exports.createDirectLink = async function (itemUID, relatedItem, relatedTable, relatedColumn, 
    createFunc, transaction = null) {
    if (itemUID && relatedItem && relatedColumn)
    {
        if (relatedTable instanceof dblib.Table) {
            try {
                let relatedUID = relatedTable.getRecordUID(relatedItem);
                if (relatedUID) {
                    relatedItem = {};
                    relatedItem[relatedColumn] = itemUID;
                    await relatedTable.updateItemByUID(relatedUID, relatedItem, transaction);
                }
                else {
                    if (relatedItem instanceof dblib.Record)
                        relatedItem.properties[relatedColumn] = itemUID;
                    else
                        relatedItem[relatedColumn] = itemUID;
                    relatedUID = await relatedTable.createNewItem(relatedItem, transaction);
                }
                return relatedUID;
            }
            catch (err) { console.log(err); }
        }

        try {
            let relatedUID = dbutils.getUidOfTableItem(relatedItem, relatedTable);
            if (relatedUID) {
                relatedItem = {};
                relatedItem[relatedColumn] = itemUID;
                await dbutils.updateItemByUID(relatedTable, relatedItem, relatedUID, transaction);
                }
            else if (createFunc) {
                relatedItem[relatedColumn] = itemUID;
                relatedUID = await createFunc(relatedItem, transaction);
            }
            return relatedUID;
        }
        catch (err) { console.log(err); }
    }
    return null;
}

/**
 * Return a customized error object for use in HTTP Response
 * 
 * @param {Number} code HTTP error status code
 * @param {String} summary Summary of error
 * @param {Object} info Detailed error description
 */
module.exports.customErr = function(code, summary, info) {
    let errObj = {
        statusCode: code, // HTTP standard response code
        summary: summary || undefined, // Short description of error
        info: info || undefined // Details
    };
    return errObj;
};

/**
 * Add given item to the projectcomputation results table
 * @param {String} processUID UID of process whichj generated the result
 * @param {String} resultUID UID of item to be treated as result
 * @param {String} resultType type of result
 * @param {Object} transaction Transaction object of which this is a part
 */
module.exports.addItemToComputationResults = async function(processUID, resultUID, resultType, transaction=null) {
    try {
        let table = dbutils.getTable('PROCESSES_TABLE');
        let row = await table.getItemByID(['projectuid'], processUID, false, true);
        if (row instanceof dblib.Record) {
            let properties = {
                projectuid: row.properties['projectuid'],
                computedate: new Date(Date.now()),
                processuid: processUID,
                resulttype: resultType,
                resultuid: resultUID
            };
            table = dbutils.getTable('RESULTS_TABLE');
            return await table.createNewItem(properties, transaction);
        }
    } catch (err) {
        // Do nothing
    }
}

/**
 * If only a few properties are given, set other unspecified properties explicitly to null
 * @method setAllPropertiesExplicitly
 * @param {Object} properties Object with properties
 * @param {Array} allProperties list of all properties
 * 
 */
module.exports.setAllPropertiesExplicitly = function(properties, allProperties) {
    let newProp = properties;
    for (let prop of allProperties) {
        if (!(prop in properties)){
            newProp[prop] = null;
        }
    }
    return newProp;
}