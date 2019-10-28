
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

  var edgeNodes = 11

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

  var verticesArray = new Float32Array(bufferArray);
  var filteredVertices = new Float32Array();//verticesArray.length);

  var tree = createTree();

  for (var i=0; i<verticesArray.length; i+=3){
    var currentVertex = [verticesArray[i], verticesArray[i+1], verticesArray[i+2]];
    tree.init(filteredVertices);
    var matches = tree.intersectSphere(currentVertex[0], currentVertex[1], currentVertex[2], 1e-20);

    if (matches.length == 0){   //WTF...efficient??
      var newFilteredVertices = new Float32Array(filteredVertices.length+3);
      newFilteredVertices.set(filteredVertices);
      newFilteredVertices[newFilteredVertices.length-3] = currentVertex[0];
      newFilteredVertices[newFilteredVertices.length-2] = currentVertex[1];
      newFilteredVertices[newFilteredVertices.length-1] = currentVertex[2];
      var filteredVertices = new Float32Array(newFilteredVertices);
    }
  }

  // CREATING CELLS ARRAY

  var cellsArray = new Uint32Array();
  var cellId=0;

  for (var j=0; j<verticesArray.length; j+=3){
    var currentVertex = [verticesArray[j], verticesArray[j+1], verticesArray[j+2]];
    tree.init(filteredVertices);
    var vertexId = tree.intersectSphere(currentVertex[0], currentVertex[1], currentVertex[2], 1e-20);

    if ((j/3)%3 == 0){
      cellId += 1;
      var newCellsArray = new Uint32Array(cellsArray.length+2);
      newCellsArray.set(cellsArray);
      newCellsArray[newCellsArray.length-2] = cellId;
      newCellsArray[newCellsArray.length-1] = vertexId;
    }
    else{
      var newCellsArray = new Uint32Array(cellsArray.length+1);
      newCellsArray.set(cellsArray);
      newCellsArray[newCellsArray.length-1] = vertexId;
    }

    var cellsArray = new Uint32Array(newCellsArray);

  }

  // CREATING LINK ARRAYS

  var linksArray = new Uint32Array(0);
  var idPositionArray = new Uint32Array(filteredVertices.length/3);

  for (var idVertex=0; idVertex<filteredVertices.length; idVertex+=3){
    var newLinksArray = new Uint32Array(linksArray.length+1);
    newLinksArray.set(linksArray);
    newLinksArray[newLinksArray.length-1] = idVertex;
    var linksArray = new Uint32Array(newLinksArray);
    idPositionArray[idVertex/3] = linksArray.length-1;

    var currentCid = 0;

    for (var q=0; q<cellsArray.length; q++){
      //console.log(q)

      if (idVertex == cellsArray[q]){
        if (q%4 == 0){
          currentCid = cellsArray[q];
        }
        else if ((q-1)%4 == 0) {
          currentCid = cellsArray[q-1];
        }
        else if ((q-2)%4 == 0) {
          currentCid = cellsArray[q-2];
        }
        else if ((q-3)%4 == 0) {
          currentCid = cellsArray[q-3];
        }

        var newLinksArray = new Uint32Array(linksArray.length+1);
        newLinksArray.set(linksArray);
        newLinksArray[newLinksArray.length-1] = currentCid;
        var linksArray = new Uint32Array(newLinksArray);

      }
    }
  }

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

  for (var n=0; n<cells.length; n+=4){
    var lineGeometry = new THREE.Geometry();
    var lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff, linewidth: 5});
    //var lineMaterial = new THREE.LineBasicMaterial({color: col+n*100000, linewidth: 5});
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n+1]],filteredVerticesArray[cells[n+1]+1],filteredVerticesArray[cells[n+1]+2]));
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n+2]],filteredVerticesArray[cells[n+2]+1],filteredVerticesArray[cells[n+2]+2]));
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n+3]],filteredVerticesArray[cells[n+3]+1],filteredVerticesArray[cells[n+3]+2]));
    lineGeometry.vertices.push(new THREE.Vector3(filteredVerticesArray[cells[n+1]],filteredVerticesArray[cells[n+1]+1],filteredVerticesArray[cells[n+1]+2]));
    var line = new THREE.Line( lineGeometry, lineMaterial );
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
