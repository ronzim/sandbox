
var path = require('path');
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));
var STLLoader = require( path.join( rootPath, 'lib', 'stl-loader.js'))(THREE);

var geometryNeedle = new THREE.BufferGeometry();
var needleMesh;
var lineSpline;
var bb;

// var initScene = function( canvasId ) {
var initScene = function() {

//================================//
//====== SCENE SETUP =============//
//================================//

var sceneFront = new THREE.Scene();
var sceneBack = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10000 );

var rendererFront = new THREE.WebGLRenderer( { antialias: true } );
var container = document.getElementById("app-container").appendChild(rendererFront.domElement);
var rendererBack = new THREE.WebGLRenderer( { canvas: container, antialias: true } );

// document.getElementById("canvas-container").appendChild(rendererFront.domElement);
// document.getElementById("canvas-container").appendChild(rendererBack.domElement);
rendererFront.setClearColor( 0xAAAAAA, 1 );
rendererFront.setSize(512,512);
rendererBack.setClearColor( 0x000000, 1 );
rendererBack.setSize(512,512);

var control = new THREE.TrackballControls( camera, rendererFront.domElement );

var light = new THREE.AmbientLight( 0xffffff, 1 ); // soft white light
sceneFront.add( light );
sceneBack.add( light );
var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set (0,1,1);
sceneFront.add( directionalLight );
sceneBack.add( directionalLight );

camera.position.z = 20;
camera.position.y = 20;
camera.position.x = 20;

camera.lookAt(0,0,0);

var gridPlane = new THREE.GridHelper(300,50);
var gridPlaneAxis = new THREE.AxisHelper(20);
sceneFront.add (gridPlane);
sceneFront.add (gridPlaneAxis);
sceneBack.add (gridPlane);
sceneBack.add (gridPlaneAxis);


//================================//
//====== SCENE CONTENT ===========//
//================================//

var vs = require('./vertexShader');

var geometry = new THREE.SphereGeometry( 10, 32, 32 );

// plane to clip
var commonPlane = new THREE.Plane(new THREE.Vector3(1,1,1), 3);

// material back
var materialBack = new THREE.ShaderMaterial( {

  uniforms: vs.uniformsBack,
  vertexShader: vs.vertexShader,
  fragmentShader: vs.fragmentShader

  } );

materialBack.side = THREE.BackSide;
materialBack.transparent = true;
materialBack.uniforms.backMesh.value = true;
materialBack.uniforms.alpha.value = 1.0;
materialBack.uniforms.clippingPlane.value = vs.projectPlanes(
  [commonPlane],
  camera,
  0,
  false
);

var meshBack = new THREE.Mesh( geometry, materialBack );
meshBack.position.x = 0;
meshBack.position.y = 5;
meshBack.position.z = 0;
sceneBack.add( meshBack );

// material front
var materialFront = new THREE.ShaderMaterial( {

  uniforms: vs.uniformsFront,
  vertexShader: vs.vertexShader,
  fragmentShader: vs.fragmentShader

  } );

materialFront.side = THREE.FrontSide;
materialFront.transparent = true;
materialFront.uniforms.backMesh.value = false;
materialFront.uniforms.alpha.value = 1.0;
materialFront.uniforms.clippingPlane.value = vs.projectPlanes(
  [commonPlane],
  camera,
  0,
  false
);

var meshFront = new THREE.Mesh( geometry, materialFront );
meshFront.position.x = 0;
meshFront.position.y = 5;
meshFront.position.z = 0;
sceneFront.add( meshFront );
sceneBack.add(sceneFront);

// var planeHelper = new THREE.PlaneHelper(material.uniforms.clippingPlanes.value[0], 30);
// scene.add(planeHelper);


//================================//
//=======RENDER FUNCTION==========//
//================================//
  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);
    rendererBack.render( sceneBack, camera );
    rendererBack.clearDepth();
    // rendererFront.render( sceneFront, camera );
  }

  render();

};

exports.render = initScene;

//=====================================//
//== FUNCTIONS ========================//
//=====================================//
