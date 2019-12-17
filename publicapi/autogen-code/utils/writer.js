var ResponsePayload = function(code, payload) {
  this.code = code;
  this.payload = payload;
}

/**
 * 
 * @param {Object} header Custom HTTP Response header 
 * @param {Object|string} payload Body of HTTP reponse
 */
let CustomResponsePayload = function(code, header, payload) {
  this.code = code;
  this.header = header;
  this.payload = payload;
}

exports.respondWithCode = function(code, payload) {
  return new ResponsePayload(code, payload);
}

/**
 * 
 * @param {Object} header Object with Key/value HTTP reponse header pairs
 * @param {String|Object} payload HTTP response body
 */
exports.respondWithCustomHeader = function(code, header, payload) {
  return new CustomResponsePayload(code, header, payload);
}


var writeJson = exports.writeJson = function(response, arg1, arg2, customHeader) {
  var code;
  var payload;
  let responseHeader = customHeader || {'Content-Type': 'application/json'};
  
  if(arg1 && arg1 instanceof ResponsePayload) {
      writeJson(response, arg1.payload, arg1.code);
      return;
  } else if (arg1 && arg1 instanceof CustomResponsePayload) {
      writeJson(response, arg1.payload, arg1.code, arg1.header);
      return;
  }

  if(arg2 && Number.isInteger(arg2)) {
    code = arg2;
  }
  else {
    if(arg1 && Number.isInteger(arg1)) {
      code = arg1;
    }
  }
  if(code && arg1) {
    payload = arg1;
  }
  else if(arg1) {
    payload = arg1;
  }

  if(!code) {
    // if no response code given, we default to 200
    code = 200;
  }
  if(typeof payload === 'object') {
    payload = JSON.stringify(payload, null, 2);
    responseHeader['Content-Length'] = Buffer.byteLength(payload);
  }
  response.writeHead(code, responseHeader);
  response.end(payload);
}
