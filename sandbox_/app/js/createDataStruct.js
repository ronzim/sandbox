//================================//
//=== CREATE DATA STRUCTURES =====//
//================================//

var createTree = require('yaot');

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

exports.createStruct = createDataStruct;
