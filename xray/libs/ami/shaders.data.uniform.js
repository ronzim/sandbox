// import {THREE.Matrix4} from 'three';


/**
 * @module shaders/data
 */
class ShadersUniform {
  /**
   * Shaders data uniforms
   */
  static uniforms() {
    var uniforms = {
      'uTextureSize': {
        type: 'i',
        value: 0,
        typeGLSL: 'int',
      },
      'uTextureContainer': {
        type: 'tv',
        value: [],
        typeGLSL: 'sampler2D',
        length: 7,
      },
      'uDataDimensions': {
        type: 'iv',
        value: [0, 0, 0],
        typeGLSL: 'ivec3',
      },
      'uWorldToData': {
        type: 'm4',
        value: new THREE.Matrix4(),
        typeGLSL: 'mat4',
      },
      'uSpacing': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uDelta': {
        type: 'fv1',
        value: [0.0, 0.0],
        typeGLSL: 'float',
        length: 2,
      },
      'uDirection': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uBBmaxDir': {
        type: 'f',
        value: 0.0,
        typeGLSL: 'float',
      },
      'uBBminDir': {
        type: 'v3',
        value: 0.0,
        typeGLSL: 'float',
      },
      'uWindowCenterWidth': {
        type: 'fv1',
        value: [0.0, 0.0],
        typeGLSL: 'float',
        length: 2,
      },
      'uRescaleSlopeIntercept': {
        type: 'fv1',
        value: [0.0, 0.0],
        typeGLSL: 'float',
        length: 2,
      },
      'uNumberOfChannels': {
        type: 'i',
        value: 1,
        typeGLSL: 'int',
      },
      'uBitsAllocated': {
        type: 'i',
        value: 8,
        typeGLSL: 'int',
      },
      'uInvert': {
        type: 'i',
        value: 0,
        typeGLSL: 'int',
      },
      'uLut': {
        type: 'i',
        value: 0,
        typeGLSL: 'int',
      },
      'uTextureLUT': {
        type: 't',
        value: [],
        typeGLSL: 'sampler2D',
      },
      'uLutSegmentation': {
        type: 'i',
        value: 0,
        typeGLSL: 'int',
      },
      'uTextureLUTSegmentation': {
        type: 't',
        value: [],
        typeGLSL: 'sampler2D',
      },
      'uPixelType': {
        type: 'i',
        value: 0,
        typeGLSL: 'int',
      },
      'uPackedPerPixel': {
        type: 'i',
        value: 1,
        typeGLSL: 'int',
      },
      'uInterpolation': {
        type: 'i',
        value: 1,
        typeGLSL: 'int',
      },
      'uCanvasWidth': {
        type: 'f',
        value: 0.,
        typeGLSL: 'float',
      },
      'uCanvasHeight': {
        type: 'f',
        value: 0.,
        typeGLSL: 'float',
      },
      'uBorderColor': {
        type: 'v3',
        value: [1.0, 0.0, 0.5],
        typeGLSL: 'vec3',
      },
      'uBorderWidth': {
        type: 'f',
        value: 2.,
        typeGLSL: 'float',
      },
      'uBorderMargin': {
        type: 'f',
        value: 2.,
        typeGLSL: 'float',
      },
      'uBorderDashLength': {
        type: 'f',
        value: 10.,
        typeGLSL: 'float',
      },
    };
    return uniforms;
  }
}

exports.ShadersUniform = ShadersUniform;
