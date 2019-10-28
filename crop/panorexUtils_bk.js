// var AMI               = require('/Users/orobix/Projects/ami/build/ami.js');
var AMI                  = require('./libs/ami/ami.js');
// console.log(AMI);

var HelpersBoundingBox = AMI.BoundingBoxHelper;
var HelpersStack       = require("./libs/ami/helpers.stack_panorex.js").HelpersStack;

var ShadersContourUniform  = AMI.ContourUniformShader;
var ShadersContourVertex   = AMI.ContourVertexShader;
var ShadersContourFragment = AMI.ContourFragmentShader;

// ================================================
// ===== set environment for panorex (camera) =====
// ================================================


function setCamera(rendererObj, stack) {

    // rendererObj.stackHelper = initHelpersStack(rendererObj.scene, stack);

    // set camera
    let worldbb = stack.worldBoundingBox();
    let lpsDims = new THREE.Vector3(
      (worldbb[1] - worldbb[0])/2,
      (worldbb[3] - worldbb[2])/2,
      (worldbb[5] - worldbb[4])/2
    );

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
// ===== render panorex to the scene ==============
// ================================================

function initHelpersStack(scene, stack) {

    // TEST FUNCTION: (points will be taken from _state)

    var plane = new THREE.Plane(new THREE.Vector3(1,0,5).normalize(), 0);

    var points = [];
    points[0] = new THREE.Vector3(  0, 150, 0);
    points[1] = new THREE.Vector3( -150, 150, 0);
    points[2] = new THREE.Vector3( -120, 60, 0);
    points[3] = new THREE.Vector3( -60, -30, 0);
    points[4] = new THREE.Vector3( -30, -51, 0);
    points[5] = new THREE.Vector3(  0, -60, 0);
    points[6] = new THREE.Vector3(  30, -51, 0);
    points[7] = new THREE.Vector3(  60, -30, 0);
    points[8] = new THREE.Vector3(  120, 60, 0);
    points[9] = new THREE.Vector3(  150, 150, 0);
    points[10] = new THREE.Vector3(  0, 150, 0);

    // move input points to simulate real situation

    var quaternion = new THREE.Quaternion().setFromUnitVectors(plane.normal.clone().normalize(), new THREE.Vector3(0,0,1));
    var rotMatrix  = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

    for (var p=0; p<points.length; p++){
      points[p].x += stack.halfDimensionsIJK.x;
      points[p].y += stack.halfDimensionsIJK.y;
      points[p].applyMatrix4(rotMatrix);
    }

    // console.log(quaternion);
    // console.log(rotMatrix);
    console.log("input points", points);

    // END TEST

    var geom = generatePanorexGeometry(points, plane, stack);

    console.log(geom);

    var l    = computeLength(points);

  // DEV use external geometry
    // var geom = new THREE.CylinderGeometry(100, 100, 235, 64, 1, true, 3*Math.PI/2, Math.PI);
    var translation = new THREE.Matrix4();
    var rotation = new THREE.Matrix4();
    var scale = new THREE.Matrix4();
    // rotation.makeRotationX(Math.PI/2);
    // rotation.makeRotationZ(Math.PI/2);
    // scale.makeScale(30,30,1);
    // if (!dy){dy = 50;}
    // translation.makeTranslation(center.x,center.y+dy,center.z);
    // geom.applyMatrix(scale);
    // geom.applyMatrix(rotation);
    // geom.applyMatrix(translation);

              // DEV fun

    // rendererObj.stackHelper = new HelpersStack(stack, geom);
    // rendererObj.stackHelper._slice.updateHalfLength(l/2);

    var stackHelper = new HelpersStack(stack, geom);
    stackHelper._slice.updateHalfLength(l/2);

              // END DEV fun


    // geom.computeBoundingBox();
    // var bb = geom.boundingBox;
    // console.log(bb);

    // var material = new THREE.MeshPhongMaterial( { color: 0x000055, wireframe:true, transparent:true, opacity: 0.6} );
    // var mesh     = new THREE.Mesh( geom, material ) ;
    // r0.scene.add(mesh);

  // END DEV

    stackHelper.bbox.visible = false;
    stackHelper.borderColor = "green";
    // rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
    // rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;

    // set camera
    // let worldbb = stack.worldBoundingBox();
    // let lpsDims = new THREE.Vector3(
    //   (worldbb[1] - worldbb[0])/2,
    //   (worldbb[3] - worldbb[2])/2,
    //   (worldbb[5] - worldbb[4])/2
    // );
    //
    // // box: {halfDimensions, center}
    // let box = {
    //   center: stack.worldCenter().clone(),
    //   halfDimensions:
    //     new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
    // };
    //
    // // init and zoom
    // let canvas = {
    //     width:  rendererObj.domElement.clientWidth,
    //     height: rendererObj.domElement.clientHeight,
    //   };
    //
    // rendererObj.camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
    // rendererObj.camera.box = box;
    // rendererObj.camera.canvas = canvas;
    // rendererObj.camera.orientation = rendererObj.sliceOrientation;
    // rendererObj.camera.update();
    // rendererObj.camera.fitBox(2, 1);

            // DEV fun
    // rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
    // rendererObj.stackHelper.index = Math.floor(rendererObj.stackHelper.orientationMaxIndex/2);
    // rendererObj.scene.add(rendererObj.stackHelper);

    stackHelper.orientation = 2;   //TODO check this
    stackHelper.index = Math.floor(stackHelper.orientationMaxIndex/2);  //TODO don't think this is meaningful
    scene.add(stackHelper);

    console.log("add stackHelper to ", scene);

    return stackHelper;

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

    center = stack.halfDimensionsIJK;
    bounds = stack.dimensionsIJK;

  // ======== TODO modify this to match with real situation (xy plane offset): ====================

    var extrusionLengthUp   = bounds.z - center.z;
    var extrusionLengthDown = -(bounds.z - center.z);

    // DEV
    // var extrusionLengthUp   = 2*(bounds.z - center.z);
    // var extrusionLengthDown = 0;

  // ==============================================================================================


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
}

// ================================================
// ===== compute panorex line length ==============
// ================================================

function computeLength(points){
  var totLength = 0;
  var p_old, p_new, length;
  for (var p = 1; p < points.length; p++){
    p_old = points[p-1];
    p_new = points[p];
    length = p_new.distanceTo(p_old);
    totLength += length;
  }
  return totLength;
}

// ================================================
// ===== export functions =========================
// ================================================

exports.generateGeometry = generatePanorexGeometry;
exports.computeLength    = computeLength;
exports.initStackHelper  = initHelpersStack;
exports.setCamera        = setCamera;
