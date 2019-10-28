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
  console.log(v.h_pts.length, v.o_pts.length)
  return v.h_pts.length>0 && v.o_pts.length>0;
})
console.timeEnd('filter3')
console.log(days)

// for each day, compute diff btw last pt @home and first @office
days = _.each(days, function(v,k){
  // var travelTimeMs = v.o_pts.slice().shift().timestampMs - v.h_pts.slice().pop().timestampMs;
  // var travelMins = new Date(travelTimeMs).getMinutes();
  v.arrival = new Date(v.o_pts.slice().pop().timestampMs);
  v.departure = new Date(v.h_pts.slice().shift().timestampMs);
  v.travelTime = (v.arrival - v.departure)/1000/60;
})

// last cleaning (just values btw 0-60)
// days = _.pick(days, function(v,k){
//   return v.travelTime > 20 && v.travelTime < 50;
// })

console.log(days)
var dayKeys = _.keys(days);

var trace = {
  type:'scattermapbox',
  lat:_.pluck(days[dayKeys[11]].o_pts, 'latitudeE7').map(a => a/1e7),
  lon:_.pluck(days[dayKeys[11]].o_pts, 'longitudeE7').map(a => a/1e7),
  mode:'markers',
  marker: {
    size:4
  },
  text:[]
}

var trace1 = {
  type:'scattermapbox',
  lat:_.pluck(days[dayKeys[11]].h_pts, 'latitudeE7').map(a => a/1e7),
  lon:_.pluck(days[dayKeys[11]].h_pts, 'longitudeE7').map(a => a/1e7),
  mode:'markers',
  marker: {
    size:4
  },
  text:[]
}

var data = [trace, trace1]

var layout = {
  autosize: true,
  hovermode:'closest',
  mapbox: {
    bearing:0,
    center: {
      lat:mean(_.pluck(days[dayKeys[10]].o_pts, 'latitudeE7').map(a => a/1e7)),
      lon:mean(_.pluck(days[dayKeys[10]].o_pts, 'longitudeE7').map(a => a/1e7))
    },
    pitch:0,
    zoom:15
  },
}

Plotly.setPlotConfig({
  mapboxAccessToken: 'pk.eyJ1Ijoicm9uemltIiwiYSI6ImNqdDdtOWIzZDBmODA0OWp6bThxbGZhYXgifQ.t4KKKWA-zOe6OLzFhuT0bw'
})

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

  for (var i=0; i<_.size(collection); i++){
    var dist2 = Math.pow(target.lat - lats[i],2)
                    + Math.pow(target.lng - lngs[i],2);
    if (dist2<0.00001){
      // console.log(new Date(collection[i].timestampMs).toLocaleString())
      sel_pts.push(collection[i]);
    }
  }
  return sel_pts;
}

function mean(array){
  var sum = _.reduce(array, (a,b) => a+b);
  return sum/array.length;
}
