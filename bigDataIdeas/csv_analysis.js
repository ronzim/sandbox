const Papa = require('papaparse')
const fs = require('fs-extra')
const _ = require('underscore')


const file = fs.createReadStream('./heart.csv');
Papa.parse(file, {
    header: true,
    // worker: true, // Don't bog down the main thread if its a big file
    // step: function(result) {
    //     // do stuff with result
    // },
    complete: function(results, file) {
      console.log(_.size(results), _.size(results.data))
      console.log(_.keys(results))
      console.log(results.meta.fields)
    }
});
