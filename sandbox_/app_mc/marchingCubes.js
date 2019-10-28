// =================================================
// MARCHING CUBES ==================================
// =================================================
require('./lib/MarchingCubesData.js');


// USAGE EXAMPLE ===============================================================
// NOTE:
			// numberOfCubes = 1.000.000 for reasonably HQ that not overflow buffers (onFinishChange)
			// numberOfCubes = 150.000 for high rate visualization (live preview - onChange)
			// offset can be computed as sizeI*sizeJ*sizeK / numberOfCubes to be image-adaptive
//
// createGrid(stack);
// var numberOfCubes = 1.000.000;
// var offset = stack._dimensionsIJK.x * stack._dimensionsIJK.y * stack._dimensionsIJK.z / numberOfCubes;
// extractIsoSurface(scene, stack, )
//
// function extractIsoSurface(scene, stack, level, offset){
// 	var obj = scene.getObjectByName('isoSurface');
// 	if (!obj){
// 		var geometry = marchingCubes(stack, level, offset);
// 		var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0x556677, side:THREE.DoubleSide, wireframe: false} );
// 		mesh = new THREE.Mesh( geometry, colorMaterial );
// 		mesh.name = 'isoSurface';
// 		scene.add(mesh);
// 		console.log(scene);
// 	}
// 	else{
// 		var geometry = marchingCubes(stack, level, offset);
// 		obj.geometry = geometry;
// 		obj.geometry.attributes.position.needsUpdate = true;
// 	}
// }
// =============================================================================

// create grid of points in voxel coordinates, to be called when stack is created or modified

function createGrid(stack) {
  // check if already exists
  if (stack.grid) {
    return stack.grid;
  }

	var dimensionIJK = stack._dimensionsIJK;
	var origin       = stack._origin;
	var spacing      = stack._spacing;

	var dimX = dimensionIJK.x * spacing.x;
	var dimY = dimensionIJK.y * spacing.y;
	var dimZ = dimensionIJK.z * spacing.z;
	var axisMinX = origin.x;
	var axisMinY = origin.y;
	var axisMinZ = origin.z;
	var axisMaxX = origin.x + dimX;
	var axisMaxY = origin.y + dimY;
	var axisMaxZ = origin.z + dimZ;
	var axisRangeX = axisMaxX - axisMinX;
	var axisRangeY = axisMaxY - axisMinY;
	var axisRangeZ = axisMaxZ - axisMinZ;

	var sizeI  = dimensionIJK.x;
	var sizeJ  = dimensionIJK.y;
	var sizeK  = dimensionIJK.z;
	var size2  = dimensionIJK.x * dimensionIJK.y;
	var size3  = dimensionIJK.x * dimensionIJK.y * dimensionIJK.z;

	//buffer, generate list of points and initialize values list
	var points = new Float32Array(size3*3);
	var index = 0;
	for (var k = 0; k < sizeK; k++){
		for (var j = 0; j < sizeJ; j++){
			for (var i = 0; i < sizeI; i++){
				var x = axisMinX + axisRangeX * i / (sizeI);
				var y = axisMinY + axisRangeY * j / (sizeJ);
				var z = axisMinZ + axisRangeZ * k / (sizeK);
				// console.log(x,y,z);
				points[index*3 +0] = x;
				points[index*3 +1] = y;
				points[index*3 +2] = z;
				index++;
			}
		}
	}

	// console.log('end initialization, n of points:', points.length/3);
	stack.grid = points;

	return points;
}

// MARCHING CUBES ALGORITHM
// parameters: stack (grid property must have been computed in advance), isolevel, offset (cube edge length)
// returns: geometry

function marchingCubes(stack, isolevel, o) {
  var out = [];

	// assumes the following global values have been defined:
	//   THREE.edgeTable, THREE.triTable
	// cycle on frames :
	// store current frame + next frame
	// cycle over values (jumping N values)
	// compute cube vertices indexes
	// compute xyz using slice origin + spacing + i,j
	// ...next cycle

	// var oCube = (stack._dimensionsIJK.x * stack._dimensionsIJK.y * stack._dimensionsIJK.z) / numberOfCubes;
	// var o     = Math.round(Math.pow(oCube, 1/3));
  // // dev
	// var o     = 1;

	var points = stack.grid;
	var sizeI  = stack._dimensionsIJK.x;
	var sizeJ  = stack._dimensionsIJK.y;
	var sizeK  = stack._dimensionsIJK.z;
	var size2  = sizeI * sizeJ;

	var slope     = stack.rescaleSlope;
	var intercept = stack.rescaleIntercept;

	// Vertices may occur along edges of cube, when the values at the edge's endpoints
	//   straddle the isolevel value.
	// Actual position along edge weighted according to function values.
	var vlist = new Float32Array(12*3);
	vlist.fill(null);

  // DEV
  var glist = new Float32Array(12*3);
  glist.fill(null);
  var colors = new Float32Array(100000000-1); // length 10M

  var d = 1;

	var geometry = new THREE.BufferGeometry();
  var vertices = new Float32Array(100000000-1); // length 10M
	var vertexIndex = 0;

	for (var k = 0; k < sizeK-(o+d)-1; k+=o){
		var currentFrame   = stack._frame[k]._pixelData;
    var nextFrame      = stack._frame[k + o]._pixelData;
		var nextFrameColor = stack._frame[k + o + d]._pixelData;

		for (var j = 0; j < sizeJ-(o+d)-1; j+=o){
			for (var i = 0; i < sizeI-(o+d)-1; i+=o){

				// index of base point, and also adjacent points on cube FOR VALUES
				var p    = (i  ) +sizeI* (j  ),
					  px   = (i+o) +sizeI* (j  ),
					  py   = (i  ) +sizeI* (j+o),
						pxy  = (i+o) +sizeI* (j+o),
						pz   = p,
						pxz  = px,
						pyz  = py,
						pxyz = pxy;

				// index of base point, and also adjacent points on cube FOR COORDINATES
				var q    = (i  ) + sizeI* (j  ) + (k  )*size2,
						qx   = (i+o) + sizeI* (j  ) + (k  )*size2,
						qy   = (i  ) + sizeI* (j+o) + (k  )*size2,
						qxy  = (i+o) + sizeI* (j+o) + (k  )*size2,
						qz   = (i  ) + sizeI* (j  ) + (k+o)*size2,
						qxz  = (i+o) + sizeI* (j  ) + (k+o)*size2,
						qyz  = (i  ) + sizeI* (j+o) + (k+o)*size2,
						qxyz = (i+o) + sizeI* (j+o) + (k+o)*size2;

				// store scalar values corresponding to vertices
				// U = m*SV + b
				// where U is in output units, m is the rescale slope, SV is the stored value, and b is the rescale intercept.
				var value0 = currentFrame[ p    ] * slope + intercept,
						value1 = currentFrame[ px   ] * slope + intercept,
						value2 = currentFrame[ py   ] * slope + intercept,
						value3 = currentFrame[ pxy  ] * slope + intercept,
						value4 = nextFrame[ pz   ]    * slope + intercept,
						value5 = nextFrame[ pxz  ]    * slope + intercept,
						value6 = nextFrame[ pyz  ]    * slope + intercept,
						value7 = nextFrame[ pxyz ]    * slope + intercept;

        // index of base point, and also adjacent points on cube FOR COLORS (DEV: cube vertex different from mc)
        var cp    = (i  ) +sizeI* (j  ),
            cpx   = (i+o+d) +sizeI* (j  ),
            cpy   = (i  ) +sizeI* (j+o+d),
            cpxy  = (i+o+d) +sizeI* (j+o+d),
            cpz   = cp,
            cpxz  = cpx,
            cpyz  = cpy,
            cpxyz = cpxy;

        // get colors values
        var value0c = currentFrame[ cp    ] * slope + intercept,
						value1c = currentFrame[ cpx   ] * slope + intercept,
						value2c = currentFrame[ cpy   ] * slope + intercept,
						value3c = currentFrame[ cpxy  ] * slope + intercept,
						value4c = nextFrameColor[ cpz   ] * slope + intercept,
						value5c = nextFrameColor[ cpxz  ] * slope + intercept,
						value6c = nextFrameColor[ cpyz  ] * slope + intercept,
						value7c = nextFrameColor[ cpxyz ] * slope + intercept;

            // dev
        var maxColVal = Math.max(value0c, value1c, value2c, value3c, value4c, value5c, value6c, value7c);

				// place a "1" in bit positions corresponding to vertices whose
				//   isovalue is less than given constant.

				var cubeindex = 0;
				if ( value0 < isolevel ) cubeindex |= 1;
				if ( value1 < isolevel ) cubeindex |= 2;
				if ( value2 < isolevel ) cubeindex |= 8;
				if ( value3 < isolevel ) cubeindex |= 4;
				if ( value4 < isolevel ) cubeindex |= 16;
				if ( value5 < isolevel ) cubeindex |= 32;
				if ( value6 < isolevel ) cubeindex |= 128;
				if ( value7 < isolevel ) cubeindex |= 64;

				// if (isNaN(value0) || isNaN(value1) || isNaN(value2) || isNaN(value3) || isNaN(value4) || isNaN(value5) || isNaN(value6) || isNaN(value7)){
				// 	// console.log('found NaN', value0, value1, value2, value3, value4, value5, value6, value7);
				// 	continue; //TODO find NaN root cause
				// }

				// bits = 12 bit number, indicates which edges are crossed by the isosurface
				var bits = THREE.edgeTable[ cubeindex ];

				// if none are crossed, proceed to next iteration
				if ( bits === 0 ) continue;

				// check which edges are crossed, and estimate the point location
				//    using a weighted average of scalar values at edge endpoints.
				// store the vertex in an array for use later.
				var mu = 0.5;
				var xa,xb,ya,yb,za,zb;

				// bottom of the cube
				if ( bits & 1 )
				{
					mu = ( isolevel - value0 ) / ( value1 - value0 );
					xa = points[q*3];
					ya = points[q*3 +1];
					za = points[q*3 +2];
					xb = points[qx*3];
					yb = points[qx*3 +1];
					zb = points[qx*3 +2];
					vlist[0] = lerp(xa,xb,mu);
					vlist[1] = lerp(ya,yb,mu);
					vlist[2] = lerp(za,zb,mu);

          // glist[0] = Math.max(value0c, value1c);
          // glist[1] = Math.max(value0c, value1c);
          // glist[2] = Math.max(value0c, value1c);
          glist[0] = maxColVal;
				}
				if ( bits & 2 )
				{
					mu = ( isolevel - value1 ) / ( value3 - value1 );
					xa = points[qx*3];
					ya = points[qx*3 +1];
					za = points[qx*3 +2];
					xb = points[qxy*3];
					yb = points[qxy*3 +1];
					zb = points[qxy*3 +2];
					vlist[3] = lerp(xa,xb,mu);
					vlist[4] = lerp(ya,yb,mu);
					vlist[5] = lerp(za,zb,mu);

          // glist[3] = Math.max(value3c, value1c);
          // glist[4] = Math.max(value3c, value1c);
          // glist[5] = Math.max(value3c, value1c);
          glist[3] = maxColVal;

				}
				if ( bits & 4 )
				{
					mu = ( isolevel - value2 ) / ( value3 - value2 );
					xa = points[qy*3];
					ya = points[qy*3 +1];
					za = points[qy*3 +2];
					xb = points[qxy*3];
					yb = points[qxy*3 +1];
					zb = points[qxy*3 +2];
					vlist[6] = lerp(xa,xb,mu);
					vlist[7] = lerp(ya,yb,mu);
					vlist[8] = lerp(za,zb,mu);

          // glist[6] = Math.max(value2c, value3c);
          // glist[7] = Math.max(value2c, value3c);
          // glist[8] = Math.max(value2c, value3c);
          glist[6] = maxColVal;

				}
				if ( bits & 8 )
				{
					mu = ( isolevel - value0 ) / ( value2 - value0 );
					xa = points[q*3];
					ya = points[q*3 +1];
					za = points[q*3 +2];
					xb = points[qy*3];
					yb = points[qy*3 +1];
					zb = points[qy*3 +2];
					vlist[9]  = lerp(xa,xb,mu);
					vlist[10] = lerp(ya,yb,mu);
					vlist[11] = lerp(za,zb,mu);

          // glist[9]  = Math.max(value0c, value2c);
          // glist[10] = Math.max(value0c, value2c);
          // glist[11] = Math.max(value0c, value2c);
          glist[9] = maxColVal;

				}
				// top of the cube
				if ( bits & 16 )
				{
					mu = ( isolevel - value4 ) / ( value5 - value4 );
					xa = points[qz*3];
					ya = points[qz*3 +1];
					za = points[qz*3 +2];
					xb = points[qxz*3];
					yb = points[qxz*3 +1];
					zb = points[qxz*3 +2];
					vlist[12] = lerp(xa,xb,mu);
					vlist[13] = lerp(ya,yb,mu);
					vlist[14] = lerp(za,zb,mu);

          // glist[12] = Math.max(value4c, value5c);
          // glist[13] = Math.max(value4c, value5c);
          // glist[14] = Math.max(value4c, value5c);
          glist[12] = maxColVal;

				}
				if ( bits & 32 )
				{
					mu = ( isolevel - value5 ) / ( value7 - value5 );
					xa = points[qxz*3];
					ya = points[qxz*3 +1];
					za = points[qxz*3 +2];
					xb = points[qxyz*3];
					yb = points[qxyz*3 +1];
					zb = points[qxyz*3 +2];
					vlist[15] = lerp(xa,xb,mu);
					vlist[16] = lerp(ya,yb,mu);
					vlist[17] = lerp(za,zb,mu);

          // glist[15] = Math.max(value5c, value7c);
          // glist[16] = Math.max(value5c, value7c);
          // glist[17] = Math.max(value5c, value7c);
          glist[15] = maxColVal;

        }
				if ( bits & 64 )
				{
					mu = ( isolevel - value6 ) / ( value7 - value6 );
					xa = points[qyz*3];
					ya = points[qyz*3 +1];
					za = points[qyz*3 +2];
					xb = points[qxyz*3];
					yb = points[qxyz*3 +1];
					zb = points[qxyz*3 +2];
					vlist[18] = lerp(xa,xb,mu);
					vlist[19] = lerp(ya,yb,mu);
					vlist[20] = lerp(za,zb,mu);

          // glist[18] = Math.max(value6c, value7c);
          // glist[19] = Math.max(value6c, value7c);
          // glist[20] = Math.max(value6c, value7c);
          glist[18] = maxColVal;

				}
				if ( bits & 128 )
				{
					mu = ( isolevel - value4 ) / ( value6 - value4 );
					xa = points[qz*3];
					ya = points[qz*3 +1];
					za = points[qz*3 +2];
					xb = points[qyz*3];
					yb = points[qyz*3 +1];
					zb = points[qyz*3 +2];
					vlist[21] = lerp(xa,xb,mu);
					vlist[22] = lerp(ya,yb,mu);
					vlist[23] = lerp(za,zb,mu);

          // glist[21] = Math.max(value6c, value4c);
          // glist[22] = Math.max(value6c, value4c);
          // glist[23] = Math.max(value6c, value4c);
          glist[21] = maxColVal;

				}
				// vertical lines of the cube
				if ( bits & 256 )
				{
					mu = ( isolevel - value0 ) / ( value4 - value0 );
					xa = points[q*3];
					ya = points[q*3 +1];
					za = points[q*3 +2];
					xb = points[qz*3];
					yb = points[qz*3 +1];
					zb = points[qz*3 +2];
					vlist[24] = lerp(xa,xb,mu);
					vlist[25] = lerp(ya,yb,mu);
					vlist[26] = lerp(za,zb,mu);

          // glist[24] = Math.max(value0c, value4c);
          // glist[25] = Math.max(value0c, value4c);
          // glist[26] = Math.max(value0c, value4c);
          glist[24] = maxColVal;

				}
				if ( bits & 512 )
				{
					mu = ( isolevel - value1 ) / ( value5 - value1 );
					xa = points[qx*3];
					ya = points[qx*3 +1];
					za = points[qx*3 +2];
					xb = points[qxz*3];
					yb = points[qxz*3 +1];
					zb = points[qxz*3 +2];
					vlist[27] = lerp(xa,xb,mu);
					vlist[28] = lerp(ya,yb,mu);
					vlist[29] = lerp(za,zb,mu);

          // glist[27] = Math.max(value5c, value1c);
          // glist[28] = Math.max(value5c, value1c);
          // glist[29] = Math.max(value5c, value1c);
          glist[27] = maxColVal;

				}
				if ( bits & 1024 )
				{
					mu = ( isolevel - value3 ) / ( value7 - value3 );
					xa = points[qxy*3];
					ya = points[qxy*3 +1];
					za = points[qxy*3 +2];
					xb = points[qxyz*3];
					yb = points[qxyz*3 +1];
					zb = points[qxyz*3 +2];
					vlist[30] = lerp(xa,xb,mu);
					vlist[31] = lerp(ya,yb,mu);
					vlist[32] = lerp(za,zb,mu);

          // glist[30] = Math.max(value7c, value3c);
          // glist[31] = Math.max(value7c, value3c);
          // glist[32] = Math.max(value7c, value3c);
          glist[30] = maxColVal;

				}
				if ( bits & 2048 )
				{
					mu = ( isolevel - value2 ) / ( value6 - value2 );
					xa = points[qy*3];
					ya = points[qy*3 +1];
					za = points[qy*3 +2];
					xb = points[qyz*3];
					yb = points[qyz*3 +1];
					zb = points[qyz*3 +2];
					vlist[33] = lerp(xa,xb,mu);
					vlist[34] = lerp(ya,yb,mu);
					vlist[35] = lerp(za,zb,mu);

          // glist[33] = Math.max(value6c, value2c);
          // glist[34] = Math.max(value6c, value2c);
          // glist[35] = Math.max(value6c, value2c);
          glist[33] = maxColVal;

				}

				// construct triangles -- get correct vertices from triTable.

				var t = 0;
				cubeindex <<= 4;  // multiply by 16...
				// "Re-purpose cubeindex into an offset into triTable."
				//  since each row really isn't a row.

				// the while loop should run at most 5 times,
				//   since the 16th entry in each row is a -1.
				while ( THREE.triTable[ cubeindex + t ] != -1 )
				{
					var index1 = THREE.triTable[cubeindex + t];
					var index2 = THREE.triTable[cubeindex + t + 1];
					var index3 = THREE.triTable[cubeindex + t + 2];

					// vertex A
					vertices[vertexIndex + 0] = vlist[index1*3 + 0];
					vertices[vertexIndex + 1] = vlist[index1*3 + 1];
					vertices[vertexIndex + 2] = vlist[index1*3 + 2];
					// vertex B
					vertices[vertexIndex + 3] = vlist[index2*3 + 0];
					vertices[vertexIndex + 4] = vlist[index2*3 + 1];
					vertices[vertexIndex + 5] = vlist[index2*3 + 2];
					// vertex C
					vertices[vertexIndex + 6] = vlist[index3*3 + 0];
					vertices[vertexIndex + 7] = vlist[index3*3 + 1];
					vertices[vertexIndex + 8] = vlist[index3*3 + 2];

          // colors A
          colors[vertexIndex + 0] = glist[index1*3 + 0];
          colors[vertexIndex + 1] = glist[index1*3 + 1];
          colors[vertexIndex + 2] = glist[index1*3 + 2];
          // colors B
          colors[vertexIndex + 3] = glist[index2*3 + 0];
          colors[vertexIndex + 4] = glist[index2*3 + 1];
          colors[vertexIndex + 5] = glist[index2*3 + 2];
          // colors C
          colors[vertexIndex + 6] = glist[index3*3 + 0];
          colors[vertexIndex + 7] = glist[index3*3 + 1];
          colors[vertexIndex + 8] = glist[index3*3 + 2];

					vertexIndex += 9;
					t += 3;
				}
			}
		}
	}

	var numOfVerts = vertexIndex/3;
	vertices = vertices.slice(0,numOfVerts*3);
  geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  // geometry.computeNormals();
  // DEV
  colors = colors.slice(0,numOfVerts*3);
  geometry.originalColors = colors;
  // console.log(colors);
  applyLut(geometry, colors);
  // console.log(geometry);

  // callback(geometry);
	return geometry;
}

// linear interpolation
function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}

// distance^2
function distanceToSquared(xa,ya,za,xb,yb,zb){
	var dx = xb-xa;
	var dy = yb-ya;
	var dz = zb-za;
	return dx * dx + dy * dy + dz * dz;
}

// distance
function distanceTo(xa,ya,za,xb,yb,zb){
	var dx = xb-xa;
	var dy = yb-ya;
	var dz = zb-za;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function applyLut(geometry, colorsArray, min = -1024, max = 1105){

  if (geometry.attributes.color){
    geometry.removeAttribute('color');
  }

  require('./Lut.js');
  // var colorMap = 'cooltowarm';
  // var colorMap = "musclebone";
  // var colorMap = "grayscale";
  var colorMap = "foo";
  // var numberOfColors = 512;
  var numberOfColors = 1024;
  var lutColors = new Float32Array(colorsArray);
  lut = new THREE.Lut( colorMap, numberOfColors );
  lut.setMin( min );
  lut.setMax( max );

  for ( var i = 0; i < colorsArray.length; i+=3 ) {
    var colorValue = colorsArray[ i ];
    color = lut.getColor( colorValue );
    if ( color == undefined ) {
      console.log( "ERROR: " + colorValue );
      return false;
    }
    else {
      lutColors[ i     ] = color.r;
      lutColors[ i + 1 ] = color.g;
      lutColors[ i + 2 ] = color.b;
    }
  }

  geometry.addAttribute( 'color', new THREE.BufferAttribute( lutColors, 3, true ) );

}


// ===============
// EXPORTS =======
// ===============

exports.marchingCubes = marchingCubes;
exports.createGrid    = createGrid;
exports.applyLut      = applyLut;
