
class ShadersUniform {
  static uniforms() {
    return {
      'uMaxY': {
        type: 'f',
        value: 0.0,
        typeGLSL: 'float',
      },
      'uP0': {
        type: 'v3',
        value: [0.0, 0.0, 0.0], 
        typeGLSL: 'vec3',
      },
      'uP1': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP2': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP3': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP4': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP5': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP6': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP7': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP8': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
      },
      'uP9': {
        type: 'v3',
        value: [0.0, 0.0, 0.0],
        typeGLSL: 'vec3',
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
      'uWidth': {
        type: 'f',
        value: 1.,
        typeGLSL: 'float',
      },
      'uTextureFilled': {
        type: 't',
        value: [],
        typeGLSL: 'sampler2D',
      },
    };
  }
}

exports.ShadersUniform = ShadersUniform;
