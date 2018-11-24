// this is supposed to be the log formatter module

var moment = require('moment'),
    path   = require('path');

var scribe = require('scribe-js')({
    createDefaultConsole : false
});

function initLogger(source){

  var logger = new scribe.LogWriter(source);

  //Create own getPath and getFilename methods to erase to default ones

  testLogWriter.getPath = function (opt) {
      return '';
  };

  testLogWriter.getFilename = function (opt) {
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
          defaultTags : ['ccc', name]
      },
      // logWriter : {
      //     rootPath : 'testLogs'
      // }
  }, testLogWriter);

  process.console = console;

  // return logger;
}
