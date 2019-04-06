'use strict'

const _ = require('lodash');

class Dataset {

  constructor(data){
    this.rawData = data;
    // number of data entries
    this.size    = _.size(data);
    // keys
    this.keys    = _.keys(data[0]);
    this.numberOfKeys = this.keys.length;
    // filters
    this.filtersFuns = [];
    this.filtersArgs = [];
    // data depth TODO ?
    // data dimensions ?
    // data size ?
    this.xaxis = null;
    this.yaxis = null;
    this.zaxis = null;
    // perform data coherence ? eg. all entries has same keys
  }

  addFilter(filter, value){
    this.filtersFuns.push(filter);
    this.filtersArgs.push(value);
  }

  filter(){
    var _this = this;
    var funcArray = Object.values(filterMap);
    var finalResult = funcArray.reduce( function(previousResult, fn, index){
      var res = fn(previousResult, _this.filtersArgs[index]);
      return res;
    }, this.rawData);

    console.log(finalResult.length);
    return finalResult;
  }

}

exports.Dataset = Dataset;

// TODO

// const keyify = (obj, prefix = '') =>
//   Object.keys(obj).reduce((res, el) => {
//     if( Array.isArray(obj[el]) ) {
//       return res;
//     } else if( typeof obj[el] === 'object' && obj[el] !== null ) {
//       return [...res, ...keyify(obj[el], prefix + el + '.')];
//     } else {
//       return [...res, prefix + el];
//     }
//   }, []);

// FILTERS

const filterMap = {
  'fake'        : fakeFilter,
  'keyValue'    : filterOnKeyValue,
  'keyTreshold' : filterOnKeyTreshold,
  // TODO
}

function filterOnKeyValue(data, [key, value]){
  console.log(data.length, '--', key, value);
  var tap = _.filter(data, function(d){
    return d[key] === value;
  });
  return tap;
}

function filterOnKeyTreshold(data, [key, threshold, sign]){
  console.log(data.length, '--', key, threshold, sign);
  var tap = _.filter(data, function(d){
    var res;
    if (sign == '>'){
      res = parseFloat(d[key]) > threshold;
    }
    else if (sign == '<'){
      res = parseFloat(d[key]) < threshold;
    }
    else if (sign == '>'){
      res = parseFloat(d[key]) >= threshold;
    }
    else if (sign == '<'){
      res = parseFloat(d[key]) <= threshold;
    }
    return res;
  })
  return tap;
}

function fakeFilter(data, fakeArgs){
  console.log(data.length, 'ff', fakeArgs)
  return data;
}
