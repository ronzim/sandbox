console.log = require('debug')('main')

console.log('main')

require('./moduleA').sum(1,2);

require('./moduleB').sub(1,2);
