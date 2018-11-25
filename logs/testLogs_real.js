// this is supposed to be the log formatter module

var moment = require('moment'),
    path   = require('path');

var scribe = require('scribe-js')({
    createDefaultConsole : false
});

function initLogger(source){

  var logger = new scribe.LogWriter(source);

  //Create own getPath and getFilename methods to erase to default ones

  logger.getPath = function (opt) {
      return '';
  };

  logger.getFilename = function (opt) {
      var now = moment();
      return (now.format('DD_MMM_YY')).toLowerCase() +
          '.' +
          opt.logger.name +
          '.json';
  };

  var console = scribe.console({
      console : {
          colors : 'white',
          alwaysTime : true,
          // alwaysDate : true,
          alwaysLocation : true,
          // defaultTags : []
      },
      // logWriter : {
      //     rootPath : 'testLogs'
      // }
  }, logger);

  process.console = console;

  console.log('CONSOLE INITIALIZATION DONE');
  // return logger;
}

exports.initLogger = initLogger;
