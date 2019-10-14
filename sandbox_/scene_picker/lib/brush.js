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
      pointer = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshPhongMaterial({color:'red'}));
      pointer.name = 'pointer'
      scene.add(pointer)
    }
    pointer.position.copy(intersects[0].point);
    console.log(intersects[0].point)
  }
  else{
    scene.remove(pointer);
  }
}

function updateSeed(scene, zoomLevel) {
  var pointer = scene.getObjectByName('pointer');
  if (pointer){
    pointer.scale.set(zoomLevel, zoomLevel, zoomLevel);
  }
}

// get normals
function getNormalsData(){
  // remove exceeding values
  cleanedNormals = normals.subarray(0, normals.indexOf(baseValue));
  return cleanedNormals;
}

var toggleCADBrush = function(renderer, scene, controls, dataDisplayName, toggle, cb) {
  var mesh = scene.getObjectByName(dataDisplayName);
  var camera = scene.getObjectByName('camera');
  controls.addEventListener('end', updateZoomLevel)

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

// bind pointer dimension to actual zoom level
function updateZoomLevel(event){
  var zoom = Math.sqrt(event.target.target.distanceTo( event.target.object.position )) / 1;
  var zoom = event.target.target.distanceTo( event.target.object.position ) / 100;
  updateSeed(event.target.object.parent, zoom);
}

/*  ================================================================  */
/*  Exports functions                                                 */
/*  ================================================================  */
exports.toggleCADBrush          = toggleCADBrush;
exports.resetOctree             = resetOctree;
