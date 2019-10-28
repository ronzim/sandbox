console.log = require('debug')('module:b');

function sub(a,b){
  console.log('sub', a-b)
  return a-b;
}

exports.sub = sub;
