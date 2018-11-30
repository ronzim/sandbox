
/*

  NOTE :

  This example contains some noise about both crop and xray shaders.
  Must divide the two problems in order to be quickly alive averywhere.

*/

// var AMI               = require('/Users/orobix/Projects/ami/build/ami.js');
var AMI                  = require('./libs/ami/ami.js');
console.log(AMI);

var CamerasOrthographic  = AMI.OrthographicCamera;
var ControlsOrthographic = AMI.TrackballOrthoControl;
var ControlsTrackball    = AMI.TrackballControl;
var CoreUtils            = AMI.UtilsCore;

var HelpersBoundingBox   = AMI.BoundingBoxHelper;
var HelpersLocalizer     = AMI.LocalizerHelper;
var HelpersStack         = AMI.StackHelper;
var LoadersVolume        = AMI.VolumeLoader;

var ShadersContourUniform  = AMI.ContourUniformShader;
var ShadersContourVertex   = AMI.ContourVertexShader;
var ShadersContourFragment = AMI.ContourFragmentShader;

var panorex = require('./panorexUtils.js');

// standard global variables
let stats;
let ready = false;

var THREE = require('three');
var STLLoader = require('three-stl-loader')(THREE);
let loader = new LoadersVolume();
let seriesContainer = [];

var globalStack;

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

// 3d renderer
const r1 = {
  domId: 'r1',
  domElement: null,
  renderer: null,
  color: 0x121212,
  // sliceOrientation: 'axial',
  // sliceColor: 0xFF1744,
  targetID: 1,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  // stackHelper: null,
  // localizerHelper: null,
  // localizerScene: null,
};

// 2d sagittal renderer
const r2 = {
  domId: 'r2',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'sagittal',
  sliceColor: 0xFFEA00,
  targetID: 2,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
};

// 2d coronal renderer
const r3 = {
  domId: 'r3',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'coronal',
  sliceColor: 0x76FF03,
  targetID: 3,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
};

// data to be loaded
let dataInfo = [
    ['adi1', {
        location:
        // 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/mesh.stl',
          '/Users/orobix/Desktop/dimaallineata.stl',
        label: 'Left',
        loaded: false,
        material: null,
        materialFront: null,
        materialBack: null,
        mesh: null,
        meshFront: null,
        meshBack: null,
        color: 0xe91e63,
        opacity: 0.7,
    }]
];

let data = new Map(dataInfo);

// extra variables to show mesh plane intersections in 2D renderers
let sceneClip = new THREE.Scene();
let clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
let clipPlane2 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
let clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

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
  renderObj.light = new THREE.DirectionalLight(0xffffff, 1);
  renderObj.light.position.copy(renderObj.camera.position);
  renderObj.scene.add(renderObj.light);

  //axis
  var axis = new THREE.AxisHelper(30);
  renderObj.scene.add(axis);

  // stats
  // stats = new Stats();
  // renderObj.domElement.appendChild(stats.domElement);
}

function initHelpersLocalizer(rendererObj, stack, referencePlane, localizers) {
    rendererObj.localizerHelper = new HelpersLocalizer(
      stack, rendererObj.stackHelper.slice.geometry, referencePlane);

    for (let i = 0; i < localizers.length; i++) {
      rendererObj.localizerHelper['plane' + (i + 1)] = localizers[i].plane;
      rendererObj.localizerHelper['color' + (i + 1)] = localizers[i].color;
    }

    rendererObj.localizerHelper.canvasWidth =
      rendererObj.domElement.clientWidth;
    rendererObj.localizerHelper.canvasHeight =
      rendererObj.domElement.clientHeight;

    rendererObj.localizerScene = new THREE.Scene();
    // rendererObj.localizerScene.add(rendererObj.localizerHelper);
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
    // console.log(files_);
    files_ = files_.filter(f => f[0] !== '.');
    files = _.map(files_, f => dir+f);
    // console.log(files);
  }

  // load sequence for each file
  // instantiate the loader
  // it loads and parses the dicom image
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

    loadMc(stack, r0.scene);

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
    });
};

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

function loadMc(stack, scene){
  var loader = new STLLoader();
  // loader.load('/home/mattia/Desktop/sandbox/bone.stl', function(geometry_) {
  loader.load('../bone.stl', function(geometry_) {
    var geometry = new THREE.Geometry().fromBufferGeometry(geometry_);
    console.log('>>>>> DONE');
    setTimeout(function(){
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      var mcStackHelper = panorex.initMcStackHelper(stack, geometry);
      console.log(mcStackHelper);
      scene.add(mcStackHelper);
    }, 2000);
  });

  console.log(stack)
  // var geometry = new THREE.Geometry();
  // for (var i=0; i<30; i++){
  //   var plane = new THREE.PlaneGeometry(128, 128, 10);
  //   var matrix = new THREE.Matrix4().makeTranslation(70,70,i*3);
  //   plane.applyMatrix(matrix);
  //   geometry.merge(plane);
  // }
  // for (var i=0; i<30; i++){
  //   var plane = new THREE.PlaneGeometry(128, 64, 10);
  //   var matrix1 = new THREE.Matrix4().makeRotationX(-Math.PI/2);
  //   var matrix2 = new THREE.Matrix4().makeTranslation(70,i*5,30);
  //   plane.applyMatrix(matrix1);
  //   plane.applyMatrix(matrix2);
  //   geometry.merge(plane);
  // }
  // for (var z=0; z<80; z++){
  //   var cube = new THREE.BoxGeometry(128,128,10);
  //   var matrix = new THREE.Matrix4().makeTranslation(70,70,z);
  //   cube.applyMatrix(matrix);
  //   geometry.merge(cube);
  // }
  // for (var z=0; z<50; z+=0.5){
  //   var sphere = new THREE.SphereGeometry(z+1,60,60);
  //   var matrix = new THREE.Matrix4().makeTranslation(70,70,30);
  //   sphere.applyMatrix(matrix);
  //   geometry.merge(sphere);
  // }
  // for (var z=0; z<30; z++){
  //   for (var y=0; y<50; y++){
  //     for (var x=0; x<50; x++){
  //       var cube = new THREE.BoxGeometry(2,2,2);
  //       var matrix = new THREE.Matrix4().makeTranslation(x*2,y*2,z*2);
  //       cube.applyMatrix(matrix);
  //       geometry.merge(cube);
  //     }
  //   }
  // }

  // var plane = new THREE.PlaneGeometry(128, 128, 128, 128);
  // var matrix = new THREE.Matrix4().makeTranslation(70,70,50);
  // plane.applyMatrix(matrix);
  // geometry = plane;
  //
  // var mcStackHelper = panorex.initMcStackHelper(stack, geometry);
  // console.log(mcStackHelper);
  // scene.add(mcStackHelper);
  // globalStack = mcStackHelper;
  //
  // var obj = new THREE.BoxGeometry(30,3,3);
  // var matrixObj = new THREE.Matrix4().makeTranslation(90,70,45);
  // obj.applyMatrix(matrixObj);
  // var mat = new THREE.MeshPhongMaterial({color:'red'});
  // var mesh = new THREE.Mesh(obj, mat);
  // scene.add(mesh);
}

initializeData();

// hook up file input listener
document.getElementById('filesinput')
  .addEventListener('change', readMultipleFiles, false);

// TODO list :
// - compute points normals (looking outward) ans planes
// - function for determining point/plane side
// - manage varying uniform array length
// - manage more than one crop

function crop(){
  console.log(globalStack._slice._material.uniforms.uVec3Array.value[0]);
  console.log(globalStack._slice._material.uniforms.uVec3Array.value[1]);
  globalStack._slice._material.uniforms.uVec3Array.length = 3;
  globalStack._slice._material.uniforms.uVec3Array.value[0] = new THREE.Vector3(50, 50, 0);
  globalStack._slice._material.uniforms.uVec3Array.value[1] = new THREE.Vector3(80, 80, 0);
  globalStack._slice._material.uniforms.uVec3Array.value[2] = new THREE.Vector3(10, 10, 0);
  console.log(globalStack._slice._material.uniforms.uVec3Array.value[0]);
  console.log(globalStack._slice._material.uniforms.uVec3Array.value[1]);
  console.log(globalStack._slice._material.uniforms.uVec3Array.value[2]);

  console.log('crop');
}

exports.crop = crop;
