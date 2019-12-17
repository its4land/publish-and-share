const util = require('util');

const geojson = require('geojson');

const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');

const POINTS_TABLEID = 'MAPFEATURESPOINT_TABLE';
const LINES_TABLEID = 'MAPFEATURESLINE_TABLE';
const AREAS_TABLEID = 'MAPFEATURESAREA_TABLE';
const featureTables = {
    Point: POINTS_TABLEID,
    LineString: LINES_TABLEID,
    Polygon: AREAS_TABLEID
}

const PROP_GEOMETRY = 'Geometry';

function MapFeaturesHandler () {
    reqHnd.RequestHandler.call(this, null);
    this.typeName = null;
    this.queryPolygonClause = null;
}
MapFeaturesHandler.prototype.constructor = MapFeaturesHandler;
MapFeaturesHandler.prototype.inheritFrom = reqHnd.RequestHandler;
MapFeaturesHandler.prototype = new reqHnd.RequestHandler();

MapFeaturesHandler.prototype.getTable = function () { 
    return this.typeName ? dblib.getTable(featureTables[this.typeName]) : null; 
}

/**
 * adds special subqueries to query clauses
 * 
 * 
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
MapFeaturesHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    clauses[''] = this.queryPolygonClause; 
}

/**
 * prepare query result(s) for response
 * 
 * @param {Array} result of a query (Array of records, or a single record)
 * @param {Array} Array of items or a single item (Record.properties), prepared for response
 */
MapFeaturesHandler.prototype.publishResult = function(result) {
    return this.createGeoJSON(dblib.publishItems(result), PROP_GEOMETRY, 
        Array.isArray(result) ? null : "i4lMetricMapFeature");
}

MapFeaturesHandler.prototype.prepareFeature = function (feature) {
    if (typeof feature === 'object') {
        if (feature['type'] == "Feature") {
            let result = feature['properties'];
            if (typeof result === 'object') {
                let geometry = feature['geometry'];
                result[PROP_GEOMETRY] = this.prepareGeometry(geometry);
                return result;
            }
        }
    }
    return feature;
}

const handler = new MapFeaturesHandler();


/**
 * 
 * @param {Object} properties Request body describing the spatial source
 * @param {Boolean} envelope 
 * @param {String[]} embed list of property names with linked objects to be embedded
 * @param {String} processUID UUID of the current process
 * @param {Object} transaction a transaction context, created by dbconn.startTransaction()
 */
module.exports.createNewItemContent = async function(properties, envelope, embed, processUID, transaction = null) {
    if (properties == null)
        properties = {};
    handler.typeName = properties["geometry"]["type"];
    if (handler.getTable())
        return await handler.createNewItemContent (handler.prepareFeature (properties), envelope, embed, processUID, transaction);
    return null;
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
    if (properties == null)
        properties = {};
    let type = null;
    for (let key of Object.keys(featureTables)) {
        handler.typeName = key;
        let table = handler.getTable();
        if (table && await table.getItemByID(itemUID, table.uidColumnName, false, false) != null) {
            type = key;
            break;
        }
    }
    handler.typeName = type;
    if (handler.getTable()) {
        return await handler.updateItem (itemUID, handler.prepareFeature (properties), envelope, embed, processUID, transaction);
    }
    return null;
}

function getWindowPoints (queryWindow) {
    let points = queryWindow.split(',');
    for (let i=0; i<points.length-1; i++){
        if (i % 2 == 1) {
            points[i] = points[i].concat(',');
        }
        points[i] = points[i].concat(' ');
    }
    return points;
}

function getPolygonFromPoints (points) {
    let polygonStr = '';
    for (let point of points)
        polygonStr = polygonStr.concat(point);
    return polygonStr;
}

function getPolygonQuery (queryPolygon) {
    return util.format('ST_GeomFromEWKT(\'SRID=4326;POLYGON((%s))\')', queryPolygon);
}

/**
 * Retrieve a list of metric map features filtered by chosen options
 * 
 * 
 * @param {Boolean} envelope 
 * @param {String} queryWindow polygon coordinates
 */
module.exports.queryItems = async function(envelope, queryWindow) {
    let properties = {}
    let queryPolygon = getPolygonFromPoints(getWindowPoints(queryWindow));
    handler.queryPolygonClause = util.format('NOT ST_Disjoint(geom, %s)', getPolygonQuery(queryPolygon));
    handler.typeName = 'Point';
    let points = await handler.queryItems (envelope, properties, undefined, undefined, undefined, undefined);
    handler.typeName = 'LineString';
    let lines = await handler.queryItems (envelope, properties, undefined, undefined, undefined, undefined);
    handler.typeName = 'Polygon';
    let polygons = await handler.queryItems (envelope, properties, undefined, undefined, undefined, undefined);

    let features = points.concat(lines, polygons);
    return dblib.wrapFeatures("i4lMetricMapFeature", features);
}

