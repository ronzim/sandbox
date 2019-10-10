// Node modules
var path       = require('path');
var uuid       = require('uuid');
var _          = require('underscore');
var createTree = require(path.join('..', 'lib', 'yaot'));

// Local modules
// var api          = require(path.join(rootPath, 'js', 'api', 'operaAPI'));
// var imageUtils   = require(path.join(rootPath, 'js', 'scenes', 'utils', 'imageUtils'));
// var devUtils     = require(path.join(rootPath, 'resources', 'js', 'devUtils'));
// var panorexUtils = require(path.join(rootPath, 'js', 'scenes', 'utils', 'panorexUtils'));
// var vtkAPI       = require(utils.getNAPIvtkAPIPath());

// const maxLength = 100000000;
const baseValue = 99999;
const color     = {r:1.0, g:0.0, b:0.0}; // RED BRUSH

// Local variables
var octree        = {};
var points        = null;
var normals       = null;
var originalColor = null;
var currentFlag   = 0;
var counters      = {};
var brushedModel  = null;


/*  ================================================================  */
/*  Library for toggle 3d brush on an object                         */
/*  ================================================================  */

// ============================================
// Convert a color from hex to rgb ============
// ============================================
var hexToRgb = function(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseFloat(parseInt(result[1], 16)/255.0),
        g: parseFloat(parseInt(result[2], 16)/255.0),
        b: parseFloat(parseInt(result[3], 16)/255.0)
    } : null;
};

// ============================================
// Set the octree =============================
// ============================================
var setOctree = function(renderingScene, dataDisplayName) {
  var mesh = renderingScene.getObjectByName(dataDisplayName);
  if (mesh) {
    // init bounds tree
    mesh.geometry.computeBoundsTree();

    octree[dataDisplayName] = createTree();
    octree[dataDisplayName].init(mesh.geometry.attributes.position.array);

    // store brushed model name
    brushedModel = dataDisplayName;

    return octree;
  }
  else {
    return null;
  }
};

// ============================================
// Reset the octree ===========================
// ============================================
var resetOctree = function() {
  octree      = {};
  points      = null;
  counters    = {};
  currentFlag = 0;
  brushModel  = null;
};

// ============================================
// Get brushed vertices =======================
// ============================================
var draw = function(ray, mesh) {
  // console.profile('draw');
  var currentId = points.indexOf(baseValue);
  var oldId = currentId;

  console.time('intersect')
  var intersects = ray.intersectObject(mesh);
  if (intersects.length > 0) {
    console.timeEnd('intersect')
    var refNormal  = new THREE.Vector3(intersects[0].face.normal.x, intersects[0].face.normal.y, intersects[0].face.normal.z);
    var radius = 3.0; // TODO input
    var matches = octree[mesh.name].intersectSphere(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z, radius);
    if (matches.length > 0) {

      _.each(matches, function applyColor(pointId, k) {
        // check normal : get only points on the same surface side (same normal as intersection point and projection under threshold)
        var n = new THREE.Vector3(mesh.geometry.attributes.normal.array[pointId], mesh.geometry.attributes.normal.array[pointId+1], mesh.geometry.attributes.normal.array[pointId+2]);
        var dot_n = refNormal.clone().dot(n);
        var d = new THREE.Vector3(mesh.geometry.attributes.position.array[pointId],
                                  mesh.geometry.attributes.position.array[pointId+1],
                                  mesh.geometry.attributes.position.array[pointId+2])
                          .sub(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z));
        var dot_d = refNormal.clone().dot(d);
        // if normal is opposite OR point is far from picking plane OR point has already a flag (avoid duplicates), return
        // if ( dot_n < 0.8 || dot_d > radius/10 || mesh.geometry.attributes.flags.array[pointId/3] <= currentFlag) {
        //   return;
        // }

        // if (mesh.geometry.attributes.color.array[pointId] == color.r){
        //   // console.log('already red')
        //   // avoid duplicates
        //   return;
        // }

        // var getCells = false;
        // if (!getCells){
          // store single vertex
          // update color
          mesh.geometry.attributes.color.array[pointId]   = color.r;
          mesh.geometry.attributes.color.array[pointId+1] = color.g;
          mesh.geometry.attributes.color.array[pointId+2] = color.b;
          // store coordinates
          // points[currentId] = mesh.geometry.attributes.position.array[pointId];
          // points[currentId+1] = mesh.geometry.attributes.position.array[pointId+1];
          // points[currentId+2] = mesh.geometry.attributes.position.array[pointId+2];
          // store normals
          // normals[currentId] = mesh.geometry.attributes.normal.array[pointId];
          // normals[currentId+1] = mesh.geometry.attributes.normal.array[pointId+1];
          // normals[currentId+2] = mesh.geometry.attributes.normal.array[pointId+2];
          // set flag
          // mesh.geometry.attributes.flags.array[pointId/3] = currentFlag;
          // CHECK if this is used
          currentId+=3;
        // }
        // else{
        //   // update also other vertices in the same cell
        //   if (getCells){
        //     var completed = completeCells(points, mesh, pointId, currentFlag);
        //     if (!completed){
        //       return;
        //     }
        //     mesh   = completed.mesh;
        //     points = completed.points;
        //   }
        // }

        // dev
        // devUtils.renderPoint('r3D', new THREE.Vector3(points[currentId], points[currentId+1], points[currentId+2]), 'p_'+currentId.toString(), 'yellow', 0.03);

      });
      // DEV
      // mesh.geometry.attributes.color.array = new Float32Array(mesh.geometry.index.array.length);
      // mesh.geometry.attributes.color.array.fill(0.5);
      // DEV
    }
    mesh.geometry.attributes.flags.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;
    mesh.geometry.colorsNeedUpdate = true;
  }

  // update counters for each flag (avoid a performance-killing loop when undo)
  counters[currentFlag] = counters[currentFlag] === undefined ? (currentId-oldId) : counters[currentFlag]+(currentId-oldId);

  // console.profileEnd('draw');
};

function placeSeeds(ray, mesh, scene) {
  var pointer = scene.getObjectByName('pointer');
  var intersects = ray.intersectObject(mesh);
  if (intersects.length > 0){
    if (!pointer){
      pointer = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshPhongMaterial({color:'red'}));
      pointer.name = 'pointer'
      scene.add(pointer)
    }
    pointer.position.copy(intersects[0].point);
    console.log(intersects[0].point)
  }
  else{
    scene.remove(pointer);
  }
  console.log(scene)
}

// get normals
function getNormalsData(){
  // remove exceeding values
  cleanedNormals = normals.subarray(0, normals.indexOf(baseValue));
  return cleanedNormals;
}

function getNormals(points){
  var normals = new Float32Array(points.length);
  console.log('>>>>>>> ', brushedModel)
  var mesh = api.getRenderingSceneFromRenderer('r3D').getObjectByName(brushedModel);
  if (!mesh) {
    console.warn('no mesh')
    return [];
  }

  var n = 0;
  // for each stored point, compute pointId in mesh vertices array
  for (var i=0; i<points.length; i+=3){
    // var pointId = mesh.geometry.attributes.position.array.indexOf(points[i]);
    var pointId = mesh.geometry.attributes.position.array.findIndex(function(e,n,arr) {
      if (n%3 !== 0){
        return false
      }
      else{
        return (arr[n] == points[i] && arr[n+1] == points[i+1] && arr[n+2] == points[i+2]);
      }
    });
    if (pointId > 0){
      normals[n] = mesh.geometry.attributes.normal.array[pointId];
      normals[n+1] = mesh.geometry.attributes.normal.array[pointId+1];
      normals[n+2] = mesh.geometry.attributes.normal.array[pointId+2];
      n+=3;
    }
    else{
      console.warn('cannot find point')
    }
  }

  console.log(normals);
  return normals;
}

// ===========================================================
// Reconstruct a not-indexed surface from brushed points =====
// ===========================================================

function completeCellsAfterBrush(points, dataDisplayName){
  var completedPoints = new Float32Array(points.length * 100).fill(baseValue);
  var mesh = api.getRenderingSceneFromRenderer('r3D').getObjectByName(dataDisplayName);
  if (!mesh) {return [];}

  // for each stored point, compute pointId in mesh vertices array
  for (var i=0; i<points.length; i+=3){
    // var pointId = mesh.geometry.attributes.position.array.indexOf(points[i]);
    var pointId = mesh.geometry.attributes.position.array.findIndex(function(e,n,arr) {
      if (n%3 !== 0){
        return false
      }
      else{
        return (arr[n] == points[i] && arr[n+1] == points[i+1] && arr[n+2] == points[i+2]);
      }
    });
    // console.log('indexOf >> pointId: ', pointId, pointId%3);
    if (pointId > 0){
      completeCells(completedPoints, mesh, pointId, 0);
    }
    else{
      console.warn('cannot find point')
    }
  }

  completedPoints = completedPoints.subarray(0, completedPoints.indexOf(baseValue));

  return completedPoints
}

function completeCells(points, mesh, pointId, currentFlag) {
  // get other cell vertices for indexed geometry (if needed)
  var pointId_  = pointId/3;
  var out       = new Uint32Array(20);
  // var res       = vtkAPI.allIndicesOf_(mesh.geometry.index.array, pointId_, out); // ensure int32
  var res       = vtkAPI.allIndicesOf_(new Uint32Array(mesh.geometry.index.array), pointId_, out);
  var indices   = res.indices.subarray(0, res.numberOfIndices);

  if (indices.length == 0){
    console.warn('cannot find pointId_ in index array', pointId);
    return false;
  }

  _.each(indices, function singleCellFinder(index){
    var res = completeSingleCell(points, pointId, index, mesh, currentFlag);
    mesh      = res.mesh;
    points    = res.points;
  });

  return {mesh: mesh, points:points};
}

function completeSingleCell(points, pointId, index, mesh, currentFlag) {
  var currentId = points.indexOf(baseValue);
  // store first vertex
  // update color
  mesh.geometry.attributes.color.array[pointId]   = color.r;
  mesh.geometry.attributes.color.array[pointId+1] = color.g;
  mesh.geometry.attributes.color.array[pointId+2] = color.b;
  // store coordinates
  points[currentId] = mesh.geometry.attributes.position.array[pointId];
  points[currentId+1] = mesh.geometry.attributes.position.array[pointId+1];
  points[currentId+2] = mesh.geometry.attributes.position.array[pointId+2];
  // set flag
  mesh.geometry.attributes.flags.array[pointId/3] = currentFlag;

  // check position into the cell & store the other two vertices
  var trianglePosition = index%3 > 0.0 ? index%3 : 0.0;
  if (trianglePosition === 0.0 ) {
    var indexA = mesh.geometry.index.array[index + 1] *3;
    var indexB = mesh.geometry.index.array[index + 2] *3;

    mesh.geometry.attributes.color.array[indexA+0] = color.r;
    mesh.geometry.attributes.color.array[indexA+1] = color.g;
    mesh.geometry.attributes.color.array[indexA+2] = color.b;
    mesh.geometry.attributes.color.array[indexB+0] = color.r;
    mesh.geometry.attributes.color.array[indexB+1] = color.g;
    mesh.geometry.attributes.color.array[indexB+2] = color.b;

    points[currentId+3] = mesh.geometry.attributes.position.array[indexA+0];
    points[currentId+4] = mesh.geometry.attributes.position.array[indexA+1];
    points[currentId+5] = mesh.geometry.attributes.position.array[indexA+2];
    points[currentId+6] = mesh.geometry.attributes.position.array[indexB+0];
    points[currentId+7] = mesh.geometry.attributes.position.array[indexB+1];
    points[currentId+8] = mesh.geometry.attributes.position.array[indexB+2];

    // devUtils.renderPoint('r3D', new THREE.Vector3(points[currentId+3], points[currentId+4], points[currentId+5]), 'p1_'+currentId.toString(), 'green', 0.03);
    // devUtils.renderPoint('r3D', new THREE.Vector3(points[currentId+6], points[currentId+7], points[currentId+8]), 'p2_'+currentId.toString(), 'green', 0.03);

    mesh.geometry.attributes.flags.array[indexA] = currentFlag;
    mesh.geometry.attributes.flags.array[indexB] = currentFlag;
  }
  else if (trianglePosition == 1.0) {
    var indexA = mesh.geometry.index.array[index - 1] *3;
    var indexB = mesh.geometry.index.array[index + 1] *3;

    mesh.geometry.attributes.color.array[indexA+0] = color.r;
    mesh.geometry.attributes.color.array[indexA+1] = color.g;
    mesh.geometry.attributes.color.array[indexA+2] = color.b;
    mesh.geometry.attributes.color.array[indexB+0] = color.r;
    mesh.geometry.attributes.color.array[indexB+1] = color.g;
    mesh.geometry.attributes.color.array[indexB+2] = color.b;

    points[currentId+3] = mesh.geometry.attributes.position.array[indexA+0];
    points[currentId+4] = mesh.geometry.attributes.position.array[indexA+1];
    points[currentId+5] = mesh.geometry.attributes.position.array[indexA+2];
    points[currentId+6] = mesh.geometry.attributes.position.array[indexB+0];
    points[currentId+7] = mesh.geometry.attributes.position.array[indexB+1];
    points[currentId+8] = mesh.geometry.attributes.position.array[indexB+2];

    // devUtils.renderPoint('r3D', new THREE.Vector3(points[currentId+3], points[currentId+4], points[currentId+5]), 'p1_'+currentId.toString(), 'green', 0.03);
    // devUtils.renderPoint('r3D', new THREE.Vector3(points[currentId+6], points[currentId+7], points[currentId+8]), 'p2_'+currentId.toString(), 'green', 0.03);

    mesh.geometry.attributes.flags.array[indexA] = currentFlag;
    mesh.geometry.attributes.flags.array[indexB] = currentFlag;
  }
  else if (trianglePosition == 2.0) {
    var indexA = mesh.geometry.index.array[index - 2] *3;
    var indexB = mesh.geometry.index.array[index - 1] *3;

    mesh.geometry.attributes.color.array[indexA+0] = color.r;
    mesh.geometry.attributes.color.array[indexA+1] = color.g;
    mesh.geometry.attributes.color.array[indexA+2] = color.b;
    mesh.geometry.attributes.color.array[indexB+0] = color.r;
    mesh.geometry.attributes.color.array[indexB+1] = color.g;
    mesh.geometry.attributes.color.array[indexB+2] = color.b;

    points[currentId+3] = mesh.geometry.attributes.position.array[indexA+0];
    points[currentId+4] = mesh.geometry.attributes.position.array[indexA+1];
    points[currentId+5] = mesh.geometry.attributes.position.array[indexA+2];
    points[currentId+6] = mesh.geometry.attributes.position.array[indexB+0];
    points[currentId+7] = mesh.geometry.attributes.position.array[indexB+1];
    points[currentId+8] = mesh.geometry.attributes.position.array[indexB+2];

    // devUtils.renderPoint('r3D', new THREE.Vector3(points[currentId+3], points[currentId+4], points[currentId+5]), 'p1_'+currentId.toString(), 'green', 0.03);
    // devUtils.renderPoint('r3D', new THREE.Vector3(points[currentId+6], points[currentId+7], points[currentId+8]), 'p2_'+currentId.toString(), 'green', 0.03);

    mesh.geometry.attributes.flags.array[indexA] = currentFlag;
    mesh.geometry.attributes.flags.array[indexB] = currentFlag;

  }

  return {mesh: mesh, points:points};
}

// ======================================================================
// find all occurencies of an id in the index array (moved to napi) =====
// ======================================================================

// function allIndicesOf_(array, pId) {
//   var allIndices = [];
//   var index      = _.indexOf(array, pId);
//
//   if (index >= 0){
//   while (index >= 0) {
//     allIndices.push(index);
//     index = array.indexOf(pId, index+1);
//   }
//   }
//   return allIndices;
// }

// function allIndicesOf(arr, val) {
//     var indexes = [], i;
//     for(i = 0; i < arr.length; i++)
//         if (arr[i] === val)
//             indexes.push(i);
//     return indexes;
// }

var toggleCADBrush = function(renderer, scene, controls, dataDisplayName, toggle, cb) {
  var mesh = scene.getObjectByName(dataDisplayName);
  var camera = scene.getObjectByName('camera');

  if (toggle && dataDisplayName) {
    console.time("enable octree");
    if (!octree[dataDisplayName]) {
      setOctree(scene, dataDisplayName);
    }
    console.timeEnd("enable octree");
    console.time("enable color geometry");
    if (!mesh.geometry.attributes.color && octree[dataDisplayName]) {
      originalColor = mesh.material.color;
      mesh.material.color = new THREE.Color(0xf5f5f5);
      mesh.material.vertexColors = THREE.VertexColors;
      var colors = new Float32Array(mesh.geometry.attributes.position.array.length).fill(0.96);
      mesh.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
      mesh.geometry.attributes.color.needsUpdate = true;
      mesh.geometry.colorsNeedUpdate = true;
      mesh.material.needsUpdate = true;
      // add flag array
      var flags = new Float32Array(mesh.geometry.attributes.position.array.length/3).fill(undefined);
      mesh.geometry.addAttribute('flags', new THREE.BufferAttribute(flags, 1));
      mesh.geometry.attributes.flags.needsUpdate = true;
    }
    var maxLength = mesh.geometry.attributes.position.array.length;
    points    = new Float32Array(maxLength).fill(baseValue);
    normals   = new Float32Array(maxLength).fill(baseValue);
    counters = {};
    currentFlag = 0;
    console.timeEnd("enable color geometry");

    var brushModel = function onDocumentMouseMove(event) {
      var ray    = new THREE.Raycaster();
      var rect   = renderer.domElement.getBoundingClientRect();
      var x      = (event.clientX - rect.left) / rect.width;
      var y      = (event.clientY - rect.top) / rect.height;

      var mouse = new THREE.Vector2();
      mouse.x = (x) * 2 - 1;
      mouse.y = -(y) * 2 + 1;
      ray.setFromCamera(mouse, camera);

      ray.firstHitOnly = true;

      // draw(ray, mesh);
      placeSeeds(ray, mesh, scene); //DEV

    };

    var disableBrushTool = function onDocumentMouseUp(event) {
      renderer.domElement.onmousemove = null;
      controls.enabled = true;
      renderer.domElement.onmouseup = null;
      // increment flag for next brush
      currentFlag++;
    };

    var enableBrushTool = function onDocumentMouseDown(event) {
      var ray     = new THREE.Raycaster();
      var camera  = scene.getObjectByName('camera');
      var rect    = renderer.domElement.getBoundingClientRect();
      var x       = (event.clientX - rect.left) / rect.width;
      var y       = (event.clientY - rect.top) / rect.height;
      var mouse   = new THREE.Vector2();
      mouse.x     = (x) * 2 - 1;
      mouse.y     = - (y) * 2 + 1;
      ray.setFromCamera(mouse, camera);

      var intersects = ray.intersectObject(mesh);

      if (intersects.length > 0) {
        controls.enabled = false;
        renderer.domElement.onmouseup   = disableBrushTool;
        renderer.domElement.onmousemove = brushModel;
      }
      else {
        controls.enabled = true;
      }
    };

    renderer.domElement.onmousedown = enableBrushTool;

    if (cb) {
      cb();
    }
  }
  else {
    renderer.domElement.onmousedown = null;
    if (mesh) {
      mesh.material.color = originalColor;
      originalColor = null;
      mesh.material.vertexColors = THREE.NoColors;
      mesh.geometry.removeAttribute('color');
      mesh.geometry.removeAttribute('flags');
      mesh.geometry.colorsNeedUpdate = true;
      mesh.material.needsUpdate = true;
    }

    if (cb) {
      cb();
    }
  }
};

// ============================================
// Return brushed points ======================
// ============================================
var getBrushData = function(getCells) {
  // remove exceeding values
  cleanedPoints = points.subarray(0, points.indexOf(99999));

  if (getCells){
    if (!brushedModel){
      console.warn('no brushed model dataDisplayName');
      return [];
    }

    cleanedPoints = completeCellsAfterBrush(cleanedPoints, brushedModel);
    // render surface for dev
    // var geometry = api.buildGeometry(cleanedPoints);
    // api.getRenderingSceneFromRenderer('r3D').add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:'yellow', side:2})))
  }

  return cleanedPoints;
};

// ============================================
// Reset Brushed points =======================
// ============================================
var resetBrush = function(sceneName, dataDisplayName, forceReset) {
  var renderingScene = api.getRenderingSceneFromRenderer(sceneName);
  var mesh           = renderingScene ? renderingScene.getObjectByName(dataDisplayName) : null
  if (mesh) {
    var maxLength = mesh.geometry.attributes.position.array.length;

    var colors = new Float32Array(mesh.geometry.attributes.position.array.length).fill(0.96);
    mesh.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    // add flag array
    var flags = new Float32Array(mesh.geometry.attributes.position.array.length/3).fill(undefined);
    mesh.geometry.addAttribute('flags', new THREE.BufferAttribute(flags, 1));

    mesh.geometry.attributes.color.needsUpdate = true;
    mesh.geometry.attributes.flags.needsUpdate = true;
    mesh.geometry.colorsNeedUpdate = true;
    mesh.material.needsUpdate = true;
  }
  points       = forceReset ? null : new Float32Array(maxLength).fill(baseValue);
  normals      = forceReset ? null : new Float32Array(maxLength).fill(baseValue);
  counters     = {};
  currentFlag  = 0;
  brushedModel = forceReset ? null : brushedModel;
};

// ============================================
// Undo last brush ============================
// ============================================
var undoBrush = function(sceneName, dataDisplayName){
  if (currentFlag === 0){
    console.warn('nothing to undo');
    return;
  }

  var renderingScene = api.getRenderingSceneFromRenderer(sceneName);
  var mesh           = renderingScene ? renderingScene.getObjectByName(dataDisplayName) : null
  if (mesh) {
    var verts = mesh.geometry.attributes.position.array;
    var flags = mesh.geometry.attributes.flags.array;
    var colors = mesh.geometry.attributes.color.array;

    // undo flag-related counters
    counters = _.omit(counters, currentFlag);
    currentFlag--;

    // reset color and flags
    for (var v=0; v<=verts.length; v+=3){
      if (flags[v/3] === currentFlag){
        flags[v/3] = undefined;
        // reset original pre-brush color
        colors[v]   = 0.96;
        colors[v+1] = 0.96;
        colors[v+2] = 0.96;
      }
    }

    // override undone points with baseValue
    var countersArray = _.toArray(counters);
    countersArray.splice(countersArray.length-1);
    var flagged = countersArray.length>0 ? countersArray.reduce((a,b)=> a+b) : 0;
    points.fill(baseValue, flagged);
    normals.fill(baseValue, flagged);

    // update
    mesh.geometry.attributes.flags.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;
    mesh.geometry.colorsNeedUpdate = true;
    mesh.material.needsUpdate = true;

  }
}

/*  ================================================================  */
/*  Exports functions                                                 */
/*  ================================================================  */
exports.toggleCADBrush          = toggleCADBrush;
exports.getBrushData            = getBrushData;
exports.resetBrush              = resetBrush;
exports.resetOctree             = resetOctree;
exports.undoBrush               = undoBrush;
exports.completeCellsAfterBrush = completeCellsAfterBrush;
exports.getNormalsData          = getNormalsData;
