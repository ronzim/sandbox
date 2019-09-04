
var Plotly = require('plotly.js-dist')
var _ = require('underscore');
var ReadJSONStream = require('read-json-stream').default;

ReadJSONStream('pos.json')
  .progress(function(p) {
    if (p){
      // console.log(p + '% done so far!');
      drawBar(p/100);
    }
  })
  .done(function(err, data) {
    if(err) {
      // handle error
    } else {
      // do something with the freshly-parsed data!
      parseData(data);
    }
  });

function drawBar(current_progress){
  const bar_length = process.stdout.columns - 30;

  var filled_bar_length = (current_progress * bar_length).toFixed(0);
  var empty_bar_length = bar_length - filled_bar_length;

  var filled_bar = get_bar(filled_bar_length, "=");
  var empty_bar = get_bar(empty_bar_length, " ");
  var percentage_progress = (current_progress * 100).toFixed(2);

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(
    `Current progress: [${filled_bar}${empty_bar}] | ${percentage_progress}%`
  );
  // console.log('\n');
}


function get_bar(length, char, color) {
		let str = "";
		for (let i = 0; i < length; i++) {
			str += char;
		}
		return str;
	}

// Plotly.d3.csv('https://raw.githubusercontent.com/plotly/datasets/c34aaa0b1b3cddad335173cb7bc0181897201ee6/2011_february_aa_flight_paths.csv', function(err, rows){
//     function unpack(rows, key) {
//         return rows.map(function(row) { return row[key]; });}
//
//     function getMaxOfArray(numArray) {
//         return Math.max.apply(null, numArray);
//     }

    // var data = [];
    // var count = unpack(rows, 'cnt');
    // var startLongitude = unpack(rows, 'start_lon');
    // var endLongitude = unpack(rows, 'end_lon');
    // var startLat = unpack(rows, 'start_lat');
    // var endLat = unpack(rows, 'end_lat');
    //
    // for ( var i = 0 ; i < count.length; i++ ) {
    //     var opacityValue = count[i]/getMaxOfArray(count);
    //
    //     var result = {
    //         type: 'scattermapbox',
    //         lon: [ startLongitude[i] , endLongitude[i] ],
    //         lat: [ startLat[i] , endLat[i] ],
    //         mode: 'lines',
    //         line: {
    //             width: 1,
    //             color: 'red'
    //         },
    //         opacity: opacityValue
    //     };
    //
    //     data.push(result);
    // };

const startDate = '2019-08-01';
const endDate = '2019-08-30';

var startMS = Date.parse('2019-08-01');
var endMS   = Date.parse('2019-08-30');

console.log(startMS, endMS);

function parseData(raw_data){
  console.log(raw_data.locations[0]);
  var subset = _.filter(raw_data.locations, e => (e.timestampMs>startMS && e.timestampMs<endMS) );
  var lats = _.pluck(subset, 'latitudeE7').map(e => e/1e7);
  var lngs = _.pluck(subset, 'longitudeE7').map(e => e/1e7);
  var ts   = _.pluck(subset, 'timestampMs').map(e => (e - subset[0].timestampMs)/(subset[subset.length-1].timestampMs - subset[0].timestampMs));
  console.log(lats.map( function(e,n){
    if (lats[n-1]){
      return distance(lats[n], lngs[n], lats[n-1], lngs[n-1]);
    }
    else {
      return null;
    }
  }))

  loadGraph(lats, lngs, ts);
}

function distance(lat1, lon1, lat2, lon2){
  console.log(lat1, lon1, lat2, lon2)
  var R = 6371e3; // metres
  var a = deg2rad(lat1);
  var b = deg2rad(lat2);
  var c = deg2rad(lat2-lat1);
  var d = deg2rad(lon2-lon1);

  var s = Math.sin(c/2) * Math.sin(c/2) +
          Math.cos(s) * Math.cos(b) *
          Math.sin(d/2) * Math.sin(d/2);
  var t = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));

  var dist = R * t;

  return dist;
}

function deg2rad(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}


const scl = [
  [0,     'rgb(150,0,90)'    ],
  [0.125, 'rgb(0, 0, 200)'   ],
  [0.25,  'rgb(0, 25, 255)'  ],
  [0.375, 'rgb(0, 152, 255)' ],
  [0.5,   'rgb(44, 255, 150)'],
  [0.625, 'rgb(151, 255, 0)' ],
  [0.75,  'rgb(255, 234, 0)' ],
  [0.875, 'rgb(255, 111, 0)' ],
  [1,     'rgb(255, 0, 0)'   ]
];

function loadGraph(lats, lngs, ts){
      var data = [{
      type:'scattermapbox',
      lat:lats,
      lon:lngs,
      mode:'markers',
      // mode:'lines',
      // marker: {
      //     color: unpack(rows, 'Globvalue'),
      //     colorscale: scl,
      //     cmin: 0,
      //     cmax: 1.4,
      //     reversescale: true,
      //     opacity: 0.5,
      //     size: 3,
      //     colorbar:{
      //       thickness: 10,
      //       titleside: 'right',
      //       outlinecolor: 'rgba(68,68,68,0)',
      //       ticks: 'outside',
      //       ticklen: 3,
      //       shoticksuffix: 'last',
      //       ticksuffix: 'inches',
      //       dtick: 0.1
      //     }
      marker: {
        color: ts,
        colorscale: scl,
        opacity: 0.5,
        size:3
      },
      text:['Montreal']
    }]

    layout = {
      dragmode: 'zoom',
      mapbox: {
        center: {
          lat: 53,
          lon: 10
        },
        domain: {
          x: [0, 1],
          y: [0, 1]
        },
        style: 'dark',
        zoom: 5
      },
      margin: {
        r: 0,
        t: 0,
        b: 0,
        l: 0,
        pad: 0
      },
      paper_bgcolor: '#191A1A',
      plot_bgcolor: '#191A1A',
      showlegend: false
   };

  Plotly.setPlotConfig({
    mapboxAccessToken: 'pk.eyJ1Ijoicm9uemltIiwiYSI6ImNqdDdtOWIzZDBmODA0OWp6bThxbGZhYXgifQ.t4KKKWA-zOe6OLzFhuT0bw'
  })

  Plotly.plot('container', data, layout, {showLink: false, responsive:true});

}
