var ShadersBase           = require('./shaders.base').ShadersBase;
var InterpolationIdentity = require('./shaders.interpolation.identity').InterpolationIdentity;

class InterpolationCompleteSlab extends ShadersBase {
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

    // multiply component-wise
    vec3 s = uSpacing * uDirection;

    const float dMin  = ${this._base._uniforms.uBBminDir.value};
    const float dMax  = ${this._base._uniforms.uBBmaxDir.value};

    vec3 justThisDirection   = currentVoxel * uDirection;
    vec3 justOtherDirections = currentVoxel - justThisDirection;

    for (float d = 0.0; d < 10000.0; d++){
		  if(d < dMin )
			  continue;
		  else if( d > dMax )
			  break;

      // direz corrente :   floor(dMin+d);
      // altre direz :      currentVoxel.x  + floor(d*s[0]);
      
      float dm = floor(dMin+d);
      vec3 dmv = vec3(dm, dm, dm) * uDirection;
      vec3 p = justOtherDirections + dmv;
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
exports.InterpolationCompleteSlab = new InterpolationCompleteSlab();
