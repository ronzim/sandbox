var path = require('path');
var rpc  = require("./rpc");
var uuid = require("uuid");
var fs   = require('fs-extra');
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));

const dev = false;

var initScene = function() {
  var video = document.createElement('video');
  video.src = "./Video.mp4";
  video.load();
  //make your video canvas
  var videocanvas = document.createElement('canvas');
  var videocanvasctx = videocanvas.getContext('2d');

  //================================//
  //====== SCENE SETUP =============//
  //================================//

  var cameraOriginalPosition = new THREE.Vector3(0, 20, 90);

  var renderer = new THREE.WebGLRenderer( { antialias: true } );
  document.getElementById("canvas-container").appendChild(renderer.domElement)
  renderer.setClearColor( 0x112233, 1 );
  // renderer.setClearColor( 0x469aaa, 1 );
  renderer.setSize(1600,900);

  var scene = new THREE.Scene();

  // var frustumSize = 200;
  // var aspect = window.innerWidth / window.innerHeight;
  // var camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.001, 1000 );

  var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.copy(cameraOriginalPosition);
  camera.lookAt(0,0,0);

  var control = new THREE.TrackballControls( camera, renderer.domElement );

  var light = new THREE.AmbientLight( 0x555555, 1 );
  scene.add( light );
  var directionalLight = new THREE.PointLight( 0xffffff, 1 );
  directionalLight.position.set (0,50,50);
  scene.add( directionalLight );

  if (dev){
    var gridPlane = new THREE.GridHelper(300,50);
    var gridPlaneAxis = new THREE.AxisHelper(20);
    scene.add (gridPlane);
    scene.add (gridPlaneAxis);
  }

  //================================//
  //====== SCENE CONTENT ===========//
  //================================//

  var baseName = 'TavolaRotonda3D-';
  var numberOfSlides = 23;
  var slides = new Array(numberOfSlides).fill(0).map((a,n) => baseName+(n+1));
  console.log(slides)

  // create a circle and sample to obtain plane positions
  var geometry = new THREE.CircleGeometry( 50, numberOfSlides );
  var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.4, wireframe:true } );
  var circle = new THREE.Mesh( geometry, material );
  circle.geometry.rotateX(-Math.PI/2);
  circle.geometry.rotateY(-Math.PI/2);
  var slidePos = circle.geometry.vertices;

  if (dev) {
    scene.add( circle );

    circle.geometry.vertices.forEach(function(v,i){
      var color = i==1 ? 'red' : 'green'
      var ball = new THREE.Mesh(new THREE.SphereGeometry( 1, 8, 8), new THREE.MeshBasicMaterial( { color: color, transparent: true, opacity: 0.4 } ))
      ball.position.copy(v);
      scene.add(ball)
    })
  }

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
    // console.log(img.map)

    // if (i == 21){
    //     //set its size
    //     videocanvas.width = planeDim.x*100;
    //     videocanvas.height = planeDim.y*100;
    //
    //     //draw a black rectangle so that your spheres don't start out transparent
    //     videocanvasctx.fillStyle = "#000000";
    //     videocanvasctx.fillRect(0,0,planeDim.x*100,planeDim.y*100);
    //
    //     //add canvas to new texture
    //     var texture = new THREE.Texture(videocanvas);
    //
    //     img.map = texture;
    // }

    // plane
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(planeDim.x, planeDim.y, planeDim.x, planeDim.y),img);
    plane.name = name;
    plane.position.copy(slidePos[i+1]);
    scene.add(plane);
  }

  // title

  var title;
  var loader = new THREE.FontLoader();

  loader.load( './resources/optimer_regular.typeface.json', function ( font ) {

  	var geometry = new THREE.TextGeometry( '3D Visualization', {
  		font: font,
  		size: 5,
  		height: 3,
  		curveSegments: 15,
  		// bevelEnabled: true,
  		// bevelThickness: 10,
  		// bevelSize: 8,
  		// bevelSegments: 5
  	} );

    var titleMaterial = new THREE.MeshPhongMaterial({color: 'yellow'});
    title = new THREE.Mesh(geometry, titleMaterial);
    geometry.computeBoundingBox();
    var center = geometry.boundingBox.getCenter();
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-center.x,5,-center.z))
    scene.add(title);
  } );

  console.log(scene)


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
      if (child.name.includes(baseName)){
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

    var int = intersects.shift();
    if (int && int.object.name.includes(baseName)){
      selected = int.object;
      // int.object.material.color = new THREE.Color('yellow');
      int.object.material.transparent = false;
    }

    // intersects.forEach(function(int){
    //   if (int.object.name.includes('slide')){
    //     selected = int.object;
    //     // int.object.material.color = new THREE.Color('yellow');
    //     int.object.material.transparent = false;
    //   }
    // })

  }

  function onmouseup( event ){
    console.log('onmouseup', selected);
    if (selected && event.which === 1){
      if (selected.name.includes('22')){
        video.play()
      };
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
      var currentSlideNumber = selected.name.split('-')[1];
      moveToSlide(++currentSlideNumber);
    }
    else if (fixedView && event.key == 'ArrowLeft'){
      var currentSlideNumber = selected.name.split('-')[1];
      moveToSlide(--currentSlideNumber);
    }
  }

  document.onmousemove = onmousemove;
  document.onmouseup   = onmouseup;
  document.onkeydown   = onkeydown;

  function moveToSlide(slideN){
    console.log(slideN)
    var next_selected = scene.getObjectByName(baseName+(slideN));
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
      if (child.name.includes(baseName) && child.name !== selected.name){
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
      if (child.name.includes(baseName)){
        // child.material.color = new THREE.Color('white');
        child.visible = true;
        child.material.transparent = true;
      }
    })

    console.log('cameraTargetPosition', cameraTargetPosition)
    cameraTargetPosition   = new THREE.Vector3().copy(cameraOriginalPosition);
    controlsTargetPosition = new THREE.Vector3(0,0,0);

    setTimeout(function(){
      console.log('cameraTargetPosition', null)
      cameraTargetPosition = null;
      controlsTargetPosition = null;
    }, 1000);
  }

  function moveCamera(){
    var old_pos    = camera.position;
    var old_target = control.target;

    if (cameraTargetPosition){
      console.log('cameraTargetPosition', cameraTargetPosition)
      camera.up = new THREE.Vector3(0,1,0);
      camera.position.lerp(cameraTargetPosition, 0.1);
      control.target.lerp(controlsTargetPosition, 0.1);
    }
  }

  function rotateTitle(){
    if (title){
      title.matrixAutoUpdate = false;
      title.position.set(0,0,0);
      title.rotateY(0.01);
      // title.updateMatrix();
      var center = title.geometry.boundingBox.getCenter();
      title.position.set(-center.x,20,-center.z);
      // title.updateMatrix();
      title.matrixAutoUpdate = true;
    }
  }


  //================================//
  //=======RENDER FUNCTION==========//
  //================================//

  var theta = 0;
  var radius = 1.0;

  function render() {
    //check for vid data
    // if(video.readyState === video.HAVE_ENOUGH_DATA){
    //   //draw video to canvas starting from upper left corner
    //   videocanvasctx.drawImage(video, 0, 0);
    //   //tell texture object it needs to be updated
    //   if (scene.getObjectByName(baseName+'22').material){
    //     scene.getObjectByName(baseName+'22').material.map.needsUpdate = true;
    //   }
    // }

  	requestAnimationFrame( animate );
    control.update(0.5);
  	renderer.render( scene, camera );
  }

  function animate(){
    rotateTitle();
    moveCamera();
    render();
  }

  render()

};

exports.render = initScene;
