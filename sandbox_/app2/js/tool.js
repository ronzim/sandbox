
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
var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );

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

  var points = [
    new THREE.Vector3(13,15,10),  // red
    new THREE.Vector3(13,0,10),   // green
    new THREE.Vector3(10,15,0),   // yellow
    new THREE.Vector3(10,0,0)     // blue
  ];

  var col = ['red', 'green', 'yellow', 'blue'];

  for(i=0; i<points.length; i++){
    var ball = new THREE.SphereGeometry(1,8,8);
    var mat = new THREE.MeshBasicMaterial({color:col[i], side: THREE.DoubleSide});
    var ballMesh = new THREE.Mesh(ball, mat);
    ballMesh.position.set(points[i].x, points[i].y, points[i].z);
    scene.add(ballMesh);
  }

  var planeA = new THREE.PlaneGeometry();
  planeA.vertices = points;
  planeA.computeBoundingBox();
  var planeAmesh = new THREE.Mesh(planeA, mat);

  var axisA = [
    new THREE.Vector3().subVectors(points[2],points[3]),
    new THREE.Vector3().subVectors(points[1],points[3]),
    new THREE.Vector3()
  ];
  axisA[2].crossVectors(axisA[0], axisA[1]);

  var helpers = [
    new THREE.ArrowHelper( axisA[0], points[3], 10, 'red' ),
    new THREE.ArrowHelper( axisA[1], points[3], 10, 'red' ),
    new THREE.ArrowHelper( axisA[2], points[3], 10, 'red' )
  ];

  scene.add(helpers[0]);
  scene.add(helpers[1]);
  scene.add(helpers[2]);

  // var matrix = new THREE.Matrix4();

  // PLane dim
  var a = 10;
  var b = 15;

  //rotation
  // var eye = new THREE.Vector3(0,0,0);
  var direction = new THREE.Vector3(1,0,0); //x axis (plane normal)
  // var focus = eye.clone().add(direction);
  // var up = new THREE.Vector3(0,1,0); //y axis
  // matrix.lookAt(eye, focus, up);

  //translation
  planeA.computeBoundingBox();
  var center = planeA.boundingBox.getCenter();
  // var baseCorner = planeA.vertices[3]; //blue corner
  // var rifCenter = center.clone().sub(baseCorner);
  var trMatrix1 = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
  var trMatrix2 = new THREE.Matrix4().makeTranslation(0, b/2, a/2);

  // var planeB = new THREE.PlaneGeometry(a, b);
  // planeB.applyMatrix(matrix);
  // planeB.applyMatrix(trMatrix);
  // var planeBmesh = new THREE.Mesh(planeB, mat);
  // scene.add(planeBmesh);

  // planeA.applyMatrix(trMatrix);


  //set rotation from vectors
  var angle = axisA[2].angleTo(direction);
  var axis = new THREE.Vector3(0,1,0); //y axis
  var rotMatrix = new THREE.Matrix4().makeRotationAxis(axis, -angle);

  // planeA.applyMatrix(rotMatrix);

  var matrix = new THREE.Matrix4();
  matrix.premultiply(trMatrix1);
  matrix.premultiply(rotMatrix);
  matrix.premultiply(trMatrix2);
  planeA.applyMatrix(matrix);

  scene.add(planeAmesh);

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
//== INTERPOLATE INTERSECTING POINTS ==//
//=====================================//

var drawContour = function(dots){

    var splineGeometry = new THREE.Geometry();
    var splineMaterial = new THREE.LineBasicMaterial( { color : 0x0000ff } );
    var numPoints = 100;
    dotsGeometry = dots.geometry;
    spline = new THREE.CatmullRomCurve3(dotsGeometry.vertices);
    spline.closed = true;
    var splinePoints = spline.getPoints(numPoints);

    for(var i = 0; i < splinePoints.length; i++){
        splineGeometry.vertices.push(splinePoints[i]);
    }
    var lineSpline = new THREE.Line(splineGeometry, splineMaterial);

    return lineSpline;
}
