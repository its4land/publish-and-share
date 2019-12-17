'use strict';


/**
 * Ping API server via request header
 * Useful for testing if server is alive
 *
 * no response value expected for this operation
 **/
exports.pingServer = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

