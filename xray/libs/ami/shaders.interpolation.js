var InterpolationIdentity     = require('./shaders.interpolation.identity').InterpolationIdentity;
var InterpolationTrilinear    = require('./shaders.interpolation.trilinear').InterpolationTrilinear;
var InterpolationSlab         = require('./shaders.interpolation.slab').InterpolationSlab;
var Interpolation3D           = require('./shaders.interpolation.3D').Interpolation3D;
var InterpolationCompleteSlab = require('./shaders.interpolation.completeSlab').InterpolationCompleteSlab;

function shadersInterpolation(baseFragment, currentVoxel, dataValue, gradient) {
  console.log(baseFragment._uniforms.uInterpolation.value)
  switch (baseFragment._uniforms.uInterpolation.value) {
    case 0:
      // no interpolation
      return InterpolationIdentity.api(baseFragment, currentVoxel, dataValue);

    case 1:
      // trilinear interpolation
      return InterpolationTrilinear.api(baseFragment, currentVoxel, dataValue, gradient);

    // temporarly disable mip interpolation (2, 3 cases)
    case 2:
      // complete slab interpolation (MIP on entire stack)
      // Well all I do is push and shove
      // Just to get a little piece of your love
      // I want it all or nothin’ at all
      var dims = baseFragment._uniforms.uDataDimensions.value;
      return InterpolationCompleteSlab.api(baseFragment, currentVoxel, dataValue, gradient, dims);

    case 3:
      // slab interpolation (MIP)
      var dims = baseFragment._uniforms.uDataDimensions.value;
      // console.log(dims)
      return InterpolationSlab.api(baseFragment, currentVoxel, dataValue, gradient, dims);
    case 4:
      // slab interpolation (MIP) on 3D mesh
      return Interpolation3D.api(baseFragment, currentVoxel, dataValue, gradient);

    default:
      return InterpolationIdentity.api(baseFragment, currentVoxel, dataValue);
  }
}

// export default shadersInterpolation;
exports.shadersInterpolation = shadersInterpolation;
