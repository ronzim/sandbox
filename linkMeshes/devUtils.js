// ========================================================================== //
// ============= LIBRARY TO DEV AND DEBUG THREE JS SCENES =================== //
// ========================================================================== //

var api = require(path.join(rootPath, 'js', 'api', 'intraAPI'));

function renderPoint(sceneName, point, tag, color){
  var scene    = api.getRenderingSceneFromRenderer(sceneName);
  var mesh     = scene.getObjectByName(tag);
  if (mesh){
    scene.remove(mesh);
  }
  var geometry = new THREE.SphereGeometry(0.1,8,8);
  var hex    = color ? color : 0xff0000;
  var material = new THREE.MeshBasicMaterial({depthTest:false, color: hex});
  mesh = new THREE.Mesh(geometry, material);
  mesh.name = tag;
  mesh.position.copy(point);
  scene.add(mesh);

  // var div = document.createElement( 'div' );
  // div.className = 'label';
  // div.textContent = tag;
  // div.style.marginTop = '-1em';
  // var label = new THREE.CSS2DObject( div );
  // label.position.set( point.x +1, point.y +1 , point.z +1);
  // earth.add( label );

}

function renderVector(sceneName, startingPoint, dir, tag, color){
  var scene    = api.getRenderingSceneFromRenderer(sceneName);
  var ah       = scene.getObjectByName(tag);
  if (ah){
    scene.remove(ah);
  }
  dir.normalize();
  var length = 60;
  var hex    = color ? color : 0xffff00;
  ah     = new THREE.ArrowHelper( dir, startingPoint, length, hex );
  ah.name = tag;
  scene.add(ah);
}

function renderPlane(sceneName, plane, tag){
  var scene  = api.getRenderingSceneFromRenderer(sceneName);
  var helper = scene.getObjectByName(tag);
  if (helper){
    scene.remove(helper);
  }
  helper = new THREE.PlaneHelper( plane, 1000, 0x111100 );
  helper.name = tag;
  scene.add( helper );
}

function renderCamera(sceneName){
  var scene  = api.getRenderingSceneFromRenderer(sceneName);
  // var camera = scene.getObjectByName('camera');
  var camera = scene.getObjectByName('camera');
  // console.log(camera.parent.name)
  var helper = scene.getObjectByName('cameraHelper' + sceneName);
  if (helper){
    scene.remove(helper);
  }
  helper = new THREE.CameraHelper( camera );
  helper.name = 'cameraHelper' + sceneName;
  scene.add( helper );
}

function addScene(srcName, trgName){
  var targetScene = api.getRenderingSceneFromRenderer(trgName);
  var sourceScene = targetScene.getObjectByName(srcName);
  if (sourceScene){
    targetScene.remove(sourceScene);
  }
  sourceScene = api.getRenderingSceneFromRenderer(srcName);
  sourceScene.name = sourceScene;
  targetScene.add(sourceScene);
}

// function render3dPanorex(){
//   var stack = api.getRenderingSceneFromRenderer('panorex').getObjectByName('stack')._stack;
//   var rendererObj = api.getRendererFromRenderingScene('panorex', '2D');
//   var workflowId  = _state.get(['application', 'active', 'workflow']);
//   var voiRanges = _state.get(['workflows', workflowId, 'params', 'stepData', 'voi']);
//   var panorexDataId = api.getDataId(api.getActiveStep(), 'panorex');
//   var panorexPoints = panorexUtils.getPanorexIJKPoints(panorexDataId, stack);
//   var plane = new THREE.Plane().setFromCoplanarPoints(panorexPoints[0], panorexPoints[1], panorexPoints[2]);
//   var r3d = api.getRenderingSceneFromRenderer('r3D');
//   var stackHelper = r3d.getObjectByName('stackHelper');
//   if (stackHelper){
//     r3d.remove(stackHelper);
//   }
//   stackHelper = panorexUtils.initStackHelper(rendererObj, panorexPoints, plane, stack, voiRanges, true);
//   r3d.add(stackHelper);
// }

function computeThickness(mesh){
  console.time('compute thickness')
  var verts = mesh.geometry.attributes.position.array;
  var norms = mesh.geometry.attributes.normal.array;

  var ray = new THREE.Raycaster();
  ray.near = 0.5;
  var p   = new THREE.Vector3();
  var n   = new THREE.Vector3();
  var distances = [];

  // var helper = new THREE.VertexNormalsHelper( mesh, 2, 0x00ff00, 1 );
  // api.getRenderingSceneFromRenderer('r3D').add(helper);
  var activeCaseId = _state.get(['application', 'active', 'case']);
  var normals      = _state.get(['cases', activeCaseId, 'workflows', 'intendedcraniotomy', 'landmarkNormals']);
  var extrDir      = api.avgDir(normals);
  // console.log(extrDir)
  n.set(extrDir.x, extrDir.y, extrDir.z);
  // renderVector('r3D', mesh.geometry.boundingSphere.center, n, 'extrDir', 'yellow');

  for (var v = verts.length/3; v<(2*verts.length/3); v+=3){
    p.set(verts[v], verts[v+1], verts[v+2]);
    // n.set(norms[v], norms[v+1], norms[v+2]).negate();
    ray.set(p, n);
    var intersections = ray.intersectObject(mesh);
    if (intersections.length>0){
      distances.push(intersections[0].distance);
    }
  }

  var avg = distances.reduce((a,b)=>(a+b));
  avg /= distances.length;
  console.timeEnd('compute thickness')
  console.log('estimate thickness:', avg);

}


exports.renderPoint  = renderPoint;
exports.renderVector = renderVector;
exports.renderPlane  = renderPlane;
exports.renderCamera = renderCamera;
exports.addScene     = addScene;
exports.computeThickness = computeThickness;
// exports.render3dPanorex = render3dPanorex;
