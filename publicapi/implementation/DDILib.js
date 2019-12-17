'use strict';

const path = require('path');
const rp = require('request-promise-native');

const apiUtils = require('./common/apiUtils');
const dbcfg = require('./common/dbConfig');
const dblib = require('./common/dbLib');
const dbrel = require('./common/dbRelations');
const experMaps = require('./common/ExperMapsAPI');
const pusconfig = require('../config/config');
const reqHnd = require('./common/RequestHandler');
const tagsLib = require('./Tags.js');

const geoServerCfg = pusconfig.geoServer;


const DDILAYERS_TABLEID = 'DDILAYERS_TABLE';
const DDIIMAGES_TABLEID = 'DDILAYERSIMAGES_TABLE';
const PROJECTS_TABLEID = 'PROJECTS_TABLE';
const PROP_PROJECTS = 'Projects';

function DDILayersHandler () {
    reqHnd.RequestHandler.call(this, DDILAYERS_TABLEID);
    this.emInstance = new experMaps.ExperMapsHandler();
}

DDILayersHandler.prototype.constructor = DDILayersHandler;
DDILayersHandler.prototype.inheritFrom = reqHnd.RequestHandler;
DDILayersHandler.prototype = new reqHnd.RequestHandler();

const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': geoServerCfg.api_auth_string
};

let getEndpointURL = function (endpoint) {
    return `${geoServerCfg.api_url}${endpoint}`
};

let getS3URL = function(contentId) {
    return `s3://${pusconfig.AWS.S3Bucket}/${contentId}`;
};

let sendGetRequest = async function(endpoint, params = null) {
    let paramString = params ? `?${params}` : '';
    let options = {
        url: `${getEndpointURL(endpoint)}?${paramString}`,
        headers : requestHeaders
    };
    return rp.get(options); //.auth(geoserver.username, geoserver.password, false);
};

let sendPostRequest = async function(endpoint, payload) {
    let options = {
        url: `${getEndpointURL(endpoint)}`,
        headers : requestHeaders,
        body: payload,
        json: true
    };
    return rp.post(options); //.auth(geoserver.username, geoserver.password, false);
};

let sendDeleteRequest = async function(endpoint, payload) {
    let options = {
        method: 'DELETE',
        url: `${getEndpointURL(endpoint)}`,
        headers : requestHeaders,
        body: payload,
        json: true
    };
    return rp(options); 
};

/**
 * Return name of file minus the extension
 * @param {String} file Name of file
 */
let getNativeName = function(file) {
    return path.parse(file).name;
};

/**
 * Handle GeoServer status codes and send interpret it accordingly for PuS API
 * 
 * @param {Object} response http response object
 * @param {String} errMessage custom error message
 * @param {Integer} newStatusCode replacement status code if needed
 */
let handleGeoserverResponse = async function(response, errMessage=undefined, newStatusCode=-1) {
    let statusCode = response.statusCode;
    if (newStatusCode == -1) {
        newStatusCode = statusCode;
    }

    switch(statusCode) {
        case 401:
            throw(apiUtils.customErr(500, 'GeoServerError - Unauthorized Access', response));
        case 500:
            if (!errMessage) {
                if ("message" in response) {
                    errMessage = response.message;
                } else {
                    errMessage = "GeoServer internal error. Contact developers."
                }
            }
            throw(apiUtils.customErr(newStatusCode, errMessage));
        default:
            return response;
    }
};

/**
 * Get all coverages belonging to a workspace
 * 
 * @param {String} workspaceName Name of Geoserver workspace
 */
let geoServerGetCoverages = async function(workspaceName = geoServerCfg.workspace) {
    let endpoint = `/workspaces/${workspaceName}/coverages`;
    return sendGetRequest(endpoint);
};

/**
 * 
 * @param {String} layerName User specified layer name
 * @param {String} contentItem content item on S3 to add as source
 */
let geoServerAddNewCoverageStore = async function(layerName, contentItem, workspaceName = geoServerCfg.workspace) {
    try {
        let endpoint = `/workspaces/${workspaceName}/coveragestores`;
        let coverageName = `${layerName}_${contentItem}`;

        let payload = {
            "coverageStore" : {
                "name" : coverageName,
                "description": `Added by DDILayers endpoint; Layer - ${layerName}; ContentId - ${contentItem}`,
                "url": getS3URL(contentItem),
                "type": "S3GeoTiff",
                "enabled": "true",
                "workspace" : {
                    "name": workspaceName
                }
            }
        };

        let result = await sendPostRequest(endpoint, payload);
        return result;
    } catch (err) {
        let errMsg, newStatusCode = undefined;
        if ("error" in err && (err.error.search("already exists in workspace")) > -1) {
            errMsg = `Layer with name '${layerName}' and ContentItem '${contentItem}' already exists in workspace on Geoserver. Choose a different name`;
            newStatusCode = 409;
        }
        return handleGeoserverResponse(err, errMsg, newStatusCode);
    }
};

/**
 * Delete a coverage store
 * @param {String} storeName Name of Coverage Store to delete
 * @param {String} workspaceName Name of workspace
 */
let geoServerDeleteCoverageStore = async function(storeName, workspaceName = geoServerCfg.workspace) {
    try {
        let endpoint = `/workspaces/${workspaceName}/coveragestores/${storeName}`;
        let payload = {};
        console.log(`Deleting coverage store '${storeName}' in workspace '${workspaceName}'`);
        return sendDeleteRequest(endpoint, payload);
    } catch (err) {
        console.log(`Error deleting coverage store '${storeName}' in workspace '${workspaceName}'`);
        console.log(err);
        return {};
    }
}

/**
 * Add a coverage (layer) to a coverage store
 * 
 * @param {String} coverageName Name of coverage (layer)
 * @param {String} coverageDesc Description of coverage
 * @param {String} storeName Name of Coverage Store to add coverage to
 * @param {String} workspaceName Name of geoserver workspace
 */
let geoServerAddCoverageToStore = async function(coverageName, contentItem, coverageDesc, storeName, workspaceName = geoServerCfg.workspace) {
    try {
        let endpoint = `/workspaces/${workspaceName}/coveragestores/${storeName}/coverages`;
        let payload = {
            "coverage" :{
                "name": coverageName,
                "title": coverageName,
                "description": `Created by DDILayers endpoint on ${Date(Date.now())}`,
                "nativeName": getNativeName(contentItem),
                "nativeCoverageName": "geotiff_coverage",
                "abstract": coverageDesc
            }
        };
        return sendPostRequest(endpoint, payload);
    } catch (err) {
        if ("error" in err && err.error.search("com.amazonaws.services.s3.model.AmazonS3Exception" != -1)) {
            // Delete newly created coverage store
            geoServerDeleteCoverageStore(storeName);
            return handleGeoserverResponse(err, "Geoserver error when using Amazon S3 store. Check if content id exists and if you have permissions to access them.")
        }
        return handleGeoserverResponse(err);
    }
};

/**
 * Check if given layer ('coverage' in GeoServer) already exists
 * 
 * @param {String} newLayerName Name of layer
 */
let layerNameIsUnique = async function(newLayerName) {
    let layersStr = await geoServerGetCoverages();
    let layers = JSON.parse(layersStr);
    if (typeof layers === "object" && "coverages" in layers) {
        if (typeof layers.coverages === "object" && "coverage" in layers.coverages) {
            for (let layer of layers.coverages.coverage) {
                if ("name" in layer && layer.name === newLayerName) {
                    return false;
                }
            }
        }
    }
    return true;
}

let getLayerInWorkspace = async function(layerName, workspaceName = geoServerCfg.workspace) {
    try {
        let endpoint = `/workspaces/${workspaceName}/layers/${layerName}`;
        return await sendGetRequest(endpoint);
    } catch(err) {
        if (err.statusCode == 404) {
            // no layer exists, we can proceed
            console.log("Layer name " + layerName + " can be created");
        }
    }
};

/**
 * adds special subqueries to query clauses
 *
 *
 * @param {Object} clauses specifications for a query
 * @param {Object} properties property values to be searched for
 */
DDILayersHandler.prototype.prepareQueryClauses = async function (clauses, properties) {
    let table = this.getTable();
    dbrel.addRelationQuery(clauses, table, properties[PROP_PROJECTS], true);
    await tagsLib.addTagsQuery(clauses, table, properties[tagsLib.PROP_TAGS]);
}


/**
 * Get layers registered in Geoserver
 * 
 */
DDILayersHandler.prototype.getLayers = async function(envelope,uid,name,type,projects,tags,page,sort,fields,embed) {
    try {
        let properties = {}
        reqHnd.addQueryValue(properties, dbcfg.UID_COLUMN, uid);
        reqHnd.addQueryValue(properties, 'name', name); 
        reqHnd.addQueryValue(properties, 'service', type); 
        reqHnd.addQueryValue(properties, PROP_PROJECTS, projects); 
        reqHnd.addQueryValue(properties, 'Tags', tags); 
        let result = await handler.queryItems(envelope, properties, page, sort, fields, embed);
        return dblib.wrapContent(await this.prepareItems(result, embed));
    } catch (err) {
        console.log(err);
        if (err.statusCode == 404) {
            throw apiUtils.customErr(404, 'Error when fetching DDI layers', err);
        }
        throw apiUtils.customErr(500, 'Error when fetching DDI layers', err);
    }
}

/**
 * Create a new layer in Geoserver from a supported content item
 * 
 * @param {Object} newDDILayer  Endpoing request body
 */
DDILayersHandler.prototype.createNewLayer = async function(newDDILayer,envelope,embed,i4lProcessUid, transaction=null) {
    var layerProperties = null;
    try {
        let contentItems = newDDILayer.ContentItems;
        if (!contentItems) { contentItems = []};
        
        // Only one content items is supported currently
        if (contentItems.length == 0) {
            throw(apiUtils.customErr(400, "No content items to add", "Content items required to add as layer"));
        } else if (contentItems.length > 1) {
            throw(apiUtils.customErr(501, "Only one content item supported in current version", "Only one content item can be added as layer"));
        }

        let newLayerName = newDDILayer.Name;
        
        /**
         * Part 1: Registration in PuS Database
         */
        layerProperties = await this.createNewItemContent(newDDILayer, envelope, embed, i4lProcessUid, transaction);
        //await this.updateRelations(layerUID, newDDILayer, transaction);
        // return layerUID;

        /**
         * Part 2: Registration in GeoServer
         */

        // Check if layername is already in use
        if (!await layerNameIsUnique(newLayerName)) {
            throw(apiUtils.customErr(409, `Layer name '${newLayerName}' conflicts with another existing layer of same name`));
        }

        // Create CoverageStore from Content Item
        let contentItem = contentItems[0];
        let coverageStoreName = await geoServerAddNewCoverageStore(newLayerName, contentItem);
        
        // Create Coverage from Store
        let geoServerResult = await geoServerAddCoverageToStore(newLayerName, contentItem, newDDILayer.description, coverageStoreName);

        /**
         * Part 3: Registration in Expermaps . A failure here should not impact the response
         */
        
         // ExperMaps needs same name as layername
         let emLayerName = newDDILayer.Name;
        
        let emlayer = await this.emInstance.addLayer(emLayerName, geoServerCfg.url);
        if (emlayer.statusCode == 200 && typeof emlayer.body === 'object' && 'success' in emlayer.body) {
            if (emlayer.body.success == true) {
                let emLayerId = emlayer.body.id;
                this.emInstance.updateDefaultRoleForLayer(emLayerId);
                this.emInstance.updateLayerHierarchy(emLayerId);
            } else {
                console.log(`ERROR! Could not add layer with uuid ${layerProperties.body.UID} to expermaps`);
                console.log(emlayer.body);
            }
        } else {
            console.log(`ERROR! Could not add layer with uuid ${layerProperties.body.UID} to expermaps`);
        }

        return layerProperties;
    } catch (err) {
        console.log("Error when adding DDI Layer");
        console.log(err);

        // Delete database entry if added should some error occur in GeoServer
        if (layerProperties) {
            console.log(`Removing DDI Layer ${layerProperties.body.UID} from DB table`);
            this.deleteItem(layerProperties.body.UID, true);
        }
        throw(err);
    }
};

DDILayersHandler.prototype.prepareItem = async function(result, embed) {
    await dbrel.setRelationsAsProperty(result, this.getTable(), dblib.getTable(PROJECTS_TABLEID), PROP_PROJECTS, embed);
    let record = await dbrel.setDirectRelationsAsProperty(result, 
        dblib.getTable(DDIIMAGES_TABLEID), 
        'ddilayeruid', 
        'ddilayeruid', 
        'ddilayeruid');
    return record;
};

/**
 * 1. Add content items to another table. 
 * 2. Add entry for Projects in item2item
 */
DDILayersHandler.prototype.updateRelations = async function(itemUID, lyrProps, transaction=null) {
    // Add content items to t_ddilayersimages    
    let properties = {
        ddilayeruid: itemUID,
        contentuid: lyrProps.ContentItems[0]
    };
    let table = dblib.getTable(DDIIMAGES_TABLEID);
    if (table) {
        await table.createNewItem(properties, transaction);
    }

    // Add entry in item2item table for projects
    if (PROP_PROJECTS in lyrProps) {
        lyrProps.ProjectsArray = [];
        for (let proj of lyrProps.Projects) {
            if ('UID' in proj) {
                lyrProps.ProjectsArray.push(proj.UID);
        }
        await dbrel.updateRelatedLinks(itemUID, 
            lyrProps,
            this.getTable(), 
            'ProjectsArray', 
            dblib.getTable(PROJECTS_TABLEID),
            'DDILayer', true, transaction);
        }
    }
    return true;
};

DDILayersHandler.prototype.publishResult = async function(items) {
    let result = dblib.publishItems(items);

    // Replace the property ddilayeruid in expected output format
    function adjustLabel(resObj) {
        if (typeof resObj === 'object' && 'ddilayeruid' in resObj) {
            resObj.ContentItems = [];
            for (let item of resObj.ddilayeruid) {
                if ('contentuid' in item) {
                    resObj.ContentItems.push(item.contentuid)
                }
            }
            delete resObj.ddilayeruid;
        }
        return resObj;
    }
    if (Array.isArray(result)) {
        let output = [];
        for (let elem of result) {
            output.push(adjustLabel(elem));
        }
        return output;
    } else {
        return adjustLabel(result);
    }
};

const handler = new DDILayersHandler();

/**
 * Get layers registered in Geoserver
 * 
 * @param {Object} newDDILayer Metadata of new layer to be added
 * 
 */
module.exports.getLayers = async function(envelope,uid,name,type,projects,tags,page,sort,fields,embed) {
    return handler.getLayers(envelope,uid,name,type,projects,tags,page,sort,fields,embed);
}

/**
 * Create a new layer in Geoserver from a supported content item
 * 
 * @param {Object} newDDILayer Metadata of new layer to be added
 * 
 */
module.exports.createNewLayer = async function(newDDILayer,envelope,embed,i4lProcessUid) {
    return handler.createNewLayer(newDDILayer,envelope,embed,i4lProcessUid);
}