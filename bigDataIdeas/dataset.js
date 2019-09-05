'use strict'

const _ = require('lodash');
const uuid = require('uuid/v4');
const filtersTree = require('./filtersTree');

var VERBOSE = true;

// TODO list
// - integrate new Tree object
// - get datatype for each key & getter DONE
// - perform data coherence: eg. all entries has same keys (use defaults)
// - get range of values for each key (numeric / string) DONE
// - check data depth (nested objects)
// - getters / setters for axis vars

class Dataset {

  constructor(data) {
    console.log(data)
    this.rawData = data;
    this._filteredData = data;
    // number of data entries
    this._size = _.size(data);
    // keys
    this._keys = _.keys(data[0]);
    this.numberOfKeys = this.keys.length;
    // filters tree
    this._filtersTree  = {};
    this._activeBranchId = null;
    this._treeIndex    = 0;
    this._filtersFuns  = [];
    this._filtersArgs  = [];
    // axis
    this._axisKeys = {
      t : [],
      w : [],
      x : [],
      y : [],
      z : []
    };
    this.initNewBranch();
    this.initKeys();
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

  get filteredData() {
    return this._filteredData;
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

  set axisKeys(axisMap) {
    // axisMap is an object like this:
    // {
    //   t : 'key_on_y',
    //   w : 'key_on_w',
    //   x : 'key_on_x',
    //   y : 'key_on_y',
    //   z : 'key_on_z'
    // }
    var _this = this;
    this._axisKeys = _.mapValues(_this._axisKeys, function(actualValue,axisName) {
      var tap = axisMap[axisName] ? _.map(_this._filteredData, axisMap[axisName]) : [];
      return tap;
    })
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

  initKeys() {
    console.time('initKeys')
    var _this = this;
    this._keys = this._keys.map(function(k,v) {
      return {
        label : k,
        type  :_this._getType(_this.rawData[0][k]),
        range : _this._getRange(k)
      }
    });
    console.timeEnd('initKeys')
  }

  // get range should be different based on key type

  _getType(value) {
    var guessNumber = parseFloat(value);
    if (!isNaN(guessNumber)){
      // TODO check if possible latlon
      return 'number'
    }
    // TODO check for dates
    else{
      return typeof value;
    }
  }

  _getRange(key) {
    console.log('============>', key)
    console.time('getRange')
    var values = _.map(this.rawData, key); // in lodash this is as _.pluck
    var uniqValues = Array.from(new Set(values)); // super-fast duplicates removal
    console.log(uniqValues.length)
    // if number, compute max/min
    console.timeEnd('getRange')
    var type = this._getType(uniqValues[0]);
    if (type == 'number'){
      var validValues = _.without(uniqValues, '');
      return {
        max : _.max(validValues),
        min : _.min(validValues)
      }
    }
    else if (type == 'string'){
      return uniqValues;
    }
    else {
      return null;
    }
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

    this._filteredData = finalResult;
    if (VERBOSE) console.log(finalResult.length);
    if (VERBOSE) console.timeEnd('filtering')
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

function init() {
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
      // setTimeout(function() {
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
  ds.axisKeys = {
    x : 'Reported by'
  }
  console.log(ds.axisKeys)
}

function getDs() {
  return ds;
}

exports.Dataset = Dataset;
exports.setVerbose = function(toggle) {VERBOSE = toggle};

exports.test  = initDs;
exports.getDs = getDs;
