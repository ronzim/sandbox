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

  //looking for intersections
  var time2 = Date.now()

  // GOOD POINTS
  var dotsGeometry = new THREE.Geometry();
  var dotsMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
  var dots = new THREE.Points( dotsGeometry, dotsMaterial );
  //dotsGeometry.vertices.push(new THREE.Vector3(filteredVertices[nearestPoint*3],filteredVertices[nearestPoint*3+1],filteredVertices[nearestPoint*3+2]))

  //BAD POINTS
  var dotsGeometry1 = new THREE.Geometry();
  var dotsMaterial1 = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false, color: 0x0000ff } );
  var dots1 = new THREE.Points( dotsGeometry1, dotsMaterial1 );

  var normal = plane.normal;
  var planeConstantNegated = normal.clone().multiplyScalar(plane.constant);
  var startingPoint = [-1, nearestPoint];
  //var startingPoint_old = -1;
  var notThisWay = -1;

  var controllo = 0;
  var limite = 10000;

  do {
      console.log("startingPoint: " + startingPoint[startingPoint.length-1])

      var howManyCells = linksArray[idPositionArray[startingPoint[startingPoint.length-1]]];
      var offset = 1;

      var startingPointVector = new THREE.Vector3(filteredVertices[startingPoint[startingPoint.length-1]*3], filteredVertices[startingPoint[startingPoint.length-1]*3+1], filteredVertices[startingPoint[startingPoint.length-1]*3+2]);
      var startingPointVectorSub =  startingPointVector.clone().addVectors(startingPointVector,planeConstantNegated);
      var startingPointSide = plane.normal.dot(startingPointVectorSub);
      //console.log(startingPointVector)

      do {
        //console.log("offset: " + offset);
        var exit = false;
        currentCid = linksArray[idPositionArray[startingPoint[startingPoint.length-1]]+offset];

        var cellScan = 0;

        do {
          console.log("cellScan: " +cellScan)
          currentPid = cellsArray[currentCid+cellScan];
          console.log("currentCid: " +currentCid +" - currentPid: " +currentPid)

          if (currentPid == startingPoint[startingPoint.length-2] || currentPid == notThisWay){
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
          dotsGeometry1.vertices.push(startingPointVector)
          //scene.add(dots1);
          exit = true;
          notThisWay = startingPoint[startingPoint.length-1];
          //startingPoint = startingPoint_old;
          startingPoint.pop();
          console.log("notThisWay: " +notThisWay)
          //break;
        }

      } while (oppositeSide > 0 && !exit) // && offset <= howManyCells) //error: if howManyCells is reached without having found an intersectingPoint ??

      if (!exit){
        var intersectingEdge = new THREE.Line3(startingPointVector,currentPointVector);
        var intersectingPoint = plane.intersectLine(intersectingEdge);
        //console.log(intersectingPoint)
        dotsGeometry.vertices.push(intersectingPoint);
        startingPoint.push(currentPid);
      }

      controllo++;
  } while (startingPoint[startingPoint.length-1] != startingPoint[1] && controllo < limite)

  console.log("looking for intersections: " + (Date.now()-time2) +" ms");

  // DRAW POINTS
  console.log(dots)

  return [dots, dots1];

}

//================================//
//=== CREATE PLANE ===============//
//================================//

var createPlane = function(origin, orientation){
  var u = new THREE.Vector3();
  var v = new THREE.Vector3();
  u.fromArray(orientation[0]);
  v.fromArray(orientation[1]);
  var normalVect = u.cross(v);
  normalVect.normalize();
  console.log(normalVect);
  var originVect = new THREE.Vector3();
  originVect.fromArray(origin);
  console.log(originVect);
  // originVect.projectOnVector(normalVect);
  // console.log(originVect)
  // console.log(normalVect)
  // var distance = -originVect.length();
  // var plane = new THREE.Plane(normalVect,distance);
  var plane = new THREE.Plane();
  plane.setFromNormalAndCoplanarPoint(normalVect, originVect);
  return plane;
}

//================================//
//=== FROM DOTS TO ij ============//
//================================//

var reportToij = function(dots, origin, spacing, orientation, thickness){

  var points = dots.geometry.vertices;
  console.log(points);

  var coordinates = new Float32Array(points.length*2);

  var u = new THREE.Vector3().fromArray(orientation[0]);
  var v = new THREE.Vector3().fromArray(orientation[1]);
  var normal = u.clone().cross(v);

  if (normal.z > normal.x && normal.z > normal.y){
    for (k=0; k<points.length; k++){

      var i = Math.round((points[k].y - origin[1]) / (spacing[0] * orientation[0][0]));
      var j = Math.round((points[k].x - origin[0]) / (spacing[1] * orientation[1][1]));

      coordinates[k*2]=i;
      coordinates[k*2+1]=j;

    }
  }

  else if (normal.x > normal.z && normal.x > normal.y){
    for (k=0; k<points.length; k++){

      var i = Math.round((points[k].y - origin[1]) / (thickness * orientation[0][1]));
      var j = Math.round((points[k].z - origin[2]) / (spacing[1] * orientation[1][2]));

      coordinates[k*2]=i;
      coordinates[k*2+1]=j;

    }
  }

  else if (normal.y > normal.z && normal.y > normal.x){
    for (k=0; k<points.length; k++){

      var i = Math.round((points[k].z - origin[2]) / (spacing[1] * orientation[0][2]));
      var j = Math.round((points[k].x - origin[0]) / (spacing[0] * orientation[1][0]));

      coordinates[k*2]=i;
      coordinates[k*2+1]=j;

    }
  }

  console.log(coordinates);
  return coordinates;

}


exports.find = findIntersection;
exports.plane = createPlane;
exports.toij = reportToij;
