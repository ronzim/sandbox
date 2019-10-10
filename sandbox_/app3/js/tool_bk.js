
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

camera.lookAt(0,3,0);

var gridPlane = new THREE.GridHelper(300,50);
var gridPlaneAxis = new THREE.AxisHelper(20);
scene.add (gridPlane);
scene.add (gridPlaneAxis);

// array of cameras
var cameras = [];
var AMOUNT = 6;
var SIZE_X = 1 / AMOUNT;
var SIZE_Y = 1;
var ASPECT_RATIO = window.innerWidth / window.innerHeight;
var width = window.innerWidth;
var height = window.innerHeight;
for (i=0; i<AMOUNT; i++){
  var subcamera = new THREE.PerspectiveCamera( 40, ASPECT_RATIO, 0.1, 1000 );
  // var subcamera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 0.1, 1000 );
  subcamera.bounds = new THREE.Vector4( i/AMOUNT, 0, SIZE_X, SIZE_Y );
  subcamera.position.x = ( i / AMOUNT )*60;
  subcamera.position.y = ( i / AMOUNT )*60;
  subcamera.position.z = 40;
  // subcamera.zoom = 0.1;
  subcamera.lookAt( new THREE.Vector3() );
  subcamera.updateMatrixWorld();
  cameras.push( subcamera );
}
var arrayCamera = new THREE.ArrayCamera(cameras);


//================================//
//====== SCENE CONTENT ===========//
//================================//

  //ADD NEEDLE FROM STL

  // var loader = new STLLoader();
  // var geometryFunction = function(_geometry){
  //   //_geometry.rotateY(Math.PI/2);
  //   //_geometry.translate(0,90,-50);
  //   geometryNeedle = _geometry;
  //   var needleMaterial = new THREE.MeshBasicMaterial( { color: 0x441123, wireframe: true} );
  //   needleMesh = new THREE.Mesh( geometryNeedle, needleMaterial );
  //   needleMesh.geometry.verticesNeedsUpdate = true;
  //   needleMesh.position.set(0,0,0);
  //   console.log(needleMesh)
  //   scene.add(needleMesh);
  //
  // };
  //
  // loader.load('./resources/ago.stl', geometryFunction);


  // ADD POINTS

  // var dotsGeometry = new THREE.Geometry();
  // var dotsMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
  // var dots = new THREE.Points( dotsGeometry, dotsMaterial );
  // dots.geometry.verticesNeedsUpdate = true;
  // dotsGeometry.vertices.push(new THREE.Vector3(-10,0,0));
  // dotsGeometry.vertices.push(new THREE.Vector3(10,0,0));
  // scene.add(dots);
  // lineSpline = drawContour(dots);
  // scene.add(lineSpline);

  // add cube
  // var cg = new THREE.BoxGeometry(10, 10, 10);
  // var cm = new THREE.MeshPhongMaterial({color: 'green'});
  // var cube = new THREE.Mesh(cg, cm);
  // scene.add(cube);

  // mesh basic material -> shader material with same shader
  var cg1 = new THREE.BoxGeometry(10, 10, 10);
  var cg2 = new THREE.BoxGeometry(10, 10, 10);

  var cm = new THREE.MeshBasicMaterial({color: 'green'});
  var cube = new THREE.Mesh(cg1, cm);
  scene.add(cube);

  var vs = require('./vertexShader.js');
  // console.log(vs);

  var sm = new THREE.ShaderMaterial({
    uniforms: vs.uniforms,
    vertexShader: vs.vertexShader,
    fragmentShader: vs.fragmentShader
  });
  var shaderCube = new THREE.Mesh(cg2, sm);
  shaderCube.position.set(50,50,0);

  console.log(sm.uniforms);
  console.log(sm.vertexShader);
  console.log(sm.fragmentShader);
  console.log(sm);

//================================//
//=======RENDER FUNCTION==========//
//================================//
var i = 0;
  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);
    renderer.render( scene, camera );
  	// renderer.render( scene, arrayCamera );
  }

  render();
  console.log('MeshBasic', cube.material.program);

};

exports.render = initScene;

//=====================================//
//== FUNCTIONS ========================//
//=====================================//
