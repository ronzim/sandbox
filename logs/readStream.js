// read stream
var _ = require('underscore')
var jsonlines = require('jsonlines')
var fs = require('fs-extra')

var allData = [];
var line = 0;

// init default
window.onload = function(){
  document.getElementById("calendar").value = new Date().toISOString().slice(0,10);
  prepareFilters();
}

var filters = {
  sel1 : {
    name : 'hourStart',
    value : null
  },
  sel2 : {
    name : 'hourEnd',
    value : null
  },
  sel3 : {
    name : 'tag',
    value : null
  },
  sel4 : {
    name : 'module',
    value : null
  }
};

function loadFile(fileName, callback){
  // parser setup
  var parser = jsonlines.parse();
  parser.on('data', function (data) {
    line++;
    if (line % 10000 == 0){
      console.log('Got line', line);
      document.getElementById("loadingbar").innerHTML += ">";
    }
    allData.push(data);
  });

  parser.on('end', function () {
    console.timeEnd('parsing');
    document.getElementById("loadingbar").innerHTML += "  DONE!  ";
    // console.log(allData);
    // fs.writeJSON('./output.json', allData);
    callback();
  });

  // check lof file exist
  var exist = fs.existsSync(fileName);

  if (exist){
    // read data
    console.time('parsing');
    var readStream = fs.createReadStream(fileName);

    // readStream.pipe(process.stdout);
    readStream.on('data', function(data){
      // console.log(data.toString('UTF-8'));
      try{
        parser.write(data.toString('UTF-8'));
      }
      catch(err){
        console.log(err)
      }
    });
    readStream.on('end', function(){
      parser.end();
    });
  }
  else{
    document.getElementById("loadingbar").innerHTML = " LOG NOT FOUND ";
  }

}

function apply(){
  // reset data TODO check if new file
  allData = [];
  line = 0;

  // reset loader bar
  document.getElementById("loadingbar").innerHTML = "";

  // get inputs
  var mac = document.getElementById("mac").checked ? 'carico' : 'scarico';
  console.log('mac', mac);

  var date = document.getElementById("calendar").value;
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var day = new Date(date).getDate().toString().length == 2 ? new Date(date).getDate().toString() : '0' + new Date(date).getDate().toString();
  var month = months[new Date(date).getMonth()];
  var year = new Date(date).getYear().toString().slice(1);

  var fileName = day + '_' + month + '_' + year + '.log' + '.json';
  var cwd = process.cwd();
  var path = cwd + "/logs_" + mac + "/" + fileName;
  console.log(process.cwd())
  console.log(path);
  loadFile(path, function(){
    if (mac == 'carico'){
      prepareGraph(new Date(date));
    }
    else{
      prepareGraph_(new Date(date));
    }
  });

};

function creatOpt(sel, opt){
  var o = document.createElement("option");
  o.text = opt;
  sel.add(o);
}

function prepareFilters(cb){
  var tags = ['general', 'urSx', 'urDx'];
  var modules = ['superMain', 'main', 'flowControl_urSx', 'flowControl_urDx', 'flowControl_ur10B'];
  var hours = new Array(24).fill(0).map((n,k) => k);
  var mins = new Array(60).fill(0).map((n,k) => k);

  filters.sel1 = document.getElementById("sel1");
  hours.forEach(function(t){
    creatOpt(filters.sel1, t);
  });

  filters.sel2 = document.getElementById("sel2");
  mins.forEach(function(m){
    creatOpt(filters.sel2, m);
  });

  filters.sel3 = document.getElementById("sel3");
  hours.forEach(function(m){
    creatOpt(filters.sel3, m);
  });

  filters.sel4 = document.getElementById("sel4");
  mins.forEach(function(m){
    creatOpt(filters.sel4, m);
  });

  filters.sel1.value = 0;
  filters.sel2.value = 0;
  filters.sel3.value = 23;
  filters.sel4.value = 59;

}

function extract(){
  console.log('extraction ------------------------------------- ');

  console.log('STARTING : ', new Date(allData[0].context.time));
  console.log('ENDING : ', new Date(allData[allData.length-1].context.time));
  console.log('ex', allData[0])

  // FILTER CHAIN
  // var hasHour = (filters.sel3.value || filters.sel4.value) == null ? allData : _.filter(allData, ((d => (d.context.time > dateStart && d.context.time < dateEnd));
  var hasHour = _.filter(allData, (d => (d.context.time > dateStart && d.context.time < dateEnd)));
  var hasTag = filters.sel1.value === null ? hasHour : _.filter(hasHour, d => d.context.tags[0] == filters.sel1.value);
  var hasModule = filters.sel2.value === null ? hasTag : _.filter(hasTag, d => (d.context));
  // TODO remove this
  hasModule = _.filter(hasModule, d => (!d.args[0].includes('lineStatus') && !d.args[0].includes('resetNeeded')));
  console.log('-----------------------', hasHour.length, hasTag.length, hasModule.length)

  var logsLines = _.pluck(hasModule, 'message');
  var logsTs = _.pluck(hasModule, ['context', 'time']);
  // console.log('----')
  console.log(hasModule);
  // console.log('----')
  display(logsLines);

  analyze(logsLines);

}

function prepareGraph(baseDate){

  // filter based on time
  var dateStart = new Date(baseDate)
  dateStart.setHours(filters.sel1.value);
  dateStart.setMinutes(filters.sel2.value);
  var dateEnd = new Date(baseDate)
  dateEnd.setHours(filters.sel3.value);
  dateEnd.setMinutes(filters.sel4.value);
  var intervalData = _.filter(allData, d => (d.context.time > dateStart && d.context.time < dateEnd))
  console.log('EXTRACTING FROM', dateStart, 'TO', dateEnd);
  console.log(allData.length, '>>>', intervalData.length);

  // get pcs number
  var data_pcs = _.filter(intervalData, function(d){
    if (d.args.length<2) {
      return false;
    }
    else if (_.isString(d.args[2]) && d.args[2].includes("placePiece")) {
      return true;
    }
    else {
      return false;
    }
  });

  var data_dx = _.filter(data_pcs, d => d.context.location.filename == 'flowControl_urDx.js');
  var data_sx = _.filter(data_pcs, d => d.context.location.filename == 'flowControl_urSx.js');

  // get stops
  var data_stops = _.filter(intervalData, (d => (d.message.includes("stopRequest"))));

  // get killings
  var data_kill = _.filter(intervalData, (d => (d.message.includes("supermain"))));

  // get safetyStatus changes
  var data_ss = _.filter(intervalData, (d => (d.message.includes('safety status changed'))));
  var data_sick     = _.filter(data_ss, (d => (d.args[3] == 5)));
  var data_disable  = _.filter(data_ss, (d => (d.args[3] == 3)));
  var data_restored = _.filter(data_ss, (d => (d.args[3] == 1)));

  var data_end_of_bin = _.filter(intervalData, (d => (d.message.includes('endOfBin observer 0 >> 1'))));

  // var ex_serie = {
  //   data : data,
  //   name : 'name',
  //   index : true/false,
  //   ts : refer_data_ts
  // }

  var serie_dx = {
    data: data_dx,
    name: 'urDx',
    index: true,
    ts: null
  }

  var serie_sx = {
    data: data_sx,
    name: 'urSx',
    index: true,
    ts: null
  }

  var serie_stops = {
    data: data_stops,
    name: 'stops',
    index: false,
    ts: data_sx
  }

  var serie_kill = {
    data: data_kill,
    name: 'kill',
    index: false,
    ts: data_sx
  }

  var serie_sick = {
    data: data_sick,
    name: 'sick',
    index: false,
    ts: data_sx
  }

  var serie_disable = {
    data: data_disable,
    name: 'disable',
    index: false,
    ts: data_sx
  }

  var serie_restored = {
    data: data_restored,
    name: 'restored',
    index: false,
    ts: data_sx
  }

  var serie_end_of_bin = {
    data: data_end_of_bin,
    name: 'endOfBin',
    index: false,
    ts: data_sx
  }

  graph([
    serie_dx,
    serie_sx,
    serie_stops,
    serie_kill,
    serie_sick,
    serie_disable,
    serie_restored,
    serie_end_of_bin
  ]);

  getWorkingStats(_.pluck(data_pcs, ['context', 'time']).map(a => new Date(a)));
}

// NOT CURRENTLY USED -----------------
function prepareGraph_(baseDate){
  // filter based on time
  var dateStart = new Date(baseDate)
  dateStart.setHours(filters.sel1.value);
  dateStart.setMinutes(filters.sel2.value);
  var dateEnd = new Date(baseDate)
  dateEnd.setHours(filters.sel3.value);
  dateEnd.setMinutes(filters.sel4.value);
  var intervalData = _.filter(allData, d => (d.context.time > dateStart && d.context.time < dateEnd))
  console.log('EXTRACTING FROM', dateStart, 'TO', dateEnd);
  console.log(allData.length, '>>>', intervalData.length);

  console.log(intervalData);

  // get pcs number
  var data_cycles = _.filter(intervalData, (d) => d.message.includes("openClamp"));
  console.log(data_cycles.length);

  // get safetyStatus changes
  var data_ss = _.filter(intervalData, (d => (d.message.includes('safety status changed'))));
  var data_sick     = _.filter(data_ss, (d => (d.args[3] == 5)));
  var data_disable  = _.filter(data_ss, (d => (d.args[3] == 3)));
  var data_restored = _.filter(data_ss, (d => (d.args[3] == 1)));
  console.log(data_ss)

  // get general
  var data_general = _.filter(intervalData, (d => (d.context.tags && d.context.tags[0] == 'general')));
  console.log(data_general.length);

  // get programs
  var data_programs = _.filter(intervalData, (d => (d.context.tags && d.context.tags[0] == 'programs')));
  console.log(data_programs.length);

  var serie_cycles = {
    data: data_cycles,
    name: 'cycles',
    index: true,
    ts: null
  }

  graph([
    serie_cycles
  ])
}

function getNearestTSindex(tsArray, val){
  return _.findIndex(tsArray, (t,k) => val>t && val<tsArray[k+1]);
}

function graph(series){
  var traces = [];

  _.each(series, function(s){
    console.log(s.name, s.data.length);
    var ts  = _.pluck(s.data, ['context', 'time']).map(a => new Date(a));

    if (s.index){
      var nop = _.map(s.data, (d,n) => n);
    }
    else{
      var ts_data = _.pluck(s.ts, ['context', 'time']).map(a => new Date(a));
      var nop = _.map(ts, (t) => getNearestTSindex(ts_data, t));
    }

    var trace = {
      x: ts,
      y: nop,
      mode: 'markers',
      type: 'scatter',
      error_y: s.index ? null : {
        type: 'constant',
        value: 200,
        symmetric: true,
        width: 3
      },
      name: s.name,
      marker: {size: 3}
    };

    // error_y: {
    //   type: 'constant',
    //   value: 0.1,
    //   color: '#85144B',
    //   thickness: 1.5,
    //   width: 3,
    //   opacity: 1
    // },

    // type: 'data',
    // symmetric: false,
    // array: [0.1, 0.2, 0.1, 0.1],
    // arrayminus: [0.2, 0.4, 1, 0.2]

    traces.push(trace);
  })

  var layout = {
    title: document.getElementById('mac').checked ? "Carico" : "Scarico",
    xaxis: {
      title: 'Timestamp',
      // titlefont: {
      //   family: 'Courier New, monospace',
      //   size: 18,
      //   color: '#7f7f7f'
      // }
    },
    yaxis: {
      title: document.getElementById('mac').checked ? "Pieces" : "Cycles",
      // titlefont: {
      //   family: 'Courier New, monospace',
      //   size: 18,
      //   color: '#7f7f7f'
      // }
    }
  };

  Plotly.newPlot('graph', traces, layout);

}

function display(x){
  var div = document.getElementById("text");
  _.each(x, function(i){
    var line = i.toString() + '<br>';
    div.innerHTML += line;
  })

  div.innerHTML += '-------------------- END ---------------------';
  div.innerHTML += '<br>';

}

function analyze(lines){

  var keywords = [
    'supermain', // killing
    'cobotRepositioning', // reset
    'startRequest', // startButton (UI)
    'endOfBin observer 0 >> 1',
    'stopRequest'
  ]

  for (k in keywords){
    var c = _.filter(lines, l => l.includes(keywords[k]));
    console.log(keywords[k], ' : ', c.length);
  }
}

function getWorkingStats(ts){
  console.log('total number of pieces', ts.length);

  var diff = _.map(ts, function(t,k){
    if (k==0) return

    return t - ts[k-1];
  })

  var over30 = _.filter(diff, d => d>30000 && d<120000)
  var over120 = _.filter(diff, d => d>120000)

  console.log('stops > 30 sec: ', _.map(over30, o => o / 1000 ).length, _.map(over30, o => o / 1000 ), ' [s]');
  console.log('stops > 2 min: ', _.map(over120, o => o / 1000 / 60).length, _.map(over120, o => o / 1000 / 60), ' [m]');

  var totStop1 = _.reduce(over30, (a,b) => a+b);
  var totStop2 = _.reduce(over120, (a,b) => a+b);
  var totWorkable = ts[ts.length-1] - ts[0];
  console.log('efficiency:', (totWorkable - (totStop1 + totStop2)) / totWorkable );
}

exports.extract = extract;
exports.apply = apply;
