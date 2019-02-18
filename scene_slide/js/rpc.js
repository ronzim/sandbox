var net      = require('net');
var _        = require('underscore');
var path     = require( 'path' );

var client;
var queue;
var msgQueue       = [];
var offset         = 0;
var header_len     = 12;
var json_len       = 0;
var paddedJson_len = 0;
var received;

/*  ================================================================  */
/*  Remote Procedure Call module                                      */
/*  ================================================================  */


// ================================================
// Push a msg request in the msgQueue =============
// ================================================

function send(obj, callback) {
  msgQueue.push({ obj:obj, callback:callback });
  if (msgQueue.length == 1) {
    sendMsg(obj, callback);
  }
}

// ======================================================================================
// Send a msg to the external process, wait for answer and launch the callback ==========
// ======================================================================================

function sendMsg(obj, callback) {
  queue    = [];
  client   = new net.Socket();
  var url  = '127.0.0.1';
  var port = 5525;
  if ( !port ) { port = 5525; }
  client.connect(port, url, function(err) {
    if (err) {
      console.err(err);
      clean();
      close();
    }
    else {
      offset = 0;
      queue.push(callback);
      client.write(JSON.stringify(obj));
    }
  });

  client.on('data', function(buf) {
    if (offset === 0) {
      var size        = buf.readUInt32LE(0);
      json_len        = buf.readUInt32LE(4);
      padded_json_len = buf.readUInt32LE(8);
      received        = new Uint8Array(size);
    }
    var bufArray = new Uint8Array(buf);
    for (var i=0; i<bufArray.length; i++) {
      received[i + offset] = bufArray[i];
    }
    offset += buf.length;
  });

  client.on('end', function() {
    if (!received) {
      return;
    }
    var callback = queue.shift();
    if (callback === undefined) {
      console.error( "Undefined callback" );
      return;
    }
    var data = received;
    var obj  = {};
    try {
      if (json_len > 0) {
        var json = String.fromCharCode.apply(null, data.subarray(header_len, header_len + json_len));
        obj = JSON.parse(json);
        var arrays = _.mapObject(obj.arrays, function(v) {
          var ArrayConstructor = null;
          var len = v.length;
          switch (v.type) {
            case "char"           : ArrayConstructor = window.Uint8Array;   break;
            case "short"          : ArrayConstructor = window.Int16Array;   len /= 2; break;
            case "unsigned short" : ArrayConstructor = window.Uint16Array;  len /= 2; break;
            case "int"            : ArrayConstructor = window.Int32Array;   len /= 4; break;
            case "unsigned int"   : ArrayConstructor = window.Uint32Array;  len /= 4; break;
            case "long"           : ArrayConstructor = window.Int32Array;   len /= 4; break;
            case "unsigned long"  : ArrayConstructor = window.Uint32Array;  len /= 4; break;
            case "float"          : ArrayConstructor = window.Float32Array; len /= 4; break;
            case "double"         : ArrayConstructor = window.Float64Array; len /= 8; break;
            case "idtype"         : ArrayConstructor = window.Int64Array;   len /= 8; break;
            default               : return null;
          }
          return new ArrayConstructor(data.buffer, padded_json_len + v.offset, len);
        });
        obj.arrays = arrays;
      }
    } catch( err ) {
      // clean();
      // closeAll();
      console.log( err );
    }

    close();
    callback(obj);
    msgQueue.shift();
    if (msgQueue.length > 0) {
      sendMsg(msgQueue[0].obj, msgQueue[0].callback);
    }
  });
}

// ================================
// Close the tcp client  ==========
// ================================

function close() {
  received = undefined;
  if (client) {
    client.destroy();
  }
}

// ================================
// Close the tcp client  ==========
// ================================

function closeAll() {
  received = undefined;
  if (client) {
    client.destroy();
  }
  app.restartVMTK();
}

// ================================
// Clean the msgQueue  ============
// ================================
function clean() {
  msgQueue = [];
}

/*  ================================================================  */
/*  Exports functions                                                 */
/*  ================================================================  */
exports.send  = send;
exports.close = close;
exports.clean = clean;
