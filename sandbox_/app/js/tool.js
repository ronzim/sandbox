
var path = require('path');
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));

var STLLoader = require( path.join( rootPath, 'lib', 'stl-loader.js'))(THREE);
var move = require( path.join( rootPath, 'js', 'moveFunction.js')); // change geometry on keypress
var data = require( path.join( rootPath, 'js', 'createDataStruct.js'));
var intersect = require( path.join( rootPath, 'js', 'intersect.js')); // core function

var geometryNeedle = new THREE.BufferGeometry();
var needleMesh = new THREE.Mesh();
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

  var loader = new STLLoader();
  var geometryFunction = function(_geometry){
    _geometry.rotateY(Math.PI/2);
    _geometry.translate(0,90,-50);
    geometryNeedle = _geometry;
    var needleMaterial = new THREE.MeshBasicMaterial( { color: 0x441123, wireframe: true} );
    needleMesh = new THREE.Mesh( geometryNeedle, needleMaterial );
    needleMesh.geometry.verticesNeedsUpdate = true;
    scene.add(needleMesh);
  };

  loader.load('./resources/ago.stl', geometryFunction);

  setTimeout(1000);

  //ADD CUBE

  var edgeNodes = 1;

  var cubeGeometry = new THREE.BoxGeometry( 10*edgeNodes, 10*edgeNodes, 10*edgeNodes, edgeNodes, edgeNodes, edgeNodes);
  var bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.fromGeometry(cubeGeometry);
  var bufferMaterial = new THREE.MeshBasicMaterial( { color: 0x441123, wireframe: true} );
  var bufferCube = new THREE.Mesh( bufferGeometry, bufferMaterial );
  bufferCube.geometry.verticesNeedsUpdate = true;

  bufferCube.rotateY(Math.PI/4);
  bufferCube.translateZ(10);

  var axis = new THREE.AxisHelper( 5);
  bufferCube.add(axis);
  console.log(axis);

  scene.add(bufferCube);

  var box = new THREE.BoxHelper( bufferCube, 0xffff00 );
  scene.add(box);
  box.geometry.computeBoundingBox();
  console.log(box);

  //ADD PLANE

  var orientation = [[1,0,0],[0,1,0]];
  var origin = [1,10,3];
  var spacing = [2,2];
  var thickness = 2;

  var plane = intersect.plane(origin,orientation);

  var normal = plane.normal;
  var distance = plane.constant;
  var planeConstantNegated = normal.clone().multiplyScalar(distance);

  var planeGeometry = new THREE.PlaneGeometry( 50*edgeNodes, 50*edgeNodes );
  var planeMaterial = new THREE.MeshPhongMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.4});
  var planeToDraw = new THREE.Mesh( planeGeometry, planeMaterial );
  planeGeometry.lookAt(normal);
  planeGeometry.translate(-planeConstantNegated.x,-planeConstantNegated.y,-planeConstantNegated.z);
  scene.add(planeToDraw);

  // ADD GOOD POINTS

  var dotsGeometry = new THREE.Geometry();
  var dotsMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
  var dots = new THREE.Points( dotsGeometry, dotsMaterial );
  dots.geometry.verticesNeedsUpdate = true;

  // ADD BAD POINTS

  var dotsGeometry1 = new THREE.Geometry();
  var dotsMaterial1 = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false, color: 0x0000ff } );
  var dots1 = new THREE.Points( dotsGeometry, dotsMaterial );
  dots1.geometry.verticesNeedsUpdate = true;

//================================//
//========== LISTENER ============//
//================================//

window.addEventListener('keydown', function(event) {

          scene.remove(dots);
          scene.remove(dots1);
          scene.remove(lineSpline);

          //bufferCube = moveFunction(bufferCube,event.keyCode);
          //var verticesArray = bufferGeometry.getAttribute('position').array;
          buffer = move.moveFunction(needleMesh,event.keyCode);

          //CREATE NEW GEOMETRY DATA AFTER MOVING OBJECT

          var verticesArray = geometryNeedle.getAttribute('position').array;
          var time1 = Date.now();
          var dataStruct = data.createStruct(verticesArray);
          console.log((Date.now()-time1)/1000);

          // CHECK INTERSECTION
          needleMesh.geometry.computeBoundingBox();
          bb = needleMesh.geometry.boundingBox;

          if(bb.intersectsPlane(plane)){

            // LOOK FOR INTERSECTING POINTS

            allDots = intersect.find(dataStruct, plane);
            dots = allDots[0];
            dots1 = allDots[1];

            // DRAW

            scene.add(dots);
            if (allDots[1].geometry.vertices.length != 0){
              scene.add(allDots[1]);
            }
            var pointsList = dots.geometry.clone();
            lineSpline = drawContour(dots);
            scene.add(lineSpline);
            //console.log(pointsList.vertices)

            // TO ij

            intersect.toij(dots, origin, spacing, orientation, thickness);
          }

});


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
