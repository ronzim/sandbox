class ShadersVertex {
  compute() {
    return `
varying vec4 vProjectedCoords;
uniform float uMaxY;
uniform vec3 uP0;
uniform vec3 uP1;
uniform vec3 uP2;
uniform vec3 uP3;
uniform vec3 uP4;
uniform vec3 uP5;
uniform vec3 uP6;
uniform vec3 uP7;
uniform vec3 uP8;
uniform vec3 uP9;

//
// main
//
void main() {

  vec3 newPos = position;
  float d;
  float offset = 0.0;

  if (position.x <= 0.0){                                     // suppose there's no point < x0
    // compute distance from previous point
    d = sqrt( pow( position.x - uP0[0], 2.0) + pow( position.y - uP0[1], 2.0) );
    // add distance to s-coord of previous point
    newPos.x = offset + uP0[2] + d;
  }
  else if (position.x <= uP2[0]){
    d = sqrt( pow( position.x - uP1[0], 2.0) + pow( position.y - uP1[1], 2.0) );
    newPos.x = offset + uP1[2] + d;
  }
  else if (position.x <= uP3[0]){
    d = sqrt( pow( position.x - uP2[0], 2.0) + pow( position.y - uP2[1], 2.0) );
    newPos.x = offset + uP2[2] + d;
  }
  else if (position.x <= uP4[0]){
    d = sqrt( pow( position.x - uP3[0], 2.0) + pow( position.y - uP3[1], 2.0) );
    newPos.x = offset + uP3[2] + d;
  }
  else if (position.x <= uP5[0]){
    d = sqrt( pow( position.x - uP4[0], 2.0) + pow( position.y - uP4[1], 2.0) );
    newPos.x = offset + uP4[2] + d;
  }
  else if (position.x <= uP6[0]){
    d = sqrt( pow( position.x - uP5[0], 2.0) + pow( position.y - uP5[1], 2.0) );
    newPos.x = offset + uP5[2] + d;
  }
  else if (position.x <= uP7[0]){
    d = sqrt( pow( position.x - uP6[0], 2.0) + pow( position.y - uP6[1], 2.0) );
    newPos.x = offset + uP6[2] + d;
  }
  else if (position.x <= uP8[0]){
    d = sqrt( pow( position.x - uP7[0], 2.0) + pow( position.y - uP7[1], 2.0) );
    newPos.x = offset + uP7[2] + d;
  }
  else if (position.x <= uP9[0]){
    d = sqrt( pow( position.x -uP8[0], 2.0) + pow( position.y -uP8[1], 2.0) );
    newPos.x = offset + uP8[2] + d;
  }
  else {
    newPos.x = position.x;
  };

  vec4 vPos = modelMatrix * vec4(position, 1.0 );
  mat4 vProjectionViewMatrix = projectionMatrix * viewMatrix;
  vProjectedCoords =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0 );

}
        `;
    }
}

exports.ShadersVertex = ShadersVertex;
