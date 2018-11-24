// var debug = require('debug')('tryDebug');
var a = require('./moduleA');
var b = require('./moduleB');

var name = 'tryDebug';
// debug('booting %o', name);

var s = a.sum(1,5);
var m = b.sub(5,3);

// debug('log0 : ' + s);
// debug('log00 : ' + m);
