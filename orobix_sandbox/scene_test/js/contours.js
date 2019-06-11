var createTree = require('yaot');
var _ = require('underscore');

// var LandmarkTransform = vtk.Common.Transform.vtkLandmarkTransform;
// var Points = vtk.Common.Core.vtkPoints;

var LandmarkTransform = window.vtk.vtkLandmarkTransform;
var Points = window.vtk.vtkPoints;

console.log(LandmarkTransform)
console.log(Points)
const Mode = {
  RIGID_BODY: 0,
  SIMILARITY: 1,
  AFFINE: 2,
};

var srcPts = Points.newInstance();
srcPts.setNumberOfPoints(3);
srcPts.setPoint(0, 4,10,10);
srcPts.setPoint(1, 20,4,20);
srcPts.setPoint(2, 30,4,30);
var trgPts = Points.newInstance();
trgPts.setNumberOfPoints(3);
trgPts.setPoint(0, -10,-4,-10);
trgPts.setPoint(1, -4,-20,-20);
trgPts.setPoint(2, -30,-30,-4);

console.log(srcPts.getPoint(0))
console.log(trgPts.getPoint(0))

var transform = LandmarkTransform.newInstance();
transform.setMode(Mode.RIGID_BODY);
transform.setSourceLandmark(srcPts); // vtkPoints
transform.setTargetLandmark(trgPts); // vtkPoints

console.log(transform.getSourceLandmark().getNumberOfPoints())
console.log(transform.getTargetLandmark().getNumberOfPoints())

transform.update();
const transformMatrix = transform.getMatrix();
console.log('============================== >>>>>>>>>>>>>', transformMatrix)

// ============================================
// Remove duplicates from vertices array ======
// ============================================

function dedup(arr) {
  // console.time('dedup');
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
  // console.timeEnd('dedup');
	return flatten(out);
}
// ====================================================
// Reorder points to create a continuous profile ======
// ====================================================

function checkProfile(points_){
  // points_ is a xyzxyzxyz... array
  console.log('checkProfile');
  console.time('checkProfile');

  // remove duplicates
  points = dedup(points_);
  // console.log('dedupped', points.length);

  var orderedIds = [];

  var ot = createTree();
  ot.init(points);
  // console.log('ot init done, reordering profile');

  function findNext(i){
    // var radius = 10; // TODO check best init for performance
    var radius = 1;
    var matches = new Array(10);

    while (matches.length > 1 && radius > 0) {
      matches = ot.intersectSphere(points[i], points[i+1], points[i+2], radius);
      matches = _.difference(matches, orderedIds); // remove points already found
      matches = matches.filter(function(a){return a!==i;});
      // radius *= 0.995;
      radius *= 0.75;
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

  // console.log('reordering done');

  var ordPts = [];
  for (var k=0; k<orderedIds.length; k++){
    ordPts.push(points[orderedIds[k]]);
    ordPts.push(points[orderedIds[k]+1]);
    ordPts.push(points[orderedIds[k]+2]);
  }

  console.timeEnd('checkProfile');
  return ordPts;
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
// From xyz array to THREE.Points array =======
// ============================================

function plainArrayToThreePointsArray(array){
  var threeArray = [];

  for (var p=0; p < array.length; p+=3){
    threeArray.push(new THREE.Vector3(array[p], array[p+1], array[p+2]));
  }

  return threeArray;
}

function getImageData( image ) {

    var canvas = document.createElement( 'canvas' );
    canvas.width = image.width;
    canvas.height = image.height;

    var context = canvas.getContext( '2d' );
    context.drawImage( image, 0, 0 );

    return context.getImageData( 0, 0, image.width, image.height );

}

function getPixel( imagedata, x, y ) {

    var position = ( x + imagedata.width * y ) * 4
    var data = imagedata.data;
    return { r: data[ position ], g: data[ position + 1 ], b: data[ position + 2 ], a: data[ position + 3 ] };

}

function setPixel( imagedata, x, y, color) {

    var position = ( x + imagedata.width * y ) * 4
    var data = imagedata.data;
    data[ position ]     = color.r;
    data[ position + 1 ] = color.g;
    data[ position + 2 ] = color.b;
    data[ position + 3 ] = color.a;
}

function toSpaceCoord(value){
  // 1px = 0.2645833333mm
  var factor = 0.2645833333;
  var converted;
  if (value instanceof Array){
    converted = boundary_xy.map(v => {
      v.multiplyScalar(factor)
    })
  }
  else if (value instanceof THREE.Vector3){
    converted = value.multiplyScalar(factor)
  }
  else {
    converted = value * factor;
  }
  return converted;
}

var boundary_xy = [];

function test(scene){
  var loader = new THREE.TextureLoader()
  loader.load('/Users/orobix/Projects/flatShoe/input/upper.png', (texture) => {

    var imagedata = getImageData( texture.image );
    console.log(imagedata);
    // vertically
    var outside = true;
    for (var x = 0; x<imagedata.width; x++){
      for (var y = 0; y<imagedata.height; y++){
        var color = getPixel( imagedata, x, y );
        if (color.a && outside){
          color.r = 0
          color.g = 0
          color.b = 255
          color.a = 255
          // setPixel(imagedata, x, y, color)
          outside = false;
          boundary_xy.push(new THREE.Vector3(x,y,0));
        }
        else if (color.a === 0 && !outside){
          color.r = 0
          color.g = 0
          color.b = 255
          color.a = 255
          // setPixel(imagedata, x, y, color)
          outside = true;
          boundary_xy.push(new THREE.Vector3(x,y,0));
        }
        else {
          color.a = 50;
          // setPixel(imagedata, x, y, color);
        }
      }
    }
    // horizontally
    for (var y = 0; y<imagedata.width; y++){
      for (var x = 0; x<imagedata.height; x++){
        var color = getPixel( imagedata, x, y );
        if (color.a && outside){
          color.r = 0
          color.g = 0
          color.b = 255
          color.a = 255
          // setPixel(imagedata, x, y, color)
          outside = false;
          boundary_xy.push(new THREE.Vector3(x,y,0));
        }
        else if (color.a === 0 && !outside){
          color.r = 0
          color.g = 0
          color.b = 255
          color.a = 255
          // setPixel(imagedata, x, y, color)
          outside = true;
          boundary_xy.push(new THREE.Vector3(x,y,0));
        }
        else {
          color.a = 50;
          // setPixel(imagedata, x, y, color);
        }
      }
    }

    var dataTexture = new THREE.DataTexture( new Uint8Array(imagedata.data), imagedata.width, imagedata.height, THREE.RGBAFormat );

    var m4 = new THREE.Matrix4().fromArray(transformMatrix)
    var rotation = new THREE.Matrix4().extractRotation(m4);
    console.log(rotation)
    dataTexture.center      = new THREE.Vector2(0.5, 0.5);
    // dataTexture.rotation    = 45*THREE.Math.DEG2RAD
    dataTexture.rotation    = new THREE.Vector2(1,0).applyMatrix3(rotation).angle()
    console.log(dataTexture.rotation)
    dataTexture.needsUpdate = true
    console.log(texture)
    console.log(dataTexture)

    var geometry = new THREE.PlaneGeometry( toSpaceCoord(texture.image.width), toSpaceCoord(texture.image.height));
    var material = new THREE.MeshBasicMaterial( {map: dataTexture, side: THREE.DoubleSide, transparent: true} );
    var plane = new THREE.Mesh( geometry, material );
    plane.position.set(toSpaceCoord(texture.image.width)/2, toSpaceCoord(texture.image.height)/2, 0);

    console.log(plane)
    scene.add(plane);

    boundary_xy.map(b => toSpaceCoord(b))
    var reordered_xy = plainArrayToThreePointsArray(checkProfile(threePointsArrayToPlainArray(boundary_xy)));
    console.log(reordered_xy)

    // reordered_xy.map((p,i) => {
    //   var ball = new THREE.Mesh(
    //     new THREE.SphereGeometry(0.2,8,8),
    //     new THREE.MeshBasicMaterial({color:i, transparent:true, opacity:0.5})
    //   )
    //   ball.position.copy(p)
    //   scene.add(ball)
    // })
    //
    // boundary_xy.map((p,i) => {
    //   var ball = new THREE.Mesh(
    //     new THREE.SphereGeometry(0.2,8,8),
    //     new THREE.MeshBasicMaterial({color:'green', transparent:true, opacity:0.3})
    //   )
    //   ball.position.copy(p)
    //   scene.add(ball)
    // })

    // var geometry = new THREE.BufferGeometry();
    // geometry.addAttribute( 'position', new THREE.BufferAttribute( Float32Array.from(threePointsArrayToPlainArray(reordered_xy)), 3 ) );
    // var curveMesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial({
    //   color: 0x000000,
    //   opacity: 1,
    //   visible: true
    // }));
    // scene.add(curveMesh);

    var positions = threePointsArrayToPlainArray(reordered_xy);

    var geo = new THREE.LineGeometry();
    geo.setPositions(positions);

    var matLine = new THREE.LineMaterial({
             linewidth: 2, // in pixels
             color: 'green'
      });
    matLine.resolution.set(320, 240);

    var line = new THREE.Line2(geo, matLine);
    scene.add(line);

    console.log(scene)

  })

}

exports.test = test;
