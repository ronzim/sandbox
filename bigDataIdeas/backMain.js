'use strict'

const Papa = require('papaparse')
const fs   = require('fs-extra')
// const _    = require('underscore')
const _    = require('lodash')
const Dataset = require('./dataset.js').Dataset

const file = fs.createReadStream('../material/heart.csv');
Papa.parse(file, {
    header: true,
    complete: function(results, file) {
      console.log(_.size(results), _.size(results.data))
      console.log(_.keys(results))
      console.log(results.meta.fields)

      init(results.data);

    }
});

function init(rawData){
  console.log('init');
  var ds = new Dataset(rawData)
  // ds.addFilter('fake', [null]);
  // ds.addFilter('keyValue', ['sex', '1']);
  // ds.addFilter('keyTreshold', ['thalach', 120, '>']);
  // ds.filter();
  console.log('filters', ds.filtersFuns);
}
