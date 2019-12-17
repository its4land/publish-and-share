'use strict';

var utils = require('../utils/writer.js');
var ContentItems = require('../service/ContentItemsService');
var request = require('request');

/**
 * This function has been modified from its auto-generated counterpart. The generated
 * code always wraps responses with the mimetype 'application/json'. Since the output
 * type is different for this GET request, the controller is modified to simply pipe 
 * the original request to AWS S3. 
 */
module.exports.getContentItem = function getContentItem (req, res, next) {
  var contentitem_id = req.swagger.params['contentitem_id'].value;
  var envelope = req.swagger.params['envelope'].value;
  let uri = ContentItems.getContentItem(contentitem_id,envelope);
  let s3_error = false;
  let s3_response_code = null;
  req.pipe(request(uri))
  .on('response', (response) => {
    s3_response_code = response.statusCode;
    switch (response.statusCode) {
      case 200:
      case 206:
      case 301:
      case 302:
      case 307:
      case 308:
          break;
      case 404:
        s3_error = true;
        res.status(404).send(`Contentitem {${contentitem_id}} does not exist`);
        break;
      default:
        s3_error = true;
        res.status(500).send(`Error downloading contentitem {${contentitem_id}}`);
    }
  })
  .on('error', (err) => {
    console.log("Content Items GET error: ", err);
    res.status(500).send(`Error downloading contentitem {${contentitem_id}}`);
  })
  .pipe(res)
  .on('finish', (response) => {
    if (!s3_error) {
      console.log(`Finished downloading content item {${contentitem_id}} at ${new Date()}`);
    }
  })
  .on('error', (err) => {
    console.log(`Error piping (downloading) content item {${contentitem_id}}. S3 response code - ${s3_response_code}`);
  });
};

module.exports.getContentItems = function getContentItems (req, res, next) {
  var envelope = req.swagger.params['envelope'].value;
  var uid = req.swagger.params['uid'].value;
  var contentname = req.swagger.params['contentname'].value;
  var contenttype = req.swagger.params['contenttype'].value;
  var contentdescription = req.swagger.params['contentdescription'].value;
  var page = req.swagger.params['page'].value;
  var sort = req.swagger.params['sort'].value;
  var fields = req.swagger.params['fields'].value;
  var embed = req.swagger.params['embed'].value;
  ContentItems.getContentItems(envelope,uid,contentname,contenttype,contentdescription,page,sort,fields,embed)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.newContentItem = function newContentItem (req, res, next) {
  var newcontent = req.swagger.params['newcontent'].value;
  var envelope = req.swagger.params['envelope'].value;
  var description = req.swagger.params['description'].value;
  var i4lProcessUid = req.swagger.params['i4l-process-uid'].value;
  // default response timeout is 2 minutes. Not enough to upload and send response, so extend it
  let timeoutMinutes = 30;
  let timeoutMilliSec = timeoutMinutes * 60 * 1000;
  req.setTimeout(timeoutMilliSec);
  ContentItems.newContentItem(newcontent,envelope,description,i4lProcessUid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
