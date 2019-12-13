// Node modules
// var AMI = require('ami.js');

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
        'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/mesh.stl',
          // '/Users/orobix/Desktop/dimaallineata.stl',
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

  // stats
  // stats = new Stats();
  // renderObj.domElement.appendChild(stats.domElement);
}
function initRenderer2D(rendererObj) {
  // renderer
  rendererObj.domElement = document.getElementById(rendererObj.domId);
  rendererObj.renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  rendererObj.renderer.autoClear = false;
  rendererObj.renderer.localClippingEnabled = false; //TODO DEV
  rendererObj.renderer.setSize(
    rendererObj.domElement.clientWidth, rendererObj.domElement.clientHeight);
  rendererObj.renderer.setClearColor(0x121212, 1);
  rendererObj.renderer.domElement.id = rendererObj.targetID;
  rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

  // camera
  rendererObj.camera = new CamerasOrthographic(
    rendererObj.domElement.clientWidth / -2,
    rendererObj.domElement.clientWidth / 2,
    rendererObj.domElement.clientHeight / 2,
    rendererObj.domElement.clientHeight / -2,
    0.1, 10000);

  // controls
  rendererObj.controls = new ControlsOrthographic(
    rendererObj.camera, rendererObj.domElement);
  rendererObj.controls.staticMoving = false;
  rendererObj.controls.noRotate = false;
  rendererObj.camera.controls = rendererObj.controls;

  // scene
  rendererObj.scene = new THREE.Scene();
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
      r1.controls.update();
      r2.controls.update();
      r3.controls.update();

      r0.light.position.copy(r0.camera.position);
      r0.renderer.render(r0.scene, r0.camera);

      // r1
      // r1.light.position.copy(r1.camera.position);
      // r1.renderer.render(r1.scene, r1.camera);

      // r2
      r2.renderer.clear();
      r2.renderer.render(r2.scene, r2.camera);
      // mesh
      r2.renderer.clearDepth();
      r2.renderer.render(sceneClip, r2.camera);

      // r3
      r3.renderer.clear();
      r3.renderer.render(r3.scene, r3.camera);
      // mesh
      r3.renderer.clearDepth();
      r3.renderer.render(sceneClip, r3.camera);

    }

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }

  // renderers
  initRenderer3D(r0);
  initRenderer3D(r1);
  initRenderer2D(r2);
  initRenderer2D(r3);

  console.log("r0", r0);
  console.log("r3", r3);

  // start rendering loop
  animate();
}

init();

// window.onload = function() {
initializeData = function(_files) {
  // init threeJS

  var _ = require("underscore");
  var files = [];
  _.each(_files,function(v) {
    // console.log(v);
    files.push( v.path );
  });

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
    let stack = series.stack[0];
    stack.prepare();

    // center 3d camera/control on the stack
    let centerLPS = stack.worldCenter();
    r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    r0.camera.updateProjectionMatrix();
    r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

    // bouding box
    let boxHelper = new HelpersBoundingBox(stack);
    r0.scene.add(boxHelper);

    // THIS IS THE TRIGGER

    var [points, plane] = panorex.generateFakePoints(stack);
    var origin = new THREE.Vector3(268, 208, 100);
    // var origin = new THREE.Vector3(0, 0, 0);
    console.log(points, plane, origin);
    // panorex.drawPlane(plane,r3.scene,"yellow",500);
    // var spline   = new THREE.CatmullRomCurve3(points);
    // var ppp      = spline.getPoints(50);
    // var geometry = new THREE.BufferGeometry().setFromPoints( ppp );
    // var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    // var curveObject = new THREE.Line( geometry, material );
    // r3.scene.add(curveObject);

    // yellow slice
    panorex.setCamera(r2,stack);
    // r2.stackHelper = panorex.initStackHelper(r2.renderer, points, plane, stack);
    r2.stackHelper = panorex.generateCrossSections(0.5, points, plane, stack);
    r2.scene.add(r2.stackHelper);
    // r0.scene.add(r2.scene);

    // green slice
    panorex.setCamera(r3,stack);
    // r3.stackHelper = panorex.initStackHelper(r3.renderer, points, plane, stack);
    r3.stackHelper = panorex.generateCrossSections(0.5, points, plane, stack);
    r3.stackHelper.name = 'stackHelper';
    r3.scene.add(r3.stackHelper);

    // var axis = new THREE.AxisHelper(30);
    // r3.stackHelper.add(axis);

    r0.scene.add(r3.scene);

    // add to any canvas
    // var aDomElement = document.getElementById("r1");
    // var aRenderer = new THREE.WebGLRenderer({
    //   antialias: true,
    // });
    // aDomElement.appendChild(aRenderer.domElement);
    // aRenderer.setSize(aDomElement.clientWidth, aDomElement.clientHeight);
    // aRenderer.setClearColor(0x121212, 1);
    // aRenderer.domElement.id = "1";
    // var aCamera = new CamerasOrthographic(
    //   aDomElement.clientWidth / -2,
    //   aDomElement.clientWidth / 2,
    //   aDomElement.clientHeight / 2,
    //   aDomElement.clientHeight / -2,
    //   0.1, 10000);
    // var aScene = new THREE.Scene();
    // // panorex.setCamera(r3,stack);
    // aStackHelper = panorex.initStackHelper(aScene, stack);
    // console.log(stack);
    //
    // aRenderer.render(aScene, aCamera);
    //
    // console.log(aScene);

    // ===========================================
    // =========== GUI ===========================
    // ===========================================

    let gui = new dat.GUI({
      autoPlace: false,
    });

    var cs = {
      s: 0.5,
      r: 0.5,
    };

    let customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    gui.add(cs,'s', 0, 1).step(0.01).onChange(function (v){
      console.log(v);
      var spline = new THREE.CatmullRomCurve3(points);
      console.log(spline);
      var currP  = spline.getPoint(v);
      var pos    = currP.multiplyScalar(0.33); //apply ijk2LPS matrix
      console.log(pos);
      var tang   = spline.getTangent(v);
      // var euler  = new THREE.Euler().setFromVector3(tang);
      // var rot    = tang.cross(plane.normal); //  plane is panorexPlane
      console.log(tang);
      var angleZ  = tang.angleTo(new THREE.Vector3(1,0,0));
      var angleY  = tang.angleTo(new THREE.Vector3(0,0,1));
      // var angleX  = tang.angleTo(new THREE.Vector3(0,1,0));
      if (tang.y<0){angleZ = -angleZ;}
      var end = r3.scene.children.length-1;
      r3.scene.children[end].rotation.set(0, 0, angleZ);
      // r3.scene.children[end].lookAt(tang);
      r3.scene.children[end].position.set(pos.x, pos.y, pos.z);
    });

    gui.add(cs,'s', 0, 1).step(0.01).onChange(function (v){
      console.log(v);
      var spline = new THREE.CatmullRomCurve3(points);
      var currP  = spline.getPoint(v);
      var tang   = spline.getTangent(v).normalize();
      var pos    = currP.multiplyScalar(0.33); //apply ijk2LPS matrix
      // var trMat  = new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z);
      // var angles = new THREE.Euler().setFromVector3(tang);
      // angles.z = angles.y;
      // angles.x = 0;
      // angles.y = 0;
      // console.log(angles);
      // var matrix = new THREE.Matrix4().makeRotationFromEuler(angles);
      // matrix.setPosition(pos);

      // var matrix = new THREE.Matrix4();
      // var focalPoint = new THREE.Vector3().copy(pos).add(tang);
      var csPlane      = new THREE.Plane().setFromNormalAndCoplanarPoint(tang, pos);
      var newPlaneGeom = panorex.createCSGeometry(csPlane, pos);
      newPlaneGeom.applyMatrix(stack.lps2IJK);
      // r3.stackHelper   = panorex.generateCrossSections(v, points, plane, stack);
      // r3.stackHelper._slice._update(newPlaneGeom);
      r3.stackHelper.geom = newPlaneGeom; //TODO update geometry without re-generate stack
      // r3.stackHelper.name = 'stackHelper';
      //
      var mat = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
      var planeMesh = new THREE.Mesh(newPlaneGeom, mat);
      // r3.scene.add(planeMesh);

      // var oldStack = r3.scene.getObjectByName('stackHelper');
      // if (oldStack){
      //   r3.scene.remove(oldStack);
      // }
      //
      // r3.scene.add(r3.stackHelper);

      // // var up = tang.clone().cross(plane.normal);
      // var up = new THREE.Vector3(0,0,1);
      // // console.log(up);
      // matrix.lookAt(pos, focalPoint, up);
      // matrix.setPosition(pos);
      // var end = r3.scene.children.length-1;
      // r2.scene.children[end].matrixAutoUpdate = false;
      // r3.scene.children[end].matrixAutoUpdate = false;
      // r2.scene.children[end].matrix = matrix;
      // r3.scene.children[end].matrix = matrix;
      // var end = r3.scene.children.length-1;
      // r3.scene.children[end].matrixAutoUpdate = false;
      // r3.scene.children[end]._geometry.lookAt(focalPoint);
      // r3.scene.children[end]._geometry.translate(pos.x, pos.y, pos.z);

      // Create plane
      // var plane = new THREE.Plane();
      // plane.setFromNormalAndCoplanarPoint(tang, currP).normalize();
      // addPlaneToScene(plane, r3.scene);
    });


    // Yellow
    let stackFolder2 = gui.addFolder('Sagittal (yellow)');
    let yellowChanged = stackFolder2.add(
      r2.stackHelper,
      'index', 0, r2.stackHelper.orientationMaxIndex).step(1).listen();
    stackFolder2.add(
      r2.stackHelper.slice, 'interpolation', 0, 1).step(1).listen();

    // Green
    let stackFolder3 = gui.addFolder('Coronal (green)');
    let greenChanged = stackFolder3.add(
      r3.stackHelper,
      'index', 0, r3.stackHelper.orientationMaxIndex).step(1).listen();
    stackFolder3.add(
      r3.stackHelper.slice, 'interpolation', 0, 1).step(1).listen();

    var tr = {
      x: 0,
      y: 0,
      z: 0,
      rx: 0,
      ry: 0,
      rz: 0
    };

    // PANOREX
    let stackFolder4 = gui.addFolder('Panorex');
    let trXchange = stackFolder4.add(
      tr, 'x').min(-200).max(200).step(0.1).onChange(function (v){
        var end = r3.scene.children.length-1;
        var curr_pos = r3.scene.children[end].position;
        r3.scene.children[end].position.set(v,curr_pos.y,curr_pos.z);
      });
    let trYchange = stackFolder4.add(
      tr, 'y').min(-200).max(200).step(0.1).onChange(function (v){
        var end = r3.scene.children.length-1;
        var curr_pos = r3.scene.children[end].position;
        r3.scene.children[end].position.set(curr_pos.x,v,curr_pos.z);
      });
    let trZchange = stackFolder4.add(
      tr, 'z').min(-200).max(200).step(0.1).onChange(function (v){
        var end = r3.scene.children.length-1;
        var curr_pos = r3.scene.children[end].position;
        r3.scene.children[end].position.set(curr_pos.x,curr_pos.y, v);
      });
    let rXchange = stackFolder4.add(
      tr, 'rx').min(-3).max(3).step(0.1).onChange(function (v){
        var end = r3.scene.children.length-1;
        var curr_rot = r3.scene.children[end].position;
        r3.scene.children[end].rotation.set(v, curr_rot.y, curr_rot.z);
      });
    let rYchange = stackFolder4.add(
      tr, 'ry').min(-3).max(3).step(0.1).onChange(function (v){
        var end = r3.scene.children.length-1;
        var curr_rot = r3.scene.children[end].position;
        r3.scene.children[end].rotation.set(curr_rot.x, v, curr_rot.z);
      });
    let rZchange = stackFolder4.add(
      tr, 'rz').min(-3).max(3).step(0.1).onChange(function (v){
        var end = r3.scene.children.length-1;
        var curr_rot = r3.scene.children[end].position;
        r3.scene.children[end].rotation.set(curr_rot.x, curr_rot.y, v);
      });

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
   initializeData(evt.target.files);
};


// hook up file input listener
document.getElementById('filesinput')
  .addEventListener('change', readMultipleFiles, false);
