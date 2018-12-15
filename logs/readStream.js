// read stream
var _ = require('underscore')
var jsonlines = require('jsonlines')
var fs = require('fs-extra')

var allData = [];
var line = 0;

// filters
// hour (start)
// hour (end)
// tag
// module

var file = "./logs/13_dec_18.log.json";
var baseDate = file.split("/")[2].split(".")[0].replace(/_/g, "-");
var dateStart = new Date(baseDate).setHours(8);
var dateEnd = new Date(baseDate).setHours(10);

var filters = {
  sel1 : {
    name : 'tag',
    value : null
  },
  sel2 : {
    name : 'module',
    value : null
  },
  sel3 : {
    name : 'hourStart',
    value : null
  },
  sel4 : {
    name : 'hourEnd',
    value : null
  }
};

// parser setup
var parser = jsonlines.parse();
parser.on('data', function (data) {
  line++;
  if (line % 1000 == 0){
    console.log('Got line', line);
  }
  allData.push(data);
});

parser.on('end', function () {
  console.timeEnd('parsing');
  // console.log(allData);
  // fs.writeJSON('./output.json', allData);
  prepareFilters(extract);
  prepareGraph();
});

window.onload = function(){

  // READ DATA
  console.time('parsing');
  var readStream = fs.createReadStream(file);
  // var readStream = fs.createReadStream('/Users/orobix/Desktop/oven/logs/13_dec_18.log.json');

  // readStream.pipe(process.stdout);
  readStream.on('data', function(data){
    // console.log(data.toString('UTF-8'));
    parser.write(data.toString('UTF-8'));
  });
  readStream.on('end', function(){
    parser.end();
  });

};

function creatOpt(sel, opt){
  var o = document.createElement("option");
  o.text = opt;
  sel.add(o);
}

function prepareFilters(cb){

  // var comboDiv = document.getElementById("combos");
  // var select = document.createElement("select");
  // comboDiv.add(select);

  var tags = ['general', 'urSx', 'urDx'];
  var modules = ['superMain', 'main', 'flowControl_urSx', 'flowControl_urDx', 'flowControl_ur10B'];

  filters.sel1 = document.getElementById("sel1");
  tags.forEach(function(t){
    creatOpt(filters.sel1, t);
  });
  filters.sel1.onchange = extract;

  filters.sel2 = document.getElementById("sel2");
  modules.forEach(function(m){
    creatOpt(filters.sel2, m);
  });

  // TODO
  var sel3 = document.getElementById("sel3");
  sel3.onclick = function(){console.log(sel3.value);};
  var option = document.createElement("option");
  option.text = "reboot";
  sel3.add(option);

  if(cb){
    cb();
  }
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
  console.log('-----------------------')

  var logsLines = _.pluck(hasModule, 'message');
  var logsTs = _.pluck(hasModule, ['context', 'time']);
  // console.log('----')
  console.log(hasModule);
  // console.log('----')
  display(logsLines);

  analyze(logsLines);

}

function prepareGraph(){
  var data = _.filter(allData, function(d){
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
  var data_dx = _.filter(data, d => d.context.location.filename == 'flowControl_urDx.js');
  var data_sx = _.filter(data, d => d.context.location.filename == 'flowControl_urSx.js');
  var ts_dx = _.pluck(data_dx, ['context', 'time']).map(a => new Date(a));
  var ts_sx = _.pluck(data_sx, ['context', 'time']).map(a => new Date(a));
  var nop_dx = _.map(data_dx, (d,n) => n);
  var nop_sx = _.map(data_sx, (d,n) => n);
  graph(ts_dx, nop_dx, ts_sx, nop_sx);
}

function graph(x1, y1, x2, y2){

  var traceSx = {
    x: x1,
    y: y1,
    mode: 'markers',
    type: 'scatter',
    marker: {size: 1}
  };

  var traceDx = {
    x: x2,
    y: y2,
    mode: 'markers',
    type: 'scatter',
    marker: {size: 1}
  };

  var data = [traceDx, traceSx];

  Plotly.newPlot('graph', data);
}

function display(x){
  var div = document.getElementById("text");
  // _.each(x, function(i, j){
  //   var line = i.toString() + ', ' + y[j].toString() + '<br>';
  //   div.innerHTML += line;
  // })
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
    'endOfBin observer 0 >> 1'
  ]

  for (k in keywords){
    var c = _.filter(lines, l => l.includes(keywords[k]));
    console.log(keywords[k], ' : ', c.length);
  }
}

exports.extract = extract;
