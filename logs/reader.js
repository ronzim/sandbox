var fs = require('fs-extra');
var _ = require('underscore');

var file = './logs/25_nov_18.log.json';

// var lines = fs.readFileSync(file).toString('UTF8').split('\n');
//
// var objs = lines.map(function(l){
//   try{
//     return JSON.parse(l);
//   }
//   catch (err){
//     console.log(err);
//     return l;
//   }
// });
//
// var locations = _.pluck(objs, ['context', 'location']);
//
// console.log(locations);
// console.log(objs[0])

// fs.readFile(file, function(err, data){
//   if (data){
//     var lines = data.toString('UTF8').split('\n');
//     console.log(lines);
//   }
// })

fs.createReadStream(file, function(err, data){
  console.log(err, data)
})
