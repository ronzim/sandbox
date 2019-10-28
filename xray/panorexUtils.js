var AMI  = require('./libs/ami/ami.js');
var path = require('path');

var CamerasOrthographic    = AMI.OrthographicCamera;
var ControlsOrthographic   = AMI.TrackballOrthoControl;
var HelpersBoundingBox     = AMI.BoundingBoxHelper;
var ShadersContourUniform  = AMI.ContourUniformShader;
var ShadersContourVertex   = AMI.ContourVertexShader;
var ShadersContourFragment = AMI.ContourFragmentShader;
var PanorexStackHelper     = require('./libs/ami/Panorex.HelperStack.js').HelpersStack;
var McStackHelper          = require('./libs/ami/Mc.HelperStack.js').HelpersStack;
var CSStackHelper          = require('./libs/ami/CS.HelperStack.js').HelpersStack;

var _ = require('underscore');

// ================================================
// ===== set environment for panorex (camera) =====
// ================================================

function initMcStackHelper(stack, geometry){
  var stackHelper = new McStackHelper(stack, geometry);
  stackHelper._border._visible = false;
  stackHelper._bBox._visible = true;
  return stackHelper;
}


function setCamera(rendererObj, stack) {

    // rendererObj.stackHelper = initHelpersStack(rendererObj.scene, stack);

    // set camera
    // let worldbb = stack.worldBoundingBox();
    // let lpsDims = new THREE.Vector3(
    //   (worldbb[1] - worldbb[0]),
    //   (worldbb[3] - worldbb[2]),
    //   (worldbb[5] - worldbb[4])
    // );

    lpsDims = new THREE.Vector3(100, 100, 100);

    // box: {halfDimensions, center}
    let box = {
      center: stack.worldCenter().clone(),
      halfDimensions:
        new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
    };

    // init and zoom
    let canvas = {
        width:  rendererObj.domElement.clientWidth,
        height: rendererObj.domElement.clientHeight,
      };

    rendererObj.camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
    rendererObj.camera.box = box;
    rendererObj.camera.canvas = canvas;
    rendererObj.camera.orientation = rendererObj.sliceOrientation;
    rendererObj.camera.update();
    rendererObj.camera.fitBox(2, 1);

}

// ================================================
// ===== create panorex HelpersStack ==============
// ================================================

function initHelpersStack(rendererObj, points, plane, stack) {

  // resampling to pass always 10 points to uniform, and map them on windowWidth
  var spline  = new THREE.CatmullRomCurve3(points);

  var options = {
    'canvasWidth' : rendererObj.domElement.clientWidth,
    'canvasHeight': rendererObj.domElement.clientHeight,
    'tenPoints'   : [],
    'sCoords'     : [],
    'nOp'         : points.length
  };

  options.tenPoints = spline.getPoints(9);
  options.sCoords   = mapPointsOverSegment(options.tenPoints, [0, options.windowWidth]); //NOTE center panorex on window using this

  var geom = generatePanorexGeometry(options.tenPoints, plane, stack);
  // var l    = computeLength(points);

  var stackHelper = new PanorexStackHelper(stack, geom, options);

  return stackHelper;
}

function generateCrossSections(s, points, panorexPlane, stack, panoCenter){       // pass points or spline
  var spline  = new THREE.CatmullRomCurve3(points);
  var tangent = spline.getTangent(s);
  var origin  = spline.getPoint(s);
  // var planeN  = panorexPlane.normal;
  // var w       = 100;

  // calculate two points on the spline normal in origin
  // var splineN = tangent.cross(planeN);
  // var d  = splineN.multiplyScalar(w/2);
  // var p1 = origin.clone().add(d);
  // var p2 = origin.clone().sub(d);
  //
  // var crossLine = new THREE.LineCurve(p1,p2);
  // var crossLinePoints = crossLine.getPoints(9);
  var csPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(tangent, origin);
  console.log(stack)
  var planeGeom  = createCSGeometry(csPlane, origin, stack, panorexPlane);

  // var matrix  = new THREE.Matrix4();
  // var angles  = new THREE.Euler();
  // angles.setFromVector3(tangent);
  // matrix.makeRotationFromEuler(angles);
  // planeG.applyMatrix(matrix);
  // matrix.makeTranslation(origin);
  // planeG.applyMatrix(matrix);

  // var options = {
  //   'canvasWidth' : w,
  //   'canvasHeight': null,
  //   'tenPoints'   : crossLinePoints,
  //   'sCoords'     : [],
  //   'nOp'         : points.length
  // };
  //
  // options.sCoords = mapPointsOverSegment(options.tenPoints, [0, options.windowWidth]);
  console.log(panoCenter);
  var stackHelper = new CSStackHelper(stack, planeGeom, panoCenter);

  return stackHelper;
}

function createCSGeometry(plane, origin, stack, panorexPlane){
  // Create a basic rectangle geometry
  var planeGeometry = new THREE.PlaneGeometry(100, 100);
  // Align the geometry to the plane // !!!!!! geometry has no UP property !!!!!!!!  --> use matrix
  var coplanarPoint = origin.clone().applyMatrix4(stack.ijk2LPS);
  var focalPoint    = new THREE.Vector3().copy(coplanarPoint).add(plane.normal.clone().multiplyScalar(5));
  var matrix5       = new THREE.Matrix4().lookAt(coplanarPoint, focalPoint, panorexPlane.normal.clone()); //from eye to center oriented by up
  planeGeometry.translate(origin.x, origin.y, origin.z);

  var centeringMatrix = new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);
  planeGeometry.applyMatrix(centeringMatrix);
  planeGeometry.applyMatrix(matrix5);
  planeGeometry.applyMatrix(centeringMatrix.getInverse(centeringMatrix));

  return planeGeometry;
}

// =====================================================
// ===== map points over given segment =================
// =====================================================

function mapPointsOverSegment(points, segment){

  // compute total length and init point obj
  var l = 0;
  var pointsObj = [];

  var firstPoint = {
    'coords' : points[0],           // card coords
    'd'      : 0,                   // distance from previous point
    's'      : null                 // curvilinear coord
  };

  for (var p=1; p<points.length; p++){
      var current_length = points[p-1].distanceTo(points[p]);
      l += current_length;
      var obj = {
                    'coords' : points[p],           // card coords
                    'd'      : current_length,      // distance from previous point
                    's'      : null,                // curvilinear coord (w coord)
                };
      pointsObj.push(obj);
  }

  // compute curvilinear coord
  // NOTE: this suppose a line moving always afterwards

  var partial_sum = 0;
  var w = segment[1] - segment[0]; // best is windowWidth, until spline length becomes bigger TODO manage this ?
                                   // TODO note that in xyz coord the stack can not be in 0-wW...to fix

  for (var p=0; p<pointsObj.length; p++){
    partial_sum += pointsObj[p].d;
    pointsObj[p].s = segment[0] + partial_sum;
  }
  var sArr = _.pluck(pointsObj, 's');
  sArr.unshift(segment[0]);

  return sArr;
}

// =====================================================
// ===== generate shape and geometry for panorex =======
// =====================================================

// points is the user-defined array of points (Vectors3)
function generatePanorexGeometry(points, plane, stack){
  // rotate points to make them lay on xy plane
          // 1. compute angle btw plane and xy plane, store Z component
          // 2. apply rotation to points
          // 3. extrude along Z axis (default)
          // 4. at the end, rotate the final geometry to match original direction  (inverse matrix) and Z position
  var z_component = points[0].z;

  var z_axis      = new THREE.Vector3(0,0,1);
  var quaternion  = new THREE.Quaternion();
  var rotMatrix   = new THREE.Matrix4();
  quaternion.setFromUnitVectors(z_axis, plane.normal.clone().normalize());
  rotMatrix.makeRotationFromQuaternion(quaternion);

  for (var i = 1; i < points.length; i++) {
    points[i].applyMatrix4(rotMatrix);
  }

  // create shape
  var shape = new THREE.Shape();

  shape.moveTo(points[0].x, points[0].y);

  for (var p = 1; p < points.length; p++) {
    shape.lineTo(points[p].x, points[p].y);
  }

  // calculate extrusion amount in both directions
  var bounds = stack.dimensionsIJK;
  var origin = stack._origin;

  var extrusionLengthUp   = (origin.z + bounds.z) - z_component; //bounds.z * sliceThickness
  var extrusionLengthDown = -(z_component - origin.z);

  // extrude along Z axis (shape is drawn on xy plane by default)
  var settingsUp = {
    steps: 1,
    amount: extrusionLengthUp,
    bevelEnabled: false,
  };
  var settingsDown = {
    steps: 1,
    amount: extrusionLengthDown,
    bevelEnabled: false,
  };

  var extrudedGeometryUp   = new THREE.ExtrudeGeometry(shape, settingsUp);
  var extrudedGeometryDown = new THREE.ExtrudeGeometry(shape, settingsDown);

  // apply initial orientation along plane axis

  // var quaternion = new THREE.Quaternion();
  // var rotMatrix  = new THREE.Matrix4();
  // quaternion.setFromUnitVectors(z_axis, plane.normal.clone().normalize());
  // rotMatrix.makeRotationFromQuaternion(quaternion);
  // extrudedGeometryUp.applyMatrix(rotMatrix);
  // extrudedGeometryDown.applyMatrix(rotMatrix);
  var inverseMatrix = new THREE.Matrix4().getInverse(rotMatrix);
  extrudedGeometryUp.applyMatrix(inverseMatrix);
  extrudedGeometryDown.applyMatrix(inverseMatrix);

  // merge Upper and Lower geometry and apply Z initial component

  var trMatrix = new THREE.Matrix4().makeTranslation(0,0,z_component);
  extrudedGeometryUp.merge(extrudedGeometryDown);
  extrudedGeometryUp.applyMatrix(trMatrix);

  return extrudedGeometryUp;
};

// ================================================
// ===== compute panorex line length ==============
// ================================================

function computeLength(points) {
  var totLength = 0;
  var p_old, p_new, length;

  for (var p = 1; p < points.length; p++) {
    p_old = points[p-1];
    p_new = points[p];
    length = p_new.distanceTo(p_old);
    totLength += length;
  }

  return totLength;
};

// =====================================================
// ======== generate points for testing ================
// =====================================================

function generateFakePoints(stack){

  var plane = new THREE.Plane(new THREE.Vector3(0,0,1).normalize(), 100);

  var points = [];
  points[0] = new THREE.Vector3(  0, 150, 100);
  points[1] = new THREE.Vector3( -150, 150, 100);
  points[2] = new THREE.Vector3( -120, 60, 100);
  points[3] = new THREE.Vector3( -60, -30, 100);
  points[4] = new THREE.Vector3( -30, -51, 100);
  points[5] = new THREE.Vector3(  0, -60, 100);
  points[6] = new THREE.Vector3(  30, -51, 100);
  points[7] = new THREE.Vector3(  60, -30, 100);
  points[8] = new THREE.Vector3(  120, 60, 100);
  points[9] = new THREE.Vector3(  150, 150, 100);
  // points[10] = new THREE.Vector3(  0, 150, 0);

  points.shift();

  // move input points to simulate real situation

  var quaternion = new THREE.Quaternion().setFromUnitVectors(plane.normal.clone().normalize(), new THREE.Vector3(0,0,1));
  var rotMatrix  = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

  for (var p=0; p<points.length; p++){
    points[p].x += stack.halfDimensionsIJK.x;
    points[p].y += stack.halfDimensionsIJK.y;
    points[p].applyMatrix4(rotMatrix);
  }

  return [points, plane];
}

//=====================================//
//== DRAW PLANE for dev ===============//
//=====================================//

var drawPlane = function (plane,scene,col,size){
  var normal = plane.normal;
  var distance = -plane.constant;
  var translationVector = normal.clone().normalize().multiplyScalar(distance);
  // console.log(translationVector)
  var planeGeometry = new THREE.PlaneGeometry( size, size );
  var planeMaterial = new THREE.MeshPhongMaterial( {color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.4});
  var planeToDraw = new THREE.Mesh( planeGeometry, planeMaterial );
  planeToDraw.name = col;
  planeGeometry.lookAt(normal);
  planeGeometry.translate(translationVector.x,translationVector.y,translationVector.z);
  var axis = new THREE.AxisHelper(10);
  planeToDraw.add(axis);
  scene.add(planeToDraw);
  return (planeToDraw);
};

// ===================================================================
// Performs translations and rotations on three js geometries ========
// ===================================================================

// This applies transformations directly on the geometry instead of using THREEjs matrix,
// in order to make contours work properly. Save matrix in the state.

var updateMatrix = function(sceneName, dataDisplayName, mov, value, current_matrix) {
  var scene3d = sceneName instanceof THREE.Scene ? sceneName : api.getRenderingSceneFromRenderer(sceneName);
  var mesh    = scene3d.getObjectByName(dataDisplayName);
  var bb      = getGeometryCentroid([mesh.geometry]);
  mesh.matrixAutoUpdate = false;

  // insert helper and align with current bounding box orientation
  var helper          = new THREE.AxisHelper(30);
  var centeringMatrix = new THREE.Matrix4().makeTranslation(-bb.center.x, -bb.center.y, -bb.center.z);
  var inverseMatrix   = new THREE.Matrix4();
  helper.matrixAutoUpdate = false;

  if (current_matrix){
    mesh.geometry.applyMatrix(centeringMatrix);
    var rot_matrix = new THREE.Matrix4();
    rot_matrix.extractRotation(current_matrix);
    helper.geometry.applyMatrix(rot_matrix);
    mesh.geometry.applyMatrix(inverseMatrix.getInverse(centeringMatrix));
    helper.geometry.attributes.position.needsUpdate = true;
  }

  // DEV visualize axis
  // mesh.add(helper);

  var actualMatrix = mesh.matrix;
  var position     = mesh.position;
  var new_matrix   = new THREE.Matrix4();
  var rotAxis, trAxis;

  switch (mov){
    case 'tx':
                trAxis = getRotationAxis(helper, 'x');
                new_matrix = translateAxisMatrix(trAxis, value);
                mesh.geometry.applyMatrix(new_matrix);
                break;
    case 'ty':
                trAxis = getRotationAxis(helper, 'y');
                new_matrix = translateAxisMatrix(trAxis, value);
                mesh.geometry.applyMatrix(new_matrix);
                break;
    case 'tz':
                trAxis = getRotationAxis(helper, 'z');
                new_matrix = translateAxisMatrix(trAxis, value);
                mesh.geometry.applyMatrix(new_matrix);
                break;
    case 'rx':
                mesh.geometry.applyMatrix(centeringMatrix);
                rotAxis = getRotationAxis(helper, 'x');
                new_matrix.makeRotationAxis(rotAxis, THREE.Math.DEG2RAD*value);
                mesh.geometry.applyMatrix(new_matrix);
                mesh.geometry.applyMatrix(centeringMatrix.getInverse(centeringMatrix));
                break;
    case 'ry':
                mesh.geometry.applyMatrix(centeringMatrix);
                rotAxis = getRotationAxis(helper, 'y');
                new_matrix.makeRotationAxis(rotAxis, THREE.Math.DEG2RAD*value);
                mesh.geometry.applyMatrix(new_matrix);
                mesh.geometry.applyMatrix(centeringMatrix.getInverse(centeringMatrix));
                break;
    case 'rz':
                mesh.geometry.applyMatrix(centeringMatrix);
                rotAxis = getRotationAxis(helper, 'z');
                new_matrix.makeRotationAxis(rotAxis, THREE.Math.DEG2RAD*value);
                mesh.geometry.applyMatrix(new_matrix);
                mesh.geometry.applyMatrix(centeringMatrix.getInverse(centeringMatrix));
                break;

    default:   console.log('no movement');
  }

  // update saved matrix
  var updated_matrix = new THREE.Matrix4();
  updated_matrix.multiplyMatrices(new_matrix, current_matrix); // pre-multiply

  return updated_matrix;

};

// ========================================================
// Get direction of passed axis from an axisHelper ========
// ========================================================

function getRotationAxis(axisHelper, dir){
  var points = axisHelper.geometry.attributes.position.array;
  var pos    = axisHelper.position;
  var index;

  switch (dir){
    case 'x': index = 0;
              break;
    case 'y': index = 2;
              break;
    case 'z': index = 4;
              break;
  }

  var eP = [points[index*3], points[index*3+1], points[index*3+2]];
  var sP = [points[index*3+3], points[index*3+4], points[index*3+5]];

  // update points with helper position
  eP[0] += pos.x;
  sP[0] += pos.x;
  eP[1] += pos.y;
  sP[1] += pos.y;
  eP[2] += pos.z;
  sP[2] += pos.z;

  var axis = new THREE.Vector3(eP[0]-sP[0], eP[1]-sP[1], eP[2]-sP[2]).normalize();

  return axis;
}

// =====================================================================================
// Create matrix representing a movement along 'axis' direction in scene coords ========
// =====================================================================================

function translateAxisMatrix(axis, d){
  alpha = axis.angleTo(new THREE.Vector3(1,0,0));
  beta  = axis.angleTo(new THREE.Vector3(0,1,0));
  gamma = axis.angleTo(new THREE.Vector3(0,0,1));
  xn    = -d * Math.cos(alpha);
  yn    = -d * Math.cos(beta);
  zn    = -d * Math.cos(gamma);

  var t   = new THREE.Vector3(xn, yn, zn);
  var mat = new THREE.Matrix4().setPosition(t);

  return mat;
}

// ================================================
// ===== export functions =========================
// ================================================
exports.generateGeometry      = generatePanorexGeometry;
exports.computeLength         = computeLength;
exports.initStackHelper       = initHelpersStack;
exports.setCamera             = setCamera;
exports.generateFakePoints    = generateFakePoints;
exports.generateCrossSections = generateCrossSections;
exports.drawPlane             = drawPlane;
exports.updateMatrix          = updateMatrix;
exports.createCSGeometry      = createCSGeometry;
exports.initMcStackHelper     = initMcStackHelper;
