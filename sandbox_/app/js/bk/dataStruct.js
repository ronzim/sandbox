
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

  var edgeNodes = 51;

  var cubeGeometry = new THREE.BoxGeometry( 10*edgeNodes, 10*edgeNodes, 10*edgeNodes, edgeNodes, edgeNodes, edgeNodes);
  var bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.fromGeometry(cubeGeometry);
  var bufferMaterial = new THREE.MeshBasicMaterial( { color: 0x441123, wireframe: true} );
  var bufferCube = new THREE.Mesh( bufferGeometry, bufferMaterial );
  bufferCube.geometry.verticesNeedsUpdate = true;
  //scene.add(bufferCube);

  //ADD PLANE

  var normal = new THREE.Vector3(1,0,0).normalize();
  var distance = -0;
  var plane = new THREE.Plane(normal,distance);
  var planeConstantNegated = normal.clone().multiplyScalar(distance);

  var planeGeometry = new THREE.PlaneGeometry( 20, 20 );
  var planeMaterial = new THREE.MeshPhongMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.4});
  var planeToDraw = new THREE.Mesh( planeGeometry, planeMaterial );
  planeGeometry.lookAt(normal);
  planeGeometry.translate(-planeConstantNegated.x,-planeConstantNegated.y,-planeConstantNegated.z);
  //scene.add(planeToDraw);

  // ADD POINTS

  var dotsGeometry = new THREE.Geometry();
  var dotsMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
  var dots = new THREE.Points( dotsGeometry, dotsMaterial );
  dots.geometry.verticesNeedsUpdate = true;

  var dotsGeometry1 = new THREE.Geometry();
  var dotsMaterial1 = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false, color: 0x0000ff } );
  var dots1 = new THREE.Points( dotsGeometry1, dotsMaterial1 );
  dots1.geometry.verticesNeedsUpdate = true;


//================================//
//=== CORE FUNCTIONS =============//
//================================//

// FILTERING BUFFER ARRAY TO AVOID DUPLICATES

var createDataStruct = function(bufferArray){

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

  console.log("time1: " + (time2-time1));
  console.log("time2: " + (time3-time2));
  console.log("time3: " + (time4-time3));
  console.log("time4: " + (Date.now()-time4));

  console.log(verticesArray);       // INPUT BUFFER ARRAY
  console.log(filteredVertices);    // VERTICES ARRAY
  console.log(cellsArray);          // CELLS ARRAY
  console.log(linksArray);          // LINKS ARRAY
  console.log(idPositionArray);     // ID POSITIONS INSIDE LINKS ARRAY

  return [filteredVertices, cellsArray, linksArray, idPositionArray];
}



//================================//
//=== DRAWING SCRIPT =============//
//================================//

  var verticesArray = bufferGeometry.getAttribute('position').array;
  var time1 = Date.now();
  var dataStruct = createDataStruct(verticesArray);
  console.log((Date.now()-time1)/1000);
  var filteredVerticesArray = dataStruct[0];

  for (var i=0; i<verticesArray.length; i+=3){
    dotsGeometry.vertices.push( new THREE.Vector3(verticesArray[i],verticesArray[i+1],verticesArray[i+2]));
  }
  scene.add(dots);

  for (var i=0; i<filteredVerticesArray.length; i+=3){
    var pointFound = new THREE.Vector3(filteredVerticesArray[i],filteredVerticesArray[i+1],filteredVerticesArray[i+2])
    dotsGeometry1.vertices.push(pointFound);
  }
  scene.add(dots);
  scene.add(dots1);

  var col = 0x000000;
  var cells = dataStruct[1];
  var lineGeometry = new THREE.Geometry();
  var line = new THREE.Line( lineGeometry, lineMaterial );
  scene.add( line );

  for (var n=0; n<cells.length; n+=3){
    var lineGeometry = new THREE.Geometry();
    var lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff, linewidth: 5});
    //var lineMaterial = new THREE.LineBasicMaterial({color: col+n*100000, linewidth: 5});
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n]*3],filteredVerticesArray[cells[n]*3+1],filteredVerticesArray[cells[n]*3+2]));
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n+1]*3],filteredVerticesArray[cells[n+1]*3+1],filteredVerticesArray[cells[n+1]*3+2]));
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n+2]*3],filteredVerticesArray[cells[n+2]*3+1],filteredVerticesArray[cells[n+2]*3+2]));
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n]*3],filteredVerticesArray[cells[n]*3+1],filteredVerticesArray[cells[n]*3+2]));
    var line = new THREE.Line( lineGeometry, lineMaterial )
    scene.add( line );
  }


//================================//
//=======RENDER FUNCTION==========//
//================================//

  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);
  	renderer.render( scene, camera );
  }
  render();
}

exports.render = initScene;
