'use strict'

const _ = require('lodash');
const uuid = require('uuid/v4');

var VERBOSE = true;

// TODO list
// - get datatype for each key & getter
// - perform data coherence: eg. all entries has same keys (use defaults)
// - get range of values for each key (numeric)
// - check data depth (nested objects)
// - getters / setters for axis vars

class Dataset {

  constructor(data) {
    console.log(data)
    this.rawData = data;
    // number of data entries
    this._size    = _.size(data);
    // keys
    this._keys    = _.keys(data[0]);
    this.numberOfKeys = this.keys.length;
    // filters tree
    this._filtersTree  = {};
    this._activeBranchId = null;
    this._treeIndex    = 0;
    this._filtersFuns  = [];
    this._filtersArgs  = [];
    // axis
    this._axisKeys = {};
    this.initNewBranch();
  }

  // ==========
  // Getters ==
  // ==========

  get keys() {
    return this._keys;
  }

  get size() {
    return this._size;
  }

  get axisKeys() {
    return this._axisKeys;
  }

  get filtersTree() {
    return this._filtersTree;
  }

  get activeBranch() {
    return {
      id   : this._activeBranch,
      funs : this._filtersFuns,
      args : this._filtersArgs
    }
  }

  get treeIndex() {
    return this._treeIndex;
  }

  // ==========
  // Setters ==
  // ==========

  set activeBranch(id) {
    if (_.isString(id) && id.length == 36 && _.has(this._filtersTree, id)) {
      this._activeBranch = id;
    }
    else{
      console.error('branch id not valid');
    }
  }

  set treeIndex(index) {
    if (_.isFinite(index)) {
      this._treeIndex = index;
      if (VERBOSE) console.log('index set to ', this._treeIndex);
    }
    else{
      console.error('index must be a number');
    }
  }

  // ====================
  // Utility functions ==
  // ====================

  // setup a new branch, copying arrays to active index position
  initNewBranch() {
    var currentId = this._activeBranchId;
    // for first initialization
    if (currentId === null) {
      var currentFuns = [];
      var currentArgs = [];
    }
    else{
      var currentFuns = this._filtersTree[currentId].funs;
      var currentArgs = this._filtersTree[currentId].args;
    }

    var newId = uuid();
    this._filtersTree[newId] = {
      parentId : currentId,
      id   : newId,
      funs : _.slice(currentFuns, 0, this._treeIndex),
      args : _.slice(currentArgs, 0, this._treeIndex)
    };
    // set as active branch
    this._activeBranchId = newId;
    if (VERBOSE) console.log('create new branch', newId);
    return newId;
  }

  addFilter(filter, value, insertPosition) {
    if (VERBOSE) console.log('add filter', filter, value, insertPosition)
    var currId = this._activeBranchId;
    if (!insertPosition) {
      insertPosition = this._filtersTree[currId].funs.length;
    }
    this._filtersTree[currId].funs.splice(insertPosition, 0, filterMap[filter]);
    this._filtersTree[currId].args.splice(insertPosition, 0, value);
    if (VERBOSE) console.log(this._filtersTree)
    this._treeIndex++;
  }

  runFilter() {
    if (VERBOSE) console.time('filtering')
    var _this = this;
    var currId = this._activeBranchId;
    var funcArray = Object.values(this._filtersTree[currId].funs);
    if (VERBOSE) console.log(funcArray)
    var finalResult = funcArray.reduce( function(previousResult, fn, index) {
      var res = fn(previousResult, _this._filtersTree[currId].args[index]);
      return res;
    }, this.rawData);

    if (VERBOSE) console.log(finalResult.length);
    if (VERBOSE) console.timeEnd('filtering')
    // return finalResult;
  }

}

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
  'keyRange'    : filterOnKeyRange,
  'keyContains' : filterOnKeyContains
  // TODO
}

function filterOnKeyValue(data, [key, value]) {
  if (VERBOSE) console.log(data.length, '--', key, value);
  var tap = _.filter(data, function(d) {
    return d[key] === value;
  });
  return tap;
}

function filterOnKeyRange(data, [key, value1, value2]) {
  if (VERBOSE) console.log(data.length, '--', key, value1, value2);
  var low  = value1 < value2 ? value1 : value2;
  var high = value1 > value2 ? value1 : value2;
  var tap = _.filter(data, function(d) {
    return d[key] >= low && d[key] <= high;
  });
  return tap;
}

function filterOnKeyTreshold(data, [key, threshold, sign]) {
  if (VERBOSE) console.log(data.length, '--', key, threshold, sign);
  var tap = _.filter(data, function(d) {
    var res;
    if (sign == '>') {
      res = parseFloat(d[key]) > threshold;
    }
    else if (sign == '<') {
      res = parseFloat(d[key]) < threshold;
    }
    else if (sign == '>') {
      res = parseFloat(d[key]) >= threshold;
    }
    else if (sign == '<') {
      res = parseFloat(d[key]) <= threshold;
    }
    return res;
  })
  return tap;
}

function filterOnKeyContains(data, [key, string]){
  var tap = _.filter(data, function(d){
    return d[key].includes(string);
  });
  return tap;
}

function fakeFilter(data, fakeArgs) {
  if (VERBOSE) console.log(data.length, 'ff', fakeArgs)
  return data;
}

// ===================================
// TESTS =============================
// ===================================
// 16 sec 600 mb senza log
// node --max-old-space-size=4096 yourFile.js

const Papa = require('papaparse')
const fs   = require('fs-extra')

// const file = fs.createReadStream('../material/heart.csv');
const file = fs.createReadStream('../material/london-street.csv');
var rawData;
var rows = 0;
var all = [];

function init(){
  console.time('loading')
  Papa.parse(file, {
    header: true,
    step: function(chunk, parser) {
      rows++
    	// console.log("Row data:", chunk.data[0]);
    	// console.log("Row errors:", results.errors);
      if (rows%100000 === 0) console.log('---', rows);
      all.push(chunk.data[0])
    },
    complete: function(results, file) {
      console.timeEnd('loading')

      console.log(_.size(results.data))
      console.log(_.keys(results))
      console.log(results.meta.fields)
      // setTimeout(initDs, 0, results.data)
      // setTimeout(function(){
      //   console.log('loaded')
      //   rawData = results.data.slice();
      //   initDs()
      // },0)
      setTimeout(initDs, 0)
    }
  });
}

init();
var ds;

function initDs() {
  ds = new Dataset(all);
}

function getDs(){
  return ds;
}

exports.Dataset = Dataset;
exports.setVerbose = function(toggle) {VERBOSE = toggle};

exports.test  = initDs;
exports.getDs = getDs;
