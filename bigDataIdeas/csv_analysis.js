const Papa = require('papaparse')
const fs = require('fs-extra')
const _ = require('underscore')
var Plotly = require('plotly.js-dist')
// const THREE = require('./three.js')
const threeGraph = require('./threeGraph')


const file = fs.createReadStream('../material/heart.csv');
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

      loadGraph(results);
    }
});

function loadGraph(results){
  // console.log('here')
  // console.log(result)
  console.log(_.keys(results.data[0])[0])
  var ages = _.pluck(results.data, _.keys(results.data[0])[0]);
  var mhrs = _.pluck(results.data, "thalach");
  var bps  = _.pluck(results.data, "trestbps");
  // console.log(ages, mhr)

  var trace = {
    x: ages,
    y: mhrs,
    z: bps,
    name: '',
    mode: 'markers',
    marker: {
      size: 2,
      color: _.pluck(results.data, "sex")
    },
    // type: 'scatter3d',
    type: 'scatter',
    // text:  _.pluck(days, 'travelTime')
  };

  var layout = {
    xaxis: {},
    yaxis: {
      // label: 'travel time'
    },
    title:''
  };

  var data = [trace];

  Plotly.newPlot('graph-container', data, layout, {responsive: true});

  // console.log(threeGraph)
  threeGraph.newGraph('three-container', data);

}
