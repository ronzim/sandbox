var moment = require('moment'),
    path   = require('path');

var scribe = require('scribe-js')({
    createDefaultConsole : false
});

var testLogWriter = new scribe.LogWriter('ciccio');

//Create own getPath and getFilename methods to erase to default ones

testLogWriter.getPath = function (opt) {

    return path.join(
        // this.getUser(),
        'cartella1',
        // opt.logger.name
        'cartella2'
    );

};

testLogWriter.getFilename = function (opt) {

    var now = moment();

    return (now.format('DD_MMM_YY')).toLowerCase() +
        '.' +
        opt.logger.name +
        '.json';

};

var name = 'aaa';

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

// With log(...)
console.log("Hello World!");

// Now with other pipes
console.info("Hello World!");
console.error("Hello World!");
console.warning("Hello World!");

// Now with an Object
console.log({
    hello : "world"
});

//Now with context
console.tag("Demo").time().file().log("Hello world");

var es = require('./otherFile.js');
var n = 0;
setInterval(function(){
  console.log('counter', n++);
}, 1000);
