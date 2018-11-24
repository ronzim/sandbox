console.log = require('debug')('module')

function work() {
  console.log('console.log log');
  setTimeout(work, Math.random() * 1000);
}

exports.work = work;
