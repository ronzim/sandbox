
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

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10000 );

var renderer = new THREE.WebGLRenderer( { antialias: true } );
document.getElementById("canvas-container").appendChild(renderer.domElement)
renderer.setClearColor( 0xAAAAAA, 1 );
renderer.setSize(512,512);

var control = new THREE.TrackballControls( camera, renderer.domElement );

var light = new THREE.AmbientLight( 0xffffff, 1 ); // soft white light
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
scene.add (gridPlane);
scene.add (gridPlaneAxis);


//================================//
//====== SCENE CONTENT ===========//
//================================//

var vs = require('./vertexShader');

// var geometry = new THREE.BoxGeometry( 10, 10, 10 );
var geometry = new THREE.SphereGeometry( 10, 32, 32);

// plane to clip
var commonPlane = new THREE.Plane(new THREE.Vector3(1,1,1), 3);

// material back
var materialBack = new THREE.ShaderMaterial( {

  uniforms: vs.uniformsBack,
  vertexShader: vs.vertexShader,
  fragmentShader: vs.fragmentShader

  } );

materialBack.side = THREE.DoubleSide;
materialBack.transparent = true;
materialBack.depthTest = true;
materialBack.depthWrite = true;
materialBack.depthFunc = THREE.AlwaysDepth;
// materialBack.opacity = 0.5;
materialBack.uniforms.alpha.value = 1.0;
materialBack.uniforms.clippingPlane.value = vs.projectPlanes(
  [commonPlane],
  camera,
  0,
  false
);

var basicMaterial = new THREE.MeshPhongMaterial({color: 'skyblue', side: THREE.DoubleSide, clippingPlanes: [commonPlane]});

var meshBack = new THREE.Mesh( geometry, materialBack );
meshBack.position.x = 0;
meshBack.position.y = 5;
meshBack.position.z = 0;
scene.add( meshBack );

// material front
// var materialFront = new THREE.ShaderMaterial( {
//
//   uniforms: vs.uniformsFront,
//   vertexShader: vs.vertexShader,
//   fragmentShader: vs.fragmentShader
//
//   } );
//
// materialFront.side = THREE.FrontSide;
// materialFront.transparent = true;
// // materialFront.opacity = 0.3;
// materialFront.uniforms.alpha.value = 1.0;
// materialFront.uniforms.clippingPlane.value = vs.projectPlanes(
//   [commonPlane],
//   camera,
//   0,
//   false
// );
//
// var meshFront = new THREE.Mesh( geometry, materialFront );
// meshFront.position.x = 0;
// meshFront.position.y = 5;
// meshFront.position.z = 0;
// scene.add( meshFront );

// var planeHelper = new THREE.PlaneHelper(material.uniforms.clippingPlanes.value[0], 30);
// scene.add(planeHelper);


//================================//
//=======RENDER FUNCTION==========//
//================================//
  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);
    renderer.render( scene, camera );
  }

  render();

};

exports.render = initScene;

//=====================================//
//== FUNCTIONS ========================//
//=====================================//
