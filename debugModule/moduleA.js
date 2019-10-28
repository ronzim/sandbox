console.log = require('debug')('module:a')

function sum(a,b) {
  console.log('a+b', a+b);
  setTimeout(sum, Math.random() * 1000, Math.random() * 1000, Math.random() * 1000);
}

exports.sum = sum;
