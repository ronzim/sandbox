// =================================================
// MARCHING CUBES ==================================
// =================================================

require('./lib/MarchingCubesData.js');

// create poe x poe grid for a cube of 'dimension' edge centered in 'center'

function createGrid(stack){
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
	var index = 0; //TODO check if -1 if needed
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
	// console.log(points);
	// values = new Float32Array(size3);
	// values.fill(0);

	console.log('end initialization, n of points:', points.length/3);

	// return {points: points, values: values};
	return points;
}

// MARCHING CUBES ALGORITHM
// parameters: domain points, range values, isolevel
// returns: geometry
function marchingCubes(stack, isolevel, o){
	// assumes the following global values have been defined:
	//   THREE.edgeTable, THREE.triTable
	console.time('performing mc:');
	console.log(isolevel, o);
	// TODO
	// cycle on frames :
	// store current frame + next frame
	// cycle over values (jumping N values)
	// compute cube vertices indexes
	// compute xyz using slice origin + spacing + i,j
	// ...next cycle

	var points = stack.grid;
	var sizeI  = stack._dimensionsIJK.x;
	var sizeJ  = stack._dimensionsIJK.y;
	var sizeK  = stack._dimensionsIJK.z;
	var size2  = sizeI * sizeJ;

	// Vertices may occur along edges of cube, when the values at the edge's endpoints
	//   straddle the isolevel value.
	// Actual position along edge weighted according to function values.
	var vlist = new Float32Array(12*3);
	vlist.fill(null);

	// var geometry = new THREE.Geometry();
	var geometry = new THREE.BufferGeometry();
	var vertices = new Float32Array(10000000-1); // length 10M
	var vertexIndex = 0;

	// this is the tricky point ============

	console.time('cycle over frames');
	var timeTotWhile = 0;
	var internalCycleTime = 0;
	var arrayCopyTime = 0;

	for (var k = 0; k < sizeK -o -1; k+=o){

		var arrayCopyTimeStamp = Date.now();

		var currentFrame  = stack._frame[k]._pixelData;
		var nextFrame     = stack._frame[k + o]._pixelData;
		var currentPoints = stack.grid.slice((k)*size2*3, (k+o)*size2*3);
		var nextPoints    = stack.grid.slice((k+o)*size2*3, (k+2*o)*size2*3);
		// console.log((k)*size2*3, (k+o)*size2*3)
		// console.log((k+o)*size2*3, (k+2*o)*size2*3)
		// console.log(stack._frame[k]._imagePosition, [currentPoints[0], currentPoints[1], currentPoints[2]]);
		// console.log(stack._frame[k+o]._imagePosition, [nextPoints[0], nextPoints[1], nextPoints[2]]);
		// console.log(currentFrame.length, currentPoints.length);
		// console.log(nextFrame.length, nextPoints.length);

		arrayCopyTime += (Date.now()-arrayCopyTimeStamp);

		var internalCycleTimeStamp = Date.now();

		for (var j = 0; j < sizeJ-o-1; j+=o){

			for (var i = 0; i < sizeI-o-1; i+=o){

				// index of base point, and also adjacent points on cube
				var p    = (i  ) +sizeJ* (j  ),
					  px   = (i+o) +sizeJ* (j  ),
					  py   = (i  ) +sizeJ* (j+o),
						pxy  = (i+o) +sizeJ* (j+o),
						pz   = p,
						pxz  = px,
						pyz  = py,
						pxyz = pxy;

				// store scalar values corresponding to vertices
				var value0 = currentFrame[ p    ],
						value1 = currentFrame[ px   ],
						value2 = currentFrame[ py   ],
						value3 = currentFrame[ pxy  ],
						value4 = nextFrame[ pz   ],
						value5 = nextFrame[ pxz  ],
						value6 = nextFrame[ pyz  ],
						value7 = nextFrame[ pxyz ];

				// if (isNaN(p) || isNaN(px) || isNaN(py) || isNaN(pz) || isNaN(pxy) || isNaN(pxz) || isNaN(pyz) || isNaN(pxyz)){
				// 	console.log('found NaN', p,px,py,pz,pxy,pxz,pyz,pxyz)
				// }

			// ======================================

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
				// 	console.log('found NaN', value0, value1, value2, value3, value4, value5, value6, value7)
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
					xa = currentPoints[p*3];
					ya = currentPoints[p*3 +1];
					za = currentPoints[p*3 +2];
					xb = currentPoints[px*3];
					yb = currentPoints[px*3 +1];
					zb = currentPoints[px*3 +2];
					vlist[0] = lerp(xa,xb,mu);
					vlist[1] = lerp(ya,yb,mu);
					vlist[2] = lerp(za,zb,mu);
				}
				if ( bits & 2 )
				{
					mu = ( isolevel - value1 ) / ( value3 - value1 );
					xa = currentPoints[px*3];
					ya = currentPoints[px*3 +1];
					za = currentPoints[px*3 +2];
					xb = currentPoints[pxy*3];
					yb = currentPoints[pxy*3 +1];
					zb = currentPoints[pxy*3 +2];
					vlist[3] = lerp(xa,xb,mu);
					vlist[4] = lerp(ya,yb,mu);
					vlist[5] = lerp(za,zb,mu);
				}
				if ( bits & 4 )
				{
					mu = ( isolevel - value2 ) / ( value3 - value2 );
					xa = currentPoints[py*3];
					ya = currentPoints[py*3 +1];
					za = currentPoints[py*3 +2];
					xb = currentPoints[pxy*3];
					yb = currentPoints[pxy*3 +1];
					zb = currentPoints[pxy*3 +2];
					vlist[6] = lerp(xa,xb,mu);
					vlist[7] = lerp(ya,yb,mu);
					vlist[8] = lerp(za,zb,mu);
				}
				if ( bits & 8 )
				{
					mu = ( isolevel - value0 ) / ( value2 - value0 );
					xa = currentPoints[p*3];
					ya = currentPoints[p*3 +1];
					za = currentPoints[p*3 +2];
					xb = currentPoints[py*3];
					yb = currentPoints[py*3 +1];
					zb = currentPoints[py*3 +2];
					vlist[9]  = lerp(xa,xb,mu);
					vlist[10] = lerp(ya,yb,mu);
					vlist[11] = lerp(za,zb,mu);
				}
				// top of the cube
				if ( bits & 16 )
				{
					mu = ( isolevel - value4 ) / ( value5 - value4 );
					xa = nextPoints[pz*3];
					ya = nextPoints[pz*3 +1];
					za = nextPoints[pz*3 +2];
					xb = nextPoints[pxz*3];
					yb = nextPoints[pxz*3 +1];
					zb = nextPoints[pxz*3 +2];
					vlist[12] = lerp(xa,xb,mu);
					vlist[13] = lerp(ya,yb,mu);
					vlist[14] = lerp(za,zb,mu);
				}
				if ( bits & 32 )
				{
					mu = ( isolevel - value5 ) / ( value7 - value5 );
					xa = nextPoints[pxz*3];
					ya = nextPoints[pxz*3 +1];
					za = nextPoints[pxz*3 +2];
					xb = nextPoints[pxyz*3];
					yb = nextPoints[pxyz*3 +1];
					zb = nextPoints[pxyz*3 +2];
					vlist[15] = lerp(xa,xb,mu);
					vlist[16] = lerp(ya,yb,mu);
					vlist[17] = lerp(za,zb,mu);
				}
				if ( bits & 64 )
				{
					mu = ( isolevel - value6 ) / ( value7 - value6 );
					xa = nextPoints[pyz*3];
					ya = nextPoints[pyz*3 +1];
					za = nextPoints[pyz*3 +2];
					xb = nextPoints[pxyz*3];
					yb = nextPoints[pxyz*3 +1];
					zb = nextPoints[pxyz*3 +2];
					vlist[18] = lerp(xa,xb,mu);
					vlist[19] = lerp(ya,yb,mu);
					vlist[20] = lerp(za,zb,mu);
				}
				if ( bits & 128 )
				{
					mu = ( isolevel - value4 ) / ( value6 - value4 );
					xa = nextPoints[pz*3];
					ya = nextPoints[pz*3 +1];
					za = nextPoints[pz*3 +2];
					xb = nextPoints[pyz*3];
					yb = nextPoints[pyz*3 +1];
					zb = nextPoints[pyz*3 +2];
					vlist[21] = lerp(xa,xb,mu);
					vlist[22] = lerp(ya,yb,mu);
					vlist[23] = lerp(za,zb,mu);
				}
				// vertical lines of the cube
				if ( bits & 256 )
				{
					mu = ( isolevel - value0 ) / ( value4 - value0 );
					xa = currentPoints[p*3];
					ya = currentPoints[p*3 +1];
					za = currentPoints[p*3 +2];
					xb = nextPoints[pz*3];
					yb = nextPoints[pz*3 +1];
					zb = nextPoints[pz*3 +2];
					vlist[24] = lerp(xa,xb,mu);
					vlist[25] = lerp(ya,yb,mu);
					vlist[26] = lerp(za,zb,mu);
				}
				if ( bits & 512 )
				{
					mu = ( isolevel - value1 ) / ( value5 - value1 );
					xa = currentPoints[px*3];
					ya = currentPoints[px*3 +1];
					za = currentPoints[px*3 +2];
					xb = nextPoints[pxz*3];
					yb = nextPoints[pxz*3 +1];
					zb = nextPoints[pxz*3 +2];
					vlist[27] = lerp(xa,xb,mu);
					vlist[28] = lerp(ya,yb,mu);
					vlist[29] = lerp(za,zb,mu);
				}
				if ( bits & 1024 )
				{
					mu = ( isolevel - value3 ) / ( value7 - value3 );
					xa = currentPoints[pxy*3];
					ya = currentPoints[pxy*3 +1];
					za = currentPoints[pxy*3 +2];
					xb = nextPoints[pxyz*3];
					yb = nextPoints[pxyz*3 +1];
					zb = nextPoints[pxyz*3 +2];
					vlist[30] = lerp(xa,xb,mu);
					vlist[31] = lerp(ya,yb,mu);
					vlist[32] = lerp(za,zb,mu);
				}
				if ( bits & 2048 )
				{
					mu = ( isolevel - value2 ) / ( value6 - value2 );
					xa = currentPoints[py*3];
					ya = currentPoints[py*3 +1];
					za = currentPoints[py*3 +2];
					xb = nextPoints[pyz*3];
					yb = nextPoints[pyz*3 +1];
					zb = nextPoints[pyz*3 +2];
					vlist[33] = lerp(xa,xb,mu);
					vlist[34] = lerp(ya,yb,mu);
					vlist[35] = lerp(za,zb,mu);
				}
				// console.log(mu, xa, ya, za, xb, yb, zb);

				// construct triangles -- get correct vertices from triTable.
				var timestamp = Date.now();

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

					// geometry.vertices.push( vlist[index1].clone() );
					// geometry.vertices.push( vlist[index2].clone() );
					// geometry.vertices.push( vlist[index3].clone() );

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

					// don't need faces anymore
					// var face = new THREE.Face3(vertexIndex, vertexIndex+1, vertexIndex+2);
					// geometry.faces.push( face );
					// geometry.faceVertexUvs[ 0 ].push( [ new THREE.Vector2(0,0), new THREE.Vector2(0,1), new THREE.Vector2(1,1) ] );

					vertexIndex += 9;
					t += 3;
				}

				timeTotWhile += (Date.now()-timestamp);
			}
		}

		internalCycleTime += (Date.now()-internalCycleTimeStamp);

	}

	console.log('arrayCopyTime', arrayCopyTime);
	console.log('internalCycleTime', internalCycleTime);
	console.log('construct triangles', timeTotWhile)
	console.timeEnd('cycle over frames');

	var numOfVerts = vertexIndex/3;
	vertices = vertices.slice(0,numOfVerts*3);
	// console.log(vertices, numOfVerts);
	geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

	// geometry.addAttribute( 'values', new THREE.BufferAttribute( values, 1 ) );
	// geometry.addAttribute( 'grid', new THREE.BufferAttribute( points, 3 ) );

	// geometry.mergeVertices();
	// geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	console.timeEnd('performing mc:', isolevel, o);

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


// ===============
// EXPORTS =======
// ===============

exports.marchingCubes = marchingCubes;
exports.createGrid    = createGrid;
