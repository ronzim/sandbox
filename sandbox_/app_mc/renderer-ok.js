// AMI
var AMI  = require('./libs/ami/ami.js');

var CamerasOrthographic    = AMI.OrthographicCamera;
var ControlsOrthographic   = AMI.TrackballOrthoControl;
var ControlsTrackball      = AMI.TrackballControl;
var HelpersBoundingBox     = AMI.BoundingBoxHelper;
var HelpersLocalizer       = AMI.LocalizerHelper;
var HelpersStack           = AMI.StackHelper;
var CoreUtils              = AMI.UtilsCore;
var LoadersVolume          = AMI.VolumeLoader;
var ShadersContourVertex   = AMI.ContourVertexShader;
var ShadersContourUniform  = AMI.ContourUniformShader;
var ShadersContourFragment = AMI.ContourFragmentShader;

// DEV

var ShadersContourVertexPanorex   = require('./libs/ami/shaders.contour.vertex.js').ShadersVertex;
var ShadersContourUniformPanorex  = require('./libs/ami/shaders.contour.uniform.js').ShadersUniform;
var ShadersContourFragmentPanorex = require('./libs/ami/shaders.contour.fragment.js').ShadersFragment;
var panorexUtils                  = require('./panorexUtils.js');

// END DEV =============================


// standard global variables
let stats;
let ready = false;

let redTextureTarget = null;
let redContourMesh = null;
let redCountourScene = null;
let redContourMaterial = null;

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

// 2d axial renderer
const r1 = {
  domId: 'r1',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'axial',
  sliceColor: 0xFF1744,
  targetID: 1,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
};

// 2d panorex renderer
const r2 = {
  domId: 'r2',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'coronal',
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
        location: './stl/decimated.stl',
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
    }],
    ['adi2', {
        location: './stl/impianto.stl',
        label: 'Left',
        loaded: false,
        material: null,
        materialFront: null,
        materialBack: null,
        mesh: null,
        meshFront: null,
        meshBack: null,
        color: 0xc5f442,
        opacity: 0.8,
    }],
    ['adi3', {
        location: './stl/impianto2.stl',
        label: 'Left',
        loaded: false,
        material: null,
        materialFront: null,
        materialBack: null,
        mesh: null,
        meshFront: null,
        meshBack: null,
        color: 0x41f449,
        opacity: 0.8,
    }],
    ['adi4', {
        location: './stl/impianto3.stl',
        label: 'Left',
        loaded: false,
        material: null,
        materialFront: null,
        materialBack: null,
        mesh: null,
        meshFront: null,
        meshBack: null,
        color: 0x41f4c4,
        opacity: 0.8,
    }]
];

let data = new Map(dataInfo);

// extra variables to show mesh plane intersections in 2D renderers
let sceneClip  = new THREE.Scene();
let clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
let clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

// DEV panorex contours ========================================================
var clipPlanes = [
  new THREE.Plane( new THREE.Vector3(  0, 1, 0 ), 0),
  new THREE.Plane( new THREE.Vector3(  0, 1, 0 ), 0 ),
  new THREE.Plane( new THREE.Vector3(  0, 1, 0 ), 0 ),
  new THREE.Plane( new THREE.Vector3(  0, 1, 0 ), 0 ),
  new THREE.Plane( new THREE.Vector3(  1, 0, 0 ), 0 ),
  new THREE.Plane( new THREE.Vector3(  1, 0, 0 ), 0 ),
  new THREE.Plane( new THREE.Vector3(  1, 0, 0 ), 0 ),
  new THREE.Plane( new THREE.Vector3(  1, 0, 0 ), 0 )
];
// END DEV =====================================================================


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
    0.1, 125000);
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

}
function initRenderer2D(rendererObj) {
  // renderer
  rendererObj.domElement = document.getElementById(rendererObj.domId);
  rendererObj.renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  rendererObj.renderer.autoClear = false;
  rendererObj.renderer.localClippingEnabled = true;  //TODO
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
    1, 1250);

  // controls
  rendererObj.controls = new ControlsOrthographic(
    rendererObj.camera, rendererObj.domElement);
  rendererObj.controls.staticMoving = true;
  rendererObj.controls.noRotate = true;
  rendererObj.camera.controls = rendererObj.controls;

  // scene
  rendererObj.scene = new THREE.Scene();
}

function initHelpersStack(rendererObj, stack) {
    rendererObj.stackHelper = new HelpersStack(stack);
    rendererObj.stackHelper.bbox.visible = false;
    rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
    rendererObj.stackHelper.slice.canvasWidth =
      rendererObj.domElement.clientWidth;
    rendererObj.stackHelper.slice.canvasHeight =
      rendererObj.domElement.clientHeight;

    // set camera
    let worldbb = stack.worldBoundingBox();
    let lpsDims = new THREE.Vector3(
      (worldbb[1] - worldbb[0])/2,
      (worldbb[3] - worldbb[2])/2,
      (worldbb[5] - worldbb[4])/2
    );

    let box = {
      center: stack.worldCenter().clone(),
      halfDimensions:
        new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
    };

    // init and zoom
    let canvas = {
        width: rendererObj.domElement.clientWidth,
        height: rendererObj.domElement.clientHeight,
      };

    rendererObj.camera.directions =
      [stack.xCosine, stack.yCosine, stack.zCosine];
    rendererObj.camera.box = box;
    rendererObj.camera.canvas = canvas;
    rendererObj.camera.orientation = rendererObj.sliceOrientation;
    rendererObj.camera.update();
    rendererObj.camera.fitBox(2, 1);

    rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
    rendererObj.stackHelper.index =
      Math.floor(rendererObj.stackHelper.orientationMaxIndex/2);
    rendererObj.scene.add(rendererObj.stackHelper);
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
      r0.renderer.clearDepth();
      r0.renderer.render(r0.scene, r0.camera);

      // r1
      r1.renderer.clear();
      r1.renderer.render(r1.scene, r1.camera);
      // mesh
      r1.renderer.clearDepth();

      data.forEach(function(object, key) {
        object.materialFront.clippingPlanes = [clipPlane1];
        object.materialBack.clippingPlanes = [clipPlane1];
        r1.renderer.render(object.scene, r1.camera, redTextureTarget, true);
        r1.renderer.clearDepth();
        redContourMaterial.uniforms.uWidth.value = object.selected ? 2 : 1;
        r1.renderer.render(redCountourScene, r1.camera);
        r1.renderer.clearDepth();
      });

      // r2
      r2.renderer.clear();
      r2.renderer.render(r2.scene, r2.camera);
      // mesh
      r2.renderer.clearDepth();

      // DEV panoContours ======================================================
      data.forEach(function(object, key) {
        object.materialFront.clippingPlanes = clipPlanes;
        object.materialBack.clippingPlanes = clipPlanes;
        r2.renderer.render(object.scene, r2.camera, yellowTextureTarget, true);
        r1.renderer.clearDepth();
        yellowContourMaterial.uniforms.uWidth.value = object.selected ? 2 : 1;
        r2.renderer.render(yellowCountourScene, r2.camera);
        r2.renderer.clearDepth();
      });
      // r2.renderer.render(sceneClip, r2.camera);

      // END DEV ===============================================================


      // r3
      r3.renderer.clear();
      r3.renderer.render(r3.scene, r3.camera);
      // mesh
      r3.renderer.clearDepth();
      data.forEach(function(object, key) {
        object.materialFront.clippingPlanes = [clipPlane3];
        object.materialBack.clippingPlanes = [clipPlane3];
      });
      r3.renderer.render(sceneClip, r3.camera);
      data.forEach(function(object, key) {
        object.materialFront.clippingPlanes = [clipPlane3];
        object.materialBack.clippingPlanes = [clipPlane3];
        r3.renderer.render(object.scene, r3.camera, greenTextureTarget, true);
        r3.renderer.clearDepth();
        greenContourMaterial.uniforms.uWidth.value = object.selected ? 2 : 1;
        r3.renderer.render(greenCountourScene, r3.camera);
        r3.renderer.clearDepth();
      });
    }

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }

  // renderers
  initRenderer3D(r0);
  initRenderer2D(r1);
  initRenderer2D(r2);
  initRenderer2D(r3);

  // start rendering loop
  animate();
}

init();



// window.onload = function() {
initializeData = function(_files) {
  // init threeJS

  var _ = require('./libs/underscore.js');
  var files = [];
  _.each(_files,function(v) {
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

    let gui = new dat.GUI({
      autoPlace: false,
    });

    var params = {
      panorexShift: 0.0
    };

    gui.add(params,'panorexShift', -2, 2).step(0.01).onChange(function (v){
      var res = panorexUtils.generateFakePoints(stack);
      var points = res[0];
      var plane = res[1];

      // shift panorex points along panorex spline normal
      var panorexPoints = panorexUtils.shiftPoints(points, v*20);
      // create new geometry
      var boom = panorexUtils.updateGeometry(panorexPoints, plane, r2.stackHelper.stack, r2.renderer);
      // update internal variables
      r2.stackHelper.updateOptions(boom.options);
      // update geometry
      r2.stackHelper.geom = boom.geometry;
  })
  .catch(function(error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
  });
}

/**
 * Parse incoming files
 */
function readMultipleFiles(evt) {
  /**
   * Load sequence
   */
   initializeData(evt.target.files);
   console.log(evt.target.files)
}

// hook up file input listener
document.getElementById('filesinput')
  .addEventListener('change', readMultipleFiles, false);
