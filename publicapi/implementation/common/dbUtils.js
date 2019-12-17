'use strict';

/**
 * This module contains some useful functions for handling database queries
 */

const util = require('util');

const apiutils = require('./apiUtils');
const dbconn = require('./dbConnection');
const {pool} = require('./dbConnection');
const dblib = require('./dbLib');
const dbcfg = require('./dbConfig');

module.exports.UID_COLUMN = dbcfg.UID_COLUMN;

const selectFormat = 'SELECT %s FROM %s%s%s';
const updateFormat = 'UPDATE %s SET %s%s';
const insertFormat = function(uidColumn) { 
    // Return UID column if present, else return entire row
    return 'INSERT INTO %s (%s) VALUES(%s) RETURNING ' + 
    (uidColumn ? module.exports.UID_COLUMN : '*');
}
const deleteFormat = 'DELETE FROM %s%s';
const orderByFormat = ' ORDER BY %s';

// 'message' is a property of the Error Prototype and not enumerable. This means
// the message string is not passable to other functions. To ensure it is not lost
// when passing the error object in a function, we need to make it enumerable.
function makeErrMessageEnumerable (errObj) {
    Object.defineProperty(errObj, 'message', { 
        value: errObj.message,
        enumerable: true
    });
}

module.exports.throwError404 = function (err) {
    console.log(err);
    throw (apiutils.customErr(404, 'No items found', err));
}

module.exports.throwError500 = function (err) {
    console.log(err);
    makeErrMessageEnumerable(err);
    throw (apiutils.customErr(500, 'Postgres Error', err));
}

module.exports.getDatabaseName = function() {
    return dbcfg.DB_CATALOG;
}

module.exports.getDatabaseSchema = function() {
    return dbcfg.DB_SCHEMA;
}

/**
 * function executing SQL query in the database
 * 
 * @method executeQuery
 * @param {dictionary} query SQL select and values
 * @param {bool} throwEmpty if true, throws an exception on empty query results
 * @returns {Object}
 */
module.exports.executeQuery = async function (query, throwEmpty = true) {
    try {
        let result = await pool.query(query);
        if (throwEmpty && result.rowCount == 0) {
            throw new Error(util.format('empty result: %s / values: %s', query.text, query.values.join()));
        }
        return result.rows;
    } catch (err) {
        if (err.message.indexOf('empty result:') == 0) {
            module.exports.throwError404(err);
        } else {
            module.exports.throwError500(err);
        }
    }
}

/**
 * function creating a where clause if there are any values to be queried
 * 
 * @method createWhere
 * @param {Object} clauses Where conditions
 * @param {Number} index start index for placeholders
 * @returns {String} empty string if there are no values
 */
function createWhere (clauses, index = 0) {
    let where = undefined;
    for (let [key, value] of Object.entries(clauses)) {
        if (value !== undefined) {
            let item = null;
            if (Array.isArray(value)) {
                let val = null;
                for (let i in value) {
                    let part = util.format("'%s'", value[i]);
                    if (val == null)
                        val = part;
                    else
                        val = util.format("%s,%s", val, part);
                }
                if (val)
                    item = util.format("%s in (%s)", key, val);
                else
                    item = util.format("%s <> %s", key, key);
                delete clauses[key];
            }
            else if (value != null && value.constructor == Object) {
                item = util.format("%s in (%s)", key, value.text);
                delete clauses[key];
            }
            else  {
                if (index >= 0) {
                    index++;
                    item = util.format("%s=$%i", key, index);
                }
                else if (value == null)
                    item = util.format("%s IS NULL", key);
                else
                    item = util.format("%s='%s'", key, value);
            }
            if (item)
                if (where === undefined)
                    where = item
                else
                    where += " AND " + item;
        }
    }
    if (where !== undefined)
        return " WHERE " + where;
    return '';
}

/**
 * function executes a SQL query command INSERT, UPDATE or DELETE as part of a transaction or standalone (transaction == null)
 * 
 * @method executeCommand
 * @param {Object} command to be executed (a query object)
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns query result
 */
async function executeCommand (command, transaction) {
    if (Array.isArray(transaction)) {
        transaction.push(command);
        return true;
    } 
    try {
        return transaction != null ? await dbconn.executeCommand(command, transaction) : await pool.query(command);
    } catch (err) {
        dbconn.cancelTransaction(transaction);
        module.exports.throwError500(err);
    }
}

function getDisplayColumns (columns, displayNames) {
    let result = null;
    if (Array.isArray(displayNames)) {
        if (columns != null && columns.length > 0) {
            for (let name of displayNames) {
                let addStr = null;
                if (typeof name == 'object')
                    addStr = name.column_name;
                else {
                    let i = name.indexOf(' ');
                    if (i > 0) {
                        addStr = name.slice(i);
                        name = name.slice(0, i);
                    }
                    let col = module.exports.findColumn(name, columns);
                    if (col != null) {
                        if (addStr)
                            addStr = util.format('%s%s', col.column_name, addStr);
                        else {
                            addStr =  col.column_name;
                            if (addStr != name)
                                addStr = util.format('%s as %s', addStr, name);
                        }
                    }
                    else
                        addStr = null;
                }
                if (addStr) {
                    result = result ? util.format('%s,%s', result, addStr) : addStr;
                }
            }
        }
    }
    else {
        switch (typeof displayNames) {
            case 'string':
                return getDisplayColumns(columns, displayNames.split(','));
        }
    }
    return result;
}

function getTableColumns (tableName, displayNames) {
    return getDisplayColumns (columnsOfTables[tableName], displayNames);
}

function filterDisplayColumns (columns, displayNames) {
    let result = null;
    if (Array.isArray(displayNames)) {
        if (columns != null && columns.length > 0) {
            result = [];
            for (let name of displayNames) {
                let col = null;
                if (typeof name == 'object')
                    col = name;
                else {
                    let i = name.indexOf(' ');
                    if (i > 0)
                        name = name.slice(0, i);
                    col = module.exports.findColumn(name, columns);
                }
                if (col != null)
                    result.push(col);
            }
        }
    }
    else {
        switch (typeof displayNames) {
            case 'string':
                return filterDisplayColumns(columns, displayNames.split(','));
        }
    }
    return result;
}

function filterTableColumns (tableName, displayNames) {
    return filterDisplayColumns (columnsOfTables[tableName], displayNames);
}

/**
 * function creates a SQL query object for a database table, optional using query values
 * 
 * @method createQuery
 * @param {String} tableName name of the database table
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {dictionary} clauses (optional) values to be queried
 * @param {String} sortBy Comma separated list of fields to sort by
 * @returns {Object} query
 */
module.exports.createQuery = function (tableName, columns, clauses, sortBy) {
    if (columns == null)
        columns = columnsOfTables[tableName];
    else
        columns = filterTableColumns (tableName, columns);
    sortBy = getTableColumns(tableName, sortBy)
    return {
        text: util.format(selectFormat, 
                getQueryExpressions(columns).join(), 
                addSchema(tableName), 
                createWhere(clauses),
                sortBy ? util.format(orderByFormat, sortBy) : ''),
        values: Object.values(clauses)
    };
}

/**
 * function executing SQL query in a database table, optional using query values
 * 
 * @method getQueryResult
 * @param {String} tableName name of the database table
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {Object} clauses (optional) values to be queried
 * @param {String} sortBy Comma separated list of fields to sort by
 * @param {Boolean} useDisplayNames returns displaynames of the properties if true, else column names
 * @param {Boolean} throwEmpty if true, throws an exception on empty query results
 * @returns {Object} result of the query
 */
module.exports.getQueryResult = async function (tableName, columns, clauses, sortBy,
        useDisplayNames = true, throwEmpty = true) {
    if (columns == null)
        columns = columnsOfTables[tableName];
    const query = module.exports.createQuery(tableName, columns, clauses, sortBy);
    let result = await module.exports.executeQuery(query, throwEmpty);
    if (useDisplayNames && Array.isArray(result)) {
        columns = columnsOfTables[tableName];
        let dresult = [];
        result.forEach((item) => {
            let ditem = {}
            Object.keys(item).forEach(function(key) {
                let col = module.exports.findColumnByColName(key, columns);
                if (col) {
                    // Skip adding null values as properties, since it's invalid as per Swagger/OAS 2.0
                    if (item[key] === null) { return }
                    if (typeof col === 'string')
                        ditem[col] = item[key];
                    else
                        ditem[col.displayName] = item[key];
                }
            });
            dresult.push(ditem);
        })
        return dresult;
    }
    return result;
}

/**
 * function query for a single item with certain uid
 * 
 * @method getItemByID
 * @param {String} tableName name of the database table
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {Number} uID uid of the desired item
 * @param {bool} useDisplayNames if true, returns the displaynames of the columns instead of column names
 * @param {bool} throwEmpty if true, throws an exception on empty query results
 * @returns {Object} single item
 */
module.exports.getItemByID = async function (tableName, columns, uID, useDisplayNames = true, throwEmpty = true) {
    let props = {};
    props[module.exports.UID_COLUMN] = uID;
    let result = await module.exports.getQueryResult(tableName, columns, props, undefined, useDisplayNames, throwEmpty);
    if (Array.isArray(result) && result.length > 0)
        return result[0];
    return result;
}

/**
 * function combining column names and values to a properties dictionary.
 * null values will be refused, undefined values can be accepted optionally.
 * 
 * @method fillProperties
 * @param {Any[]} columns to be returned as properties
 * @param {Any[]} values in the same order as columns
 * @param {Boolean} acceptUndefined add undefined values or not
 * @returns {dictionary} properties
 */
module.exports.fillProperties = function (columns, values, acceptUndefined = true) {
    let props = {};
    if (Array.isArray(values)) {
        for (var i = 0; i < columns.length; i++) {
            let value = undefined;
            if (i < values.length)
                value = values[i];
            if (value !== null && (acceptUndefined || (value !== undefined)))
                props[columns[i].column_name] = value;
        };
    }
    else if (columns.length > 0)
        if (value !== null && (acceptUndefined || values !== undefined))
            props[columns[0].column_name] = values;
    return props;
}

/**
 * Updates one or more data row(s) in a specific database table and fills it with values
 * where clauses determine which row(s) will be updated
 * 
 * @method updateItems
 * @param {String} tableName name of the database table
 * @param {Object} properties values to be inserted
 * @param {Object} clauses to create a where statement
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {int} number of affected rows
 */
module.exports.updateItems = async function(tableName, properties, clauses, transaction = null) {
    if (properties) {
        let columns = columnsOfTables[tableName];
        let values = [];
        let placeholders = [];
        let index = 0;
        Object.keys(properties).forEach(function(key) {
            let col = module.exports.findColumn(key, columns);
            if (col && col.column_name != module.exports.UID_COLUMN) {
                let value = properties[key];
                if (value !== undefined) {
                    if (value === null) {
                        placeholders.push(util.format("%s=null", col.column_name));
                    }
                    else {
                        values.push(util.format(col.writeFormat, value));
                        index++;
                        placeholders.push(util.format("%s=$%i", col.column_name, index));
                    }
                }
            }
        });
        if (placeholders.length > 0) {
            const query = {
                text: util.format(updateFormat, 
                        addSchema(tableName), 
                        placeholders, 
                        createWhere(clauses, -1)),
                values: values
            };
            try {
                let result = await executeCommand (query, transaction);
                return result.rowCount;
            } catch (err) {
                module.exports.throwError500(err);
            }
        }
    }
    return 0;
}

/**
 * Updates a specific data row in a specific database table and fills it with values
 * 
 * @method updateItemByUID
 * @param {String} tableName name of the database table
 * @param {Object} properties values to be inserted
 * @param {String} uid of the record to be updated
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
module.exports.updateItemByUID = async function(tableName, properties, uid, transaction = null) {
    if (uid && properties) {
        let clauses = {};
        clauses[module.exports.UID_COLUMN] = uid;
        return await module.exports.updateItems(tableName, properties, clauses, transaction) > 0;
    }
    return null;
}

/**
 * Deletes one or more data row(s) in a specific database table
 * where clauses determine which row(s) will be deleted
 * 
 * @method deleteItems
 * @param {String} tableName name of the database table
 * @param {Object} clauses to create a where statement
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Number} number of deleted rows
 */
module.exports.deleteItems = async function(tableName, clauses, transaction  = null) {
    if (clauses) {
        const query = {
            text: util.format(deleteFormat, 
                    addSchema(tableName), 
                    createWhere(clauses, -1)),
            values: null
        };
        let result = await executeCommand (query, transaction);
        return result.rowCount;
    }
    return 0;
}

/**
 * Deletes a specific row in a specific database table
 * 
 * @method deleteItemByUID
 * @param {String} tableName name of the database table
 * @param {String} uid of the record to be deleted
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
module.exports.deleteItemByUID = async function(tableName, uid, transaction  = null) {
    if (uid) {
        let clauses = {};
        clauses[module.exports.UID_COLUMN] = uid;
        return await module.exports.deleteItems(tableName, clauses, transaction) > 0;
    }
    return null;
}

/**
 * Creates a new data record in a specific database table and fills it with values
 * 
 * @method createNewItem
 * @param {String} tableName name of the database table
 * @param {Object} properties values to be inserted
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Number} uid of the new item
 */
module.exports.createNewItem = async function(tableName, properties, transaction  = null) {
    let columns = columnsOfTables[tableName];
    let columnNames = [];
    let values = [];
    let placeholders = [];
    let colUID = module.exports.findUidColumn(columns);
    if (colUID) {
        columnNames.push(util.format('"%s"', colUID.column_name));
        placeholders.push(colUID.createExpression);
    }
    if (tableName in specialColumns) {
        for (let splCol of Object.keys(specialColumns[tableName])) {
            columnNames.push(splCol);
            if (splCol in properties) {
                // If value exists, replace %s by the value
                let expr = util.format(specialColumns[tableName][splCol], properties[splCol]);
                placeholders.push(expr);
            } else {
                placeholders.push(specialColumns[tableName][splCol]);
            }
        }
    }
    if (properties) {
        let index = 0;
        Object.keys(properties).forEach(function(key) {
            let col = module.exports.findColumn(key, columns);
            if (col && columnNames.indexOf(col.column_name) < 0) {
                let value = properties[key];
                if (value !== null) {
                    columnNames.push(util.format('"%s"', col.column_name));
                    values.push(value);
                    index++;
                    placeholders.push(util.format(col.writeFormat, "$"+index));
                }
            }
        });
    }
    else {
        placeholders = '';
    }
    const query = {
        text: util.format(insertFormat(colUID), 
                addSchema(tableName), 
                columnNames.join(), 
                placeholders.join()),
        values: values
    };

    try {
        let result = await executeCommand (query, transaction);
        if (result && !Array.isArray(transaction) && result.rowCount > 0) {
            result = result.rows[0];
            let uid = null;
            if (colUID) {
                uid = result[module.exports.UID_COLUMN];
                properties[colUID.displayName] = uid;
                return uid;
            }
        }
        return result;
    } catch (err) {
        module.exports.throwError500(err);
    }
}

/**
 * Creates a new data record in a specific database table and fills it with values of a feature
 * 
 * @method createNewFeature
 * @param {String} tableName name of the database table
 * @param {Object} feature and its properties to be saved in the database
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} updated contentBody with uid of the new item
 */
module.exports.createNewFeature = function(tableName, feature, transaction  = null) {
    if (feature)
        try {
            feature.properties[module.exports.UID_COLUMN] = 
                module.exports.createNewItem(tableName, feature.properties, transaction);
        } catch (err) {
            module.exports.throwError500(err);
        }
    return feature;
}

function addSchema(tableName) {
    if (tableName.indexOf('.') < 0)
        return dbcfg.DB_SCHEMA + '.' + tableName;
    return tableName;
}

/**
 * A function to get table columns from Postgres metadata table (information_schema)
 * 
 * This function is invoked once initially to populate the columnsOfTable map. Instead
 * of querying column info for each table separately, we query the entire schema at once.
 * 
 * @method queryTableColumnMetadata
 */
async function queryTableColumnMetadata() {
    let clauses = {};
    clauses['table_catalog'] = dbcfg.DB_CATALOG;
    clauses['table_schema'] = dbcfg.DB_SCHEMA;

    try {

        /* Create mapping and exports based on simplified table names
        This needs to be done before the Async DB call, otherwise 
        unittests will fail because tablename exports are not available
        */
        Object.keys(dbcfg.AllTables).forEach((simpleName) => {
            module.exports[simpleName] = dbcfg.AllTables[simpleName];
        });

        // Get information about columns
        let result = await module.exports.getQueryResult('information_schema.columns', null, clauses, undefined, false, false);
        if (Array.isArray(result)) {
            result.forEach(col => {
                // Add extra fields to the result
                dbcfg.prepareColumn(col);
                // Add it to column information for the given table
                if (!(col.table_name in columnsOfTables)) {
                    columnsOfTables[col.table_name] = [];
                }
                columnsOfTables[col.table_name].push(col);
            });

            // Add column info based on simplified table names
            Object.keys(dbcfg.AllTables).forEach((simpleName) => {
                let dbTableName = dbcfg.AllTables[simpleName];
                module.exports[simpleName + '_COLUMNS'] = columnsOfTables[dbTableName];
            });
        }
    } catch (err) {
        console.log("Error initializing table column metadata");
        console.log(err);
    }
}


// Creates a string array from a column array, containg the query expressions.
function getQueryExpressions (columns) {
    let names = [];
    if (Array.isArray(columns))
        columns.forEach(col => {
            if (typeof col === 'string')
                names.push(col);
            else {
                let value = col.queryExpression;
                if (value) 
                    if (value.toLowerCase() != col.column_name)
                        value = util.format("%s as %s", value, col.column_name);
                    names.push(value);
            }
        })
    else {
        if (!columns)
            columns = '*';
        names.push(columns);
    }
    return names;
}

/**
 * function search for column in a column list
 * 
 * @method findColumnByColName
 * @param {String} colName name of the column to be found
 * @param {Any[]} columns list of column objects
 * @returns {Object} column if found, else null
 */
module.exports.findColumnByColName = function (colName, columns) {
    colName = colName.toLowerCase();
    if (Array.isArray(columns))
        for (let col of columns) {
            if (typeof col === 'string') {
                if (colName == col.toLowerCase())
                    return col;
            }
            else if (colName == col.column_name.toLowerCase())
                return col;
        }
    return null;
}

/**
 * function search for column in a column list
 * 
 * @method findColumnByDisplayName
 * @param {String} dispName display name of the column to be found
 * @param {Any[]} columns list of column objects
 * @returns {Object} column if found, else null
 */
module.exports.findColumnByDisplayName = function (dispName, columns) {
    dispName = dispName.toLowerCase();
    if (Array.isArray(columns))
        for (let col of columns) {
            if (typeof col === 'string') {
                if (dispName == col.toLowerCase())
                    return col;
            }
            else if (dispName == col.displayName.toLowerCase())
                return col;
        }
    return null;
}

/**
 * function search for column in a column list
 * 
 * @method findColumn
 * @param {String} colName column name or display name of the column to be found
 * @param {Any[]} columns list of column objects
 * @returns {Object} column if found, else null
 */
module.exports.findColumn = function (colName, columns) {
    let col = module.exports.findColumnByColName(colName, columns);
    if (col == null)
        col = module.exports.findColumnByDisplayName(colName, columns);
    return col;
}

/**
 * function search for column in a table
 * 
 * @method findColumnOfTable
 * @param {String} colName column name or display name of the column to be found
 * @param {String} tableName name of the database table
 * @returns {Object} column if found, else null
 */
module.exports.findColumnOfTable = function (colName, tableName) {
    return module.exports.findColumn(colName, columnsOfTables[tableName]);
}

/**
 * function search for the uid column (PK) in a column list
 * 
 * @method findUidColumn
 * @param {Any[]} columns list of columns 
 * @returns {Object} column if found, else null
 */
module.exports.findUidColumn = function (columns) {
    return module.exports.findColumn(module.exports.UID_COLUMN, columns);
}

/**
 * function search for the uid column (PK) in a column list
 * 
 * @method getUidColumnName
 * @param {Any[]} columns list of columns 
 * @returns {String} column display name if found, else standard uid column name ('uid')
 */
module.exports.getUidColumnName = function (columns) {
    let col = module.exports.findUidColumn(columns);
    if (col)
        return col.displayName;
    return module.exports.UID_COLUMN;
}

/**
 * function search for the uid column (PK) in a certain table
 * 
 * @method findColumn
 * @param {String} tableName name of the database table
 * @returns {String} column display name if found, else standard uid column name ('uid')
 */
module.exports.getUidColumnNameOfTable = function (tableName) {
    return module.exports.getUidColumnName(columnsOfTables[tableName]);
}

/**
 * function returns the uid of an item
 * 
 * @method getUidOfItem
 * @param {Object} item 
 * @param {Any[]} columns list of columns 
 * @returns {String} uid of the item if found, else null
 */
module.exports.getUidOfItem = function (item, columns) {
    if (item) {
        if (item.constructor == String) 
            return item;
        if (item.constructor == Array) {
            for (let subItem of item) {
                let uid = module.exports.getUidOfItem(subItem, columns);
                if (uid)
                    return uid;
            }
        } else {
            let uid = item[module.exports.UID_COLUMN];
            if (uid == undefined) {
                let col = module.exports.findUidColumn(columns);
                if (col)
                    return item[col.displayName];
                return module.exports.getUidOfItem(item.body, columns);
            }
            return uid;
        }
    }
    return null;
}

/**
 * function returns the uid of an item of a certain table
 * 
 * @method getUidOfTableItem
 * @param {Object} item 
 * @param {String} tableName name of the database table
 * @returns {String} uid of the item if found, else null
 */
module.exports.getUidOfTableItem = function (item, tableName) {
    return module.exports.getUidOfItem(item, columnsOfTables[tableName]);
}

/**
 * function returns the columns of a certain table
 * 
 * @method getColumnsOfTable
 * @param {String} tableName name of the database table
 * @returns {Array} list of column objects
 */
module.exports.getColumnsOfTable = function (tableName) {
    return columnsOfTables[tableName];
}

/**
 * function sets the uid property of an item, using the display name
 * 
 * @method setUidOfItem
 * @param {Object} item 
 * @param {Array} columns list of columns
 * @returns {Boolean} true if item exists
 */
module.exports.setUidOfItem = function (uid, item, columns) {
    if (item) {
        let colName = module.exports.UID_COLUMN;
        let col = module.exports.findUidColumn(columns);
        if (col)
            colName = col.displayName;
        item[colName] = uid;
        return true;
    }
    return false;
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
        if (uid) {
            let props = {};
            props[reverse ? 'touid' : 'fromuid'] = uid;
            if (toType)
                props[reverse ? 'fromtype' : 'totype'] = toType;
            if (relationType)
                props['relationtype'] = relationType;
            let result = await module.exports.getQueryResult(tables.ITEM2ITEM_TABLE, null, props, undefined, false, false);
            let items = [];
            if (Array.isArray(result)) {
                for (let record of result) {
                    if (loadRelated) {
                        let item = await module.exports.getItemByID(
                            record[reverse ? 'fromtype' : 'totype'],
                            null,
                            record[reverse ? 'fromuid' : 'touid'], true);
                        if (item)
                            items.push(item)
                    } else
                        items.push(record[reverse ? 'fromuid' : 'touid']);
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
 * function adds a clause with a subquery for the 'item2item' table if related UIDs are given.
 * 
 * @method addRelationQuery
 * @param {Object} clauses where clauses for the main query (can be empty '{}' but not null)
 * @param {String[]} toUIDs one or more uids of potentially related items
 * @param {Boolean} reverse: if true, relation "from->to" is iverted to "to->from" 
 */
module.exports.addRelationQuery = function (clauses, relatedUIDs, reverse) {
    if (Array.isArray(relatedUIDs) && relatedUIDs.length > 0) {
        let relClauses = {};
        relClauses[reverse ? 'fromuid' : 'touid'] = relatedUIDs;
        clauses[module.exports.UID_COLUMN] = 
            module.exports.createQuery(tables.ITEM2ITEM_TABLE, [reverse ? 'touid' : 'fromuid'], relClauses);
    }
}

/**
 * function adds a clause with a subquery for the 'item2item' table if related UIDs are given.
 * 
 * @method addLinkQuery
 * @param {Object} clauses where clauses for the main query (can be empty '{}' but not null)
 * @param {String[]} toUIDs one or more uids of potentially related items
 * @param {Boolean} reverse: if true, relation "from->to" is iverted to "to->from" 
 */
module.exports.addLinkQuery = function (clauses, relatedUIDs, relatedTableName, relatedColName) {
    if (relatedUIDs) {
        let relClauses = {}
        relClauses[module.exports.UID_COLUMN] = relatedUIDs;
        clauses[module.exports.UID_COLUMN] = 
            module.exports.createQuery(relatedTableName, [relatedColName], relClauses);
    }
}

/**
 * function to create a new relation between two items
 * 
 * @method createRelationOfItem
 * @param {String} fromUID uid of the source item
 * @param {String} fromType tablename of the source type
 * @param {String} toUID uid of the target item
 * @param {String} toType tablename of the target type
 * @param {String} relationType
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} the new relation object
 */
module.exports.createRelationOfItem = async function (fromUID, fromType, toUID, toType, relationType, transaction  = null) {
    if (fromUID && toUID) {
        let props = {};
        props['fromuid'] = fromUID;
        props['fromtype'] = fromType;
        props['touid'] = toUID;
        props['totype'] = toType;
        props['relationtype'] = relationType;
        let table = module.exports.getTable("ITEM2ITEM_TABLE");
        if (table instanceof dblib.Table)
            return await table.createNewItem(props, transaction);
        return await module.exports.createNewItem(tables.ITEM2ITEM_TABLE, props, transaction);
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
module.exports.deleteRelations = async function (fromUID, fromType, toUID, toType, relationType, transaction  = null) {
    if (fromUID || toUID) {
        let props = {};
        props['fromuid'] = fromUID;
        props['fromtype'] = fromType;
        props['touid'] = toUID;
        props['totype'] = toType;
        props['relationtype'] = relationType;
        return await module.exports.deleteItems(tables.ITEM2ITEM_TABLE, props, transaction);
    }
    return null;
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
    if (testUIDs && relatedTableName && Array.isArray(items)) {
        let columns = columnsOfTables[itemsTableName];
        let i = items.length;
        while (i > 0) {
            i--;
            let itemUID = module.exports.getUidOfItem(items[i], columns);
            if (!await module.exports.checkRelation(itemUID, testUIDs, relatedTableName, reverse)) {
                items.splice(i, 1);
            }
        }
    }
}

let columnsOfTables = {};

// Populate the columnsOfTables object with table column info
queryTableColumnMetadata();

