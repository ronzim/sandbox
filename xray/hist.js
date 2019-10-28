const Plotly = require('plotly.js-dist');

function create(stack){

  var frames = [];
  for (var i=0; i<stack._frame.length; i+=2){
    frames.push(stack._frame[i]);
  }
  console.log('================', frames.length);

  var nOfFrames = frames.length;
  var framesLength = frames[0]._pixelData.length;

  var allPixels = new Int16Array(nOfFrames * framesLength);
  frames.forEach(function(f, i){
    allPixels.set(f._pixelData, i*framesLength);
  });
  console.log(allPixels);

  var trace = {
    x: allPixels,
    type: 'histogram',
  };
  var data = [trace];
  console.time('graph')
  Plotly.newPlot('r3', data);
  console.timeEnd('graph')
}

exports.create = create;
