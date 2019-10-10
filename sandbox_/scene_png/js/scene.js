var path = require('path');
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));

var initScene = function() {

  //================================//
  //====== SCENE SETUP =============//
  //================================//

  var renderer = new THREE.WebGLRenderer( { antialias: true } );
  document.getElementById("canvas-container").appendChild(renderer.domElement)
  // renderer.setClearColor( 0xFFFFFF, 1 );
  renderer.setClearColor( 0xAAAAAA, 1 );
  renderer.setSize(2048,2048);

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10000 );
  camera.position.z = 2000;
  camera.position.y = 0;
  camera.position.x = 0;
  camera.lookAt(0,0,0);

  var control = new THREE.TrackballControls( camera, renderer.domElement );

  var light = new THREE.AmbientLight( 0x555555, 1 );
  scene.add( light );
  var directionalLight = new THREE.PointLight( 0xffffff, 1 );
  directionalLight.position.set (0,50,50);
  scene.add( directionalLight );
  var pointLight = new THREE.PointLight( 0xffffff, 0.1 );
  pointLight.position.set (0,-50,50);
  scene.add( pointLight );

  THREE.OrbitControls

  THREE.TrackballControls

  //================================//
  //====== SCENE CONTENT ===========//
  //================================//

  var gridPlane = new THREE.GridHelper(30,50);
  var gridPlaneAxis = new THREE.AxisHelper(20);
  scene.add (gridPlane);
  scene.add (gridPlaneAxis);

  var cubeGeometry    = new THREE.BoxGeometry(2,2,2);
  var cubeMaterial1   = new THREE.MeshBasicMaterial({wireframe:false, color:0x2194ce});

  var cubeMaterial2a   = new THREE.MeshPhongMaterial({color:0x2194ce, shininess: 0});
  var cubeMaterial2b   = new THREE.MeshPhongMaterial({color:0x2194ce, shininess: 25});
  var cubeMaterial2c   = new THREE.MeshPhongMaterial({color:0x2194ce, shininess: 50});
  var cubeMaterial2d   = new THREE.MeshPhongMaterial({color:0x2194ce, shininess: 100});

  var cubeMaterial3   = new THREE.MeshToonMaterial({wireframe:false, color:0x2194ce});
  var cubeMaterial4   = new THREE.MeshNormalMaterial({wireframe:false, color:0x2194ce});

  var cubeMesh1       = new THREE.Mesh(cubeGeometry, cubeMaterial2a);
  var cubeMesh2       = new THREE.Mesh(cubeGeometry, cubeMaterial2b);
  var cubeMesh3       = new THREE.Mesh(cubeGeometry, cubeMaterial2c);
  var cubeMesh4       = new THREE.Mesh(cubeGeometry, cubeMaterial2d);

  var translationMatrix = new THREE.Matrix4();
  var rotationMatrix    = new THREE.Matrix4();

  translationMatrix.makeTranslation(4,4,0);
  rotationMatrix.makeRotationX(Math.PI/4);
  rotationMatrix.premultiply(translationMatrix);
  cubeGeometry.applyMatrix(rotationMatrix);

  // scene.add(cubeMesh4)

  // cubeMesh1.position.set(15,0,0);
  // cubeMesh2.position.set(10,0,0);
  // cubeMesh3.position.set(5,0,0);
  // cubeMesh4.position.set(0,0,0);
  //
  // scene.add(cubeMesh1);
  // scene.add(cubeMesh2);
  // scene.add(cubeMesh3);
  // scene.add(cubeMesh4);

  var sphereGeometry = new THREE.SphereGeometry(0.5,32,32);
  var sphereMaterial = new THREE.MeshBasicMaterial({wireframe:false, color:'red'});
  var sphereMesh     = new THREE.Mesh(sphereGeometry, sphereMaterial);
  //
  // var geometry = new THREE.TorusGeometry( 1, 0.5, 30, 16 );
  // var material = new THREE.MeshBasicMaterial( {wireframe:true, color:'black'} );
  // var torus    = new THREE.Mesh( geometry, material );
  // scene.add( torus );

  // console.log(cubeGeometry);
  // console.log(cubeBufferGeometry);

  // sphereMesh.position.set(0,3,0);
  // torus.position.set(0,-4,0);
  // scene.add(cubeMesh);
  // scene.add(sphereMesh);
  //
  // addVerticesBalls(cubeMesh)
  // addVerticesBalls(sphereMesh)
  // addVerticesBalls(torus)

  function addVerticesBalls(mesh){
    mesh.geometry.vertices.forEach(function(v){
      var ballGeometry = new THREE.SphereGeometry(0.05,32,32);
      var ballMaterial = new THREE.MeshBasicMaterial({wireframe:false, color:'green'});
      var ballMesh     = new THREE.Mesh(ballGeometry, ballMaterial);
      ballMesh.position.copy(v)
      mesh.add(ballMesh)
    })
  }

  // dev
  // control.noRotate = true;
  // require('./drawBezier.js').init(camera, renderer, scene)

  require('./contours.js').test(scene);

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
