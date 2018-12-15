// read stream
var _ = require('underscore')
var jsonlines = require('jsonlines')
var parser = jsonlines.parse()
var fs = require('fs-extra')

var allData = [];
var line = 0;

console.time('parsing');

parser.on('data', function (data) {
  line++;
  if (line % 1000 == 0){
    console.log('Got line', line);
  }
  allData.push(data);
})

parser.on('end', function () {
  console.timeEnd('parsing');
  // console.log(allData);
  // fs.writeJSON('./output.json', allData);
  extract();
})

var readStream = fs.createReadStream('./logs/30_nov_18.log.json');
// var readStream = fs.createReadStream('/Users/orobix/Desktop/oven/logs/13_dec_18.log.json');

// readStream.pipe(process.stdout);
readStream.on('data', function(data){
  // console.log(data.toString('UTF-8'));
  parser.write(data.toString('UTF-8'))
});
readStream.on('end', function(){
  parser.end();
})

function extract(){
  console.log('extraction ------------------------------------- ');
  var sel1 = document.getElementById("sel1");

  // sel1.onSelect = onSelection;
  // sel1.onClick = onSelection;
  // sel1.addEventListener('select', onSelection);
  //
  // console.log(sel1)

  var option = document.createElement("option");
  // option.addEventListener('select', onSelection);
  option.text = "general";
  sel1.add(option);


  // console.log(_.filter(allData, d => d.context.location.filename == 'main.js'));
  // console.log(_.pluck(allData, ['context', 'tags']));
  // var hasValueA = _.filter(allData, d => d.context.tags[0] == 'general');
  // var hasValueB = _.filter(allData, d => d.context.tags[0] == 'random_values_b');

  // var a_array = _.pluck(hasValueA, 'argsString').map(a => parseFloat(a))
  // var b_array = _.pluck(hasValueB, 'argsString').map(b => parseFloat(b))

  // graph(a_array, b_array);

  // var hasText = _.filter(allData, d => (d.context.tags[0] !== 'random_values_b' && d.context.tags[0] !== 'random_values_a'));
  // var logsLines = _.pluck(hasText, 'message');
  // display(logsLines);

  console.log('STARTING : ', new Date(allData[0].context.time));
  console.log('ENDING : ', new Date(allData[allData.length-1].context.time));

  var hasGeneral = _.filter(allData, d => d.context.tags[0] == 'general');
  var hasNotLineStatus = _.filter(hasGeneral, d => (!d.args[0].includes('lineStatus') && !d.args[0].includes('resetNeeded')));
  console.log('-----------------------')
  // var logsLines = _.pluck(hasNotLineStatus, 'argsString');
  var logsLines = _.pluck(hasNotLineStatus, 'message');
  var logsTs = _.pluck(hasNotLineStatus, ['context', 'time']);
  // console.log('----')
  console.log(hasNotLineStatus);
  // console.log('----')
  display(logsLines);

  analyze(logsLines);

}

function graph(x, y){

  var trace = {
    x: x,
    y: y,
    mode: 'markers',
    type: 'scatter'
  };

  var data = [trace];

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
