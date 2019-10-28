//==============================//
//== Intersecting Line ========//
//=============================//

// // plane
//
// var normal = new THREE.Vector3(0,1,0).normalize();
// var distance = -2;
// var plane = new THREE.Plane(normal,distance);
//
// // line from 2 points
//
// var start = new THREE.Vector3(0,4,0);
// var end = new THREE.Vector3(0,0,0);
//
// var intersectingLine = new THREE.Line3(start, end);
//
// // intersecting points
//
// var intersectingPoint = plane.intersectLine(intersectingLine);
//
// console.log(intersectingPoint);

//==============================//
//== Same Point Check =========//
//=============================//

p1 = new THREE.Vector3(1,1,1.00001);
p2 = new THREE.Vector3(1,1,1.00000);
tol = 1000000;

var isSamePoint = function (p1, p2, tol)
{
  var p1rounded = p1;
  var p2rounded = p2;

  p1rounded.x = Math.round(p1.x*tol)/tol;
  p1rounded.y = Math.round(p1.y*tol)/tol;
  p1rounded.z = Math.round(p1.z*tol)/tol;
  p2rounded.x = Math.round(p2.x*tol)/tol;
  p2rounded.y = Math.round(p2.y*tol)/tol;
  p2rounded.z = Math.round(p2.z*tol)/tol;

  var samePoint = false;

  if (p1rounded.x === p2rounded.x && p1rounded.y === p2rounded.y && p1rounded.z === p2rounded.z)
  {
    samePoint=true;
    console.log("same point")
  }
  else {
    console.log("not same point")
  }
  return samePoint;
}

isSamePoint(p1,p2,tol);
