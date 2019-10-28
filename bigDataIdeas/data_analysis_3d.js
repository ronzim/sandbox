var fs = require('fs-extra')
var _  = require('underscore')
var stat  = require('simple-statistics')
var Plotly = require('plotly.js-dist')

console.time('read file')
var data = fs.readJSONSync('../material/position_data.json')
console.timeEnd('read file')

console.time('stat')
// console.log(_.keys(data))
console.log('Number of locations:')
console.log(_.size(data.locations)) // 972833
console.log('Location keys:')
console.log(_.keys(data.locations[0]))
  // {
  //   timestampMs: '23456789',
  //   latitudeE7: 3456789,
  //   longitudeE7: 3456789,
  //   accuracy: 12
  // }
// console.log(new Date(parseInt(data.locations[0].timestampMs)))
console.timeEnd('stat')

var tss = _.pluck(data.locations, 'timestampMs');
console.log('First date:')
console.log(new Date(parseInt(tss.slice().pop())))
console.log('Last date:')
console.log(new Date(parseInt(tss.slice().shift())))

var lats = _.pluck(data.locations, 'latitudeE7');
lats = lats.map(e => e/1e7);
var lngs = _.pluck(data.locations, 'longitudeE7');
lngs = lngs.map(e => e/1e7);

// parse int
data.locations.forEach(function(d){
  d.timestampMs = parseInt(d.timestampMs);
})

const home   = {lat: 45.715226, lng: 9.580577}
const office = {lat: 45.697726, lng: 9.677000}

// divide obj per day
console.time('groupBy')
var days = _.groupBy(data.locations, function(l){
  return new Date(l.timestampMs).toLocaleDateString();
})
console.timeEnd('groupBy')
console.log('days tot:', _.size(days))
console.log(days)

// filter for weekdays
console.time('filter')
days = _.pick(days, function(v, k){
  var date = new Date(v[0].timestampMs)
  return date.getDay()<5;
})
console.timeEnd('filter')
console.log('weekdays: ', _.size(days), _.size(days[0]))
console.log(days)

// for each day, get travel time for outbound trip:

// filter for morning
console.time('filter2')
days = _.each(days, function(d,dk){
  days[dk] = _.filter(d, function(v,k){
    var hour = new Date(v.timestampMs).getHours();
    return hour < 12;
  })
})
console.timeEnd('filter2')
console.log('suitable days: ', _.size(days), _.size(days[0]))
console.log(days)

// filter for days with at least 1 pt @home and 1 pt @office & append data
console.time('filter3')
days = _.pick(days, function(v,k){
  v.h_pts = nearPoints(home, v);
  v.o_pts = nearPoints(office, v);
  return v.h_pts.length>0 && v.o_pts.length>0;
})
console.timeEnd('filter3')

// for each day, compute diff btw last pt @home and first @office
days = _.each(days, function(v,k){
  // var travelTimeMs = v.o_pts.slice().shift().timestampMs - v.h_pts.slice().pop().timestampMs;
  // var travelMins = new Date(travelTimeMs).getMinutes();
  v.arrival = new Date(v.o_pts.slice().pop().timestampMs);
  v.departure = new Date(v.h_pts.slice().shift().timestampMs);
  v.travelTime = (v.arrival - v.departure)/1000/60;
})

// last cleaning (just values btw 0-60)
days = _.pick(days, function(v,k){
  return v.travelTime > 20 && v.travelTime < 50;
})


// PLOT IT !
// y axis : day of the year (1>365)
// x axis : departure time
// color : travel time

var trace0 = {
  // x: _.keys(days).map((v,k)=>k),
  x: _.pluck(days, 'departure').map(t => getDayOfYear(t)),
  y: _.pluck(days, 'departure').map(t => getDayTime(t)),
  z: _.pluck(days, 'travelTime'),
  name: 'travelTime',
  mode: 'markers',
  marker: {
    size: 2,
    color: _.pluck(days, 'travelTime').map(a => a*10)
  },
  type: 'scatter3d',
  text:  _.pluck(days, 'travelTime')
};

var layout = {
  xaxis: {

          },
  yaxis: {
    // range: [0, 8]
    label: 'travel time'
  },
  title:'',
  margin: {
  	l: 5,
  	r: 5,
  	b: 5,
  	t: 5
  }
};

var data = [trace0];

Plotly.newPlot('graph-container', data, layout);

var dayKeys = _.keys(days);
console.log(days)

function convertDate(inputFormat) {
  var d = new Date(inputFormat);
  return [d.getDate(), d.getMonth()+1].join('/');
}

function getDayTime(ts){
  var date = new Date(ts);
  var dateStr = date.toLocaleDateString();
  var dayTime = new Date(date - new Date(dateStr));
  return dayTime.getTime()/1000/60/60; //hours
}

function getDayOfYear(ts){
  var date = new Date(ts);
  var startYear = new Date(date.getFullYear(), 0, 0);
  var diff = (date - startYear) + ((startYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  return day;
}

function nearPoints(target, collection){
  var count = 0;
  var sel_pts = [];
  var lats = _.pluck(collection, 'latitudeE7');
  lats = lats.map(e => e/1e7);
  var lngs = _.pluck(collection, 'longitudeE7');
  lngs = lngs.map(e => e/1e7);

  for (var i=0; i<tss.length; i++){
    var dist2 = Math.pow(target.lat - lats[i],2)
                    + Math.pow(target.lng - lngs[i],2);
    if (dist2<0.00001){
      // console.log(new Date(collection[i].timestampMs).toLocaleString())
      sel_pts.push(collection[i]);
    }
  }
  return sel_pts;
}
