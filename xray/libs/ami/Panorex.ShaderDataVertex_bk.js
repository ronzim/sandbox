class ShadersVertex {
  compute() {
    return `
varying vec4 vPos;
uniform float uMax;
uniform float uMin;
// uniform float uBack;
uniform float uHalfLength;

//
// main
//
void main() {

  vec3 newPos = position;
  float middle;
  float deltaX;
  float a;
  float b;
  float deltaMax;

  deltaMax = 150.0;
  middle = (uMax + uMin)/2.0;

  // if vertex is on the backside AND is not a corner, do nothing

  // if (newPos.y != uBack || newPos.x == uMax || newPos.x == uMin){
  // if (newPos.y != uBack){
    if (position.x < middle){
      a = middle - uMin;
      deltaX = (middle - position.x)/a * deltaMax;
      newPos.x = position.x - deltaX;
      newPos.y = 200.0 + position.y * 0.01; // avoid overlapping of vertex from backside
    }
    else {
      b = uMax - middle;
      deltaX = (position.x - middle)/b * deltaMax;
      newPos.x = position.x + deltaX;
      newPos.y = 200.0 + position.y * 0.01;
    }
  // }

  vPos = modelMatrix * vec4(position, 1.0 );                                  // send back old position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0 );      // evaluate using new position

}
        `;
    }
}

exports.ShadersVertex = ShadersVertex;
