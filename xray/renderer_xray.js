
/*

  NOTE :

  This example contains some noise about both crop and xray shaders.
  Must divide the two problems in order to be quickly alive averywhere.

*/

// var AMI               = require('/Users/orobix/Projects/ami/build/ami.js');
var AMI = require('./libs/ami/ami.js')
console.log(AMI)

var ControlsTrackball = AMI.TrackballControl
var HelpersStack = AMI.StackHelper
var LoadersVolume = AMI.VolumeLoader
var panorex = require('./panorexUtils.js')

// standard global variables
let ready = false

var THREE = require('three');
var STLLoader = require('three-stl-loader')(THREE);
// let loader = new LoadersVolume();

// 3d renderer
const r0 = {
  domId: 'r0',
  domElement: null,
  renderer: null,
  color: 0x212121,
  targetID: 0,
  camera: null,
  controls: null,
  scene: null,
  light: null,
};

function initRenderer3D(renderObj) {
  // renderer
  renderObj.domElement = document.getElementById(renderObj.domId);
  renderObj.renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderObj.renderer.setSize(
    renderObj.domElement.clientWidth, renderObj.domElement.clientHeight);
  renderObj.renderer.setClearColor(renderObj.color, 1);
  renderObj.renderer.domElement.id = renderObj.targetID;
  renderObj.domElement.appendChild(renderObj.renderer.domElement);

  // camera
  renderObj.camera = new THREE.PerspectiveCamera(
    45, renderObj.domElement.clientWidth / renderObj.domElement.clientHeight,
    0.1, 100000);
  renderObj.camera.position.x = 250;
  renderObj.camera.position.y = 250;
  renderObj.camera.position.z = 250;

  // controls
  renderObj.controls = new ControlsTrackball(
    renderObj.camera, renderObj.domElement);
  renderObj.controls.rotateSpeed = 5.5;
  renderObj.controls.zoomSpeed = 1.2;
  renderObj.controls.panSpeed = 0.8;
  renderObj.controls.staticMoving = true;
  renderObj.controls.dynamicDampingFactor = 0.3;

  // scene
  renderObj.scene = new THREE.Scene();

  // light
  renderObj.light = new THREE.DirectionalLight(0xffffff, 10);
  renderObj.light.position.copy(renderObj.camera.position);
  renderObj.scene.add(renderObj.light);
  renderObj.ambientLight = new THREE.AmbientLight(0xffffff, 1);
  renderObj.scene.add(renderObj.ambientLight);

  //axis
  var axis = new THREE.AxisHelper(30);
  renderObj.scene.add(axis);

  // stats
  // stats = new Stats();
  // renderObj.domElement.appendChild(stats.domElement);
}

/**
 * Init the quadview
 */
function init() {
  /**
   * Called on each animation frame
   */
  function animate() {
    // we are ready when both meshes have been loaded
    if (ready) {
      // render
      r0.controls.update();
      r0.light.position.copy(r0.camera.position);
      r0.renderer.render(r0.scene, r0.camera);
    }

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }

  // renderers
  initRenderer3D(r0);

  console.log("r0", r0);

  // start rendering loop
  animate();
}

init();

// window.onload = function() {
initializeData = function(_files) {
  // init threeJS

  var _ = require("underscore");
  var files = [];

  if (_files){
    _.each(_files,function(v) {
      // console.log(v);
      files.push( v.path );
    });
  }
  else{
    var fs = require('fs-extra');
    var dir = '/Users/orobix/Desktop/DICOM/DICOM CASO GUIDATA/BOCCONFRANCESCA_3_15626_40/CT_mpleSeries_6784_2017030909996/';
    // var dir = '/home/mattia/sandbox/material/DICOM/';
    var files_ = fs.readdirSync(dir);
    console.log(files_);
    files_ = files_.filter(f => f[0] !== '.');
    files = _.map(files_, f => dir+f);
    console.log(files);
  }

  // load sequence for each file
  // instantiate the loader
  // it loads and parses the dicom image
// setTimeout(function(){
  let loader = new LoadersVolume();
  loader.load(files)
  .then(function() {
    let series = loader.data[0].mergeSeries(loader.data)[0];
    loader.free();
    loader = null;
    // get first stack from series
    console.log(series);
    let stack = series.stack[0];
    stack.prepare();

    // center 3d camera/control on the stack
    let centerLPS = stack.worldCenter();
    r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    r0.camera.updateProjectionMatrix();
    r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

    // bouding box
    // let boxHelper = new HelpersBoundingBox(stack);
    // r0.scene.add(boxHelper);

    r0.stackHelper = new HelpersStack(stack);
    // r0.scene.add(r0.stackHelper);

    // loadMc(stack, r0.scene);
    loadSurfaces(stack, r0.scene, 0);

    // ===========================================
    // =========== GUI ===========================
    // ===========================================

    // let gui = new dat.GUI({
    //   autoPlace: false,
    // });
    //
    // var cs = {
    //   s: 0.5,
    //   r: 0.5,
    // };

    // let customContainer = document.getElementById('my-gui-container');
    // customContainer.appendChild(gui.domElement);

    // gui.add(cs,'s', 0, 1).step(0.01).onChange(function (v){
    //   console.log(v);
    // });

        ready = true;

    })
    .catch(function(error) {
      window.console.log('oops... something went wrong...');
      window.console.log(error);
    })
}

/**
 * Parse incoming files
 */
function readMultipleFiles(evt) {
  /**
   * Load sequence
   */
   console.log(evt.target.files);
   initializeData(evt.target.files);
}

var i=0;
// var fileNames = ['../bone.stl'];
var path = '/Users/orobix/Desktop/segmentation_layers/'
var fileNames = [
                  '150_dec90.stl',
                  // '175_dec90.stl',
                  // '200_dec90.stl',
                  // '225_dec90.stl',
                  '250_dec90.stl'
                  // '500.stl',
                  // '1000.stl',
                  // '2000.stl'
                ];
var completeGeometry = new THREE.Geometry();

function loadSurfaces(stack, scene, i){
  if (fileNames[i]){
    console.log('surface', i);
    var loader = new STLLoader();
    loader.load(path+fileNames[i], function(geometry_) {
      console.log(geometry_)
      var geometry = new THREE.Geometry().fromBufferGeometry(geometry_);
      console.log('>>>>> from buffer geometry to geometry', geometry_);
      completeGeometry.merge(geometry);
      i++;
      setTimeout(function(){
        loadSurfaces(stack, scene, i);
        console.log(completeGeometry)
      }, 100);
    });
  }
  else{
    setTimeout(function(){
      loadMc(stack, scene, completeGeometry);
    }, 100);
  }
}

function loadMc(stack, scene, geometry){
  // console.log('>>>>> from buffer geometry to geometry', geometry_);
  // var geometry = new THREE.Geometry().fromBufferGeometry(geometry_);
  setTimeout(function(){
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    var matrix = new THREE.Matrix4();
    matrix.elements = [-1, 0, 0, 0,
                        0, -1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0 ,1 ];
    geometry.applyMatrix(matrix);
    var mcStackHelper = panorex.initMcStackHelper(stack, geometry);
    console.log(mcStackHelper);
    scene.add(mcStackHelper);
    console.log(scene);
  }, 5000);
}


// function loadMc(stack, scene, geometry_){
//   var loader = new STLLoader();
//   // loader.load('/home/mattia/Desktop/sandbox/bone.stl', function(geometry_) {
//   loader.load('../bone.stl', function(geometry_) {
//     var geometry = new THREE.Geometry().fromBufferGeometry(geometry_);
//     console.log('>>>>> DONE');
//     setTimeout(function(){
//       geometry.computeVertexNormals();
//       geometry.computeBoundingBox();
//       var mcStackHelper = panorex.initMcStackHelper(stack, geometry);
//       console.log(mcStackHelper);
//       scene.add(mcStackHelper);
//     }, 2000);
//   });
// }

console.log('init data')
initializeData();

// hook up file input listener
document.getElementById('filesinput')
  .addEventListener('change', readMultipleFiles, false);
