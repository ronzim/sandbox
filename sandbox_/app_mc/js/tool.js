
var rootPath = '../';

var path = require('path');
var fs   = require('fs-extra');
var _    = require('underscore');
var dat  = require( path.join( rootPath, 'lib', 'dat.gui.min.js'));

var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));
var STLLoader         = require( path.join( rootPath, 'lib', 'stl-loader.js'))(THREE);
var mc = require('../marchingCubes.js');

var AMI                = require(path.join(rootPath,'ami', 'ami.js'));
var LoadersVolume      = AMI.VolumeLoader;
var HelpersBoundingBox = AMI.BoundingBoxHelper;
var HelpersLocalizer   = AMI.LocalizerHelper;
var HelpersStack       = AMI.StackHelper;
var loader = new LoadersVolume();
var seriesContainer = [];


//================================//
//====== SCENE SETUP =============//
//================================//

var init = function() {

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer( { antialias: true } );
document.getElementById("canvas-container").appendChild(renderer.domElement)
// renderer.setClearColor( 0xAAAAAA, 1 );
renderer.setClearColor( 0x000000, 1 );
renderer.setSize(512,512);
renderer.localClippingEnabled = true;

var control = new THREE.TrackballControls( camera, renderer.domElement );

var light = new THREE.AmbientLight( 0xAAAAAA, 1 ); // soft white light
light.name = 'ambientLight';
scene.add( light );
var pointLight = new THREE.PointLight( 0xffffff, 1.0, 0 );
pointLight.name = 'pointLight';
pointLight.position.set (0,10,10);
scene.add( pointLight );
// var pointLight2 = new THREE.PointLight( 0xffffff, 0.8, 0 );
// pointLight2.position.set (0,-10,10);
// scene.add( pointLight2 );
// var pointLight3 = new THREE.PointLight( 0xffffff, 0.8, 0 );
// pointLight3.position.set (100,100,0);
// scene.add( pointLight3 );

camera.position.z = 200;
camera.position.y = -100;
camera.position.x = 0;

camera.up = new THREE.Vector3(0,0,1);
camera.lookAt(100,100,200);

var gridPlane = new THREE.GridHelper(500,50);
var gridPlaneAxis = new THREE.AxisHelper(300);
gridPlane.rotateX(Math.PI/2);
// gridPlaneAxis.rotateX(Math.PI/2);
scene.add (gridPlane);
scene.add (gridPlaneAxis);

console.log('LOADING...');

//================================//
//====== SCENE CONTENT ===========//
//================================//

  var fileList = [];
  var folder   = '/Users/orobix/Desktop/testAMI/amiPanorexEx/CT_sample_panorex/';
  // var folder   = '/Users/orobix/Desktop/DICOM/DICOM bug 2.24/DICOM';

  // read file in the directory
  fs.readdirSync(folder).forEach(file => {
    if (file != '.DS_Store'){
      fileList.push(file);
    }
  });

  initializeData(fileList);

  function initializeData(_files) {
    // init threeJS

    var files = [];
    _.each(_files,function(v) {
      files.push( path.join(folder, v ));
    });

    // load sequence for each file
    // instantiate the loader
    // it loads and parses the dicom image

    var loader = new LoadersVolume();
    loader.load(files)
    .then(function() {

      // console.profile('then');
      var series = loader.data[0].mergeSeries(loader.data)[0];
      loader.free();
      loader = null;
      // get first stack from series
      var stack = series.stack[0];
      stack.prepare();
      stack.pack();

      // center 3d camera/control on the stack
      var centerLPS = stack.worldCenter();
      camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
      camera.updateProjectionMatrix();
      control.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

      // bounding box
      var boxHelper = new HelpersBoundingBox(stack);
      scene.add(boxHelper);

      stackHelper = new HelpersStack(stack);
      stackHelper.bbox.visible = true;
      console.log(stackHelper);
      // scene.add(stackHelper);

      console.log('CREATING GRID...');
      mc.createGrid(stack);
      console.log(stack);

      var initLevel1 = 0.0;
      var initOffset = 1.0;
      var initLutMin = -1024.0;
      var initLutMax = 1105.0;
      var initOpacity = 1.0;
      var initShininess = 0.5;
      var initMetalness = 0.5;
      var initRoughness = 0.6;
      var initReflectivity = 0.5;
      var initAmbientLight = 2.0;
      var initPointLight = 0.3;

      // DEV
      var hist = require('./hist.js');
      hist.compute(stack, function(level){
        extractIsoSurface(scene, stack, level, initOffset, initOpacity, "mc");
      });

      // DOUBLE ISOSURFACE
      // extractIsoSurface(scene, stack, initLevel2, 4.0, "green");
      // console.profileEnd('then');

      //GUI

      gui = new dat.GUI();
      parameters = {
                      level1: initLevel1,
                      offset: initOffset,
                      lutMin: initLutMin,
                      lutMax: initLutMax,
                      opacity: initOpacity,
                      metalness: initMetalness,
                      roughness: initRoughness,
                      reflectivity: initReflectivity,
                      ambientLight: initAmbientLight,
                      pointLight: initPointLight,
                      shade: false
                    };

      var aGUI = gui.add( parameters, 'level1' ).min(-2000).max(5000).step(10).name("level1").listen();
      aGUI.onChange(function(value){
          parameters.level1 = value;
          // console.profile('mc');
          extractIsoSurface(scene, stack, parameters.level1, parameters.offset, parameters.opacity, "mc");
          // console.profileEnd('mc');
        });

      var bGUI = gui.add( parameters, 'offset' ).min(1.0).max(16.0).step(1).name("offset").listen();
      bGUI.onChange(function(value){
          parameters.offset = value;
          // console.profile('mc');
          extractIsoSurface(scene, stack, parameters.level1, parameters.offset, parameters.opacity, "mc");
          // console.profileEnd('mc');
        });

      var cGUI = gui.add( parameters, 'lutMin' ).min(-2000.0).max(4000.0).step(1).name("lut min").listen();
      cGUI.onChange(function(value){
          parameters.lutMin = value;
          // console.profile('lut');
          updateLut(parameters.lutMin, parameters.lutMax);
          // console.profile('lut');
        });

      var dGUI = gui.add( parameters, 'lutMax' ).min(-2000.0).max(4000.0).step(1).name("lut max").listen();
      dGUI.onChange(function(value){
          parameters.lutMax = value;
          // console.profile('lut');
          updateLut(parameters.lutMin, parameters.lutMax);
          // console.profile('lut');
        });

      var eGUI = gui.add( parameters, 'opacity' ).min(0.0).max(1.0).step(0.1).name("opacity").listen();
      eGUI.onChange(function(value){
          parameters.opacity = value;
          // console.profile('lut');
          scene.getObjectByName('isoSurface_mc').material.opacity = parameters.opacity;
          // console.profile('lut');
        });

      var fGUI = gui.add( parameters, 'roughness' ).min(0.0).max(1.0).step(0.1).name("roughness").listen();
      fGUI.onChange(function(value){
          parameters.roughness = value;
          // console.profile('lut');
          scene.getObjectByName('isoSurface_mc').material.roughness = parameters.roughness;
          // console.profile('lut');
        });

      var gGUI = gui.add( parameters, 'reflectivity' ).min(0.0).max(1.0).step(0.1).name("reflectivity").listen();
      gGUI.onChange(function(value){
          parameters.reflectivity = value;
          // console.log('reflectivity', value);
          scene.getObjectByName('isoSurface_mc').material.reflectivity = parameters.reflectivity;
          // console.profile('lut');
        });

      var hGUI = gui.add( parameters, 'metalness' ).min(0.0).max(1.0).step(0.1).name("metalness").listen();
      hGUI.onChange(function(value){
          parameters.metalness = value;
          // console.profile('lut');
          scene.getObjectByName('isoSurface_mc').material.metalness = parameters.metalness;
          // console.profile('lut');
        });

      var l1GUI = gui.add( parameters, 'ambientLight' ).min(0).max(2).step(0.05).name("ambientLight").listen();
      l1GUI.onChange(function(value){
          parameters.ambientLight = value;
          scene.getObjectByName('ambientLight').intensity = parameters.ambientLight;
        });

      var l2GUI = gui.add( parameters, 'pointLight' ).min(0).max(1).step(0.05).name("pointLight").listen();
      l2GUI.onChange(function(value){
          parameters.pointLight = value;
          scene.getObjectByName('pointLight').intensity = parameters.pointLight;
        });

      var shadeGUI = gui.add( parameters, 'shade' ).name("shade").listen();
      shadeGUI.onChange(function(value){
          console.log(value)
          parameters.shade = value;
          scene.getObjectByName('isoSurface_mc').material.flatShading = parameters.shade;
          scene.getObjectByName('isoSurface_mc').material.needsUpdate = true;
        });

    });
  }

  function extractIsoSurface(scene, stack, level, offset, opacity, tag){

    var obj = scene.getObjectByName('isoSurface_' + tag);

    if (!obj){

      var geometry = mc.marchingCubes(stack, level, offset);
      // var geometry = new THREE.TorusKnotBufferGeometry( 10, 3, 100, 16 );
      // var geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
      // geometry.computeVertexNormals();
      // geometry.normalsNeedUpdate = true;

      var opValue  = tag == "mc" ? 0.6 : 0.8;
      var trValue  = tag == "mc" ? true : false;

      // var colorMaterial = new THREE.MeshPhongMaterial({
      // var colorMaterial = new THREE.MeshStandardMaterial({
      var colorMaterial = new THREE.MeshPhysicalMaterial({
      // var colorMaterial = new THREE.MeshToonMaterial({
        // color        : new THREE.Color('blue'),
        // emissive     : new THREE.Color(0x333333),
        // emissiveIntensity : 0.5,
        skinning     : 0.5,
        metalness    : 0.5,
        specular     : new THREE.Color(0xffffff),
        opacity      : opacity,
        transparent  : true,
        // shininess    : 0.5,
        roughness    : 0.6,
        flatShading  : false,
        side         : THREE.DoubleSide, // or THREE.FrontSide,
        wireframe    : false,
        vertexColors : THREE.VertexColors,
        fog          : true,
        reflectivity : 0.5
      });

      // POINTS
      // var points = new THREE.Points();
      // points.geometry.addAttribute( 'position', geometry.getAttribute('position') );
      // console.log(points)
      // scene.add(points);

      mesh = new THREE.Mesh( geometry, colorMaterial );
      mesh.name = 'isoSurface_' + tag;
      scene.add(mesh);

      geometry.computeBoundingBox();
      var focus = geometry.boundingBox.getCenter();
      camera.position.set(focus.x, focus.y -180, focus.z +80);
      camera.lookAt(focus.x, focus.y, focus.z);

      console.log(scene);
      console.log('LOADED!');
    }
    else{
      var geometry = mc.marchingCubes(stack, level, offset);
      obj.geometry = geometry;
      obj.geometry.attributes.position.needsUpdate = true;
    }

  }

function updateLut(min, max){
  geometry = scene.getObjectByName('isoSurface_mc').geometry;
  mc.applyLut(geometry, geometry.originalColors, min, max);
}

function computeBumpMap(geometry){

  // var size = width * height;
  var size = geometry.attributes.position.array.length/3;
  var data = new Uint8Array( 3 * size );
  var color = {r:1, g:1, b:1};
  var r = Math.floor( color.r * 255 );
  var g = Math.floor( color.g * 255 );
  var b = Math.floor( color.b * 255 );

  for ( var i = 0; i < size; i ++ ) {
  	var stride = i * 3;
  	data[ stride ] = r;
  	data[ stride + 1 ] = g;
  	data[ stride + 2 ] = b;
  }

  var texture = new THREE.DataTexture( data, 3, size, THREE.RGBFormat );
  texture.needsUpdate = true

  console.log(texture);

  var smap =  THREE.ImageUtils.loadTexture("https://s3-us-west-2.amazonaws.com/s.cdpn.io/33170/specular_map.jpg", {}, function(){});

  return smap;
}

//================================//
//========== LISTENER ============//
//================================//

window.addEventListener('keydown', function(event) {
  console.log(scene, camera);
});


//================================//
//=======RENDER FUNCTION==========//
//================================//

  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);
  	renderer.render( scene, camera );
  }

  render();
};

exports.render = init;
