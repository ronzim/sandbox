class ShadersVertex {
  compute() {
    return `
varying vec4 vPos;
uniform float uPosY;
uniform vec3 uBaseCorner;

//
// main
//
void main() {

  vec3 newPos = position;
  float d;

  d = sqrt( pow( position.x - uBaseCorner[0], 2.0) + pow( position.y - uBaseCorner[1], 2.0) );

  newPos.x = d;
  newPos.y = uPosY;
  newPos.z = position.z;

  vPos = modelMatrix * vec4(position, 1.0 );                                  // send back old position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0 );      // evaluate using new position

}
        `;
    }
}

exports.ShadersVertex = ShadersVertex;
