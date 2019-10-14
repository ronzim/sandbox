var path = require('path');
var TrackballControls = require( './lib/TrackballControls.js');
var STLLoader = require('three-stl-loader')(THREE);

var brush = require('./lib/brush.js');

// override console.log if silent mode
if (process.env.SILENT == 'true'){
  console.log = function(){};
}

var initScene = function() {

  //================================//
  //====== SCENE SETUP =============//
  //================================//

  var renderer = new THREE.WebGLRenderer( { antialias: true } );
  document.getElementById("canvas-container").appendChild(renderer.domElement)
  renderer.setClearColor( 0x63abd4, 1 );
  renderer.setSize(2048,2048);

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 100;
  camera.position.y = 0;
  camera.position.x = 0;
  camera.lookAt(0,0,0);
  camera.name = 'camera';
  scene.add(camera);

  var control = new THREE.TrackballControls( camera, renderer.domElement );
  control.rotateSpeed = 3;

  var light = new THREE.AmbientLight( 0xffffff, 0.4 );
  scene.add( light );
  var directionalLight = new THREE.PointLight( 0xffffff, 0.2 );
  directionalLight.position.set (0,50,50);
  scene.add( directionalLight );
  var pointLight = new THREE.PointLight( 0xffffff, 0.5 );
  pointLight.position.set (100,100,100);
  scene.add( pointLight );

  var gridPlane = new THREE.GridHelper(30,50);
  var gridPlaneAxis = new THREE.AxisHelper(20);
  scene.add(gridPlane);
  scene.add(gridPlaneAxis);

  populate(renderer, scene, control);

  //================================//
  //====== SCENE CONTENT ===========//
  //================================//

  function populate(renderer, scene, controls){
    var loader = new STLLoader();
    loader.load('./resources/shoe.stl', function(geometry) {

      var material = new THREE.MeshPhongMaterial({wireframe:false, color:'white'});
      var mesh = new THREE.Mesh(geometry, material);

      geometry.computeBoundingBox();
      var center = geometry.boundingBox.getCenter().negate();
      var centeringMatrix = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
      console.log(centeringMatrix)
      geometry.applyMatrix(centeringMatrix);
      mesh.name = 'shoe';
      mesh.material.needsUpdate = true;

      scene.add(mesh);

      // activate picking lib
      brush.toggleCADBrush(renderer, scene, controls, mesh.name, true);

    });
  }

  //================================//
  //=======RENDER FUNCTION==========//
  //================================//

  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);
  	renderer.render( scene, camera );
  }

  console.log(scene)

  render();
};

initScene();
