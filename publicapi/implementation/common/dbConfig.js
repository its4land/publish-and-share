'use strict';

/**
 * This module contains hard coded database tables and columns specifications
 */

const util = require('util');

const {DB: DBConfig} = require('../../config/config.js');

// local declarations and functions

const tables = {
    ADMINSOURCE_TABLE: 't_adminsource',
    BOUNDARYFACESTRING_TABLE: 't_boundaryfacestring',
    CLASSIFIERS_TABLE: 't_classifier',
    CONFIG_TABLE: 't_pusconfig',
    CONTENT_INDEX_TABLE: 't_contentindex',
    DDILAYERS_TABLE: 't_ddilayers',
    DDILAYERSIMAGES_TABLE: 't_ddilayersimages',
    ENTRYPOINT_TABLE: 't_entrypoint',
    ITEM2ITEM_TABLE: 't_item2item',
    LOGS_TABLE: 't_logs',
    MAPFEATURESPOINT_TABLE: 't_topopointfeature',
    MAPFEATURESLINE_TABLE: 't_topolinearfeature',
    MAPFEATURESAREA_TABLE: 't_topoareafeature',
    MODELS_TABLE: 't_models',
    MODELCLASSES_TABLE: 't_modelclasses',
    PROCESSES_TABLE: 't_processes',
    PROCESS_PARAMETERS_TABLE: 't_processparameters',
    PROJECTS_TABLE: 't_projects',
    RESULTS_TABLE: 't_projectcomputationresults',
    SPATIALSOURCES_TABLE: 't_spatialsources',
    SPATIALSOURCEADDDOCS_TABLE: 't_addspatialsourcedocuments',
    SPATIALUNITS_TABLE: 't_spatialunit',
    SPATIALUNITCONCEPTS_TABLE: 't_spatialunitconcepts',
    TAGS_TABLE: 't_tags',
    TOOLS_TABLE: 't_tools',
    TOOLIMAGES_TABLE: 't_toolimages',
    TRAININGSETS_TABLE: 't_trainingsets',
    VALIDATIONSETS_TABLE: 't_wp5_valdidationsets'
};
const tableIDs = {};
Object.keys(tables).forEach((simpleName) => {
    let dbTableName = tables[simpleName]; // actual name of table in database e.g. t_projects
    tableIDs[dbTableName] = simpleName; // Reverse mapping from: actual name => simplified name
});

const columnDisplayNames = {
    'classifier': 'Classifier',
    'conceptimage': 'ConceptImage',
    'conceptname': 'ConceptName',
    'contentitem': 'ContentItem',
    'createdat': "CreatedAt",
    'createdby': "CreatedBy",
    'description': 'Description',
    'entrypoint': 'EntryPoint',
    'extdescriptionurl': 'ExtDescriptionURL',
    'geom': 'Geometry',
    'lastmodifiedby': 'LastModifiedBy',
    'lastmodifiedat': 'LastModifiedAt',
    'longdescription': "LongDescription",
    'name': 'Name',
    'nameinmodel': 'NameInModel',
    'projectdir': 'ProjectDir',
    'releasedate': 'ReleaseDate',
    'status': "Status",
    'tags': 'TagValue',
    'toolname': 'ToolName',
    'toolversion': 'ToolVersion',
    'trainingset': 'TrainingSet',
    'type': 'Type',
    'uid': 'UID',
    'version': 'Version'
}

const primaryKeys = {
    RESULTS_TABLE: 'resultuid'
}

const columnDisplayNamesOfTables = {
    CLASSIFIERS_TABLE: {
        'classifiertype': 'ClassifierType'
    },
    CONTENT_INDEX_TABLE: {
        'contentuid': 'ContentID',
        'contentmimetype': 'ContentType',
        'contentname': 'ContentName',
        'contentsize': 'ContentSize',
        'contentdescription': 'ContentDescription'
    },
    DDILAYERS_TABLE: {
        'service': 'Service',
        'emname': 'EMName'
    },
    ENTRYPOINT_TABLE: {
        'entrypoint': 'EntryPoint'
    },
    ITEM2ITEM_TABLE: {},
    LOGS_TABLE: {
        'logseq' : 'SeqNr',
        'logdate': 'LogDate',
        'logsource': 'LogSource',
        'loglevel': 'LogLevel',
        'logtext': 'LogMsg'
    },
    MODELS_TABLE: {},
    MODELCLASSES_TABLE: {
        'modeluid': 'Model'
    },
    PROCESSES_TABLE: {
        'projectuid': 'Project',
        'processuid': 'Process'
    },
    PROCESS_PARAMETERS_TABLE: {
        'parametername': "ParameterName",
        'parametervalue': "ParameterValue",
    },
    PROJECTS_TABLE: {},
    RESULTS_TABLE: {
        'projectuid': 'Project',
        'processuid': 'Process',
        'computedate': "ComputeDate",
        'resulttype': "ResultType",
        'resultuid': "ResultUID"
    },
    SPATIALSOURCES_TABLE: {},
    SPATIALSOURCEADDDOCS_TABLE: {},
    TAGS_TABLE: {},
    TOOLS_TABLE: {
        'longdescription': 'LongDescription',
        'supplier': 'Supplier',
        'extdescriptionurl': 'ExtDescriptionURL',
        'toolurl': 'ToolURL'
    },
    TOOLIMAGES_TABLE: {},
    TRAININGSETS_TABLE: {
        'trainingsettype': 'TrainingSetType',
        'trainingsetstatus': 'TrainingSetStatus'
    }
}

const columnQueryExpressions = {
    'AOI': 'ST_AsGeoJSON("AOI")',
    'aoi': 'ST_AsGeoJSON("aoi")',
    'geom': 'ST_AsGeoJSON("geom")',
    'geometry': 'ST_AsGeoJSON("geometry")'
    //'geom': 'ST_AsEWKT("geom")'
}
const columnCreateExpressions = {
    'uid': 'uuid_generate_v4()',
    'logseq': '(SELECT CASE WHEN max(logseq) IS NULL THEN 1 ' +
        `ELSE max(logseq) + 1 END FROM %DB_SCHEMA%.${tables.LOGS_TABLE} WHERE processuid='%s')`
}
const columnWriteFormats = {
    'AOI': 'ST_GeomFromGeoJSON(%s)',
    'aoi': 'ST_GeomFromGeoJSON(%s)',
    'geom': 'ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)',
    'geometry': 'ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)'
}

/*
// Some columns need to be treated specially e.g. if data is generated from sub-queries
const specialColumns = {};
specialColumns[tables.LOGS_TABLE] = {
    'logseq': '(SELECT CASE WHEN max(logseq) IS NULL  THEN 1 ' +
    `ELSE max(logseq) + 1 END FROM ${module.exports.DB_SCHEMA}.${tables.LOGS_TABLE} WHERE processuid='%s')`
}
*/

// Checks if there is a displayname for a given column name. 
// If not, the column name is returned.
function getDisplayName (colName, tableName) {
    let name = undefined;
    let colNames = columnDisplayNamesOfTables[tableIDs[tableName]];
    if (colNames) 
        name = colNames[colName];
    if (name === undefined)
        name = columnDisplayNames[colName];
    if (name === undefined)
        return colName;
    return name;
}

function parseExpression (expr) {
    if (expr != null)
        return expr.replace("%DB_SCHEMA%", module.exports.DB_SCHEMA)
    return expr
}

// Checks if there is a query expression for a given column name. 
// If not, the column name is returned.
function getQueryExpression (colName) {
    let name = columnQueryExpressions[colName];
    if (name === undefined)
        return colName;
    return parseExpression(name);
}

// Checks if there is a create expression for a given column name. 
// If not, the column name is returned.
function getCreateExpression (colName) {
    return parseExpression (columnCreateExpressions[colName]);
}

// Checks if there is a write format for a given column name. 
// If not, the standard "%s" is returned.
// If a value is submitted, the formatted value is returned.
function getWriteFormat (colName, value = null) {
    let fmt = parseExpression(columnWriteFormats[colName]);
    if (fmt === undefined)
        fmt = '%s';
    if (value !== null)
        return util.format(fmt, value);
    return fmt;
}

// exports

module.exports.DB_CATALOG = DBConfig.name;
module.exports.DB_SCHEMA = DBConfig.schema;
module.exports.UID_COLUMN = 'uid';
module.exports.AllTables = tables;
module.exports.AllTableIDs = tableIDs;

module.exports.getPrimaryKey = function (tableID) {
    let key = primaryKeys[tableID];
    if (key === undefined)
        return module.exports.UID_COLUMN;
    return key;
}

module.exports.prepareColumn = function (column) {
    if (typeof column === 'object') {
        // Add extra fields to the cols
        column.displayName = getDisplayName(column.column_name, column.table_name);
        column.queryExpression = getQueryExpression(column.column_name);
        column.createExpression = getCreateExpression(column.column_name);
        column.writeFormat = getWriteFormat(column.column_name);
    }
}

