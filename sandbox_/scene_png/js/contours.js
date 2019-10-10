var createTree = require('yaot');
var _ = require('underscore');

// var LandmarkTransform = window.vtk.Common.Transform.vtkLandmarkTransform;
// var Points = window.vtk.Common.Core.vtkPoints;
// console.log(LandmarkTransform)
// console.log(Points)
// const Mode = {
//   RIGID_BODY: 0,
//   SIMILARITY: 1,
//   AFFINE: 2,
// };
//
// var srcPts = Points.newInstance();
// srcPts.setNumberOfPoints(3);
// srcPts.setPoint(0, 10,10,10);
// srcPts.setPoint(1, 20,20,20);
// srcPts.setPoint(2, 30,30,30);
// var trgPts = Points.newInstance();
// trgPts.setNumberOfPoints(3);
// trgPts.setPoint(0, -10,-10,-10);
// trgPts.setPoint(1, -20,-20,-20);
// trgPts.setPoint(2, -30,-30,-30);
//
// console.log(srcPts.getPoint(0))
// console.log(trgPts.getPoint(0))
//
// var transform = LandmarkTransform.newInstance();
// transform.setMode(Mode.RIGID_BODY);
// transform.setSourceLandmark(srcPts); // vtkPoints
// transform.setTargetLandmark(trgPts); // vtkPoints
//
// console.log(transform.getSourceLandmark().getNumberOfPoints())
// console.log(transform.getTargetLandmark().getNumberOfPoints())

// transform.update();
// const transformMatrix = transform.getMatrix();
// console.log(transformMatrix)

var scene;

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

// var boundary_xy = [];

function getBoundaryVertices(imagedata){
	var boundary_xy = [];

	// vertically
	var outside = true;
	for (var x = 0; x<imagedata.width; x++){
		for (var y = 0; y<imagedata.height; y++){
			var color = getPixel( imagedata, x, y );
			if (color.a && outside){
				// color.r = 0
				// color.g = 0
				// color.b = 255
				color.a = 255
				// setPixel(imagedata, x, y, color)
				outside = false;
				boundary_xy.push(new THREE.Vector3(x,y,0));
			}
			else if (color.a === 0 && !outside){
				// color.r = 0
				// color.g = 0
				// color.b = 255
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
				// color.r = 0
				// color.g = 0
				// color.b = 255
				color.a = 255
				// setPixel(imagedata, x, y, color)
				outside = false;
				boundary_xy.push(new THREE.Vector3(x,y,0));
			}
			else if (color.a === 0 && !outside){
				// color.r = 0
				// color.g = 0
				// color.b = 255
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

	// plane contours
	for (var y = 0; y<imagedata.width; y++){
		for (var x = 0; x<imagedata.height; x++){
			var color = getPixel( imagedata, x, y );
			if (x == 0 || y == 0 || x == imagedata.height-1 || y == imagedata.width-1){
				color.r = 0
				color.g = 0
				color.b = 255
				color.a = 255
				setPixel(imagedata, x, y, color)
			}
		}
	}

	boundary_xy.map(b => toSpaceCoord(b))
	var reordered_xy = plainArrayToThreePointsArray(checkProfile(threePointsArrayToPlainArray(boundary_xy)));
	console.log(reordered_xy)

	return reordered_xy;
}

function renderLine(xy_array, scene){
	var positions = threePointsArrayToPlainArray(xy_array);

	var geo = new THREE.LineGeometry();
	geo.setPositions(positions);

	var matLine = new THREE.LineMaterial({
					 linewidth: 2, // in pixels
					 color: 'green'
		});
	matLine.resolution.set(320, 240);

	var line = new THREE.Line2(geo, matLine);
	scene.add(line);
}

function setUVmappingArray(plane, texture){
	var uvs = new Float32Array(plane.geometry.attributes.position.count * 2)
	plane.geometry.computeBoundingBox();
	var bb = plane.geometry.boundingBox;

	var imagedata = getImageData( texture.image );

	var x_range = (bb.max.x - bb.min.x);
	var x_offset = 0;
	var y_range = (bb.max.y - bb.min.y);
	var y_offset = 0;

	var n = plane.geometry.attributes.position.count*3

	for (v=0; v<n; v+=3){
		var x = plane.geometry.attributes.position.array[v]   + plane.position.x;
		var y = plane.geometry.attributes.position.array[v+1] + plane.position.y;

		var s = (x + x_offset) / x_range;
		var t = (y + y_offset) / y_range;
		uvs[v/3 *2] = s;
		uvs[v/3 *2 +1] = t;

		var px = Math.floor((texture.image.width-1) * s);
		var py = Math.floor((texture.image.height-1) * t);
		var col = getPixel( imagedata, px, py );

		if (col.a === undefined){console.log(px, py, col)}

	}
	plane.geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ));
}

function setColorArray(plane, texture){
	var color = new Float32Array(plane.geometry.attributes.position.count * 3)

	plane.geometry.computeBoundingBox();
	var bb = plane.geometry.boundingBox;

	var imagedata = getImageData( texture.image );

	var x_range = (bb.max.x - bb.min.x);
	var x_offset = 0;
	var y_range = (bb.max.y - bb.min.y);
	var y_offset = 0;

	var n = plane.geometry.attributes.position.count*3

	for (v=0; v<n; v+=3){
		var x = plane.geometry.attributes.position.array[v]   + plane.position.x;
		var y = plane.geometry.attributes.position.array[v+1] + plane.position.y;

		var s = (x + x_offset) / x_range;
		var t = (y + y_offset) / y_range;

		var px = Math.floor((texture.image.width-1) * s);
		var py = Math.floor((texture.image.height-1) * t);
		var col = getPixel( imagedata, px, py );

		if (col.a === undefined){console.log(px, py, col)}

		color[v] = col.r/255;
		color[v+1] = col.g/255;
		color[v+2] = col.b/255;

	}
	plane.geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( color, 3 ));
}

function onTextureLoaded(texture){
	texture.center = new THREE.Vector2(1000, 1000)

	var imagedata = getImageData( texture.image );

	var bounds_xy = getBoundaryVertices(imagedata)

	renderLine(bounds_xy, scene)

	var dataTexture = new THREE.DataTexture( new Uint8Array(imagedata.data), imagedata.width, imagedata.height, THREE.RGBAFormat );
	dataTexture.needsUpdate = true

	console.log(texture)
	console.log(dataTexture)

	var geometry = new THREE.PlaneBufferGeometry( toSpaceCoord(texture.image.width), toSpaceCoord(texture.image.height), texture.image.width, texture.image.height);
	// var geometry = new THREE.PlaneBufferGeometry( texture.image.width, texture.image.height, texture.image.width, texture.image.height);
	// var material = new THREE.MeshBasicMaterial( {map: dataTexture, side: THREE.DoubleSide, transparent: true} );
	var material = new THREE.MeshBasicMaterial( {vertexColors: THREE.VertexColors, side: THREE.DoubleSide, transparent: false} );
	var plane = new THREE.Mesh( geometry, material );
	plane.position.set(toSpaceCoord(texture.image.width)/2, toSpaceCoord(texture.image.height)/2, 0);

	// alternative ways to set texture vertices binding
	// setUVmappingArray(plane, texture);
	setColorArray(plane, texture);

	console.log(plane)
	scene.add(plane);
}

function test(scene_){
	scene = scene_;
  var loader = new THREE.TextureLoader();
	loader.load('/Users/orobix/Projects/flatShoe/input/upper.png', onTextureLoaded)
}

exports.test = test;
