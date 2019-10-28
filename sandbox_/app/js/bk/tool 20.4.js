
var path = require('path');
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));
var createTree = require('yaot');

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

  //ADD CUBE

  var edgeNodes = 1;

  var cubeGeometry = new THREE.BoxGeometry( 10*edgeNodes, 10*edgeNodes, 10*edgeNodes, edgeNodes, edgeNodes, edgeNodes);
  var bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.fromGeometry(cubeGeometry);
  var bufferMaterial = new THREE.MeshBasicMaterial( { color: 0x441123, wireframe: true} );
  var bufferCube = new THREE.Mesh( bufferGeometry, bufferMaterial );
  bufferCube.geometry.verticesNeedsUpdate = true;
  scene.add(bufferCube);

  //ADD PLANE

  var normal = new THREE.Vector3(1,0,0).normalize();
  var distance = -0;
  var plane = new THREE.Plane(normal,distance);
  var planeConstantNegated = normal.clone().multiplyScalar(distance);

  var planeGeometry = new THREE.PlaneGeometry( 20*edgeNodes, 20*edgeNodes );
  var planeMaterial = new THREE.MeshPhongMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.4});
  var planeToDraw = new THREE.Mesh( planeGeometry, planeMaterial );
  planeGeometry.lookAt(normal);
  planeGeometry.translate(-planeConstantNegated.x,-planeConstantNegated.y,-planeConstantNegated.z);
  scene.add(planeToDraw);

  // ADD POINTS

  var dotsGeometry = new THREE.Geometry();
  var dotsMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
  var dots = new THREE.Points( dotsGeometry, dotsMaterial );
  dots.geometry.verticesNeedsUpdate = true;

//================================//
//= CHANGE GEOMETRY ON KEYPRESS ==//
//================================//

var transformCube = function(bufferCube,key){

  switch (key ) {
		case 81: // Q
				bufferCube.position.z += 0.5;
				break;
		case 82: // R
        bufferCube.position.y += 0.5;
				break;
		case 87: // W
        bufferCube.position.z -= 0.5;
				break;
		case 69: // E
        bufferCube.position.y -= 0.5;
				break;
    case 84: // T
        bufferCube.position.x += 0.5;
    		break;
    case 89: // Y
        bufferCube.position.x -= 0.5;
        break;
    case 65: // A
        bufferCube.rotation.x += 10 * Math.PI/180;
        break;
    case 83: // S
        bufferCube.rotation.y += 10 * Math.PI/180;
        break;
    case 68: // D
        bufferCube.rotation.z += 10 * Math.PI/180;
        break;
    default:
        console.log("X axis +/- : T/Y");
        console.log("Y axis +/- : E/R");
        console.log("Z axis +/- : Q/W");
        console.log("X axis rotation : A");
        console.log("Y axis rotation : S");
        console.log("Z axis rotation : D");
  }

  var update = function(){
    console.log("update");
    bufferCube.updateMatrix();
    bufferCube.geometry.applyMatrix(bufferCube.matrix);
    bufferCube.matrix.identity();
    bufferCube.position.set(0,0,0);
    bufferCube.rotation.set(0,0,0);
    bufferCube.scale.set(1,1,1);
  }

  update();

  return bufferCube;

}

//================================//
//=== CREATE DATA STRUCTURES =====//
//================================//

var createDataStruct = function(bufferArray){

  // FILTERING BUFFER ARRAY TO AVOID DUPLICATES

  var time1 = Date.now();
  var verticesArray = new Float32Array(bufferArray);

  var coordMap = new Uint32Array(bufferArray.length/3);
  var countArray = new Int32Array(bufferArray.length/3);
  countArray.fill(-1);
  var counter = 0;
  var tree = createTree();
  tree.init(verticesArray);

  for (var i=0; i<verticesArray.length; i+=3){
    var currentVertex = [verticesArray[i], verticesArray[i+1], verticesArray[i+2]];
    var matches = tree.intersectSphere(currentVertex[0], currentVertex[1], currentVertex[2], 1e-20);

    coordMap[i/3] = matches[0]/3;

    if (countArray[coordMap[i/3]] == -1) {
      countArray[i/3] = counter;
      counter += 1;
    }
  }

  //console.log(coordMap)
  //console.log(countArray)

  // CREATING FILTERED VERTICES ARRAY

  var time2 = Date.now();
  var filteredVertices = new Float32Array(3*(counter));

  for (var commonIndex=0; commonIndex < countArray.length; commonIndex++ ){
    if (countArray[commonIndex] != -1){
      var pId = countArray[commonIndex];
      var vertexCoord = [verticesArray[coordMap[commonIndex]*3],verticesArray[coordMap[commonIndex]*3+1],verticesArray[coordMap[commonIndex]*3+2]];
      filteredVertices[pId*3] = vertexCoord[0];
      filteredVertices[pId*3+1] = vertexCoord[1];
      filteredVertices[pId*3+2] = vertexCoord[2];
    }
  }


  // CREATING CELLS ARRAY

  var time3 = Date.now();
  var cellsArray = new Uint32Array(coordMap);

  for (var j=0; j<coordMap.length; j++){

    cellsArray[j] = countArray[coordMap[j]];

  }

  // CREATING LINK ARRAYS

  var time4 = Date.now();
  var recurrenceCounter = new Uint32Array(filteredVertices.length/3);
  recurrenceCounter.fill(1); // init 1 to keep one place free for each link set
  var idPositionArray = new Uint32Array(filteredVertices.length/3);

  for (var p=0; p<cellsArray.length; p++){
    pIdCorrente = cellsArray[p];
    recurrenceCounter[pIdCorrente]++;
  }

  var recurrenceSum = 0;
  for (s=0; s<recurrenceCounter.length; s++){
    idPositionArray[s] = recurrenceSum;
    recurrenceSum = recurrenceSum + recurrenceCounter[s];
  }

  var linksArray = new Int32Array(recurrenceSum);
  linksArray.fill(-1);

  for (u=0; u<idPositionArray.length; u++){
    linksArray[idPositionArray[u]] = recurrenceCounter[u]-1;
  }

  //console.log(linksArray)

  var offsetArray = new Uint32Array(filteredVertices.length/3);
  offsetArray.fill(1);

  for (t=0; t<cellsArray.length; t++){
    var currentPid = cellsArray[t];
    var currentCid = -1;

    switch (t%3){
      case 0: currentCid = t;
              break;
      case 1: currentCid = t-1;
              break;
      case 2: currentCid = t-2;
              break;
    }

    var position = idPositionArray[currentPid];
    var offset = offsetArray[currentPid];
    linksArray[ position + offset ] = currentCid;
    offsetArray[currentPid]++;
  }

  // console.log("time1: " + (time2-time1));
  // console.log("time2: " + (time3-time2));
  // console.log("time3: " + (time4-time3));
  // console.log("time4: " + (Date.now()-time4));
  //
  // console.log(verticesArray);       // INPUT BUFFER ARRAY
  // console.log(filteredVertices);    // VERTICES ARRAY
  // console.log(cellsArray);          // CELLS ARRAY
  // console.log(linksArray);          // LINKS ARRAY
  // console.log(idPositionArray);     // ID POSITIONS INSIDE LINKS ARRAY

  return [filteredVertices, cellsArray, linksArray, idPositionArray];
}



//================================//
//=== CORE FUNCTION ==============//
//================================//

var findIntersection = function(dataStruct, plane){

  var filteredVertices = dataStruct[0];
  var cellsArray = dataStruct[1];
  var linksArray = dataStruct[2];
  var idPositionArray = dataStruct[3];

  var pId = 0;
  var endSearch = false;
  var startingPoint = -1 ;
  var minDistance = 100000000;

  // looking for the point nearest to the plane
  var time1 = Date.now();

  for (i=0; i<filteredVertices.length; i+=3) {

    var currentPoint = new THREE.Vector3(filteredVertices[i],filteredVertices[i+1],filteredVertices[i+2]);
    var currentDistance = Math.abs(plane.distanceToPoint(currentPoint));

    if (currentDistance < minDistance){
      minDistance = currentDistance;
      nearestPoint = i/3; // pId
    }
  }

  // console.log("looking for starting point: " +(Date.now()-time1)+ " ms");
  // console.log("startingPoint: " +startingPoint);

  //looking for intersections
  var time2 = Date.now()

  var dotsGeometry = new THREE.Geometry();
  var dotsMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
  var dots = new THREE.Points( dotsGeometry, dotsMaterial );
  dotsGeometry.vertices.push(new THREE.Vector3(filteredVertices[nearestPoint*3],filteredVertices[nearestPoint*3+1],filteredVertices[nearestPoint*3+2]))
  var planeConstantNegated = normal.clone().multiplyScalar(plane.constant);
  var startingPoint = nearestPoint;
  var startingPoint_old = -1;
  var notThisWay = -1;

  var controllo = 0;
  var limite = 10000;
  do {
      console.log("startingPoint: " + startingPoint)

      var howManyCells = linksArray[idPositionArray[startingPoint]];
      var offset = 1;

      var startingPointVector = new THREE.Vector3(filteredVertices[startingPoint*3], filteredVertices[startingPoint*3+1], filteredVertices[startingPoint*3+2]);
      var startingPointVectorSub =  startingPointVector.clone().addVectors(startingPointVector,planeConstantNegated);
      var startingPointSide = plane.normal.dot(startingPointVectorSub);
      //console.log(startingPointVector)

      do {
        //console.log("offset: " + offset);
        var exit = false;
        currentCid = linksArray[idPositionArray[startingPoint]+offset];

        var cellScan = 0;

        do {
          //console.log("cellScan: " +cellScan)
          currentPid = cellsArray[currentCid+cellScan];
          console.log("currentPid: " +currentPid)

          if (currentPid == startingPoint_old || currentPid == notThisWay){
            var oppositeSide = 9999;
            cellScan++;
            continue;
          }
          var currentPointVector = new THREE.Vector3(filteredVertices[currentPid*3], filteredVertices[currentPid*3+1], filteredVertices[currentPid*3+2]);
          var currentPointVectorSub =  currentPointVector.clone().addVectors(currentPointVector,planeConstantNegated);
          var currentPointSide = plane.normal.dot(currentPointVectorSub);
          //console.log(currentPointVector)
          var oppositeSide = startingPointSide * currentPointSide;
          //console.log("oppositeSide: " +oppositeSide)

          cellScan++;

          var oppositeSideNotFound = true;
          if (oppositeSide <= 0){
            oppositeSideNotFound = false;
          }

        } while (oppositeSideNotFound && cellScan < 3)

        offset++;
        if (offset > howManyCells && oppositeSideNotFound){
          var dotsGeometry1 = new THREE.Geometry();
          var dotsMaterial1 = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false, color: 0x0000ff } );
          var dots1 = new THREE.Points( dotsGeometry1, dotsMaterial1 );
          dotsGeometry1.vertices.push(startingPointVector)
          scene.add(dots1);
          exit = true;
          notThisWay = startingPoint;
          startingPoint = startingPoint_old;
          console.log("notThisWat: " +notThisWay)
          //break;
        }

      } while (oppositeSide > 0 && !exit) // && offset <= howManyCells) //error: if howManyCells is reached without having found an intersectingPoint ??

      if (!exit){
        var intersectingEdge = new THREE.Line3(startingPointVector,currentPointVector);
        var intersectingPoint = plane.intersectLine(intersectingEdge);
        console.log(intersectingPoint)
        dotsGeometry.vertices.push(intersectingPoint);
        startingPoint_old = startingPoint;
        startingPoint = currentPid;
      }

      controllo++;
  } while (startingPoint != nearestPoint && controllo < limite)

  console.log("looking for intersections: " + (Date.now()-time2) +" ms");

  // DRAW POINTS
  console.log(dots)
  scene.add(dots);
  return dots;

}

var verticesArray = bufferGeometry.getAttribute('position').array;
var time1 = Date.now();
var dataStruct = createDataStruct(verticesArray);
console.log((Date.now()-time1)/1000);

dots = findIntersection(dataStruct, plane);

//=====================================//
//== INTERPOLATE INTERSECTING POINTS ==//
//=====================================//

// var drawContour = function(dots){
//
//     var splineGeometry = new THREE.Geometry();
//     var splineMaterial = new THREE.LineBasicMaterial( { color : 0x0000ff } );
//     var numPoints = 100;
//     dotsGeometry = dots.geometry;
//     spline = new THREE.CatmullRomCurve3(dotsGeometry.vertices);
//     spline.closed = true;
//     var splinePoints = spline.getPoints(numPoints);
//
//     for(var i = 0; i < splinePoints.length; i++){
//         splineGeometry.vertices.push(splinePoints[i]);
//     }
//     var lineSpline = new THREE.Line(splineGeometry, splineMaterial);
//     scene.add(lineSpline);
//
//     return lineSpline;
// }
//
// lineSpline = drawContour(dots);

//================================//
//========== LISTENER ============//
//================================//

window.addEventListener('keydown', function(event) {
                                      scene.remove(dots);
                                      //scene.remove(lineSpline);
                                      bufferCube = transformCube(bufferCube,event.keyCode);
                                      var verticesArray = bufferGeometry.getAttribute('position').array;
                                      var time1 = Date.now();
                                      var dataStruct = createDataStruct(verticesArray);
                                      console.log((Date.now()-time1)/1000);
                                      dots = findIntersection(dataStruct, plane);
                                      var pointsList = dots.geometry.clone();
                                      //console.log(pointsList.vertices)
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

// ============================================
// Compute the distance between two 3D points =
// ============================================
var computeDistance = function( x, y ) {
  return Math.sqrt(Math.pow((y[0]-x[0]),2)+Math.pow((y[1]-x[1]),2)+Math.pow((y[2]-x[2]),2));
};

// =====================================================================
// Get the longest edge of a triangle ==================================
// =====================================================================
var getMaxDistance = function( a, b, c ) {
  var ab_distance = computeDistance( a, b );
  var bc_distance = computeDistance( b, c );
  var ac_distance = computeDistance( a, c );
  var max_distance = ab_distance > bc_distance ? ab_distance : bc_distance;
  max_distance = max_distance > ac_distance ? max_distance : ac_distance;
  return max_distance;
};

// =====================================================================
// Establish if two points are the same, within a given tolerance ======
// =====================================================================

var isSamePoint = function (p1, p2, tol){
  var p1rounded = p1;
  var p2rounded = p2;

  p1rounded.x = Math.round(p1.x*tol)/tol;
  p1rounded.y = Math.round(p1.y*tol)/tol;
  p1rounded.z = Math.round(p1.z*tol)/tol;
  p2rounded.x = Math.round(p2.x*tol)/tol;
  p2rounded.y = Math.round(p2.y*tol)/tol;
  p2rounded.z = Math.round(p2.z*tol)/tol;

  var samePoint = false;

  if (p1rounded.x === p2rounded.x && p1rounded.y === p2rounded.y && p1rounded.z === p2rounded.z){
    samePoint=true;
  }
  return samePoint;
}
