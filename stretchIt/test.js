const THREE = require('three');
const createTree = require('yaot').createTree;
const TrackballControls = require('./TrackballControls.js');

const points = [
  0,0,0,
  0,1,0,
  0,2,0,
  0,3,0,
  0,4,0,
  0,5,0,
  1,5,0,
  2,5,0,
  3,5,0,
  4,5,0,
  4,6,0,
  4,7,0,
  5,7,0,
  6,7,0,
];

// create a scene, that will hold all our elements such as objects, cameras and lights.
var scene = new THREE.Scene();

// create a camera, which defines where we're looking at.
var camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(0,0,0);

// create a render and set the size
var renderer = new THREE.WebGLRenderer();
document.getElementById("container").appendChild(renderer.domElement);

renderer.setClearColor(new THREE.Color(0x000000));
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMapEnabled = true;

var control = new THREE.TrackballControls( camera, renderer.domElement );

var light = new THREE.AmbientLight(0x0f0f0f);
scene.add(light);

var axis = new THREE.AxisHelper(30);
scene.add(axis);


// create the ground plane
var planeGeometry = new THREE.PlaneGeometry(60, 20, 1, 1);
var planeMaterial = new THREE.MeshLambertMaterial({color: 0xff0000});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;

var sphereG = new THREE.SphereGeometry(30,30,30);
var mat = new THREE.MeshBasicMaterial();
var sphere = new THREE.Mesh(sphereG, mat);
scene.add(sphere)


// add the plane to the scene
// scene.add(plane);

console.log(scene)

function render() {
  requestAnimationFrame( render );
  control.update(0.5);
  renderer.render( scene, camera );
}

render();
