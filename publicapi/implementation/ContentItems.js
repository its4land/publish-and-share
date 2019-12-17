const i4lconfig = require('../config/config.js');

const fs = require('fs');
const stream = require('stream');
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const util = require('util');
const Busboy = require('busboy');

const dblib = require('./common/dbLib');
const dbcfg = require('./common/dbConfig');
const dbrel = require('./common/dbRelations');
const reqHnd = require('./common/RequestHandler.js');
const TABLEID = 'CONTENT_INDEX_TABLE';

const PROP_CONTENTID = 'contentuid';
const PROP_CONTENTTYPE = 'contentmimetype';
const PROP_CONTENTNAME = 'contentname';
const PROP_CONTENTSIZE = 'contentsize';
const PROP_CONTENTDESCRIPTION = 'contentdescription';

AWS.config.region = i4lconfig.AWS.region; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: i4lconfig.AWS.IdentityPoolId,
});

// Create S3 service object
let s3 = new AWS.S3();

// Create Promisified versions of S3 API methods
s3.uploadAsync = util.promisify(s3.upload);
s3.headObjectAsync = util.promisify(s3.headObject);

function ContentItemsHandler() {
    reqHnd.RequestHandler.call(this, TABLEID);
}

ContentItemsHandler.prototype.constructor = ContentItemsHandler;
ContentItemsHandler.prototype.inheritFrom = reqHnd.RequestHandler;
ContentItemsHandler.prototype = new reqHnd.RequestHandler();

ContentItemsHandler.prototype.listContentItems = async function(envelope,uid,contentname,contenttype,contentdescription,page,sort,fields,embed) {
    let table = this.getTable();
}

ContentItemsHandler.prototype.prepareItem = async function(item, embed, fields) {
    let table = this.getTable();
    item.properties['ContentSize'] = parseInt(item.properties['ContentSize']);
}

const handler = new ContentItemsHandler();

/**
 * Return URI of the S3 object
 * 
 * This function just returns the URI of the requested object. The actual
 * functionality is implemented in the controller, which just pipes the 
 * request to S3.
 * 
 * @method getContentItem
 * @param {String} contentItem_ID 
 * @param {Boolean} envelope 
 * @returns {String}
 */
module.exports.getContentItem = function (contentItem_ID, envelope) {
    let uri = i4lconfig.AWS.S3BaseURI + contentItem_ID;
    return uri;
};

/**
 * Upload a file to an S3 bucket
 * 
 * @method postContentItem
 * @param {Object} contentItem 
 * @param {Boolean} envelope 
 * @returns {Object}
 */
module.exports.postContentItem = async function(contentItem, envelope, description) {
    // call S3 to retrieve upload file to specified bucket
    
    let bufferStream = null;
    if (contentItem.path != null)
        bufferStream = fs.createReadStream(contentItem.path);
    else {
        let contentBuffer = contentItem.buffer;
        bufferStream = new stream.PassThrough();
        bufferStream.end(contentBuffer);
    }

    let uploadParams = {
        Bucket: i4lconfig.AWS.S3Bucket,
        Key: uuidv4(),
        Body: bufferStream,
        ContentDisposition: `attachment; filename="${contentItem.originalname}"`, // Orig filename as metadata
        ContentType: contentItem.mimetype,
    };
    if (description) {
        uploadParams.Metadata = {
            "description": description
        }
    }

    let options = {
        partSize: 10 * 1024 * 1024, 
        queueSize: 1
    };

    try {
        let data = await s3.uploadAsync(uploadParams);
        let result = {};
        if (data) {
            console.log("Upload Success", data.Location);
            result.statusCode = 201;
            result.body = {
                ContentType: uploadParams.ContentType,
                ContentID: uploadParams.Key
            };
        }

        // If upload is successful fetch metadata of uploaded object from S3
        let getParams = {
            Bucket: i4lconfig.AWS.S3Bucket,
            Key: uploadParams.Key
        }
        let contentMeta = await s3.headObjectAsync(getParams);
        let contentProperties = {
            contentuid: uploadParams.Key,
            contenthashid: contentMeta.ETag.replace(/"/g,''),
            contentmimetype: contentMeta.ContentType,
            contentsize: contentMeta.ContentLength,
            contentname: extractFilename(contentMeta.ContentDisposition),
            contentdescription: contentMeta.Metadata.description
        };
        let table = dblib.getTable('CONTENT_INDEX_TABLE');
        if (table != null) {
            table.createNewItem(contentProperties);
        }
        return result;
    } catch (err) {
        console.log(err);
        switch (err.code) {
            case "InvalidHeader":
                err.statusCode = 400;
                err.message = "AWS S3 error: " + err.message;
                break;
            default:
                err.statusCode = 500;
        }
        throw(err);
    }
};

/**
 * Extract filename from the Content-Disposition value
 * 
 * The field in the header typically is of the form shown below:
 * {
 *  Content-Disposition: 'form-data; name="fieldName"; filename="filename.jpg"';'
 * }
 * Given the value string for the above field, the function returns 'filename.jpg'
 * 
 * @param {String} dispString 
 */
function extractFilename(dispString) {
    let parts = dispString.split(";");
    let regex = /^filename=['"](.*)['"]$/i;
    for (let part of parts.map(p => p.trim())) {
        let match = part.match(regex);
        if (match) {
            return match[1];
        }
    }
}

/**
 * Return metadata of all contentitems registered in the database
 */
module.exports.listContentItems = async function(envelope,uid,contentname,contenttype,contentdescription,page,sort,fields,embed) {
    let properties = {};
    reqHnd.addQueryValue(properties, PROP_CONTENTID, uid);
    reqHnd.addQueryValue(properties, PROP_CONTENTNAME, contentname);
    reqHnd.addQueryValue(properties, PROP_CONTENTTYPE, contenttype);
    reqHnd.addQueryValue(properties, PROP_CONTENTDESCRIPTION, contentdescription);
    // return await handler.listContentItems(envelope,uid,contentname,contenttype,contentdescription,page,sort,fields,embed);_
    let result = {};
    if (!fields) {
        fields = [PROP_CONTENTID, PROP_CONTENTNAME, PROP_CONTENTDESCRIPTION, PROP_CONTENTTYPE, PROP_CONTENTSIZE];
    }

    result.body = await handler.queryItems(envelope, properties, page, sort, fields, embed);
    result.status = 200;

    if (result.body.length == 0) {
        result.status = 204;
    }
    return result;
}

/**
 * Manually handle POST content items request using Busboy to parse the multipart form data *
 *
 */

module.exports.postContentItemStream = async function(req, res) {
    try {
        const inspect = require('util').inspect;
	let timeoutMinutes = 90;
	let timeoutMilliSec = timeoutMinutes * 60 * 1000;
	req.setTimeout(timeoutMilliSec);

        let busboy = new Busboy({headers: req.headers});
        var formFields = {};
        var uploadParams = {
            Bucket: i4lconfig.AWS.S3Bucket,
            Key: uuidv4(),
        };

        busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
            console.log('Field [' + fieldname + ']: value: ' + inspect(val));
            formFields[fieldname] = val;
        });

        busboy.on('file', async (fieldname, stream, filename, encoding, mimetype) => {
            if (fieldname !== "newcontent") {
                console.log(`Ignoring invalid fieldname '${fieldname}' for POST /contentitems`);
                stream.resume(); //Ignore
                res.status(400).send(`Invalid field '${fieldname}' for POST /contentitems `);
                //res.end();
            } else {
                uploadParams.ContentDisposition = `attachment; filename="${filename}"`; // Needed to download with original filename
                uploadParams.ContentType = mimetype;
                uploadParams.Body = stream;

                if ('description' in formFields) {
                    uploadParams.Metadata = {
                        "description": formFields.description
                    }
                } else if ('Description' in formFields) {
                    uploadParams.Metadata = {
                        "description": formFields.Description
                    }
                }

                console.log(`Uploading started at ${new Date()}: '${filename}' => s3://${uploadParams.Bucket}/${uploadParams.Key} `);

                s3.upload(uploadParams)
                .on('httpUploadProgress', (event)=>{
                    console.log(`Uploaded ${event.loaded} of ${event.total} bytes for content item {${event.key}}`);
                })
                .send(async (err, data) => {
                    if (err) { throw(err)}
                    let result = {};

                    if (data) {
                        console.log(`Upload finished at ${new Date()}: '${filename}' => ${data.Location}`);
                        result.statusCode = 201;
                        result.body = {
                            ContentType: uploadParams.ContentType,
                            ContentID: uploadParams.Key,
                            ContentName: filename,
                        };
                    }

                    // If upload is successful fetch metadata of uploaded object from S3
                    let getParams = {
                        Bucket: i4lconfig.AWS.S3Bucket,
                        Key: uploadParams.Key
                    }
                    let contentMeta = await s3.headObjectAsync(getParams);
                    let contentProperties = {
                        contentuid: uploadParams.Key,
                        contenthashid: contentMeta.ETag.replace(/"/g,''),
                        contentmimetype: contentMeta.ContentType,
                        contentsize: contentMeta.ContentLength,
                        contentname: extractFilename(contentMeta.ContentDisposition),
                    };

                    if ('description' in formFields) {
                        contentProperties.contentdescription = formFields.description
                    } else if ('Description' in formFields) {
                        contentProperties.contentdescription = formFields.Description
                    }

                    result.body.ContentDescription = contentProperties.contentdescription;
                    result.body.ContentSize = contentProperties.contentsize;

                    let table = dblib.getTable('CONTENT_INDEX_TABLE');
                    if (table != null) {
                        table.createNewItem(contentProperties);
                    }
                    res.status(result.statusCode).send(result.body);
                });
            }
        });

        busboy.on('finish', () => {
            console.log("Finished parsing form");
        });

        req.pipe(busboy);
    } catch (err) {
        console.log(err);
        switch (err.code) {
            case "InvalidHeader":
            err.statusCode = 400;
            err.message = "AWS S3 error: " + err.message;
            break;
            default:
            err.statusCode = 500;
        }
        res.status(500).send('Internal server error when uploading content item');
    }
}
