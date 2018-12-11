class ShadersVertex {
  compute() {
    return `
varying vec4 vPos;
uniform float uPosY;

//
// main
//
void main() {

  vec3 newPos = position;

  vPos = modelMatrix * vec4(position, 1.0 );                                  // send back old position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );      // evaluate using new position

}
        `;
    }
}

exports.ShadersVertex = ShadersVertex;
