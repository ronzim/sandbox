// lib to generate smoothly binded bezier curves (c0 or c1)

const ARC_SEGMENTS = 200

var scene;
var curves = [];
var handles = [];
var initialPoint;
var secondPoint;
var isVertex = true;
var c1 = true;
var mode = 'create' // or 'modify' or 'delete'

// TODO
// - code cleanup
// - creation initialization / ending (including snapping last-first vertices) OK
// - render handles and bind them to the curve (rewrite renderPoint fun) OK
// - possibility to modify curves
// - place points on first curve creation
// - check handles with straight segments 

function multipointBezier(pointsArray, freeze){
  var curve = new (Function.bind.apply(THREE.CubicBezierCurve3, [null].concat(pointsArray)));
  curve.closed = true;
  curve.tension = 0.5;
  if (freeze) {
    curves.push(curve)
  }
  else {
    if (curves[curves.length-1]) curves[curves.length-1].v2 = pointsArray[2];
  }
  renderCurve(curve);
}

function renderCurve(curve) {
  var geometry = new THREE.BufferGeometry();
  geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ARC_SEGMENTS * 3 ), 3 ) );

  var curveMesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
    color: 0x000000,
    opacity: 0.35,
    visible: true
  } ) );

  var index = isVertex ? curves.length : curves.length-1;
  curveMesh.name = 'curve_' + index;

  var position = curveMesh.geometry.attributes.position;

  for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
    var t = i / ( ARC_SEGMENTS - 1 );
    var point = curve.getPoint(t);
    position.setXYZ( i, point.x, point.y, 0 );
  }

  position.needsUpdate = true;

  if (scene.getObjectByName(curveMesh.name)){
    scene.remove(scene.getObjectByName(curveMesh.name))
  }

  scene.add(curveMesh)
}

function handleMouseMove(e){
  var mouse = new THREE.Vector2();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera( mouse.clone(), camera );

  var int = raycaster.intersectObject(plane);
  renderPoint(int[0].point, 'pointer', 'blue', 0.1);

  onMove(int[0].point);
}

function handleMouseDown(e){
  console.log('click')
  if (e.which === 1) {
    var mouse = new THREE.Vector2();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera( mouse.clone(), camera );

    var int = raycaster.intersectObject(plane);
    renderPoint(int[0].point, 'pointer', 'red', 0.1);

    onClick(int[0].point);
  }
  else if (e.which === 3) {
    closeCurve(renderer);
  }
}

function handleKeyDown(e){
  if (e.key == "Shift"){
    c1 = !c1;
    console.log('keydown', c1)
  }
}

function onMove(p){
  if (curves.length === 0 && !initialPoint) {
    // console.log('first point')
  }
  else if (curves.length === 0 && !secondPoint) {
    // console.log('second point')
  }
  else if (isVertex) {
    // console.log('ADD VERTEX')
    addVertex(p, false)
  }
  else {
    // console.log('ADD CTRL P')
    updateHandle(3, p);
    addCtrlPoint(p, false)
  }
}

function onClick(p){
  if (curves.length === 0 && !initialPoint) {
    initialPoint = p.clone();
    renderPoint(initialPoint, 'initialPoint', 'green', 0.1);
    updateHandle(0, p);
  }
  else if (curves.length === 0 && !secondPoint) {
    secondPoint = p.clone();
    renderPoint(secondPoint, 'secondPoint', 'blue', 0.1);
    updateHandle(1, p);
  }
  else if (isVertex) {
    if (c1) {
      isVertex = false;
    } // important before addVertex (correct rendering)

    renderPoint(p, 'vertex' + curves.length, 'green', 0.1);
    updateHandle(2, p);
    addVertex(p, true)
  }
  else {
    isVertex = true;

    renderPoint(p, 'ctrl' + curves.length + '_' + Math.random().toFixed(2), 'blue', 0.1);
    updateHandle(3, p);
    secondPoint = p.clone();
    addCtrlPoint(p, false)
  }
}

function addVertex(p, freeze){
  var last_curve = curves.slice().pop();
  var p1 = last_curve ? last_curve.v3 : initialPoint;
  var p4 = p.clone();

  if (c1) {
    var p2 = secondPoint ? secondPoint : new THREE.Vector3().subVectors(last_curve.v3, last_curve.v2).add(last_curve.v3);
    var p3 = p4.clone();
  }
  else {
    var p2 = new THREE.Vector3().lerpVectors(p1,p4,0.3);
    var p3 = new THREE.Vector3().lerpVectors(p1,p4,0.7);
    secondPoint = p2.clone();
  }

  var points = [p1, p2, p3, p4];
  multipointBezier(points, freeze)
}

function closeCurve(renderer){
  var last_curve  = curves[curves.length-1];
  var first_curve = curves[0];

  var p1 = last_curve.v3.clone();
  var p4 = first_curve.v0.clone();

  if (c1) {
    var p2 = new THREE.Vector3().subVectors(last_curve.v3, last_curve.v2).add(last_curve.v3);
    var p3 = new THREE.Vector3().subVectors(first_curve.v0, first_curve.v1).add(first_curve.v0);

    var points = [p1, p2, p3, p4];
    multipointBezier(points, true)
  }

  var displayed = scene.getObjectByName('handle');
  if (displayed){
    var last_p = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({color: 'blue'})
    );
    last_p.position.copy(p4);
    var first_p = last_p.clone();
    first_p.position.copy(p1);
    scene.add(first_p)
    scene.add(last_p)
    scene.remove(scene.getObjectByName('handle'));
  }

  endListeners(renderer)
}

function addCtrlPoint(p, freeze){
  var last_curve = curves[curves.length-1];
  var p1 = last_curve.v0.clone();
  var p4 = last_curve.v3.clone();

  if (c1) {
    var p2 = last_curve.v1.clone();
    var p3 = new THREE.Vector3().subVectors(last_curve.v3, p).add(last_curve.v3);

    var points = [p1, p2, p3, p4];
    multipointBezier(points, freeze)
  }
  else {
    var p2 = new THREE.Vector3().lerpVectors(p1,p4,0.3);
    var p3 = new THREE.Vector3().lerpVectors(p1,p4,0.7);
  }
}

function renderPoint(point, tag, color, radius_) {
  var mesh     = scene.getObjectByName(tag);
  if (mesh){
    scene.remove(mesh);
  }
  var radius = radius_ ? radius_ : 0.5;
  var geometry = new THREE.SphereGeometry(radius,8,8);
  var hex    = color ? color : 0xff0000;
  var material = new THREE.MeshBasicMaterial({depthTest:true, color: hex});
  mesh = new THREE.Mesh(geometry, material);
  mesh.name = tag;
  mesh.position.copy(point);
  // scene.add(mesh);

  // var div = document.createElement( 'div' );
  // div.className = 'label';
  // div.textContent = tag;
  // div.style.marginTop = '-1em';
  // var label = new THREE.CSS2DObject( div );
  // label.position.set( point.x +1, point.y +1 , point.z +1);
  // earth.add( label );

}

function updateHandle(caseId, p){
  var curve = curves[curves.length-1];
  if (!curve){
    return;
  }

  if (isVertex) {
    // remove handle ?
    // if (scene.getObjectByName('handle')){
    //   scene.remove(scene.getObjectByName('handle'))
    // }
  }
  else {
    var pA = curve.v2.clone();
    var pB = curve.v3.clone();
    var pC = p.clone();

    var handle = new THREE.Object3D();
    var hA = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({color: 'blue'})
    );
    var hB = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({color: 'green'})
    );
    var hC = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({color: 'blue'})
    );
    var lineAB = new THREE.Line(
      new THREE.Geometry().setFromPoints([pA, pB]),
      new THREE.LineBasicMaterial({color: 'blue'})
    )
    var lineBC = new THREE.Line(
      new THREE.Geometry().setFromPoints([pB, pC]),
      new THREE.LineBasicMaterial({color: 'blue'})
    )

    hA.position.copy(pA)
    hB.position.copy(pB)
    hC.position.copy(pC)

    hA.name = 'hA';
    hB.name = 'hB';
    hC.name = 'hC';

    handle.add(hA);
    handle.add(hB);
    handle.add(hC);
    handle.add(lineAB);
    handle.add(lineBC);

    handle.name = 'handle';

    var displayed = scene.getObjectByName('handle');

    if (displayed){
      var center = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({color: 'blue'})
      );
      center.position.copy(handle.getObjectByName('hB').position);
      scene.add(center)
      scene.remove(scene.getObjectByName('handle'));
    }

    scene.add(handle);

  }
}

function initListeners(camera, renderer){
  renderer.domElement.addEventListener('mousemove', handleMouseMove)
  renderer.domElement.addEventListener('mousedown', handleMouseDown)
  window.addEventListener("keydown", handleKeyDown);
}

function endListeners(renderer) {
  renderer.domElement.removeEventListener('mousemove', handleMouseMove);
  renderer.domElement.removeEventListener('mousedown', handleMouseDown);
  renderer.domElement.removeEventListener('keydown', handleKeyDown);
}

function init(camera_, renderer_, scene_) {
  scene    = scene_;
  renderer = renderer_;
  camera   = camera_;

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100,100),
    new THREE.MeshBasicMaterial({color:'lightblue', opacity: 0.2, transparent:true})
  )
  scene.add(plane);

  initListeners(camera, renderer);
}

exports.init = init;
