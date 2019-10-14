/*  ================================================================  */
/*  Library for toggle 3d brush on a single object                    */
/*  ================================================================  */

// Node modules
var path       = require('path');
var uuid       = require('uuid');
var _          = require('underscore');
var createTree = require(path.join('..', 'lib', 'yaot'));

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
var splines       = [];

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
// Brush ======================================
// ============================================
var draw = function(int, mesh) {

  var radius = 3.0; // TODO input
  var matches = octree[mesh.name].intersectSphere(int.point.x, int.point.y, int.point.z, radius);
  if (matches.length > 0) {

    _.each(matches, function applyColor(pointId, k) {

        mesh.geometry.attributes.color.array[pointId]   = color.r;
        mesh.geometry.attributes.color.array[pointId+1] = color.g;
        mesh.geometry.attributes.color.array[pointId+2] = color.b;

    });

  }
  mesh.geometry.attributes.flags.needsUpdate = true;
  mesh.geometry.attributes.color.needsUpdate = true;
  mesh.geometry.colorsNeedUpdate = true;

};

// ============================================
// Pointer ====================================
// ============================================

function placeSeeds(ray, mesh, scene) {
  var pointer = scene.getObjectByName('pointer');
  var intersects = ray.intersectObject(mesh);
  if (intersects.length > 0){
    if (!pointer){
      pointer = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshPhongMaterial({color:'green'}));
      pointer.name = 'pointer'
      scene.add(pointer)
    }
    pointer.position.copy(intersects[0].point);
    // draw(intersects[0], mesh);
    updateSpline(intersects[0].point, scene);
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

// bind pointer dimension to actual zoom level
function updateZoomLevel(event){
  var zoom = Math.sqrt(event.target.target.distanceTo( event.target.object.position )) / 1;
  var zoom = event.target.target.distanceTo( event.target.object.position ) / 100;
  updateSeed(event.target.object.parent, zoom);
}

// ============================================
// Curves =====================================
// ============================================

function initSpline(point, scene){
  var curve = new THREE.CatmullRomCurve3([]);
  splines.push(curve);
}

function updateSpline(point, scene){
  splines[splines.length-1].points.push(point);
  renderCurve(splines[splines.length-1], scene)
}

function renderCurve(curve, scene){
  if (curve.points.length < 2){
    return;
  }

  var points = curve.getPoints(500);
  var spline = scene.getObjectByName('spline' + splines.length);

  if (spline){
    spline.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }
  else{
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({color : 0x000000, depthTest:false});
    var curveObject = new THREE.Line(geometry, material);
    curveObject.name = 'spline' + splines.length;
    scene.add(curveObject);
  }

}

// ============================================
// Activate / Deactivate ======================
// ============================================

var toggleCADBrush = function(renderer, scene, controls, dataDisplayName, toggle, cb) {
  var mesh = scene.getObjectByName(dataDisplayName);
  var camera = scene.getObjectByName('camera');
  controls.addEventListener('end', updateZoomLevel)

  if (toggle && dataDisplayName) {
    if (!octree[dataDisplayName]) {
      setOctree(scene, dataDisplayName);
    }
    if (!mesh.geometry.attributes.color && octree[dataDisplayName]) {
      originalColor = mesh.material.color;
      mesh.material.color = new THREE.Color(0xf5f5f5);
      mesh.material.vertexColors = THREE.VertexColors;
      var colors = new Float32Array(mesh.geometry.attributes.position.array.length).fill(0.96);
      mesh.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
      mesh.geometry.attributes.color.needsUpdate = true;
      mesh.geometry.colorsNeedUpdate = true;
      mesh.material.needsUpdate = true;
    }
    var maxLength = mesh.geometry.attributes.position.array.length;
    points    = new Float32Array(maxLength).fill(baseValue);
    normals   = new Float32Array(maxLength).fill(baseValue);
    counters = {};

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
    };

    var enableBrushTool = function onDocumentMouseDown(event) {
      initSpline(new THREE.Vector3(), scene);

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

/*  ================================================================  */
/*  Exports functions                                                 */
/*  ================================================================  */
exports.toggleCADBrush          = toggleCADBrush;
exports.resetOctree             = resetOctree;
