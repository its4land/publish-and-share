/**
 * Module to handle updating of Expermaps GUI
 */

const rp = require('request-promise-native');

const pusconfig = require('../../config/config');

const experMapsCfg = pusconfig.experMaps;

ExperMapsHandler = function() {
    // Flag for authentication
    this.authenticated = false;

    // Jar for cookies
    this.cookieJar = rp.jar();

    // Modify default request options
    this.HTTPrequest = rp.defaults({
        headers: {
            'Content-Type': 'application/json'
        },
        json: true,
        followAllRedirects: true,
        strictSSL: false,
        resolveWithFullResponse: true,
        jar: this.cookieJar
    });

    // Create a session
    this.createSession();
};

ExperMapsHandler.prototype.constructor = ExperMapsHandler;

ExperMapsHandler.prototype.getEndpointURL = function(endpoint) {
    return `${experMapsCfg.url}/${endpoint}`;
};

/**
 * Create a new session cookie for ExperMaps
 */
ExperMapsHandler.prototype.createSession = async function() {
    try {
        let options = {
            url: this.getEndpointURL('login'),
            body: {
                username: experMapsCfg.username,
                password: experMapsCfg.password
            },
        };

        let response = await this.HTTPrequest.post(options);
        // Check if login fails. Sadly ExperMaps does not indicate failure via statusCode
        // Upon failure, a client is redirected to the login page
        if (response.request.uri.path === "/login") {
            console.log("ERROR! ExperMaps login failed. POST DDILayers endpoint wont function correctly");
            return false;
        } else {
            this.authenticated = true;
            return true;
        }
    } catch(err) { 
        throw(err)
    };
};

ExperMapsHandler.prototype.getProjections = async function() {
    try {
        if (this.createSession()) {
            let options = {
                url: this.getEndpointURL('db/projections')
            }
            let response = await this.HTTPrequest.get(options);
            if (response.statusCode === 200){
                let body = response.body;
                if (typeof body === 'object' && 'success' in body && body.success == true) {
                    let projections = [];
                    if ('projections' in body) {
                        for (let proj of body.projections) {
                            if ('_id' in proj) {
                                projections.push(proj._id);
                            }
                        }
                    }
                    return projections;
                }
            }
        }
    } catch(err) {
        throw(err);
    }
};

ExperMapsHandler.prototype.addLayer = async function(layerName, geoServerURL) {
    try {
        if (this.createSession()) {
            let payload = {
                "type": "WMS",
                "name": layerName,
                "category": "overlay",
                "dataConfig": {
                    "useSecurityProxySrc": true,
                    "src": geoServerURL + "/wms",
                    "layer": layerName,
                    "fontName": "",
                    "fontSize": 0,
                    "fontColor": "",
                    "singleTile": false,
                    "tileSize": 512,
                    "imageType": "image/png"
                },
                "attribution": null,
                "minScale": 1000000,
                "maxScale": 100,
                "transparent": 0,
                "wmsFeatureInfoAvailable": false,
                "featureDataService": "",
                "availableProjectionSets": await this.getProjections(),
                "contextMenus": []
            };

            let options = {
                url: this.getEndpointURL('db/layers'),
                body: payload
            };

            let response = await this.HTTPrequest.post(options);
            return response;
        }
    } catch (err) {
        throw(err);
    }
};

ExperMapsHandler.prototype.getDefaultRole = async function() {
    try {
        if (this.createSession()) {
            let options = {
                url: this.getEndpointURL('db/roles')
            };
            let response = await this.HTTPrequest.get(options);
            if (response.statusCode == 200) {
                if ('roles' in response.body) {
                    for (let role of response.body.roles) {
                        if ('name' in role && role.name === 'defaultRole') {
                            return role
                        }
                    }
                }
            }
        }
    } catch (err) {
        throw(err);
    }
};

ExperMapsHandler.prototype.updateDefaultRoleForLayer = async function(layerId) {
    try {
        if (this.createSession()) {
            let defaultRole = await this.getDefaultRole();
            if (defaultRole) {
                defaultRole["rights"]["<layer>" + layerId] = {
                    "type": "layer",
                    "create": false,
                    "update": false,
                    "delete": false,
                    "updateAttributes": false
                };
                let options = {
                    url: this.getEndpointURL('db/roles'),
                    body: defaultRole
                };
                this.HTTPrequest.put(options);
            }
        }
    } catch (err) {
        throw(err);
    }
};

ExperMapsHandler.prototype.getLayerHierarchy = async function() {
    try {
        if (this.createSession()) {
            let options = {
                url: this.getEndpointURL('db/layerhierarchy')
            };
            let response = await this.HTTPrequest.get(options);
            if (response.statusCode == 200) {
                if ('layerHierarchy' in response.body) {
                    return response.body.layerHierarchy;
                }
            }
        }
    } catch (err) {
        throw(err);
    }
};

ExperMapsHandler.prototype.updateLayerHierarchy = async function(layerId) {
    try {
        if (this.createSession()) {
            let layers = await this.getLayerHierarchy();
            if (layers) {
                let layerDisplayOptions = {
                    "leaf": true,
                    "checked": false,
                    "id": layerId
                };
                layers.layerDisplayOrder.push(layerDisplayOptions);

                let layerTree = layers.layerTree;
                let layerTreeOptions = {
                    "leaf": true,
                    "checked": false,
                    "id": layerId,
                    "layerIndex": layerTree.length
                };
                layers.layerTree.push(layerTreeOptions);

                let options = {
                    url: this.getEndpointURL('db/layerhierarchy'),
                    body: layers
                };
                let response = await this.HTTPrequest.post(options);
                return response;
            }
        }
    } catch (err) {
        throw(err);
    }
};

module.exports.ExperMapsHandler = ExperMapsHandler;