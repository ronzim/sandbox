// Node modules
// var path       = require('path');
// var createTree = require('yaot');
// var smalltalk  = require('smalltalk');

// Local modules
// var api     = require(path.join(rootPath, 'js', 'api', 'operaAPI'));
// var cadData = require(path.join(rootPath, 'js', 'workflows', 'cadModel', 'cadModelsExtrusions'));

// Local variables
var cylinderTypes = [
  'extrusion',
  'support',
  'topExtrusion',
  'bottomExtrusion',
  'analogTopExtrusion',
  'analogBottomExtrusion'
];

/*  ========================  */
/*  Geometry methods          */
/*  ========================  */

// ============================================
// Get RASToLPS matrix transformation =========
// ============================================
var getRAStoLPS = function() {
  var RASToLPS = new THREE.Matrix4();
  RASToLPS.set(-1, 0, 0, 0,
                0, -1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1);
  return(RASToLPS);
};

// ============================================
// Compute centroIds of a face ================
// ============================================
var computeFaceCentroIds = function(geometry) {
  var f, fl, face;
  for (f = 0, fl = geometry.faces.length; f < fl; f ++) {
    face = geometry.faces[f];
    face.centroid = new THREE.Vector3();
    face.centroid.set(0, 0, 0);
    face.centroid.add(geometry.vertices[face.a]);
    face.centroid.add(geometry.vertices[face.b]);
    face.centroid.add(geometry.vertices[face.c]);
    face.centroid.divideScalar(3);
  }
  return geometry;
};

// ============================================
// Compute geometry(s) centroIds ==============
// ============================================
var getGeometryCentroid = function(geometries) {
  var minX, minY, minZ, maxX, maxY, maxZ, geometryFromArray, boundingBox;
  var center = new THREE.Vector3();
  if (geometries.length == 1) {
    geometryFromArray = geometries[0];
    geometryFromArray.computeBoundingBox();
    boundingBox = geometryFromArray.boundingBox;
    center.copy(boundingBox.getCenter());
    minX = boundingBox.min.x;
    minY = boundingBox.min.y;
    minZ = boundingBox.min.z;
    maxX = boundingBox.max.x;
    maxY = boundingBox.max.y;
    maxZ = boundingBox.max.z;
    min = new THREE.Vector3(minX, minY, minZ);
    max = new THREE.Vector3(maxX, maxY, maxZ);
  }
  else {
    for (var i = 0; i < geometries.length; i++) {
      geometryFromArray = geometries[i];
      if (geometryFromArray) {
        geometryFromArray.computeBoundingBox();
        boundingBox = geometryFromArray.boundingBox;
        if (i == 0) {
          minX = boundingBox.min.x;
          minY = boundingBox.min.y;
          minZ = boundingBox.min.z;
          maxX = boundingBox.max.x;
          maxY = boundingBox.max.y;
          maxZ = boundingBox.max.z;
        }
        else {
          if (boundingBox.min.x < minX) {
            minX = boundingBox.min.x;
          }
          if (boundingBox.min.y < minY) {
            minY = boundingBox.min.y;
          }
          if (boundingBox.min.z < minZ) {
            minZ = boundingBox.min.z;
          }
          if (boundingBox.max.x > maxX) {
            maxX = boundingBox.max.x;
          }
          if (boundingBox.max.x > maxY) {
            maxY = boundingBox.max.y;
          }
          if (boundingBox.max.x > maxX) {
            maxZ = boundingBox.max.z;
          }
        }
        min = new THREE.Vector3(minX, minY, minZ);
        max = new THREE.Vector3(maxX, maxY, maxZ);
        center = new THREE.Vector3();
        center.addVectors(min, max).multiplyScalar(0.5);
      }
    }
  }
  return {'center': center, 'min': min, 'max': max};
};

// ============================================
// Get the bounding box of a widget ===========
// ============================================
var getWidgetBoundingBox = function(sceneName) {
  var scene3d = sceneName instanceof THREE.Scene ? sceneName : api.getSceneFromRenderer(sceneName);
  var widget  = scene3d.getObjectByName('boxWidget');
  widget.geometry.computeBoundingBox();
  widget.geometry.computeFaceNormals();
  return widget.geometry.boundingBox;
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

  if (current_matrix) {
    mesh.geometry.applyMatrix(centeringMatrix);
    var rot_matrix = new THREE.Matrix4();
    rot_matrix.extractRotation(current_matrix);
    helper.geometry.applyMatrix(rot_matrix);
    mesh.geometry.applyMatrix(inverseMatrix.getInverse(centeringMatrix));
    helper.geometry.attributes.position.needsUpdate = true;
  }

  // DEV visualize axis
  // mesh.add(helper);

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
                new_matrix.multiplyMatrices(centeringMatrix, new_matrix);
                mesh.geometry.applyMatrix(centeringMatrix.getInverse(centeringMatrix));
                new_matrix.multiplyMatrices(new_matrix, centeringMatrix.clone());

                new_matrix.elements[13]*=-1;
                new_matrix.elements[14]*=-1;

                break;
    case 'ry':
                mesh.geometry.applyMatrix(centeringMatrix);
                rotAxis = getRotationAxis(helper, 'y');
                new_matrix.makeRotationAxis(rotAxis, THREE.Math.DEG2RAD*value);
                mesh.geometry.applyMatrix(new_matrix);
                new_matrix.multiplyMatrices(centeringMatrix, new_matrix);
                mesh.geometry.applyMatrix(centeringMatrix.getInverse(centeringMatrix));
                new_matrix.multiplyMatrices(new_matrix, centeringMatrix.clone());

                new_matrix.elements[12]*=-1;
                new_matrix.elements[14]*=-1;

                break;
    case 'rz':
                mesh.geometry.applyMatrix(centeringMatrix);
                rotAxis = getRotationAxis(helper, 'z');
                new_matrix.makeRotationAxis(rotAxis, THREE.Math.DEG2RAD*value);
                mesh.geometry.applyMatrix(new_matrix);
                new_matrix.multiplyMatrices(centeringMatrix, new_matrix);
                mesh.geometry.applyMatrix(centeringMatrix.getInverse(centeringMatrix));
                new_matrix.multiplyMatrices(new_matrix, centeringMatrix.clone());

                new_matrix.elements[12]*=-1;
                new_matrix.elements[13]*=-1;

                break;

    default:   console.log('no movement');
  }

  return new_matrix;

};

// ========================================================
// Get direction of passed axis from an axisHelper ========
// ========================================================
var getRotationAxis = function(axisHelper, dir) {
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
};

// =====================================================================================
// Create matrix representing a movement along 'axis' direction in scene coords ========
// =====================================================================================
var translateAxisMatrix = function(axis, d) {
  alpha = axis.angleTo(new THREE.Vector3(1,0,0));
  beta  = axis.angleTo(new THREE.Vector3(0,1,0));
  gamma = axis.angleTo(new THREE.Vector3(0,0,1));
  xn    = -d * Math.cos(alpha);
  yn    = -d * Math.cos(beta);
  zn    = -d * Math.cos(gamma);

  var t   = new THREE.Vector3(xn, yn, zn);
  var mat = new THREE.Matrix4().setPosition(t);

  return mat;
};

// ======================================
// Find center of a points cloud ========
// ======================================
var getPointsCentroid = function(points) {
  var min = points[0].clone();
  var max = points[0].clone();
  for (i=0; i<points.length; i++){
    p = points[i];
    if (p.x < min.x){
      min.x = p.x;
    } else if (p.x > max.x){
      max.x = p.x;
    }
    if (p.y < min.y){
      min.y = p.y;
    } else if (p.y > max.y){
      max.y = p.y;
    }
    if (p.z < min.z){
      min.z = p.z;
    } else if (p.z > max.z){
      max.z = p.z;
    }
  }
  var bb = new THREE.Box3(min, max);
  var center = bb.getCenter();

  return center;
};

// ==========================================
// Find bounding box of a points cloud ======
// ==========================================
var getPointsBoundingBox = function(points) {
  var min = points[0].clone();
  var max = points[0].clone();
  for (i=0; i<points.length; i++){
    p = points[i];
    if (p.x < min.x){
      min.x = p.x;
    } else if (p.x > max.x){
      max.x = p.x;
    }
    if (p.y < min.y){
      min.y = p.y;
    } else if (p.y > max.y){
      max.y = p.y;
    }
    if (p.z < min.z){
      min.z = p.z;
    } else if (p.z > max.z){
      max.z = p.z;
    }
  }
  var bb = new THREE.Box3(min, max);
  return bb;
};

// ==========================================
// Linear interpolation =====================
// ==========================================
var lerp = function(a, b, n) {
  return (1 - n) * a + n * b;
};

// ==========================================
// Compute squared distance =================
// ==========================================
var distanceToSquared = function(xa,ya,za,xb,yb,zb) {
	var dx = xb-xa;
	var dy = yb-ya;
	var dz = zb-za;
	return dx * dx + dy * dy + dz * dz;
};

// ==========================================
// Compute distance =========================
// ==========================================
var distanceTo = function(xa,ya,za,xb,yb,zb) {
	var dx = xb-xa;
	var dy = yb-ya;
	var dz = zb-za;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// ============================================
// Compute the distance between two 3D points =
// ============================================
var computeDistance = function( a, b ) {
  return Math.sqrt(Math.pow((b.x-a.x),2)+Math.pow((b.y-a.y),2)+Math.pow((b.z-a.z),2));
};

// ==========================================
// XYZ to IJK conversion ====================
// ==========================================
var toIjk = function(point, data) {
	var i = Math.floor( (point[0] - data.origin[0]) / data.spacing[0] );
	var j = Math.floor( (point[1] - data.origin[1]) / data.spacing[1] );
	var k = Math.floor( (point[2] - data.origin[2]) / data.spacing[2] );
	return [i,j,k];
};

// ==========================================
// Get pixel data value from ijk ============
// ==========================================
var getValueFromIjk = function(values, dot, size) {
	return values[dot[0] + dot[1]*size + dot[2]*size*size];
};

// ==========================================
// Set a value in a cube ====================
// ==========================================
var setCubeToValue = function(centralDot, edge, value, values, size) {
	var l = edge/2;
	var sigma = 1;
	for (var i = centralDot[0]-l; i<centralDot[0]+l; i++){
		for (var j = centralDot[1]-l; j<centralDot[1]+l; j++){
			for (var k = centralDot[2]-l; k<centralDot[2]+l; k++){
				values[i + j*size + k*size*size] = value * coeff[i + j*edge + k*edge*edge];
			}
		}
	}
};

// ==========================================
// Get a cube and returns the mean value ====
// ==========================================
var computeMeanCubeValue = function(centralDot, edge, values, size) {
	var cubeValues = new Array(edge*edge*edge);
	var l = edge/2;
	var d = 0;
	for (var i = centralDot[0]-l; i<centralDot[0]+l; i++){
		for (var j = centralDot[1]-l; j<centralDot[1]+l; j++){
			for (var k = centralDot[2]-l; k<centralDot[2]+l; k++){
				cubeValues[d] = values[i + j*size + k*size*size];
				d++;
			}
		}
	}
	return math.mean(cubeValues);
};

// ============================================
// Get image bounding Box =====================
// ============================================
var getImageBoundingBox = function(msg) {
  var bb = {
    min : {
      x: msg.data.origin[0],
      y: msg.data.origin[1],
      z: msg.data.origin[2]
    },
    max: {
      x: msg.data.origin[0] + msg.data.spacing[0] * msg.data.extent[1],
      y: msg.data.origin[1] + msg.data.spacing[1] * msg.data.extent[3],
      z: msg.data.origin[2] + msg.data.spacing[2] * msg.data.extent[5]
    },
    center:{},
    dimX:0,
    dimY:0,
    dimZ:0
  };
  bb.center = {
    x: bb.min.x + (bb.max.x - bb.min.x)/2,
    y: bb.min.y + (bb.max.y - bb.min.y)/2,
    z: bb.min.z + (bb.max.z - bb.min.z)/2
  };
  bb.dimX = bb.max.x - bb.min.x;
  bb.dimY = bb.max.y - bb.min.y;
  bb.dimZ = bb.max.z - bb.min.z;
  return bb;
};

// =============================
// generate objects ============
// =============================

// =============================
// Add cylinder in the scene ===
// =============================
var addCylinderHelpers = function(modelName, visible) {
  var workflowId  = _state.get(['application', 'active', 'workflow']);
  var objectsList = _state.get(['workflows', workflowId, 'params', 'stepData', 'cadObjects']);
  var panoPoints  = _state.get(['workflows', workflowId, 'params', 'stepData', 'panorex', 'points']);
  var panoNormal  = new THREE.Plane().setFromCoplanarPoints(panoPoints[0], panoPoints[1], panoPoints[2]).normal;
  var spline      = new THREE.CatmullRomCurve3(panoPoints);
  var scene3d     = api.getRenderingSceneFromRenderer('r3D');

  // Remove helpers if already in scene
  removeCylinderHelpers();

  var addCylinder = function(modelName, modelType, cylinderName, objectData, sleeveId, replicaId) {
    var obj = generateCylinderHelper(
      modelName,
      modelType,
      cylinderName,
      objectData.props,
      panoNormal,
      spline,
      sleeveId,
      replicaId
    );
    obj.name = objectData.dataId + '_' + cylinderName;
    obj.material.opacity = visible ? 0.5 : 0.0;
    obj.renderOrder = 1;

    scene3d.add(obj);
  };

  var firstObject;
  _.each(objectsList, function(o) {
    // IMPLANT HELPERS
    if (o.props.type == 'implant' || o.props.type == 'freeImplant') {
      // TODO apply custom hSLSleeve (advanced user)
      if (modelName == 'surgicalGuide') {
        var implantSleeveProps = _.findWhere(
          _.pluck(objectsList, 'props'),
          {type: 'implantSleeve', parentId: o.props.parentId}
        ) || {};

        if (implantSleeveProps) {
          addCylinder(modelName, 'implant', 'extrusion', o, implantSleeveProps.toolId);
          addCylinder(modelName, 'implant', 'support', o, implantSleeveProps.toolId);
        }
      }
      else if (modelName == 'anatomicModel') {
        var analogPropsId;

        if (o.props.type == 'freeImplant') {
          analogPropsId = 'freeImplant';
        } else {
          var analogProps = _.findWhere(
            _.pluck(objectsList, 'props'),
            {type: 'replica', parentId: o.props.parentId}
          ) || {};
          analogPropsId = analogProps.toolId;
        }

        var cylNames = ['topExtrusion', 'bottomExtrusion', 'analogTopExtrusion', 'analogBottomExtrusion'];
        _.each(cylNames, function(name) {
          addCylinder(modelName, 'implant', name, o, null, analogPropsId);
        });
      }
    }
    // PIN HELPERS
    else if (o.props.type == 'pin') {
      addCylinder(modelName, 'pin', 'extrusion', o);

      if (modelName == 'surgicalGuide') {
        addCylinder(modelName, 'pin', 'support', o);
      }
    }
  });

  _state.set(['application', 'r3D', 'isRendering'], true);
};

var getCylinderProps = function(modelName, objType, cylinderHelperType, sleeveCode, replicaCode, objProps) {
  var sleeveProps = {};
  if (sleeveCode) {
    sleeveProps = cadData.sleeveData[sleeveCode];
  }

  var analogProps = {};
  if (replicaCode) {
    if (replicaCode == 'freeImplant') {
      analogProps = {
        l1Model: objProps.height,
        l2Model: 0,
        d1Model: Math.max(objProps.bottomRadius, objProps.topRadius) * 2,
        d2Model: 0
      }
    } else {
      analogProps = cadData.analogData[replicaCode];
    }
  }
  // TODO* export rules in cadModelsExtrusions

  // D: cylinder diameter
  // L: cylinder height
  // H: cylinder center distance from implant center position
  var anatomicModelData = {
    implant: {
      topExtrusion: {
        D: analogProps.d1Model + 1.5 + cadData.sleeveTol,
        L: 40,
        H: 40 / 2
      },
      bottomExtrusion: {
        D: 2, // fixed
        L: 40,
        H: -(40 / 2)
      },
      analogTopExtrusion: {
        D: analogProps.d1Model + cadData.sleeveTol,
        L: analogProps.l1Model,
        H: -(analogProps.l1Model / 2)
      },
      analogBottomExtrusion: {
        D: analogProps.d2Model + cadData.sleeveTol,
        L: analogProps.l1Model + analogProps.l2Model,
        H: -((analogProps.l1Model + analogProps.l2Model) / 2)
      }
    },
    pin: {
      extrusion: {
        D: cadData.dIntSleevePin + cadData.sleeveTol,
        L: 40,
        H: (40 / 2) - (cadData.lPin + cadData.lSleevePin)
      }
    }
  };

  var surgicalGuideData = {
    implant: {
      extrusion: {
        D: sleeveProps.dIntSleeve + cadData.sleeveTol,
        L: 40,
        H: 40 / 2
      },
      support: {
        D: sleeveProps.dExtSleeve + 4,
        L: sleeveProps.lSlSleeve,
        H: sleeveProps.hSlSleeve + sleeveProps.lSlSleeve / 2
      }
    },
    pin: {
      extrusion: {
        D: cadData.dIntSleevePin + cadData.sleeveTol,
        L: 40,
        H: (40 / 2) - (cadData.lPin + cadData.lSleevePin)
      },
      support: {
        D: cadData.dExtSleevePin + 2,
        L: cadData.lSleevePin,
        H: -(cadData.lSleevePin / 2)
      }
    }
  };

  var data = modelName == 'anatomicModel' ? anatomicModelData : surgicalGuideData;
  return data[objType][cylinderHelperType];
};

// ===================================
// Generate the implant extrusions ===
// ===================================
var generateCylinderHelper = function(modelName, objType, cylinderHelperType,
                                      objProps, panoNormal, spline, sleeveId, replicaId) {
  // cylinder props
  var sleeveCode;
  if (sleeveId) {
    sleeveCode = _state.get(['planningLibrary', 'sleeves_implant', sleeveId, 'itemCode']);
  }

  var replicaCode;
  if (replicaId) {
    if (replicaId == 'freeImplant') {
      replicaCode = replicaId;
    } else {
      replicaCode = _state.get(['planningLibrary', 'replica', replicaId, 'itemCode']);
    }
  }

  var data = getCylinderProps(modelName, objType, cylinderHelperType, sleeveCode, replicaCode, objProps);
  // cylinder center vector
  var C = new THREE.Vector3(0,0,1).multiplyScalar(data.H);

  // get position and rotation along spline
  var tCoord = objProps.crossSectionCenter;
  var axis   = spline.getTangentAt(tCoord).cross(panoNormal);
  var mesh = create3dCylinder(data.D, data.L, C, axis, objProps.parentMatrix, cylinderHelperType);
  mesh.cylinderHelperType = cylinderHelperType;

  return mesh;
};

// =========================================
// Create the 3D cylinder for extrusions ===
// =========================================
var create3dCylinder = function(d, h, c, axis, matrix, cylinderType) {
  // init geometry
  var g = new THREE.CylinderGeometry(d/2, d/2, h, 32);

  // align geometry with implant
  var posMatrix = new THREE.Matrix4().setPosition(c);
  var zAxisAlignMatrix = new THREE.Matrix4().makeRotationX(Math.PI/2);
  g.applyMatrix(zAxisAlignMatrix);
  g.applyMatrix(posMatrix);
  g.applyMatrix(matrix);

  var _h = cylinderType == 'support' ? h : h / 2;
  var p1 = new THREE.Vector3(0,_h,0);
  var p2 = new THREE.Vector3(0,-h/2,0);
  p1.applyMatrix4(zAxisAlignMatrix);
  p1.applyMatrix4(posMatrix);
  p1.applyMatrix4(matrix);

  p2.applyMatrix4(zAxisAlignMatrix);
  p2.applyMatrix4(posMatrix);
  p2.applyMatrix4(matrix);

  // create mesh
  var m = new THREE.MeshPhongMaterial({color: 'yellow', transparent: true, opacity: 0.5});
  var cylMesh = new THREE.Mesh(g, m);
  cylMesh.p1 = p1;
  cylMesh.p2 = p2;
  cylMesh.radius = d / 2;

  return cylMesh;
};

// ===============================================================================
// Populate arrays of extrusions and supports to be used for computational API ===
// ===============================================================================
var buildCylinderArrays = function() {
  var scene3d = api.getRenderingSceneFromRenderer('r3D');
  var extrusions = _.without(cylinderTypes, 'support');

  var outExtrusionsArray = [];
  var outSupportsArray = [];

  _.each(scene3d.children, function(c) {
    if (_.contains(extrusions, c.cylinderHelperType)) {
      outExtrusionsArray = outExtrusionsArray.concat([c.p1.x, c.p1.y, c.p1.z, c.p2.x, c.p2.y, c.p2.z, c.radius]);
    } else if (c.cylinderHelperType == 'support') {
      outSupportsArray = outSupportsArray.concat([c.p1.x, c.p1.y, c.p1.z, c.p2.x, c.p2.y, c.p2.z, c.radius]);
    }
  });

  return {
    outExtrusionsArray: outExtrusionsArray,
    outSupportsArray: outSupportsArray
  };
};

// ==========================
// Cylinder helpers utils ===
// ==========================
var removeCylinderHelpers = function() {
  var scene3d = api.getRenderingSceneFromRenderer('r3D');
  if (!scene3d) {
    return;
  }

  _.each(_.clone(scene3d.children), function(obj) {
    if (obj && obj.cylinderHelperType && _.contains(cylinderTypes, obj.cylinderHelperType)) {
      scene3d.remove(obj);
    }
  });

  _state.set(['application', 'r3D', 'isRendering'], true);
};

var toggleCylinderHelpers = function(visible) {
  var scene3d = api.getRenderingSceneFromRenderer('r3D');
  if (!scene3d) {
    return;
  }

  _.each(_.clone(scene3d.children), function(obj) {
    if (obj && obj.cylinderHelperType && _.contains(cylinderTypes, obj.cylinderHelperType)) {
      obj.material.opacity = visible ? 0.5 : 0.0;
    }
  });

  _state.set(['application', 'r3D', 'isRendering'], true);
};

// =================================
// Move a point over a direction ===
// =================================
var movePointOverDir = function(startPos, direction, distance) {
  var dist = new THREE.Vector3();
  dist.x = startPos.x + direction.x * distance;
  dist.y = startPos.y + direction.y * distance;
  dist.z = startPos.z + direction.z * distance;
  return dist;
};

// ============================================
// From xyz array to THREE.Points array =======
// ============================================

function threePointsArrayToPlainArray(threeArray){
  var array = [];

  for (var p=0; p < threeArray.length; p++){
    array.push(threeArray[p].x);
    array.push(threeArray[p].y);
    array.push(threeArray[p].z);
  }

  return array;
}

// ============================================
// From xyz array to THREE.Points array =======
// ============================================

function plainArrayToThreePointsArray(array){
  var threeArray = [];

  for (var p=0; p < array.length; p+=3){
    threeArray.push(new THREE.Vector3(array[p], array[p+1], array[p+2]));
  }

  return threeArray;
}

// =============================================================
// Create bboxes array to be used for concave geometries =======
// =============================================================

function createBBoxes(tubeGeometry){
  var pointsArray = plainArrayToThreePointsArray(tubeGeometry.attributes.position.array);
  // console.time('creating bboxes');
  var chunks = _.chunk(pointsArray, 50);
  var boxes = chunks.map(function(c){
    var box = new THREE.Box3().setFromPoints(c);

    // dev add to scene
    // var s = api.getRenderingSceneFromRenderer('r3D', 'r3D');
    // s.add(new THREE.Box3Helper(box, 'yellow'));
    // end dev

    return box;
  });
  tubeGeometry.bBoxes = boxes;
  // console.timeEnd('creating bboxes');
}

// =============================================================
// Check collisions against a concave mesh =====================
// =============================================================

var checkConcaveGeometryCollision = function(mesh_, mesh, toll){

  if (!mesh_ || !mesh) {
    return null;
  }

  if (!mesh_.geometry.bBoxes){
    createBBoxes(mesh_.geometry);
  }

  // console.time('nerve collision')

  if (!mesh.geometry.boundingBox){mesh.geometry.computeBoundingBox()};
  var movingObj = mesh.geometry.boundingBox;
  var collisions = mesh_.geometry.bBoxes.map(box => movingObj.intersectsBox(box));

  // console.timeEnd('nerve collision')

  return collisions.reduce((a,b) => (a || b));
}

// ============================================
// checkObjectCollisions ======================
// ============================================

var checkObjectCollisions = function(mesh_, mesh, toll) {

  // console.time('obj collision')
  if (!mesh_ || !mesh) {
    return null;
  }

  if (!mesh_.geometry.boundingBox) {
    mesh_.geometry.computeBoundingBox();
  }
  if (!mesh.geometry.boundingBox) {
    mesh.geometry.computeBoundingBox();
  }
  var movingObj = mesh.geometry.boundingBox;
  var testObj   = mesh_.geometry.boundingBox;
  var collision = movingObj.intersectsBox(testObj);

  // console.timeEnd('obj collision')

  return collision;

};

// ==================================================
// Perform collision check w/ objects and nerve =====
// ==================================================
var checkCollisions = function(model, i, brothers) {
  var nerveCollision  = false;
  var objectCollision = false;

  // get scene data objects
  var scene3d     = api.getRenderingSceneFromRenderer('r3D');
  var meshTocheck = scene3d.getObjectByName(model.id);
  var sceneObjs   = api.getSceneDataObjects('r3D');

  if (!meshTocheck){
    console.warn('no mesh to check', model);
    return;
  }

  var toCheck = sceneObjs.filter(function(o){
    var cond1 = !o.id.includes('nerveSpline'); // not nerves
    var cond2 =  o.type !== 'object3D'; // not parent objects
    var cond3 =  o.id !== 'radiologicalGuideDataDisplay';  // not guide
    var cond4 =  brothers.map(b => (b.id !== o.id)).reduce((a,b) => (a && b));

    return cond1 && cond2 && cond3 && cond4;
  });

  // NOTE use every instead of each to enhance performance (exit on first false found)

  // foreach check collision
  _.every(toCheck, function(o){
      var mesh = scene3d.getObjectByName(o.dataId);
      objectCollision = api.checkObjectCollisions(mesh, meshTocheck, 1);
      return !objectCollision;
  });

  // check collision with nerve
  var nerves = sceneObjs.filter(o => o.id.includes('nerve3d'));

  _.every(nerves, function(n){
    var mesh = scene3d.getObjectByName(n.id);
    nerveCollision = api.checkNerveCollisions(mesh, meshTocheck, 1);
    return !nerveCollision;
  });

  var res = objectCollision || nerveCollision;

  if (res == true) {
    smalltalk.alert(
      'Collision',
      'An object collision has been detected.'
    );
  }

  return !res; // false ends the every cycle
};



/*  ========================  */
/*  Export methods            */
/*  ========================  */
exports.getRAStoLPS           = getRAStoLPS;
exports.computeFaceCentroIds  = computeFaceCentroIds;
exports.getGeometryCentroid   = getGeometryCentroid;
exports.getWidgetBoundingBox  = getWidgetBoundingBox;
exports.updateMatrix          = updateMatrix;
exports.getRotationAxis       = getRotationAxis;
exports.translateAxisMatrix   = translateAxisMatrix;
exports.getPointsCentroid     = getPointsCentroid;
exports.getPointsBoundingBox  = getPointsBoundingBox;
exports.lerp                  = lerp;
exports.distanceToSquared     = distanceToSquared;
exports.distanceTo            = distanceTo;
exports.computeDistance       = computeDistance;
exports.toIjk                 = toIjk;
exports.getValueFromIjk       = getValueFromIjk;
exports.setCubeToValue        = setCubeToValue;
exports.computeMeanCubeValue  = computeMeanCubeValue;
exports.getImageBoundingBox   = getImageBoundingBox;
exports.addCylinderHelpers    = addCylinderHelpers;
exports.buildCylinderArrays   = buildCylinderArrays;
exports.toggleCylinderHelpers = toggleCylinderHelpers;
exports.movePointOverDir      = movePointOverDir;
exports.checkObjectCollisions = checkObjectCollisions;
exports.checkNerveCollisions  = checkConcaveGeometryCollision;
exports.createBBoxes          = createBBoxes;
exports.checkCollisions       = checkCollisions;
