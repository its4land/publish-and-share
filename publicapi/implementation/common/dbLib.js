'use strict';

/**
 * This module contains some useful functions for handling database queries
 */

const util = require('util');
const jpatch = require('jsonpatch');

const dbconn = require('./dbConnection');
const {pool} = require('./dbConnection');
const dbcfg = require('./dbConfig');

// exports

module.exports.Table = Table;
module.exports.Record = Record;

module.exports.throwError404 = function (err, table=null) {
    console.log(err);
    let errInfo = 'No items found';
    if (table) {
        errInfo = errInfo + ` in table ${table}`;
    }
    throw (module.exports.customErr(404, errInfo, err));
}

module.exports.throwError500 = function (err, table=null) {
    console.log(err);
    Object.defineProperty(err, 'message', { 
        value: err.message,
        enumerable: true
    });
    let errInfo = 'Database Error';
    if (table) {
        errInfo = errInfo + ` in table ${table}`;
    }
    throw (module.exports.customErr(500, errInfo, err));
}

/**
 * Return a customized error object for use in HTTP Response
 * 
 * @param {Number} code HTTP error status code
 * @param {String} summary Summary of error
 * @param {Object} info Detailed error description
 */
module.exports.customErr = function(code, summary, info) {
    if (info != null && info.statusCode == code)
        return info;
    let errObj = {
        statusCode: code, // HTTP standard response code
        summary: summary || undefined, // Short description of error
        info: info || undefined // Details
    };
    return errObj;
};

/**
 * Returns property object of a Record item
 * 
 * @method publishItem
 * @param {Any} item a Record object with properties
 * @returns {Any} properties of item
 */
function publishItem (item) {
    if (typeof item === 'object') {
        if (item instanceof Record)
            item = item.properties;
        for (let key of Object.keys(item)) {
            item[key] = module.exports.publishItems(item[key]);
        }
    }
    return item;
}

/**
 * Returns property objects of Record items
 * 
 * @method publishItems
 * @param {Array} items array of Records
 * @returns {Array} array of property objects of Record items
 */
module.exports.publishItems = function(items) {
    if (Array.isArray(items)) {
        let result = [];
        for (let item of items)
            result.push(publishItem(item));
        return result;
    }
    return publishItem(items);
}

module.exports.getItemProperty = function(item, property) {
    if (item instanceof Record)
        return module.exports.getItemProperty(item.properties, property);
    if (Array.isArray(item))
        return item;
    if (typeof item === 'object')
        return item[property];
    return item;
}

module.exports.setItemProperty = function(item, property, value) {
    if (property) {
        if (item instanceof Record)
            return module.exports.setItemProperty(item.properties, property, value);
        if (typeof item === 'object') {
            item[property] = value;
            return true;
        }
    }
    return false;
}

/**
 * Creates content wrapper from a single item or an item array.
 * 
 * @method wrapContent
 * @param {Object} item: single item or item array to be wrapped
 * @param {boolean} asArray return content as Array if true
 * @param {Integer} statusCode response HTTP status code
 * @returns {dictionary} content with items as body
 */
module.exports.wrapContent = function(item, asArray=true, statusCode=201) {
    if (item) {
        item = publishItem(item);
        let content = {};
        content.body = Array.isArray(item) ? item : (asArray ? [item]: item);
        content.statusCode = statusCode;
        return content;
    }
    return null;
}

/**
 * Accept an array of geometric objects metadata and return a GeoJSON object
 * 
 * @method wrapFeatures
 * @param {Array} features Array of geometric objects
 * @returns {Array} wrapped as geojson
 */
module.exports.wrapFeatures = function (name, features = []) {
    return {
        "type": "FeatureCollection",
        "name": name,
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": features
    }
}

module.exports.fromRFCpatch = function (patch) {
    if (Array.isArray(patch) && patch.length > 0) 
    {
        let pitems = [];
        for (let item of patch) {
            switch (item.op) {
                case "replace":
                    item.op = "add";
                    break;
                case "remove":
                    item.op = "add";
                    item.value = null;
                    break;
            }
            if (item.op == "add")
                pitems.push(item);
        }
        return jpatch.apply_patch({}, pitems);
    }
    return patch;
}
    
// local declarations and functions

const selectFormat = 'SELECT %s FROM %s%s%s';
const updateFormat = 'UPDATE %s SET %s%s';
const insertFormat = function(uidColumn) { 
    // Return UID column if present, else return entire row
    return 'INSERT INTO %s (%s) VALUES(%s) RETURNING ' + (uidColumn ? uidColumn : '*');
}
const deleteFormat = 'DELETE FROM %s%s';
const orderByFormat = ' ORDER BY %s';

/**
 * function creates a SQL query object for a database table, optional using query values
 * 
 * @method createQuery
 * @param {String} tableName name of the table
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {Object} clauses (optional) values to be queried
 * @param {String} sortBy Comma separated list of fields to sort by
 * @returns {Object} query
 */
function createQuery (tableName, columns, clauses, sortBy) {
    return {
        text: util.format(selectFormat, 
                getQueryExpressions(columns).join(), 
                tableName, 
                createWhere(clauses),
                sortBy),
        values: getQueryValues(clauses),
        table: tableName
    };
}

/**
 * function executing SQL query in the database
 * 
 * @method executeQuery
 * @param {dictionary} query SQL select and values
 * @param {bool} throwEmpty if true, throws an exception on empty query results
 * @returns {Object}
 */
async function executeQuery (query, throwEmpty = true) {
    try {
        let result = await pool.query(query);
        if (throwEmpty && result.rowCount == 0) {
            throw new Error(util.format('empty result: %s / values: %s', query.text, query.values.join()));
        }
        return result.rows;
    } catch (err) {
        if (err.message.indexOf('empty result:') == 0) {
            module.exports.throwError404(err, query.table);
        } else {
            module.exports.throwError500(err, query.table);
        }
    }
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
    try {
        return transaction != null ? await dbconn.executeCommand(command, transaction) : await pool.query(command);
    } catch (err) {
        //dbconn.cancelTransaction(transaction);
        module.exports.throwError500(err);
    }
}

// Creates a string array from a column array, containg the query expressions.
function getQueryExpressions (columns) {
    let names = [];
    if (Array.isArray(columns))
        for (let col of columns) {
            if (typeof col === 'string')
                names.push(col);
            else {
                let value = col.queryExpression;
                if (value) 
                    if (value.toLowerCase() != col.column_name)
                        value = util.format("%s as %s", value, col.column_name);
                    names.push(value);
            }
        }
    else {
        if (!columns)
            columns = '*';
        names.push(columns);
    }
    return names;
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
            if (key) {
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
            }
            else {
                item = value;
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

function getQueryValues (clauses) {
    let values = [];
    for (let [key, value] of Object.entries(clauses)) {
        if (key && value != null) {
            values.push(value);
        }
    }
    return values;
}

/// class Table

function Table (tableID, name, schema, columns = []) {
    this.tableID = tableID;
    this.schema = schema.toLowerCase();
    this.name = name.toLowerCase();
    this.columns = columns;

    this.fullName = this.schema + '.' + this.name;
        //function (){ return this.schema + '.' + this.name; }
    let primKey = dbcfg.getPrimaryKey(tableID);
    this.uidColumnName = this.getColumnByName(primKey) != null ? primKey : undefined;
    this.uidColumn = function (){ return this.getColumnByName(this.uidColumnName); }
    this.uidColumnDisplayName = function (){ 
        let col = this.uidColumn();
        return col != null ? col.displayName : undefined; 
    }
}
Table.prototype.constructor = Table;

Table.prototype.addColumns = function (allColumns, doPrepare = true) {
    if (Array.isArray(allColumns)) {
        for (let col of allColumns) {
            if (col.table_schema == this.schema && col.table_name == this.name) {
                this.columns.push(col);
                // Add extra fields to the cols
                if (doPrepare)
                    dbcfg.prepareColumn(col);
            }
        };
        this.uidColumnName = this.getColumnByName(dbcfg.UID_COLUMN) != null ? dbcfg.UID_COLUMN : undefined;
    }

}

Table.prototype.getColumnByName = function (colName) {
    if (colName && Array.isArray(this.columns)) {
        colName = colName.toLowerCase();
        for (let col of this.columns) {
            if (colName == col.column_name.toLowerCase())
                return col;
        }
    }
    return null;
}

Table.prototype.getColumnByDisplayName = function (displayName) {
    if (displayName && Array.isArray(this.columns)) {
        displayName = displayName.toLowerCase();
        for (let col of this.columns) {
            if (col.displayName && displayName == col.displayName.toLowerCase())
                return col;
        }
    }
    return null;
}

Table.prototype.getColumn = function (name) {
    if (typeof name === 'string')
        return this.getColumnByName(name) || this.getColumnByDisplayName(name);
    if (typeof name === 'object' && name.table_name == this.name)
        return this.getColumnByName(name.column_name);
    return null;
}

Table.prototype.getColumns = function (names) {
    let result = [];
    if (Array.isArray(names))
        for (let name of names) {
            let col = this.getColumn(name);
            if (col != null)
                result.push(col);
        }
    else {
        let col = this.getColumn(names);
        if (col != null)
            result.push(col);
    }
    return result;
}

/**
 * Get All Columns of a table as properties
 * @method getAllColumns
 * @param {Boolean} useDisplayName if true, use display name rather than original db colname
 */
Table.prototype.getAllColumns = function (useDisplayName=true) {
    let property = 'column_name';
    if (useDisplayName) { property = 'displayName'};
    let cols = [];
    for (let col of this.columns) {
        cols.push(col[property]);
    }
    return cols;
}

Table.prototype.getRecordUID = function (record) {
    if (record instanceof Record) { 
        return record.id != null ? record.id : this.getRecordUID(record.properties);
    }
    if (typeof record === 'object')
        return record[this.uidColumnName] || record[this.uidColumnDisplayName()];
    return record;
}

Table.prototype.setRecordUID = function (record, uid, useDisplayNames) {
    if (typeof uid === 'object')
        uid = uid[this.uidColumnName];
    if (module.exports.setItemProperty(record, useDisplayNames ? this.uidColumnDisplayName() : this.uidColumnName, uid)) {
        if (record instanceof Record)
            record.id = uid;
        return true;    
    }
    return false;
}

Table.prototype.prepareOrderBy = function (sortBy) {
    if (typeof sortBy === 'string') {
        let fields = sortBy.split(',');
        sortBy = null;
        for (let fld of fields) {
            fld = fld.trim();
            let direction = null;
            let p = fld.indexOf(' ');
            if (p > 0) {
                direction = fld.substr(p+1);
                fld = fld.substr(0, p);
            }
            let col = this.getColumn(fld);
            if (col != null) {
                let expr = col.column_name;
                if (direction)
                    expr = util.format("%s %s", expr, direction);
                if (sortBy == null)
                    sortBy = expr;
                else
                    sortBy = util.format("%s, %s", sortBy, expr);
            }
        }
    }
    return sortBy ? util.format(orderByFormat, sortBy) : '';
}

/**
 * function creates a SQL query object for a database table, optional using query values
 * 
 * @method createQuery
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {Object} clauses (optional) values to be queried
 * @param {String} sortBy Comma separated list of fields to sort by
 * @returns {Object} query
 */
Table.prototype.createQuery = function (columns, clauses, sortBy) {
    if (columns == null)
        columns = this.columns;
    else {
        columns = this.getColumns(columns);
        let col = this.uidColumn();
        if (col != null && columns.indexOf(col) < 0)
            columns.splice(0, 0, col);
    }
    return createQuery(this.fullName, columns, clauses, this.prepareOrderBy(sortBy));
}

Table.prototype.createRecord = function (data, useDisplayNames, copyValues) {
    return new Record(this, data, useDisplayNames, copyValues);
}

/**
 * function combining column names and values to a properties dictionary.
 * The values array must be in the same order as the according table columns. 
 * Null values will be refused, undefined values can be accepted optionally.
 * 
 * @method fillProperties
 * @param {Any[]} columns to be returned as properties
 * @param {Any[]} values in the same order as columns
 * @param {Boolean} acceptUndefined add undefined values or not
 * @returns {dictionary} properties
 */
Table.prototype.fillProperties = function (values, acceptUndefined = true) {
    if (Array.isArray(values)) {
        let props = {};
        for (let i = 0; i < this.columns.length; i++) {
            let value = undefined;
            if (i < values.length)
                value = values[i];
            if (value !== null && (acceptUndefined || (value !== undefined)))
                props[this.columns[i].column_name] = value;
        };
        return props;
    }
    if (typeof values === 'object') {
        let props = Object.assign({}, values);
        this.setPropertyNames(props, false, true);
        return props;
    }
    return values;
}

/**
 * function executing SQL query in a database table, optional using query values
 * 
 * @method getQueryResult
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {Object} clauses (optional) values to be queried
 * @param {String} sortBy Comma separated list of fields to sort by
 * @param {Boolean} useDisplayNames returns displaynames of the properties if true, else column names
 * @param {Boolean} throwEmpty if true, throws an exception on empty query results
 * @returns {Object} result of the query
 */
Table.prototype.getQueryResult = async function (columns, clauses, sortBy, useDisplayNames = true, throwEmpty = true) {
    const query = this.createQuery(columns, clauses, sortBy);
    let result = await executeQuery(query, throwEmpty);
    if (Array.isArray(result)) {
        let dresult = [];
        for (let item of result) {
            let record = this.createRecord(item, useDisplayNames, false);
            if (record != null) {
                dresult.push(record);
            }
        }
        return dresult;
    }
    return result;
}

/**
 * function query for a single item with certain uid
 * 
 * @method getItemByID
 * @param {Number} uid uid of the desired item
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {bool} useDisplayNames if true, returns the displaynames of the columns instead of column names
 * @param {bool} throwEmpty if true, throws an exception on empty query results
 * @returns {Object} single item
 */
Table.prototype.getItemByID = async function (uid, columns = null, useDisplayNames = true, throwEmpty = true) {
    let clauses = {};
    clauses[this.uidColumnName] = uid;
    let result = await this.getQueryResult(columns, clauses, undefined, useDisplayNames, throwEmpty);
    if (Array.isArray(result) && result.length > 0)
        return result[0];
    return null;  //result;
}

/**
 * Updates one or more data row(s) in a specific database table and fills it with values
 * where clauses determine which row(s) will be updated
 * 
 * @method updateItems
 * @param {Object} properties values to be inserted
 * @param {Object} clauses to create a where statement
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {int} number of affected rows
 */
Table.prototype.updateItems = async function(properties, clauses, transaction = null) {
    if (properties instanceof Record)
        return this.updateItems(properties.properties, clauses, transaction);
    if (properties) {
        let values = [];
        let placeholders = [];
        let index = 0;
        for (let key of Object.keys(properties)) {
            let col = this.getColumn(key);
            if (col && col.column_name != this.uidColumnName) {
                let value = properties[key];
                if (value !== undefined) {
                    if (value === null) {
                        placeholders.push(util.format("%s=null", col.column_name));
                    }
                    else {
                        //values.push(util.format(col.writeFormat, value));
                        values.push(value);
                        index++;
                        //placeholders.push(util.format("%s=$%i", col.column_name, index));
                        placeholders.push(util.format("%s=%s", col.column_name, util.format(col.writeFormat, "$"+index)));
                    }
                }
            }
        }
        if (placeholders.length > 0) {
            const query = {
                text: util.format(updateFormat, 
                        this.fullName, 
                        placeholders, 
                        createWhere(clauses, -1)),
                values: values
            };
            try {
                let result = await executeCommand (query, transaction);
                return result != null ? result.rowCount : null;
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
 * @param {Object} properties values to be inserted
 * @param {String} uid of the record to be updated
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
Table.prototype.updateItemByUID = async function(uid, properties, transaction = null) {
    if (uid && properties) {
        let clauses = {};
        clauses[this.uidColumnName] = uid;
        return await this.updateItems(properties, clauses, transaction) > 0;
    }
    return null;
}

/**
 * Updates a specific data row in a specific database table by a patch specification
 * 
 * @method patchItem
 * @param {String} uid of the record to be patched
 * @param {any[]} patch JSON Patch is specified in RFC 6902 from the IETF
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
Table.prototype.patchItem = async function(uid, patch, transaction = null) {
    if (uid && Array.isArray(patch)) {
        let item = await this.getItemByID(uid);
        if (item != null) {
            return await item.patchItem(patch, true, transaction);
        }
    }
    return null;
}

/**
 * Deletes one or more data row(s) in a specific database table
 * where clauses determine which row(s) will be deleted
 * 
 * @method deleteItems
 * @param {Object} clauses to create a where statement
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Number} number of deleted rows
 */
Table.prototype.deleteItems = async function(clauses, transaction  = null) {
    if (clauses) {
        const query = {
            text: util.format(deleteFormat, 
                    this.fullName, 
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
 * @param {String} uid of the record to be deleted
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
Table.prototype.deleteItemByUID = async function(uid, transaction  = null) {
    if (uid) {
        let clauses = {};
        clauses[this.uidColumnName] = uid;
        return await this.deleteItems(clauses, transaction) > 0;
    }
    return null;
}

/**
 * Creates a new data record in a specific database table and fills it with values
 * 
 * @method createNewItem
 * @param {Object} properties values to be inserted
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Number} uid of the new item
 */
Table.prototype.createNewItem = async function(properties, transaction  = null) {
    if (properties instanceof Record)
        return this.createNewItem(properties.properties, transaction);
    let columnNames = [];
    let values = [];
    let placeholders = [];
    
    if (properties) {
        properties[this.uidColumnName] = null;
        let index = 0;
        for (let key of Object.keys(properties)) {
            let col = this.getColumn(key);
            if (col && columnNames.indexOf(col.column_name) < 0) {
                let expr = col.createExpression;
                let value = properties[key];
                if (value !== null || expr) {
                    columnNames.push(util.format('"%s"', col.column_name));
                    if (expr) {
                        if (expr.indexOf('%') >= 0)
                            value = util.format(expr, value);
                        else
                            value = expr;
                        placeholders.push(value);
                    }
                    else if (col.datetime_precision != null) {
                        if (value instanceof Date)
                            value = util.format('to_timestamp(%s)', value * 0.001);
                        placeholders.push(value);
                    }
                    else {
                        values.push(value);
                        index++;
                        placeholders.push(util.format(col.writeFormat, "$"+index));
                    }
                }
            }
        }
    }
    else {
        placeholders = '';
    }
    const query = {
        text: util.format(insertFormat(this.uidColumnName), 
                this.fullName, 
                columnNames.join(), 
                placeholders.join()),
        values: values
    };

    try {
        let result = await executeCommand (query, transaction);
        if (result && result.rowCount > 0) {
            result = result.rows[0];
            if (result != null && this.uidColumnName)
                return result[this.uidColumnName];
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
 * @param {Object} feature and its properties to be saved in the database
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Object} updated contentBody with uid of the new item
 */
Table.prototype.createNewFeature = function(feature, transaction = null) {
    if (feature)
        try {
            feature.properties[this.uidColumnName] = 
                this.createNewItem(feature.properties, transaction);
        } catch (err) {
            module.exports.throwError500(err);
        }
    return feature;
}

Table.prototype.setPropertyNames = function (data, useDisplayNames, check) {
    if (data instanceof Record)
        return this.setPropertyNames(data.properties, useDisplayNames, check);
    if (typeof data === 'object') {
        for (let key of Object.keys(data)) {
            let remove = check;
            // Skip adding null values as properties, since it's invalid as per Swagger/OAS 2.0
            if (data[key] !== null) {
                let col = this.getColumn(key);
                if (col != null) {
                    let name = useDisplayNames ? col.displayName : col.column_name;
                    if (name != key)
                        data[name] = data[key];
                    else
                        remove = false;
                }
            }
            if (remove)
                delete data[key];
        }
        return true;
    }
    return false;
}

/// class Record = item or row of a database table

function Record (table, data, useDisplayNames, copyValues = true) {
    this.table = table;
    this.properties = {};
    this.copyProperties(data, useDisplayNames, copyValues);
    this.id = table.getRecordUID(this);
    //this.id = function() { return table.getRecordUID(this); };
}
Record.prototype.constructor = Record;

Record.prototype.copyProperties = function (data, useDisplayNames, copyValues) {
    if (data instanceof Record)
        return this.copyProperties(data.properties, useDisplayNames, true);
    if (typeof data === 'object') {
        this.table.setPropertyNames(data, useDisplayNames, true);
        if (copyValues) {
            for (let key of Object.keys(data))
                this.properties[key] = data[key];
        }
        else
            this.properties = data;
        return true;
    }
    return false;
}

/**
 * function query for a single item with certain uid
 * 
 * @method queryItem
 * @param {Any[]} columns to be returned as properties; if null, all columns of the table are returnd
 * @param {bool} useDisplayNames if true, returns the displaynames of the columns instead of column names
 * @param {bool} throwEmpty if true, throws an exception on empty query results
 * @returns {Object} single item
 */
Record.prototype.queryItem = async function (columns = null, useDisplayNames = true, throwEmpty = true) {
    let item = await this.table.getItemByID(columns, this.id, useDisplayNames, throwEmpty); 
    if (item != null) {
        this.copyProperties(item, false);
        return true;
    }
    return false;
}

/**
 * Updates this record in the database table
 * 
 * @method updateItem
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
Record.prototype.updateItem = async function(transaction = null) {
    if (this.id != null)
        return await this.table.updateItemByUID(this.id, this.properties, transaction) > 0;
    this.id = await this.table.createNewItem(this.properties, transaction);
    return this.id != null ? 1 : 0; 
}

/**
 * Updates this record by a patch specification
 * 
 * @method patchItem
 * @param {any[]} patch JSON Patch is specified in RFC 6902 from the IETF
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
Record.prototype.patchItem = async function (patch, update, transaction = null) {
    let newValues = jpatch.apply_patch(this.properties, patch);
    if (update) {
        let count = 0;
        for (let [key, value] of Object.entries(newValues)) {
            if (!this.properties.hasOwnProperty(key) || value == this.properties[key])
                delete newValues[key];
            else
                count++;
        }
        return count <= 0 || await this.table.updateItemByUID(this.id, newValues, transaction) > 0;
    }
    this.properties = newValues;
}
    
/**
 * Deletes a specific row in a specific database table
 * 
 * @method deleteItem
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 * @returns {Boolean} true on success
 */
Record.prototype.deleteItem = async function(transaction  = null) {
    return await this.table.deleteItemByUID(this.id, clauses, transaction) > 0;
}

/**
 * Queries for a via foreign key related item in another table (N:1 relation)
 * 
 * @method queryParentItem
 * @param {Object} relatedTable the table linked by a foreign key
 * @param {String} keyName name of the foreign key property
 * @param {bool} loadRelated if true: replaces the foreign uid by the queried object
 * @returns {Object} properties of the parent
 */
Record.prototype.queryParentItem = async function(parentTable, keyName, loadRelated, asObject = true) {
    if (parentTable != null && keyName) {
        let parentUID = this.properties[keyName];
        if (parentUID) {
            let result = await parentTable.getItemByID(parentUID, null, true, false);
            if (result != null) {
                if (loadRelated)
                    this.properties[keyName] = result.properties;
                else if (asObject) {
                    let item = {};
                    item[parentTable.uidColumnDisplayName()] = parentUID;
                    this.properties[keyName] = item;
                }
                return result.properties;
            }
        }
    }
    return null;
}

/**
 * Queries for via foreign key related items in another table (1:N relation)
 * 
 * @method queryRelatedItems
 * @param {Object} relatedTable the table linked by a foreign key
 * @param {String} keyName name of the foreign key property
 * @param {bool} loadRelated if true: replaces the foreign uid by the queried object
 * @returns {Object} properties of the parent
 */
Record.prototype.queryRelatedItems = async function(relatedTable, keyName, loadRelated) {
    if (relatedTable != null && keyName) {
        let relatedUIDs = this.properties[keyName];
        if (Array.isArray(relatedUIDs)) {
            let result = [];
            for (let uid of relatedUIDs) {
                if (loadRelated) {
                    let item = await relatedTable.getItemByID(uid, null, true, false);
                    result.push(item.properties);
                }
                else {
                    let item = {};
                    item[relatedTable.uidColumnName] = uid;
                    result.push(item);
                }
            }
            this.properties[keyName] = result;
            return result;
        }
        else
            return this.queryParentItem(relatedTable, keyName, loadRelated, true);
    }
    return null;
}

/**
 * Queries for a via foreign key related item in another table
 * 
 * @method queryRelatedItem
 * @param {Object} relatedTable the table linked by a foreign key
 * @param {Object} relatedItem properties of the related item, if it does not exist yet
 * @param {String} keyName name of the foreign key property
 * @param {bool} replaceKey if true: replaces the foreign uid by the queried object
 * @returns {Boolean} true on success
 */
Record.prototype.updateRelatedItem = async function(relatedTable, relatedItem, keyName, transaction = null) {
    if (this.id && relatedTable != null && relatedItem != null && keyName) {
        let relatedUID = relatedTable.getRecordUID(relatedItem);
        if (relatedUID) {
            relatedItem = {};
            relatedItem[keyName] = this.id;
            return await relatedTable.updateItemByID(relatedUID, relatedItem, transaction);
        }
        else {
            if (relatedItem instanceof Record)
                relatedItem.properties[keyName] = this.id;
            else
                relatedItem[keyName] = this.id;
            return await relatedTable.createNewItem(relatedItem, transaction);
        }
    }
    return null;
}

/**
 * Set 1:n related target items of given type as a property of the given source item.
 * This relationship does not use the item2item table, but a direct relation via a foreign key
 * This function only reads from the database
 * 
 * @method setDirectRelations
 * @param {String} ownProperty Label of target property in source item
 * @param {String} relatedTable Type of target item (table name)
 * @param {String} relatedProperty Column name of the foreign key
 * @param {bool} loadRelated 
 * @returns {Array} Related Items
 */
Record.prototype.setDirectRelations = async function(ownProperty, relatedTable, relatedProperty, loadRelated) {
    if (relatedTable != null && relatedProperty)
        try {
            let clauses = {};
            clauses[relatedProperty] = this.id;
            let relatedItems = await relatedTable.getQueryResult(loadRelated ? null : [relatedTable.uidColumnName], 
                clauses, undefined, true, false);
            if (ownProperty)
                this.properties[ownProperty] = module.exports.publishItems(relatedItems);
            return relatedItems;
        } catch (err) {
            console.log(err); 
            if (ownProperty)
                this.properties[ownProperty] = err;
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
Record.prototype.setDirectRelation = async function(ownProperty, relatedTable, loadRelated, asObject = false) {
    return this.queryParentItem(relatedTable, ownProperty, loadRelated, asObject);
}

/// Initialization

const allTables = {};
let isInitialized = false;
let isInitializing = false;
initializeMetadata();

module.exports.getTableByName = function (tableName) {
    if (tableName instanceof Table)
        return tableName;
    return module.exports.getTable(dbcfg.AllTableIDs[tableName]);
}

module.exports.getTable = function (tableID) {
    if (tableID instanceof Table)
        return tableID;
    if (!isInitialized) {
        initializeMetadata();
        return null;
    }
    return allTables[tableID];
}

/**
 * A function to get table columns from Postgres metadata table (information_schema)
 * 
 * This function is invoked once initially to populate the columnsOfTable map. Instead
 * of querying column info for each table separately, we query the entire schema at once.
 * 
 * @method initializeMetadata
 */
async function initializeMetadata () {
    if (!isInitialized && !isInitializing) {
        try {
            isInitializing = true;

            let clauses = {};
            clauses['table_catalog'] = dbcfg.DB_CATALOG;
            clauses['table_schema'] = dbcfg.DB_SCHEMA;

            // Get information about columns
            const query = createQuery('information_schema.columns', null, clauses, util.format(orderByFormat, 'table_name, column_name'));
            let result = await executeQuery(query, true);
            if (Array.isArray(result)) {
                let columnsOfTables = {};
                for (let col of result) {
                    if (col instanceof Record)
                        col = col.properties;
                    // Add extra fields to the result
                    dbcfg.prepareColumn(col);
                    // Add it to column information for the given table
                    if (!(col.table_name in columnsOfTables)) {
                        columnsOfTables[col.table_name] = [];
                    }
                    columnsOfTables[col.table_name].push(col);
                };
                for (let [key, value] of Object.entries(dbcfg.AllTables)) {
                    if (value in columnsOfTables) {
                        let table = new Table(key, value, dbcfg.DB_SCHEMA, columnsOfTables[value]);
                        allTables[key] = table;
                        console.log("Added table "+table.tableID+": "+ table.fullName);
                    }
                }
                isInitialized = true;
            }
        } catch (err) {
            console.log("Error initializing table column metadata");
            console.log(err);
        }
        finally {
            isInitializing = false;
        }
    }
}

