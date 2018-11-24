// import ShadersBase from '../shaders.base';
// import InterpolationIdentity from './shaders.interpolation.identity';
var ShadersBase           = require('./shaders.base').ShadersBase;
var InterpolationIdentity = require('./shaders.interpolation.identity').InterpolationIdentity;

class InterpolationSlab extends ShadersBase {
  constructor() {
    super();
    this.name = 'InterpolationSlab';

    // default properties names
    this._currentVoxel = 'currentVoxel';
    this._dataValue = 'dataValue';
    this._gradient = 'gradient';
    this._dims = 'dims';
  }

  api(baseFragment = this._base, currentVoxel = this._currentVoxel, dataValue = this._dataValue, dims = this._dims) {
    this._base = baseFragment;
    return this.compute(currentVoxel, dataValue, dims);
  }

  compute(currentVoxel, dataValue, dims) {
    this.computeDefinition();
    this._base._functions[this._name] = this._definition;
    return `${this._name}(${currentVoxel}, ${dataValue}, ${dims});`;
  }

  computeDefinition() {
    this._definition = `
void ${this._name}(in vec3 currentVoxel, out vec4 dataValue, out vec3 gradient){

  if (true){

    dataValue = vec4(0.0, 0.0, 0.0, 0.0);

    vec3 s = normalize(uSpacing * uDirection);

    const float dMin  = ${this._base._uniforms.uDelta.value[0]};
    const float dMax  = ${this._base._uniforms.uDelta.value[1]};

    for (float d = dMin; d < dMax; d++) {
      vec3 p = vec3(
        floor(currentVoxel.x + d * s[0]),
        floor(currentVoxel.y + d * s[1]),
        floor(currentVoxel.z + d * s[2])
      );
      vec4 v = vec4(0.0, 0.0, 0.0, 0.0);
      ${InterpolationIdentity.api(this._base, 'p', 'v')}
      dataValue = max(dataValue, v);
    }

  }

}
    `;
  }
}

// export default new InterpolationTrilinear();
exports.InterpolationSlab = new InterpolationSlab();
