const _ = require('underscore')

function newGraph(divName, data){
  // SCENE
  var container = document.getElementById(divName);
  var renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xffffff, 1.0);
  // renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  var camera = new THREE.PerspectiveCamera( 45, 800 / 600, 0.1, 1000);
  // var camera = new THREE.OrthograpicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000);
  camera.position.x = 250;
  camera.position.y = 250;
  camera.position.z = 250;
  var scene  = new THREE.Scene();
  var ah = new THREE.AxisHelper(200)
  var gh = new THREE.GridHelper(300, 60)
  gh.rotateZ(Math.PI)
  scene.add(ah)
  // scene.add(gh)
  var ambientLight = new THREE.AmbientLight( 0xaaaaaa, 0.7 );
  scene.add( ambientLight );
  // var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
  // camera.add( pointLight );
  scene.add( camera );

  console.log(scene)
  var controls = new THREE.TrackballControls(camera, renderer.domElement);

  // DATA
  var trace = data[0];
  var verts = [];

  for (var n=0; n<trace.x.length; n++){
    verts.push(new THREE.Vector3(trace.x[n], trace.y[n], trace.z[n]));
  }

  var pointGeometry = new THREE.BufferGeometry().setFromPoints(verts);
  pointGeometry.computeBoundingBox();
  controls.target = pointGeometry.boundingBox.getCenter();
  camera.position.x = controls.target.x -100
  camera.position.y = controls.target.y
  camera.position.z = controls.target.z
  var pointMaterial = new THREE.PointsMaterial({
    size : 1.5,
    sizeAttenuation : false,
    color : 'red'
  });
  var cloud = new THREE.Points(pointGeometry, pointMaterial);
  ah.position.copy(pointGeometry.boundingBox.min);
  gh.rotateX(Math.PI)
  gh.position.copy(pointGeometry.boundingBox.min);

  scene.add(cloud);

  var ball = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial())
  scene.add(ball);

  renderer.render(scene, camera);

  function animate() {
    requestAnimationFrame(animate);
  	controls.update();
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  animate();
}

exports.newGraph = newGraph;
