var panorexVertexShader = [
// 'varying vec4 vProjectedCoords;',
// 'uniform float uMaxY;',
// 'uniform float uP[150];',
// 'uniform int uNoP;',

//
// main
//

// 'void main() {',

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

// '  vec4 vPos = modelMatrix * vec4(position, 1.0 );',
// '  mat4 vProjectionViewMatrix = projectionMatrix * viewMatrix;',
// '  vProjectedCoords = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0 );',
// '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0 );',

// '}'
].join('\n');

var uniforms = function(side){
  // panorex contours variables
  var _this = {};

  _this.uMaxY = {
    type: 'f',
    value: 0.0,
    typeGLSL: 'float',
  };
  _this.uNoP = {
    type: 'i',
    value: 10,
    typeGLSL: 'int',
  };
  _this.uP = {
    type: 'fv1',
    value: new Float32Array(150),
    typeGLSL: 'float',
    length: 150,
  };
  _this.color = {
    value: new THREE.Color('skyblue')
  };
  _this.clippingPlanes = {
    type: 'float',
    value:  new Float32Array(),
    typeGLSL: 'float',
    length: undefined,
  };
  _this.alpha = {
    value: 1.0
  };
  _this.backMesh = {
    value: side == 'back'
  };
  _this.numClippingPlanes = {
    type: 'i',
    value: _this.clippingPlanes.value.length/4,
    typeGLSL: 'int'
  };

  console.log(_this);
  return _this;
};

var vertexShader = [
  // panorex variables
'varying vec4 vProjectedCoords;',
'uniform float uMaxY;',
'uniform float uP[150];',
'uniform int uNoP;',
'varying vec3 vPosition;',

'void main() {',

'vPosition = (modelMatrix * vec4(position.xyz, 1.0) ).xyz;',       // vPosition da mettere in varying per clippare nel frag

'vec3 vPos = vec3( position );',

// panorex vertex distortion TODO uncomment:
// panorexVertexShader,
// 'vPos.x = newPos.x;',
// 'vPos.y = 1.0;',
// 'vPos.z = newPos.z;',

'vec4 mvPosition = modelViewMatrix * vec4( vPos, 1.0 );',
'gl_Position = projectionMatrix * mvPosition;',                     // gl_Position per visualizzare il frag (modelMatrix not needed?)

'}'

].join('\n');
console.log(vertexShader)


var fragmentShader = [

'uniform vec3 color;',
'varying vec3 vPosition;',
'uniform float clippingPlanes[NUM_CLIP_PLANES*4];',
'uniform int numClippingPlanes;',
'uniform float alpha;',
'uniform bool backMesh;',


'void main(void)',
'{',
// transform float array to a vec4 array

// '  vec4 pl[NUM_CLIP_PLANES];',
// '  for (int j=0; j<NUM_CLIP_PLANES; j++){',
// '    pl[j].x = clippingPlanes[j*4 +0];',
// '    pl[j].y = clippingPlanes[j*4 +1];',
// '    pl[j].z = clippingPlanes[j*4 +2];',
// '    pl[j].w = clippingPlanes[j*4 +3];',
// '  }',

' #if NUM_CLIP_PLANES == 1',
'   vec4 plane = vec4(clippingPlanes[0], clippingPlanes[1], clippingPlanes[2], clippingPlanes[3]);',
'   if ( dot( vPosition, plane.xyz ) > plane.w ) discard;',
' #endif',

'#if NUM_CLIP_PLANES > 1',
'	for ( int i = 0; i < NUM_CLIP_PLANES; ++ i ) {',
'		vec4 plane = vec4(clippingPlanes[i*4+0], clippingPlanes[i*4+1], clippingPlanes[i*4+2], clippingPlanes[i*4+3]);',
// TODO other planes to cut each object alone
// '		vec4 plane = vec4(clippingPlanes[0], clippingPlanes[1], clippingPlanes[2], clippingPlanes[3]);',
// '		vec4 planeA = vec4(clippingPlanes[i], clippingPlanes[i], clippingPlanes[i], clippingPlanes[i]);',
// '		vec4 planeB = vec4(clippingPlanes[i], clippingPlanes[i], clippingPlanes[i], clippingPlanes[i]);',
// '		if ( dot( vPosition, plane.xyz ) > plane.w && dot( vPosition, n ) > ac && dot( vPosition, n ) < bc) discard;',
// '		if ( dot( vPosition, plane.xyz ) > plane.w && dot( vPosition, a.xyz ) > a.w && dot( vPosition, b.xyz ) > b.w ) discard;',
'		if ( dot( vPosition, plane.xyz ) > -plane.w ) discard;',
'	}',
'#endif',

// ===

'if (!backMesh){',
'  gl_FragColor = vec4(color.r, color.g, color.b, 0.0);',
'}',
'else {',
'  gl_FragColor = vec4(color.r, color.g, color.b, 1.0);',
'}',

'}'

].join('\n');



function projectPlanes( planes, camera, dstOffset, skipTransform, uniforms ) {
  var viewNormalMatrix = new THREE.Matrix3();
  var plane = new THREE.Plane();

  var nPlanes = planes !== null ? planes.length : 0,
    dstArray = null;

  if ( nPlanes !== 0 ) {

    dstArray = uniforms.clippingPlanes.value;

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

    uniforms.value = dstArray;
    uniforms.needsUpdate = true;

  }

  return dstArray;

}

exports.uniforms       = uniforms;
exports.vertexShader   = vertexShader;
exports.fragmentShader = fragmentShader;

exports.projectPlanes  = projectPlanes;
