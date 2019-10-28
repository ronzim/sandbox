// Node moduels
var path = require('path');
var _    = require('underscore');

// AMI
var HelpersStack = AMI.StackHelper;

// Local modules
var api          = require(path.join(rootPath, 'js', 'api', 'operaAPI'));
var imageUtils   = require(path.join(rootPath, 'js', 'scenes', 'utils', 'imageUtils'));
var panorexUtils = require(path.join(rootPath, 'js', 'scenes', 'utils', 'panorexUtils'));
var _state       = require(path.join(rootPath, 'js', 'app', 'state'));

/*  ================================================================  */
/*  Library for rendering panorex                                     */
/*  ================================================================  */
var getPanorexPoints = function(dataId) {
  var data;
  var cases = _.keys(_state.get(['workspace', 'cases']));

  for (var i = 0; i < cases.length; i++) {
    var casesData = _.keys(_state.get(['workspace', 'cases', cases[i]]));
    for (var j = 0; j < casesData.length; j++) {
      if (casesData[j] == dataId) {
        data = _state.get(['workspace', 'cases', cases[i], casesData[j]]);
      }
    }
  }

  return data.props.points;
};

var getPanorexStackHelper = function(rendererObj, stack, panorexPoints) {
  var planeStackHelper = new HelpersStack(stack);
  // TODO fix this with correct direction
  var plane = new THREE.Plane(planeStackHelper.slice.planeDirection, planeStackHelper.slice.planePosition.z);

  // apply IJK matrix to points
  var toIJKmatrix = planeStackHelper.stack.lps2IJK;
  var pointsIJK   = [];

  for (p = 0; p < panorexPoints.length; p++) {
    var point = panorexPoints[p];
    var pointIJK = point.applyMatrix4(toIJKmatrix);
    pointsIJK.push(pointIJK);
  }

  return panorexUtils.initStackHelper(rendererObj, pointsIJK, plane, stack, 2);
};

var getPanorexGeometry = function(stack, panorexPoints) {
  var planeStackHelper = new HelpersStack(stack);
  // TODO fix this with correct direction
  var plane = new THREE.Plane(planeStackHelper.slice.planeDirection, planeStackHelper.slice.planePosition.z);

  // apply IJK matrix to points
  var toIJKmatrix = planeStackHelper.stack.lps2IJK;
  var pointsIJK   = [];

  for (p = 0; p < panorexPoints.length; p++) {
    var point = panorexPoints[p];
    var pointIJK = point.applyMatrix4(toIJKmatrix);
    pointsIJK.push(pointIJK);
  }

  var g = panorexUtils.generateGeometry(pointsIJK, plane, stack);
  var l = panorexUtils.computeLength(pointsIJK);

  return {
    geometry: g,
    length: l
  }
};

var initHelperStack = function(scene, sceneName, dataDisplayName, stack, defaultProps, panorexPoints) {
  var workflowId  = _state.get(['application', 'active', 'workflow']);
  var sceneType   = _state.get(['workspace', 'scenes', sceneName, 'type']);
  var stateProps  = _state.get(['workspace', 'scenes', sceneName, dataDisplayName, 'props']);

  var rendererObj = api.getRendererFromRenderingScene(sceneName, sceneType);

  var stackHelper = getPanorexStackHelper(rendererObj, stack, panorexPoints);

  stackHelper.name = 'stack';
  stackHelper.bbox.visible = false;
  stackHelper.bbox.color = 0x121212;
  stackHelper.borderColor = 0x121212;
  stackHelper._slice.canvasHeight = rendererObj.domElement.clientHeight;
  stackHelper._slice.canvasWidth  = rendererObj.domElement.clientWidth;

  // intensityAuto = true makes a single slice intensity evaluation
  stackHelper.slice.intensityAuto = false;

  // set camera
  let camera = scene.getObjectByName('camera');

  let worldbb = stack.worldBoundingBox();
  let lpsDims = new THREE.Vector3(
    (worldbb[1] - worldbb[0]) / 2,
    (worldbb[3] - worldbb[2]) / 2,
    (worldbb[5] - worldbb[4]) / 2
  );

  // box: {halfDimensions, center}
  let box = {
    center: stack.worldCenter().clone(),
    halfDimensions:
      new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
  };

  // init and zoom
  let canvas = {
    width: rendererObj.domElement.clientWidth,
    height: rendererObj.domElement.clientHeight,
  };

  camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
  camera.box = box;
  camera.canvas = canvas;
  camera.orientation = 'coronal';

  camera.update();
  camera.fitBox(2, 1);

  // Set orientation
  stackHelper.orientation = camera.stackOrientation;

  // update border with new slice
  stackHelper.border.helpersSlice = stackHelper.slice;

  scene.add(stackHelper);

  // Initialize state props
  if (!_.has(stateProps, 'windowCenter')) {
    // initialize it with the default value
    _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'windowCenter'], stackHelper.slice.windowCenter);
  }

  if (!_.has(stateProps, 'windowWidth')) {
    // initialize it with the default value
    _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'windowWidth'], stackHelper.slice.windowWidth);
  }

  _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'stackLength'], stackHelper.orientationMaxIndex);
  _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'dimensionsIJK'], stackHelper.stack.dimensionsIJK);
  _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'minMax'], stackHelper.stack.minMax);

  // TODO is this the correct value?
  _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'zoom'], camera.zoom);
  _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'pan'], new THREE.Vector2(0, 0));

  if (camera.directionsLabel) {
    _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'orientationMarkers', 'top'], camera.directionsLabel[0]);
    _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'orientationMarkers', 'bottom'], camera.directionsLabel[1]);
    _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'orientationMarkers', 'right'], camera.directionsLabel[2]);
    _state.set(['workspace', 'scenes', sceneName, dataDisplayName, 'props', 'orientationMarkers', 'left'], camera.directionsLabel[3]);
  }
};

var updateStack = function(scene3d, sceneName, dataDisplayName, stackHelper, panorexPoints) {
  var sceneType   = _state.get(['workspace', 'scenes', sceneName, 'type']);
  var rendererObj = api.getRendererFromRenderingScene(sceneName, sceneType);

  let stack = imageUtils.getSeriesStack('panorex', 'panorexPlane');

  // TODO do not add/remove stack, update its geometry
  // let newStackGeometry = getPanorexGeometry(stack, panorexPoints);
  //
  // stackHelper.slice.updateHalfLength(newStackGeometry.length / 2);
  // stackHelper.geometry = newStackGeometry.geometry;

  // scene3d.remove(stackHelper);

  let newStackHelper = getPanorexStackHelper(rendererObj, stack, panorexPoints);

  newStackHelper.name = 'stack';
  newStackHelper.bbox.visible = false;
  newStackHelper.bbox.color = 0x121212;
  newStackHelper.borderColor = 0x121212;
  stackHelper._slice.canvasHeight = rendererObj.domElement.clientHeight;
  stackHelper._slice.canvasWidth  = rendererObj.domElement.clientWidth;

  // intensityAuto = true makes a single slice intensity evaluation
  newStackHelper.slice.intensityAuto = false;

  // Set orientation
  let camera = scene3d.getObjectByName('camera');
  newStackHelper.orientation = camera.stackOrientation;

  // update border with new slice
  newStackHelper.border.helpersSlice = newStackHelper.slice;

  scene3d.add(newStackHelper);
};

var updateScene = function(scene3d, sceneName, dataDisplayName, stackHelper, props) {
  // windowWidth
  if (_.has(props, 'windowWidth')) {
    stackHelper.slice.windowWidth = props.windowWidth;
  }

  // windowCenter
  if (_.has(props, 'windowCenter')) {
    stackHelper.slice.windowCenter = props.windowCenter;
  }

  // zoom
  if (_.has(props, 'zoom')) {
    // just trigger the rendering function for the current scene:
    // zoom functionality is implemented by the camera controls
  }

  // pan
  if (_.has(props, 'pan')) {
    // just trigger the rendering function for the current scene:
    // pan functionality is implemented by the camera controls
  }
};

var render = function(toRender, sceneName, scene3d, dataDisplay, callback) {
  // TODO check this, set dataDisplay to false
  var currentStepDataDisplay = api.getDataDisplayName(api.getActiveStep(), sceneName);
  if (currentStepDataDisplay !== dataDisplay.id) {
    return;
  }

  var stackHelper = scene3d.getObjectByName('stack');

  if (!stackHelper) {
    let stepName = api.getActiveStep();
    let stack = imageUtils.getSeriesStack('panorex', 'panorexPlane');

    if (!stack) {
      return;
    }

    let panorexPoints = getPanorexPoints(dataDisplay.dataId);
    if (!panorexPoints || panorexPoints.length < 2){
      console.log('not enough points');
      return;
    }

    let toRenderProps = _.extend(toRender.props, _state.get(['workspace', 'scenes', sceneName, dataDisplay.id, 'props']));
    initHelperStack(scene3d, sceneName, dataDisplay.id, stack, toRenderProps, panorexPoints);
  } else {
    if (_.has(toRender.props, 'dataRev')) {
      // add new spline point
      let panorexPoints = getPanorexPoints(dataDisplay.dataId);
      if (!panorexPoints || panorexPoints.length < 2) {
        console.log('not enough points');
        return;
      }
      updateStack(scene3d, sceneName, dataDisplay.id, stackHelper, panorexPoints);
    } else {
      updateScene(scene3d, sceneName, dataDisplay.id, stackHelper, toRender.props);
    }

    setTimeout(function() {
      _state.set(['application', sceneName, 'isRendering'], false);
    }, 0);
  }
};

/*  ================================================================  */
/*  Exports functions                                                 */
/*  ================================================================  */
exports.render = render;
