'use strict';

const reqHnd = require('./common/RequestHandler.js');

const CONFIG_TABLEID = 'CONFIG_TABLE';

function ConfigHandler () {
    reqHnd.RequestHandler.call(this, CONFIG_TABLEID);
}
ConfigHandler.prototype.constructor = ConfigHandler;
ConfigHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ConfigHandler.prototype = new reqHnd.RequestHandler();

const cfgHandler = new ConfigHandler();

module.exports.getConfig = async function(envelope,page,sort,fields,embed) {
    let properties = {};
    return await cfgHandler.queryItems(envelope, properties,page,sort,fields,embed);
}