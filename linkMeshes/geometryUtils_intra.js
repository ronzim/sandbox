// Node modules
var _ = require('underscore');
var createTree = require('yaot');

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
    }
    min = new THREE.Vector3(minX, minY, minZ);
    max = new THREE.Vector3(maxX, maxY, maxZ);
    center = new THREE.Vector3();
    center.addVectors(min, max).multiplyScalar(0.5);
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
// Order seeds clockwise ======================
// ============================================

function orderPointsByAngle(points, normals){
    // compute mean normal direction and origin
    var dx = 0;
    var dy = 0;
    var dz = 0;
    var ox = 0;
    var oy = 0;
    var oz = 0;

    for(var i=0; i<points.length; i++){
      ox += points[i].x;
      oy += points[i].y;
      oz += points[i].z;
    }

    for(var j=0; j<points.length; j++){
      dx += normals[j].x;
      dy += normals[j].y;
      dz += normals[j].z;
    }

    var lm = points.length;
    var o = new THREE.Vector3(ox/lm, oy/lm, oz/lm);
    var d = new THREE.Vector3(dx/lm, dy/lm, dz/lm);

    // console.log(o, d);

    // create objects to order
    var seeds = [];
    for(var k=0; k<points.length; k++){
      var obj = {
        'coords' : points[k],
        'angle'  : 0.0,
        'ray'    : new THREE.Vector3().subVectors(points[k], o).normalize(), // check sign?
        'normal' : normals[k]
      };
      seeds.push(obj);
    }

    // keep first vect as zero,
    // cycle on other and compute angle
    var ray_zero = seeds[0].ray;
    for(var l=1; l<points.length; l++){
      seeds[l].angle = seeds[l].ray.distanceTo(ray_zero);
      var ray = seeds[l].ray;
      var sign = Math.sign(d.dot(ray.cross(ray_zero)));
      seeds[l].angle *= sign;
    }

    //dev
    // for(var s=0; s<seeds.length; s++){
    //   console.log(seeds[s].angle);
    // }

    // sort by angle
    seeds.sort(function(a, b){
        return a.angle - b.angle;
      });

    //dev
    // for(var s=0; s<seeds.length; s++){
    //   console.log(seeds[s].angle);
    // }

    return seeds;
}

function rotateMeshOnAxis(mesh, axis, degrees){
  // get bb center
  mesh.geometry.computeBoundingBox()
  var center = mesh.geometry.boundingBox.getCenter();

  // translate to origin
  var bbCenter = center.clone().negate()
  var trMat  = new THREE.Matrix4().makeTranslation(bbCenter.x, bbCenter.y, bbCenter.z);
  // rotate
  var rotMat = new THREE.Matrix4().makeRotationAxis(axis.normalize(), THREE.Math.degToRad(degrees));
  // back in place
  var invMat = new THREE.Matrix4().getInverse(trMat);

  // apply to geometry
  mesh.geometry.applyMatrix(trMat);
  mesh.geometry.applyMatrix(rotMat);
  mesh.geometry.applyMatrix(invMat);
}

function lerp(array){
  var normLerp = {x: 0, y:0, z:0};
  for (var n=0; n<array.length; n+=3){
    normLerp.x += array[n];
    normLerp.y += array[n+1];
    normLerp.z += array[n+2];
  }

  normLerp.x /= array.length;
  normLerp.y /= array.length;
  normLerp.z /= array.length;

  return normLerp;
}

function dedup(arr) {
	var grouper = function(a, n) {
		var out = [];
		for (var i = 0; i < a.length;) {
			var grp = [];
			for (var j = 0; j < n; j++, i++) {
				grp.push(a[i])
			}
			out.push(grp);
		}
		return out;
	};

	var flatten = function(a) {
		var out = [];
		for (var i = 0; i < a.length; i++) {
			for (var j = 0; j < a[i].length; j++) {
				out.push(a[i][j]);
			}
		}
		return out;
	};

	arr = grouper(arr, 3);

	// Deduplicate
	var out = [];
	var seen = new Set();
	for (var i = 0; i < arr.length; i++) {
		var item = arr[i];
		var sitem = JSON.stringify(item);
		if (!seen.has(sitem)) {
			seen = seen.add(sitem);
			out.push(item);
		}
	}

	return flatten(out);
}

// points is a xyzxyzxyz... array
function checkProfile(points_){
  // remove duplicates
  points = dedup(points_);

  var orderedIds = [];

  var ot = createTree();
  ot.init(points);

  function findNext(i){
    // var radius = 10; // TODO check best init for performance
    var radius = 10;
    var matches = new Array(10);

    while (matches.length > 1 && radius > 0) {
      matches = ot.intersectSphere(points[i], points[i+1], points[i+2], radius);
      matches = _.difference(matches, orderedIds); // remove points already found
      matches = matches.filter(function(a){return a!==i;});
      radius *= 0.995;
      if (matches.length === 0){
        matches[0] = stored;
        break;
      }
      if (matches.length < 2){
        break;
      }
      var stored = matches[0];
    }
    return matches[0];
  }

  var nP = 0; // start from first
  orderedIds.push(nP);
  do {
    nP = findNext(nP);
    if (!nP){
      // console.log('connected points:', points.length/3);
      break
    };

    orderedIds.push(nP);

  } while (nP !== orderedIds[0]);

  var ordPts = [];
  for (var k=0; k<orderedIds.length; k++){
    ordPts.push(points[orderedIds[k]]);
    ordPts.push(points[orderedIds[k]+1]);
    ordPts.push(points[orderedIds[k]+2]);
  }

  return ordPts;
}


/*  ========================  */
/*  Export methods            */
/*  ========================  */
exports.getRAStoLPS          = getRAStoLPS;
exports.computeFaceCentroIds = computeFaceCentroIds;
exports.getGeometryCentroid  = getGeometryCentroid;
exports.getWidgetBoundingBox = getWidgetBoundingBox;
exports.getPointsCentroid    = getPointsCentroid;
exports.getPointsBoundingBox = getPointsBoundingBox;
exports.orderPoints          = orderPointsByAngle;
exports.plainArrayToThreePointsArray = plainArrayToThreePointsArray;
exports.threePointsArrayToPlainArray = threePointsArrayToPlainArray;
exports.rotateMeshOnAxis     = rotateMeshOnAxis;
exports.lerp                 = lerp;
exports.checkProfile         = checkProfile;
exports.dedup                = dedup;
