class ShadersVertex {
  compute() {
    return `
// uniform vec3 uSeeds;
varying float opacity;
varying vec4 vPos;
varying vec3 vNormal;
uniform float uPosY;
varying float flag;

//
// main
//
void main() {
  // vNormal = normalize( normalMatrix * normal );
  vNormal = normal;
  opacity = 0.2;
  flag = 0.0;
  // if (abs(dot(vNormal, vec3(0,0,1))) < 0.01){
  // if (position.y > uVec3Array[0].y && position.y < uVec3Array[1].y){

  // opacity = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 3.0);
  // opacity *= 1.2*abs(dot(vNormal, vec3(0, 0, 1)));

  vPos = vec4(position, 1.0 );
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );      // evaluate using new position

}
        `;
    }
}

exports.ShadersVertex = ShadersVertex;
