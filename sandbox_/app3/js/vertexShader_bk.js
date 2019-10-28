var uniformsFront = {

  // panorex contours variables
  'uMaxY': {
    type: 'f',
    value: 0.0,
    typeGLSL: 'float',
  },
  'uNoP': {
    type: 'i',
    value: 10,
    typeGLSL: 'int',
  },
  'uP': {
    type: 'fv1',
    value: new Float32Array(150),
    typeGLSL: 'float',
    length: 150,
  },
  color: {
    value: new THREE.Color('skyblue')
  },
  'clippingPlane': {
    type: 'v4',
    value:  [1.0, 0.0, 0.0, 0.0],
    typeGLSL: 'vec4',
  },
  alpha: {
    value: 1.0
  },
  backMesh: {
    value: false
  }
};

var uniformsBack = {

  // panorex contours variables
  'uMaxY': {
    type: 'f',
    value: 0.0,
    typeGLSL: 'float',
  },
  'uNoP': {
    type: 'i',
    value: 10,
    typeGLSL: 'int',
  },
  'uP': {
    type: 'fv1',
    value: new Float32Array(150),
    typeGLSL: 'float',
    length: 150,
  },
  color: {
    value: new THREE.Color('blue')
  },
  'clippingPlane': {
    type: 'v4',
    value:  [1.0, 0.0, 0.0, 0.0],
    typeGLSL: 'vec4',
  },
  alpha: {
    value: 1.0
  },
  backMesh: {
    value: true
  }
};

var vertexShader = [

// '#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )',
'	varying vec3 vViewPosition;',
'	varying mat4 vModelViewMatrix;',
// '#endif',

'void main() {',

'vec3 vPos = vec3( position );',

  // ami
  // vPos = modelMatrix * vec4(position, 1.0 );
  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
// "vec3 worldNormal = normalize ( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",
'vec4 mvPosition = modelViewMatrix * vec4( vPos, 1.0 );',
// "vNormal = normalize( normalMatrix * normal );",
// 'mvPosition += vec4(0.0, 1.0, 0.0, 1.0);',
'gl_Position = projectionMatrix * mvPosition;',

'vModelViewMatrix = modelViewMatrix;',

// '#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )',
//'	vViewPosition = - mvPosition.xyz;',
'	vViewPosition = position.xyz;', // vPosition da mettere in varying per clippare nel frag
// '#endif',
'}'

].join('\n');



var fragmentShader = [

'uniform vec3 color;',
'varying vec3 vViewPosition;',
'varying mat4 vModelViewMatrix;',
'uniform vec4 clippingPlane;',
'uniform float alpha;',
'uniform bool backMesh;',

'void main(void)',
'{',

//

'vec4 plane = clippingPlane;',
// 'if ( dot( vViewPosition, plane.xyz ) > plane.w) discard;',
'if ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;',
//'if ( dot( vViewPosition, plane.xyz ) < plane.w - 0.1) discard;',

//

'#if NUM_CLIPPING_PLANES == 1',
'	for ( int i = 0; i < UNION_CLIPPING_PLANES; ++ i ) {',
'		vec4 plane = clippingPlanes[ i ];',
'		if ( dot( vViewPosition, plane.xyz ) > plane.w + 0.01 ) discard;',
'		if ( dot( vViewPosition, plane.xyz ) < plane.w ) discard;',
// '		if ( true ) discard;',
'	}',
'#endif',
'#if NUM_CLIPPING_PLANES > 1',
'	for ( int i = 0; i < UNION_CLIPPING_PLANES/3; ++ i ) {',
'		vec4 plane = clippingPlanes[ i ];',
'		vec4 a = clippingPlanes[2*i + UNION_CLIPPING_PLANES/3];',
'		vec4 b = clippingPlanes[2*i + 1 + UNION_CLIPPING_PLANES/3];',
// '		if ( dot( vViewPosition, plane.xyz ) > plane.w && dot( vViewPosition, n ) > ac && dot( vViewPosition, n ) < bc) discard;',
// '		if ( dot( vViewPosition, plane.xyz ) > plane.w && dot( vViewPosition, a.xyz ) > a.w && dot( vViewPosition, b.xyz ) > b.w ) discard;',
// '		if ( dot( vViewPosition, plane.xyz ) > plane.w && dot( vViewPosition, a.xyz ) > a.w ) discard;',
'		if ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;',
// '		if ( true ) discard;',
'	}',
'	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES',
'		bool clipped = true;',
'		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; ++ i ) {',
'			a = uP[0];',
'			vec4 plane = clippingPlanes[ i ];',
'			clipped = ( dot( vViewPosition, plane.xyz ) > plane.w ) && clipped;',
'		}',
'		if ( clipped ) discard;',
'	#endif',
'#endif',

// 'if (gl_FrontFacing){',
// '  gl_FragColor = vec4(color.r, color.g, color.b, 0.0);',
// '}',
// 'else {',
// '  gl_FragColor = vec4(0.3, 0.5, 0.5, 1.0);',
// '}',

'if (!backMesh){',
'  gl_FragColor = vec4(1.0, 0.5, 0.5, 0.0);',
'}',
'else {',
'  gl_FragColor = vec4(0.3, 0.5, 0.5, 1.0);',
'}',

'}'

].join('\n');

var panorexVertexShader = [
'varying vec4 vProjectedCoords;',
'uniform float uMaxY;',
'uniform float uP[150];',
'uniform int uNoP;',

//
// main
//

'void main() {',

'  vec3 newPos = position;',
'  const int nOp = 50;',
'  float d;',
'  float offset = 0.0;',

'  vec3 basePoint;',
'  vec3 nextPoint;',
'  vec3 v[nOp];',

  // transform uniform array to a vec3 array
'  for (int i=0; i<nOp; i++){',
'    v[i].x = uP[i*3 +0];',
'    v[i].y = uP[i*3 +1];',
'    v[i].z = uP[i*3 +2];',
'  }',

  // find nearest basePoint
'  float dMin = 1000.0;',
'  vec3 bp, np;',

'  for (int i=0; i<nOp; i++){',
'    d = sqrt( pow( position.x - v[i][0], 2.0) + pow( position.y - v[i][1], 2.0) );',
'    float dx = position.x - v[i][0];',
'    if (d<dMin){',
'      dMin = d;',
'      bp = v[i];',
'      np = v[i+1];',
'    }',
'  }',

  // compute nextPoint position w/ respect to basePoint (in terms of cartesian quarter)
  // int nextPointId = basePointId+1;
  //q can be 1,2,3,4

'  int qa = 0;',

'  float dx = np[0] - bp[0];',
'  float dy = np[1] - bp[1];',

'  if (dx >= 0.0 && dy >= 0.0){',
'    qa = 1;',
'  }',
'  else if (dx < 0.0 && dy > 0.0){',
'    qa = 2;',
'  }',
'  else if (dx < 0.0 && dy < 0.0){',
'    qa = 3;',
'  }',
'  else if (dx > 0.0 && dy < 0.0){',
'    qa = 4;',
'  }',

  // same for current point w/respect to base point
'  float delta_x = position.x - bp[0];',
'  float delta_y = position.y - bp[1];',
'  int qb = 0;',

'  if (delta_x >= 0.0 && delta_y >= 0.0){',
'    qb = 1;',
'  }',
'  else if (delta_x < 0.0 && delta_y > 0.0){',
'    qb = 2;',
'  }',
'  else if (delta_x < 0.0 && delta_y < 0.0){',
'    qb = 3;',
'  }',
'  else if (delta_x > 0.0 && delta_y < 0.0){',
'    qb = 4;',
'  }',

  // compute distance from base point
'  d = sqrt( pow( position.x - bp[0], 2.0) + pow( position.y - bp[1], 2.0) );',

'  if (qa == qb){',
'    newPos.x = offset + bp[2] + d;', //add d
'  }',
'  else{',
'    newPos.x = offset + bp[2] - d;', //sub d
'  }',

'  vec4 vPos = modelMatrix * vec4(position, 1.0 );',
'  mat4 vProjectionViewMatrix = projectionMatrix * viewMatrix;',
'  vProjectedCoords = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0 );',
'  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0 );',

'}'
].join('\n');

function projectPlanes( planes, camera, dstOffset, skipTransform ) {
  var viewNormalMatrix = new THREE.Matrix3();
  var plane = new THREE.Plane();

  var nPlanes = planes !== null ? planes.length : 0,
    dstArray = null;

  if ( nPlanes !== 0 ) {

    dstArray = uniformsFront.clippingPlane.value;

    if ( skipTransform !== true || dstArray === null ) {

      var flatSize = dstOffset + nPlanes * 4,
        viewMatrix = camera.matrixWorldInverse;

      viewNormalMatrix.getNormalMatrix( viewMatrix );

      if ( dstArray === null || dstArray.length < flatSize ) {

        dstArray = new Float32Array( flatSize );

      }

      for ( var i = 0, i4 = dstOffset; i !== nPlanes; ++ i, i4 += 4 ) {

        // plane.copy( planes[ i ] ).applyMatrix4( viewMatrix, viewNormalMatrix );
        plane.copy( planes[ i ] );

        plane.normal.toArray( dstArray, i4 );
        dstArray[ i4 + 3 ] = plane.constant;

      }

      console.log(dstArray);

    }

    // uniform.value = dstArray;
    // uniform.needsUpdate = true;

  }

  // scope.numPlanes = nPlanes;

  return dstArray;

}

exports.uniformsFront  = uniformsFront;
exports.uniformsBack   = uniformsBack;
exports.vertexShader   = vertexShader;
exports.fragmentShader = fragmentShader;

exports.projectPlanes  = projectPlanes;
