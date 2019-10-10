
var path = require('path');
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));
var STLLoader = require( path.join( rootPath, 'lib', 'stl-loader.js'))(THREE);
var HelpersContour = require('./helpers.contour').HelpersContour;

var geometryNeedle = new THREE.BufferGeometry();
var needleMesh;
var lineSpline;
var bb;

// var initScene = function( canvasId ) {
var initScene = function() {

//================================//
//====== SCENE SETUP =============//
//================================//

var scene = new THREE.Scene();  // for check

var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10000 );

var renderer = new THREE.WebGLRenderer( { antialias: true } );
var renderer2 = new THREE.WebGLRenderer( { antialias: true } );

// renderer.localClippingEnabled = true;
renderer2.localClippingEnabled = true;

var container = document.getElementById("app-container").appendChild(renderer.domElement);
var container2 = document.getElementById("app-container").appendChild(renderer2.domElement);

renderer.autoClearDepth = false;
renderer2.autoClearDepth = false;  //??

renderer.setClearColor( 0xAAAAAA, 1 );
renderer.setSize(512,512);
renderer2.setClearColor( 0xAAAAAA, 1 );
renderer2.setSize(512,512);

var control = new THREE.TrackballControls( camera, renderer2.domElement );

var light = new THREE.AmbientLight( 0xffffff, 0.5 ); // soft white light
scene.add( light );
var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set (0,1,1);
scene.add( directionalLight );

camera.position.z = 20;
camera.position.y = 20;
camera.position.x = 20;

camera.lookAt(0,0,0);

var gridPlane = new THREE.GridHelper(300,50);
var gridPlaneAxis = new THREE.AxisHelper(20);


//================================//
//====== SCENE CONTENT ===========//
//================================//

var vs = require('./vertexShader');

var geometry = new THREE.SphereGeometry( 10, 32, 32 );
var geometry2 = new THREE.BoxGeometry( 20, 20, 20 );

var globalPos = new THREE.Vector3(2, 0, 0);
var globalPos2 = new THREE.Vector3(-4, 0, 0);

// plane to clip
var commonPlanes = [
  new THREE.Plane(new THREE.Vector3(1,1,1), 0),
  new THREE.Plane(new THREE.Vector3(1,0,0), 0),
  new THREE.Plane(new THREE.Vector3(0,0,1), 2),
];

var commonPlanesNeg = [
  new THREE.Plane(new THREE.Vector3(-1,-1,-1), 0),
  new THREE.Plane(new THREE.Vector3(-1,0,0), 0),
  new THREE.Plane(new THREE.Vector3(0,0,-1), -2),
];

// this is like the 3dScene of planning
var pm = new THREE.MeshPhongMaterial({color: 'skyblue', side: THREE.DoubleSide});
pm.clippingPlanes = commonPlanesNeg;
var mesh = new THREE.Mesh(geometry, pm);
var mesh2 = new THREE.Mesh(geometry2, pm);
mesh.position.copy(globalPos);
mesh2.position.copy(globalPos2);
scene.add(mesh);
scene.add(mesh2);

// for each obj, create clip scenes (front and back)
mesh.fullContourScenes  = createClipScene(mesh.geometry, commonPlanes, new THREE.PerspectiveCamera(), globalPos);
mesh2.fullContourScenes = createClipScene(mesh2.geometry, commonPlanes, new THREE.PerspectiveCamera(), globalPos2);

// add plane helpers
for (var i=0; i<commonPlanes.length; i++){
  var helper2 = new THREE.PlaneHelper(commonPlanesNeg[i], 30);
  scene.add(helper2);
}

// create texture target and geometry to render over
var targetTxt = new THREE.WebGLRenderTarget(512, 512);
var renderGeometry = new THREE.PlaneGeometry(100, 100);

var helperContour = new HelpersContour(renderGeometry, targetTxt);
helperContour.canvasWidth = targetTxt.width;
helperContour.canvasHeight = targetTxt.height;
helperContour.textureToFilter = targetTxt.texture;
helperContour.contourWidth = 2;
helperContour.contourOpacity = 1;
contourScene = new THREE.Scene();
contourScene.add(helperContour);
console.log(contourScene)

//================================//
//=======RENDER FUNCTION==========//
//================================//
var clock = new THREE.Clock();
  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);

    // render each object clipscenes to same targetTxt
    renderer.context.colorMask(false, false, false, false);
    renderer.render( mesh.fullContourScenes.sceneFront, camera, targetTxt );
    renderer.context.colorMask(true, true, true, true);
    renderer.render( mesh.fullContourScenes.sceneBack, camera, targetTxt );

    renderer.context.colorMask(false, false, false, false);
    renderer.render( mesh2.fullContourScenes.sceneFront, camera, targetTxt );
    renderer.context.colorMask(true, true, true, true);
    renderer.render( mesh2.fullContourScenes.sceneBack, camera, targetTxt );

    // render sceneContour
    renderer.render(contourScene, camera);

    // bottom scene, just to check
    renderer2.render( scene, camera );

    // this is to add full countours
    // renderer2.render( mesh.fullContourScenes.sceneFront, camera );
    // renderer2.render( mesh.fullContourScenes.sceneBack, camera);
    // renderer2.clearDepth();
    // renderer2.render( mesh2.fullContourScenes.sceneFront, camera );
    // renderer2.render( mesh2.fullContourScenes.sceneBack, camera );

  }

  render();

};

exports.render = initScene;

//=====================================//
//== FUNCTIONS ========================//
//=====================================//

var createClipScene = function(geometry, clippingPlanes, camera, globalPos){

  var vs = require('./vertexShader');
  var sceneFront = new THREE.Scene();
  var sceneBack = new THREE.Scene();

  var materialBack = new THREE.ShaderMaterial( {

    uniforms: vs.uniforms('back'),
    vertexShader: vs.vertexShader,
    fragmentShader: vs.fragmentShader,
    side: THREE.BackSide,
    transparent: true,

    } );

  // materialBack.clipping = true;
  materialBack.defines = {
    NUM_CLIP_PLANES: clippingPlanes.length
    // NUM_CLIP_PLANES: 1
  };
  console.log(clippingPlanes.length)
  // materialBack.clippingPlanes = [commonPlane]; //TODO
  materialBack.uniforms.backMesh.value = true;
  materialBack.uniforms.alpha.value = 1.0;
  materialBack.uniforms.clippingPlanes.value = vs.projectPlanes(
    clippingPlanes,
    camera,
    0,
    false,
    materialBack.uniforms
  );
  materialBack.uniforms.clippingPlanes.length   = clippingPlanes.length*4;
  materialBack.uniforms.numClippingPlanes.value = clippingPlanes.length;

  // console.log(materialBack.uniforms, vs.uniforms('back'))

  var meshBack = new THREE.Mesh( geometry, materialBack );
  meshBack.position.copy(globalPos);
  sceneBack.add( meshBack );

  // material front
  var materialFront = new THREE.ShaderMaterial( {

    uniforms: vs.uniforms('front'),
    vertexShader: vs.vertexShader,
    fragmentShader: vs.fragmentShader

    } );

  materialFront.side = THREE.FrontSide;
  materialFront.transparent = true;
  materialFront.defines = {
    NUM_CLIP_PLANES: clippingPlanes.length
    // NUM_CLIP_PLANES: 1
  };
  // materialFront.clippingPlanes = [commonPlane]; //TODO
  materialFront.uniforms.backMesh.value = false;
  materialFront.uniforms.alpha.value = 1.0;
  materialFront.uniforms.clippingPlanes.value = vs.projectPlanes(
    clippingPlanes,
    camera,
    0,
    false,
    materialFront.uniforms
  );
  materialFront.uniforms.clippingPlanes.length = clippingPlanes.length*4;
  materialFront.uniforms.numClippingPlanes.value = clippingPlanes.length;


  var meshFront = new THREE.Mesh( geometry, materialFront );
  meshFront.position.copy(globalPos);
  sceneFront.add( meshFront );

  return {sceneFront: sceneFront, sceneBack: sceneBack};

};
