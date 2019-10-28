var _ = require('underscore');

function hist(stack, cb){

  console.time('hist');

  var frames = _.pluck(stack._frame, '_pixelData');

  console.log(frames);

  var pixels = new Int16Array(frames.length * frames[0].length);

  // concatenate frames

  // OK ===========
  frames.forEach(function(f, i){
    pixels.set(f, f.length * i)
  })

  // pixels = _.sample(pixels, Math.floor(pixels.length/100000))

  console.log('pixels ==============');
  console.log(pixels);

  console.log('start grouping')
  var g = _.groupBy(pixels, p => p);

  console.log('start mapping')
  var values = Object.keys(g);
  var counter = _.map(g, e => e.length );

  var zip = _.object(values, counter);
  console.timeEnd('hist');

  var bins = intoBins(zip, stack._minMax, pixels.length);
  // var orderedBins = {};

  drawHist(bins);

  // _.sortBy(bins, (a, b) => parseInt(a));
  // var keys = Object.keys(bins);
  // console.log(keys);
  //
  // var intKeys = _.map(keys, a => parseInt(a));
  // console.log(intKeys);
  //
  // var orderedKeys = _.sortBy(intKeys, (a,b) => (a > b));
  // console.log(orderedKeys);
  //
  // orderedKeys.forEach(function(key) {
  //   console.log(key)
  //   orderedBins[key] = bins[key];
  // });
  //
  // console.log(orderedBins);

  if (cb){
    var sorted = _.sortBy(bins, 'value');
    console.log(sorted);
    var boneValue = sorted[sorted.length-1].bin + 1500;
    // cb(sorted[sorted.length-1].bin);
    console.log(boneValue)
    cb(boneValue);
  }
}

function intoBins(zip, minMax, samples){
  // rule of thumb

  var nOfBins = 50;
  var l = Math.floor((minMax[1]-minMax[0]) / nOfBins) ;

  console.log(nOfBins, l, samples);

  var bins = _.range(-2500, 2000, l);
  var data = [];

  _.each(bins, function(bin){
    var fallen = _.filter(zip, function(v, k){
      return parseInt(k) > bin && parseInt(k) < bin+l;
    })
    var totFallen = _.reduce(fallen, function(a,b){
      return a+b
    })

    totFallen = totFallen ? totFallen : 0;

    data.push({bin: bin, value: totFallen});
  })

  return data;

}


function drawHist(bins){

  var histogramCanvas = document.getElementById('chart');
  var ctx = histogramCanvas.getContext('2d');

  var maxBin = 0;
  _.each( bins, function( v, k ) {
    maxBin = maxBin < v.value ? v.value : maxBin ;
  });
  var x = 0;
  var y = 0;
  var w = 1;
  var h = 0;

  // var minWindow = ( windowLevel - ( windowWidth / 2 ) );
  // var maxWindow = ( windowLevel + ( windowWidth / 2 ) );

  // 1 is div height
  var divHeight = 250;
  var factor = divHeight / maxBin;

  _.each( bins, function( v, k ) {
    console.log(v, k, maxBin)
    // if ( v.value < minWindow || v.value > maxWindow ) {
    //   ctx.fillStyle="#4a4a4a";
    // }
    // else {
    // ctx.fillStyle="#d3d3d3";
      ctx.fillStyle="#0000ff";
    // }
    h = v.value * factor;
    y = divHeight - h;
    ctx.fillRect( x, y, w, h );
    x += w + 1;
    console.log(x, y, w, h)
  });

  console.log('done')

}

exports.compute = hist;
exports.draw = drawHist;
