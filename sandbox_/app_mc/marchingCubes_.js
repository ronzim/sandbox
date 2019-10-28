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
	var points = new Float32Array(size3*5);
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

function marchingCubes(stack, isolevel, o){
	// assumes the following global values have been defined:
	//   THREE.edgeTable, THREE.triTable

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

	var geometry = new THREE.BufferGeometry();
	var vertices = new Float32Array(10000000-1); // length 10M
	var vertexIndex = 0;

	for (var k = 0; k < sizeK -o -1; k+=o){
		var currentFrame  = stack._frame[k]._pixelData;
		var nextFrame     = stack._frame[k + o]._pixelData;

		for (var j = 0; j < sizeJ-o-1; j+=o){
			for (var i = 0; i < sizeI-o-1; i+=o){

				// index of base point, and also adjacent points on cube FOR VALUES
				var p    = (i  ) +sizeJ* (j  ),
					  px   = (i+o) +sizeJ* (j  ),
					  py   = (i  ) +sizeJ* (j+o),
						pxy  = (i+o) +sizeJ* (j+o),
						pz   = p,
						pxz  = px,
						pyz  = py,
						pxyz = pxy;

				// index of base point, and also adjacent points on cube FOR COORDINATES
				var q    = (i  ) + sizeJ* (j  ) + (k  )*size2,
						qx   = (i+o) + sizeJ* (j  ) + (k  )*size2,
						qy   = (i  ) + sizeJ* (j+o) + (k  )*size2,
						qxy  = (i+o) + sizeJ* (j+o) + (k  )*size2,
						qz   = (i  ) + sizeJ* (j  ) + (k+o)*size2,
						qxz  = (i+o) + sizeJ* (j  ) + (k+o)*size2,
						qyz  = (i  ) + sizeJ* (j+o) + (k+o)*size2,
						qxyz = (i+o) + sizeJ* (j+o) + (k+o)*size2;

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
					xa = points[q*3];
					ya = points[q*3 +1];
					za = points[q*3 +2];
					xb = points[qx*3];
					yb = points[qx*3 +1];
					zb = points[qx*3 +2];
					vlist[0] = lerp(xa,xb,mu);
					vlist[1] = lerp(ya,yb,mu);
					vlist[2] = lerp(za,zb,mu);
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

					vertexIndex += 9;
					t += 3;
				}
			}
		}
	}

	var numOfVerts = vertexIndex/3;
	vertices = vertices.slice(0,numOfVerts*3);
	geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
	geometry.computeVertexNormals();

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
