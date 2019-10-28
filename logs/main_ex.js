// this can be the program main
var logger = require('./testLogs_real');
logger.initLogger();

var submodule = require('./submodule');

process.console.tag('main').log('a log in main');
// console.log(process.mainModule.children[0].id)
