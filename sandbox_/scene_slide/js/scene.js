var path = require('path');
var rpc  = require("./rpc");
var uuid = require("uuid");
var fs   = require('fs-extra');
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));

var initScene = function() {

  //================================//
  //====== SCENE SETUP =============//
  //================================//

  var renderer = new THREE.WebGLRenderer( { antialias: true } );
  document.getElementById("canvas-container").appendChild(renderer.domElement)
  renderer.setClearColor( 0xAAAAAA, 1 );
  renderer.setSize(1600,900);

  var scene = new THREE.Scene();

  // var frustumSize = 200;
  // var aspect = window.innerWidth / window.innerHeight;
  // var camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.001, 1000 );

  var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 50;
  camera.position.y = 50;
  camera.position.x = 50;
  camera.lookAt(0,0,0);

  var control = new THREE.TrackballControls( camera, renderer.domElement );

  var light = new THREE.AmbientLight( 0x555555, 1 );
  scene.add( light );
  var directionalLight = new THREE.PointLight( 0xffffff, 1 );
  directionalLight.position.set (0,50,50);
  scene.add( directionalLight );

  var gridPlane = new THREE.GridHelper(300,50);
  var gridPlaneAxis = new THREE.AxisHelper(20);
  scene.add (gridPlane);
  scene.add (gridPlaneAxis);

  //================================//
  //====== SCENE CONTENT ===========//
  //================================//

  var baseName = 'slide_';
  var numberOfSlides = 20;
  var slides = new Array(numberOfSlides).fill(0).map((a,n) => baseName+(n+1));
  console.log(slides)

  // create a circle and sample to obtain plane positions
  var geometry = new THREE.CircleGeometry( 50, numberOfSlides );
  var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.4, wireframe:true } );
  var circle = new THREE.Mesh( geometry, material );
  circle.geometry.rotateX(-Math.PI/2);
  var slidePos = circle.geometry.vertices;
  scene.add( circle );

  circle.geometry.vertices.forEach(function(v){
    var ball = new THREE.Mesh(new THREE.SphereGeometry( 0.3, 8, 8), new THREE.MeshBasicMaterial( { color: 0x330000, transparent: true, opacity: 0.4 } ))
    ball.position.copy(v);
    scene.add(ball)
  })

  // add slides
  slides.forEach((s,i) => addSlide(s,i));

  function addSlide(name, i){
    console.log('addSlide', name, i)
    var planeDim = new THREE.Vector3(16, 9, 0);

    if (!fs.existsSync('./slides/'+name+'.jpg')){
      console.warn('slide not found', name);
      return;
    }

    var img = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map:  THREE.ImageUtils.loadTexture('./slides/'+name+'.jpg'),
      // wireframe: true,
      transparent:true,
      opacity:0.5
    });
    img.map.anisotropy = renderer.getMaxAnisotropy();
    img.map.wrapS = THREE.RepeatWrapping;
    img.map.wrapT = THREE.RepeatWrapping;
    img.map.magFilter = THREE.LinearFilter;
    img.map.minFilter = THREE.LinearFilter;
    img.map.needsUpdate = true; //ADDED
    console.log(img.map)

    // plane
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(planeDim.x, planeDim.y, planeDim.x, planeDim.y),img);
    plane.name = name;
    plane.position.copy(slidePos[i+1]);
    scene.add(plane);
  }


  //================================//
  //======= EVENTS =================//
  //================================//

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var selected = null;
  var cameraTargetPosition = null;
  var controlsTargetPosition = null;
  var fixedView = false;

  function onmousemove( event ) {
    selected = null;

    scene.children.forEach(function(child){
      if (child.name.includes('slide')){
        // child.material.color = new THREE.Color('white');
        child.material.transparent = true;
        child.material.opacity = 0.5;
      }
    })

  	// calculate mouse position in normalized device coordinates
  	// (-1 to +1) for both components

  	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects( scene.children );

    intersects.forEach(function(int){
      if (int.object.name.includes('slide')){
        selected = int.object;
        // int.object.material.color = new THREE.Color('yellow');
        int.object.material.transparent = false;
      }
    })

  }

  function onmouseup( event ){
    console.log('onmouseup', selected);
    if (selected && event.which === 1){
      // camera.up = new THREE.Vector3(0,1,0);
      // camera.position.set(selected.position.x, selected.position.y, selected.position.z+7.5)
      // control.target.copy(selected.position);
      // camera.updateMatrix()
      cameraTargetPosition = new THREE.Vector3(selected.position.x, selected.position.y, selected.position.z+7.5);
      controlsTargetPosition = selected.position;
      fixedViewOn();
    }
    else if (event.which === 3){
      // camera.up = new THREE.Vector3(0,1,0);
      // camera.position.set(50,50,50)
      // control.target.set(0,0,0);
      // camera.updateMatrix()
      fixedViewOff();
    }
  }

  function onkeydown(event){
    console.log(event)
    if (fixedView && event.key == 'ArrowRight'){
      var currentSlideNumber = selected.name.split('_')[1];
      moveToSlide(++currentSlideNumber);
    }
    else if (fixedView && event.key == 'ArrowLeft'){
      var currentSlideNumber = selected.name.split('_')[1];
      moveToSlide(--currentSlideNumber);
    }
  }

  document.onmousemove = onmousemove;
  document.onmouseup   = onmouseup;
  document.onkeydown   = onkeydown;

  function moveToSlide(slideN){
    console.log(slideN)
    var next_selected = scene.getObjectByName('slide_'+(slideN));
    if (next_selected){
      fixedViewOff()
      selected = next_selected;
      fixedViewOn()
      setTimeout(function(){
        cameraTargetPosition = new THREE.Vector3(selected.position.x, selected.position.y, selected.position.z+7.5);
        controlsTargetPosition = selected.position;
      }, 0)
    }
  }

  function fixedViewOn(){
    fixedView = true;
    document.onmousemove = null;
    scene.children.forEach(function(child){
      if (child.name.includes('slide') && child.name !== selected.name){
        // child.material.color = new THREE.Color('white');
        child.visible = false;
      }
    })
    selected.material.transparent = false;
    console.log(selected.material)
  }

  function fixedViewOff(){
    fixedView = false;
    document.onmousemove = onmousemove;
    scene.children.forEach(function(child){
      if (child.name.includes('slide')){
        // child.material.color = new THREE.Color('white');
        child.visible = true;
        child.material.transparent = true;
      }
    })
    cameraTargetPosition = new THREE.Vector3(50,50,50);
    controlsTargetPosition = new THREE.Vector3(0,0,0);
  }

  function moveCamera(){
    var old_pos    = camera.position;
    var old_target = control.target;

    if (cameraTargetPosition){
      camera.position.lerp(cameraTargetPosition, 0.1);
      control.target.lerp(controlsTargetPosition, 0.1);
    }

  }


  //================================//
  //=======RENDER FUNCTION==========//
  //================================//

  var theta = 0;
  var radius = 1.0;

  function render() {
  	requestAnimationFrame( animate );
    control.update(0.5);
  	renderer.render( scene, camera );
  }

  function animate(){
    moveCamera()
    render();
  }

  render()

};

exports.render = initScene;
