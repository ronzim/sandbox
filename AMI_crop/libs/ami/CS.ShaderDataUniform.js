
class ShadersUniform {
  /**
   * Shaders data uniforms
   */
  static uniforms() {
    var toBeReturned = {
      'uPosY': {
        type: 'f',
        value: 0.0,
        typeGLSL: 'float',
      },
      'uBaseCorner': {
        type: 'v3',
        value: [0.0, 0.0, 0.0], // NOTE!! the third component is the s-coord NOT the z
        typeGLSL: 'vec3',
      },
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
        value: 0.0,
        typeGLSL: 'float',
      },
      'uCanvasHeight': {
        type: 'f',
        value: 0.0,
        typeGLSL: 'float',
      },
      'uBorderColor': {
        type: 'v3',
        value: [1.0, 0.0, 0.5],
        typeGLSL: 'vec3',
      },
      'uBorderWidth': {
        type: 'f',
        value: 2.0,
        typeGLSL: 'float',
      },
      'uBorderMargin': {
        type: 'f',
        value: 2.0,
        typeGLSL: 'float',
      },
      'uBorderDashLength': {
        type: 'f',
        value: 10.0,
        typeGLSL: 'float',
      },
    };

    return toBeReturned;
  }
}

exports.ShadersUniform = ShadersUniform;
