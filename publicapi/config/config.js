/**
 * API configuration for the its4land public API
 */

'use strict';

/**
 * Settings related to Amazon Web Services
 */
module.exports.AWS = {
    IdentityPoolId: '',
    S3Bucket: 's3bucket',
    S3Domain: 's3.amazonaws.com',
    region: 'eu-central-1',
    get S3BaseURI() { return `http://${this.S3Bucket}.${this.S3Domain}/` }
};

/**
 * Postgres Database settings
 * 
 * Use environment variables if present, else switch to defaults
 */
module.exports.DB = {
    host: 'db_hostname',
    user: 'db_username',
    password: 'db_password',
    port: 5432,
    name: process.env.DB_NAME ? process.env.DB_NAME : 'i4l', // name of the database
    schema: process.env.DB_SCHEMA ? process.env.DB_SCHEMA : 'i4ldata' // schema
};


/**
 * Process API settings
 * 
 * Used to generate URL of the form http://{host}:{port}/{api_root}/{api_version}
 */
module.exports.processAPI = {
    host: 'localhost', // Also change redis host below if required
    port: 7878,
    protocol: 'https',
    api_root: 'processapi', 
    api_version: 'v1',
    redis : {
        host: 'localhost', // If using Docker, make sure redis host and port are accessible 
        port: 6379,
        status_channel: 'STATUS_CHAN'
    },
    get url() {
        return `http://${this.host}:${this.port}/${this.api_root}/${this.api_version}`;
    }
};

/**
 * Geoserver settings
 */
module.exports.geoServer = {
    host: 'geoserverhost',
    port: '8080',
    protocol: 'http',
    geoserver_root: '/', // Sub-path in case geoserver is reverse proxied
    username: 'username',
    password: 'password',
    workspace: 'its4land',
    get url() {
        return `${this.protocol}://${this.host}:${this.port}${this.geoserver_root}`
    },
    get api_url() {
        return `${this.url}/rest`
    },
    get api_auth_string() {
        // Basic Authorization string encoded in base64 for the API request header
        let encoded = Buffer.from(`${this.username}:${this.password}`).toString("base64");
        return `Basic ${encoded}`;
    }
};

/**
 * Expermaps settings
 */
module.exports.experMaps = {
    host: 'expermapshost',
    port: '443',
    root: '/',
    protocol: 'https',
    username: '',
    password: '',
    get url() {
        return `${this.protocol}://${this.host}:${this.port}${this.root}`;
    }
}
