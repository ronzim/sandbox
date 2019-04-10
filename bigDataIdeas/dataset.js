'use strict'

const _ = require('lodash');
const uuid = require('uuid/v4');

// TODO get datatype for each key

class Dataset {

  constructor(data){
    console.log(aaa)
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
    // data depth TODO ?
    // data dimensions ?
    // data size ?
    this._axisKeys = {};
    // perform data coherence ? eg. all entries has same keys (use defaults)
    this.initNewBranch();
  }

  // ==========
  // Getters ==
  // ==========

  get keys(){
    return this._keys;
  }

  get size(){
    return this._size;
  }

  get axisKeys(){
    return this._axisKeys;
  }

  get filtersTree(){
    return this._filtersTree;
  }

  get activeBranch(){
    return {
      id   : this._activeBranch,
      funs : this._filtersFuns,
      args : this._filtersArgs
    }
  }

  get treeIndex(){
    return this._treeIndex;
  }

  // ==========
  // Setters ==
  // ==========

  set activeBranch(id){
    if (_.isString(id) && id.length == 36 && _.has(this._filtersTree, id)){
      this._activeBranch = id;
    }
    else{
      console.error('branch id not valid');
    }
  }

  set treeIndex(index){
    if (_.isFinite(index)){
      this._treeIndex = index;
    }
    else{
      console.error('index must be a number');
    }
  }

  // ====================
  // Utility functions ==
  // ====================

  // setup a new branch, copying arrays to active index position
  initNewBranch(){
    console.log('new branch')
    var currentId = this._activeBranchId;
    // for first initialization
    if (currentId === null){
      var currentFuns = [];
      var currentArgs = [];
    }
    else{
      var currentFuns = this._filtersTree[currentId].filtersFuns;
      var currentArgs = this._filtersTree[currentId].filtersArgs;
    }
    var newId = uuid();
    this._filtersTree[newId] = {
      parentId : currentId,
      id   : newId,
      funs : _.slice(currentFuns, 0, this._treeIndex),
      args : _.slice(currentArgs, 0, this._treeIndex) // TODO adapt all functions to this new object (funs and args inside)
    };
    // set as active branch
    this._activeBranchId = newId;
    return newId;
  }

  addFilter(filter, value, insertPosition){
    console.log(filter, value, insertPosition)
    var currId = this._activeBranchId;
    console.log('1', this._filtersTree, currId)
    if (!insertPosition){
      insertPosition = this._filtersTree[currId].filtersFuns.length;
    }
    this._filtersTree[currId].filtersFuns.splice(insertPosition, 0, filterMap[filter]);
    this._filtersTree[currId].filtersArgs.splice(insertPosition, 0, value);
    console.log(this._filtersTree[currId].filtersFuns);
  }

  runFilter(){
    var _this = this;
    var currId = this._activeBranchId;
    var funcArray = Object.values(this._filtersTree[currId].filtersFuns);
    console.log(funcArray)
    var finalResult = funcArray.reduce( function(previousResult, fn, index){
      var res = fn(previousResult, this._filtersTree[currId].filtersArgs[index]);
      return res;
    }, this.rawData);

    console.log(finalResult.length);
    return finalResult;
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
  // TODO
}

function filterOnKeyValue(data, [key, value]){
  console.log(data.length, '--', key, value);
  var tap = _.filter(data, function(d){
    return d[key] === value;
  });
  return tap;
}

function filterOnKeyRange(data, [key, value1, value2]){
  console.log(data.length, '--', key, value1, value2);
  var low  = value1 < value2 ? value1 : value2;
  var high = value1 > value2 ? value1 : value2;
  var tap = _.filter(data, function(d){
    return d[key] >= low && d[key] <= high;
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

// for test

const Papa = require('papaparse')
const fs   = require('fs-extra')

function init(rawData){
  const file = fs.createReadStream('../material/heart.csv');
  Papa.parse(file, {
      header: true,
      complete: function(results, file) {
        console.log(_.size(results), _.size(results.data))
        console.log(_.keys(results))
        console.log(results.meta.fields)

        // init(results.data);
        var ds = new Dataset(results.data);
        ds.addFilter('keyValue', ['sex', 1]);
        ds.addFilter('keyValue', ['sex', 1]);
        ds.addFilter('keyValue', ['sex', 1]);
        ds.addFilter('keyTreshold', [' age', 50], 1);
        var b0 = ds.activeBranch.id;
        ds.treeIndex = 1;
        var b1 = ds.initNewBranch();
        // console.log(b0, b1);
        // console.log(ds.activeBranch)
        //
        // console.log(ds.treeIndex)
      }
  });
}
init()

exports.Dataset = Dataset;
exports.init = init;
