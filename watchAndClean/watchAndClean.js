const fs   = require('fs-extra')
const path = require('path')

const target = '/home/mattia/Desktop/target/'
const maxDimension   = 500000;
const checkFrequency = 60*1000;

setInterval(check, checkFrequency);

// check folder dimensions: clear if too large
function check(what, file){
  // console.log(what, file)
  fs.stat(target, function(err, stats){
    // console.log(err, stats.size);
    if (stats.size > maxDimension){
      // console.log('=============================> clean');
      clearDir(target);
    }
  });
}

// remove all file in dir
function clearDir(dir){
  fs.readdir(dir, (err, files) => {
    // if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(dir, file), err => {
        // if (err) throw err;
      });
    }
  });
}

// fill folder to test
// var str = '';
// for (var i=0; i< 100000; i++){
//   str += 'A';
// }
// setInterval(writeFile, 50);
// function writeFile(){
//   console.log('write');
//   fs.writeJSON('/home/mattia/Desktop/target/' + Date.now().toString() + '.txt', str);
// }
