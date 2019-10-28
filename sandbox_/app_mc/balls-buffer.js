var path = require('path');
var rpc  = require("./rpc");
var _    = require("underscore");
var uuid = require("uuid");
var math = require("mathjs");

var tools = require("./imgCadTools.js");
var cad   = require("../js/cadTools.js");

/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
*/

// The Marching Cubes Algorithm draws an isosurface of a given value.
// To use this for a Metaballs simulation, we need to:
// (1) Initialize the domain - create a grid of size*size*size points in space
// (2) Initialize the range  - a set of values, corresponding to each of the points, to zero.
// (3) Add 1 to values array for points on boundary of the sphere;
//       values should decrease to zero quickly for points away from sphere boundary.
// (4) Repeat step (3) as desired
// (5) Implement Marching Cubes algorithm with isovalue slightly less than 1.

// MAIN

// standard global variables for Three.js
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(-9999, -9999);
var old_pos = new THREE.Vector2(-9999, -9999);
// var mesh, points, values;
// var mesh;
var meshes = [];
var funs = {};
var pointsArray = [];
var curve;


var isMovingOn   = false;
var isCadOn      = true;
var isDragging   = false;
var isPosChanged = false;
var isLoaded     = false;
var isPicking    = false;

var params = {
	brush : "gaussian",
	a : 0.1,
	b : 0.1,
	sign : 1
};



// DEV scaling problem
const K = 1;

init();
animate();

// FUNCTIONS
function init()
{
	initScene();

  // add more than one grid

	var grid = tools.createGrid(10,10,10, new THREE.Vector3(0,0,0), 100); // this will be done externally
	points = grid.points;
	values = grid.values;
	scene.add( new THREE.AxisHelper(100) );
	tools.resetValues(values);

	// isolevel = 0.5;
	var geometry = tools.marchingCubes( points, values, 0.5 );
	geometry.addAttribute( 'values', new THREE.BufferAttribute( values, 1 ) );
	geometry.addAttribute( 'grid', new THREE.BufferAttribute( points, 3 ) );
	geometry.level = 0.5;

	var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0xffffff, side:THREE.DoubleSide, wireframe: false} );
	mesh = new THREE.Mesh( geometry, colorMaterial );
	mesh.name = 'balls';
	scene.add(mesh);
	meshes.push(mesh);
	console.log(scene);

	points = values = [];

	function applyModelCreation(name){
		var model  = scene.getObjectByName(name);
		var level  = model.geometry.level;
		var data   = model.geometry.data;
		var points = model.geometry.getAttribute('grid').array;
		var values = model.geometry.getAttribute('values').array;

		var newGrid = tools.createModel(model, params.a, params.b);

		// scene.remove(model);
		var newGeometry = tools.marchingCubes( newGrid.points, newGrid.values, model.geometry.level );
		var material = new THREE.MeshLambertMaterial({side:THREE.DoubleSide, color: 'blue', transparent:true, opacity: 0.6});
		mesh = new THREE.Mesh( newGeometry, material );
		mesh.name = name + "_";
		mesh.geometry.level = level;
		mesh.geometry.data  = data;
		scene.add(mesh);
	}

	// GUI for experimenting with parameters

	gui = new dat.GUI();
	this.parameters = {
											a: 0.1,
											b: 0.1,
											sign: 1,
										 	d: function(){
												loadSurface("/Users/orobix/Desktop/testFunctor/sphere.stl");
												// loadSurface("/Users/orobix/Desktop/testFunctor/cube.stl");
											},
											e: function(){
												mesh1 = scene.getObjectByName("/Users/orobix/Desktop/testFunctor/moncone.stl");
												mesh2 = scene.getObjectByName("/Users/orobix/Desktop/testFunctor/cube.stl");
												var values1 = mesh1.geometry.getAttribute('values').array;
												var values2 = mesh2.geometry.getAttribute('values').array;
												var newGrid;
												if (this.brush == "sub") {
													newGrid = tools.subVolume(mesh1.geometry.data, mesh2.geometry.data, values1, values2, true);
												}
												else {
													newGrid = tools.addVolume(mesh1.geometry.data, mesh2.geometry.data, values1, values2, false);
												}
												var newGeometry = tools.marchingCubes(newGrid.points, newGrid.values, mesh1.geometry.level);
												newGeometry.level = mesh1.geometry.level;
												newGeometry.data  = mesh1.geometry.data; //TODO update with real values
												var material = new THREE.MeshPhongMaterial({color: 'blue', side: THREE.DoubleSide, transparent: true, opacity: 0.6});
												var newMesh = new THREE.Mesh(newGeometry, material);
												scene.add(newMesh);
											},
											f: function(){
												isPicking = true;
												var modelName = "/Users/orobix/Desktop/testFunctor/sphere.stl";
												// tools.addGhostPlane(scene, modelName, 100);
												// cad.drawLine(scene, mouse, pointsArray);
												cad.drawSpline(scene, modelName, mouse, pointsArray, 0.5, applyModelCreation);
											},
											g: function(){
												isPicking = false;
												var model  = scene.getObjectByName("/Users/orobix/Desktop/testFunctor/moncone.stl");
												var level  = model.geometry.level;
												var data   = model.geometry.data;
												var points = model.geometry.getAttribute('grid').array;
												var values = model.geometry.getAttribute('values').array;
												// tools.cut(points, values, pointsArray, level, scene);
												tools.createModelSub(curve, model);
												scene.remove( model );
												var newGeometry = tools.marchingCubes( points, values, model.geometry.level );
												var material = new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
												mesh = new THREE.Mesh( newGeometry, material );
												mesh.name = "/Users/orobix/Desktop/testFunctor/moncone.stl";
												mesh.geometry.level = level;
												mesh.geometry.data  = data;
												scene.add( mesh );
											},
											p: function(){
												cad.getPointAndDirection(scene, mouse, function(center, dir, name){
													var model  = scene.getObjectByName(name);
													var level  = model.geometry.level;
													var data   = model.geometry.data;
													var points = model.geometry.getAttribute('grid').array;
													var values = model.geometry.getAttribute('values').array;

													var radius = 0.5;
													tools.createHole(points, values, center, dir, radius, level);

													scene.remove( model );
													var newGeometry = tools.marchingCubes( points, values, model.geometry.level );
													var material = new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
													mesh = new THREE.Mesh( newGeometry, material );
													mesh.name = name;
													mesh.geometry.level = level;
													mesh.geometry.data  = data;
													scene.add( mesh );
												});
											},
											q: function(){
												var name = "/Users/orobix/Desktop/testFunctor/sphere.stl";
												var radius = 0.2;
												cad.selectArea(scene, mouse, name, radius, applyModelCreation);
											},
											brush: "gaussian",
											n: true
										};

	var gGUI = gui.add( parameters, 'g' ).name("execute")
	var fGUI = gui.add( parameters, 'f' ).name("draw")
	var dGUI = gui.add( parameters, 'd' ).name("add models")
	var mGUI = gui.add( parameters, 'e' ).name("bool")
	var pGUI = gui.add( parameters, 'p' ).name("hole")
	var qGUI = gui.add( parameters, 'q' ).name("grow area")

	var nGUI = gui.add( parameters, 'n' ).name("toggle models").onChange(
		function(v){
			var mesh1 = scene.getObjectByName("/Users/orobix/Desktop/testFunctor/sphere.stl");
			// var mesh2 = scene.getObjectByName("/Users/orobix/Desktop/testFunctor/cube.stl");
			mesh1.visible = !mesh1.visible;
			// mesh2.visible = !mesh2.visible;
		}
	)

	var eGUI = gui.add( parameters, "brush", ["gaussian", "multiquadric", "inverseMultiquadric", "smooth", "add", "sub"]);
	eGUI.onChange(function(value){
		console.log(value);
		params.brush = value;
	})

	var aGUI = gui.add( parameters, 'a' ).min(-10.0).max(20.0).step(0.01).name("a").listen();
	aGUI.onChange(
		function(value)
		{
			params.a = value;
		}
	);

	var bGUI = gui.add( parameters, 'b' ).min(-10.0).max(1000.0).step(0.01).name("b").listen();
	bGUI.onChange(
		function(value)
		{
			params.b = value;
		}
	);

	var cGUI = gui.add( parameters, 'sign' ).name("switch sign");
	cGUI.onChange(
		function(value)
		{
			params.sign = value;
		}
	);

	// document.addEventListener( 'mousemove', onMouseMove, false );
}

function animate()
{
  requestAnimationFrame( animate );
	render();
	update();
}

function update()
{
	controls.update();
	stats.update();

}

function render()
{
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObject( scene.children[scene.children.length-1] );
	// if (intersects[0] && isDragging && isPosChanged) {

	// APPLY FILL SCRAPE ECC
	// if (intersects[0] && isDragging && !isPicking) {
	// 		var objName = intersects[0].object.name;
	// 		var mesh = scene.getObjectByName(objName);
	// 		var level = mesh.geometry.level;
	// 		var data = mesh.geometry.data;
	// 		var points = mesh.geometry.getAttribute('grid').array;
	// 		var values = mesh.geometry.getAttribute('values').array;
  //
	// 		if (params.brush == 'smooth'){
	// 			var dot = tools.toIjk([intersects[0].point.x, intersects[0].point.y, intersects[0].point.z], mesh.geometry.data);
	// 			// var val = tools.getValueFromIjk(values, dot, mesh.geometry.data.dimensions[0]);
	// 			console.log(intersects);
	// 			tools.smooth(dot, values);
	// 		}
	// 		else{
	// 			// this performs fill / scrape
	// 			funs[params.brush](points, values, intersects[0].point, -level);
	// 		}
  //
	// 		scene.remove( mesh );
  //
	// 		var newGeometry = tools.marchingCubes( points, values, mesh.geometry.level );
  //
	// 		var material = new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
	// 		mesh = new THREE.Mesh( newGeometry, material );
	// 		mesh.name = objName;
	// 		mesh.geometry.level = level;
	// 		mesh.geometry.data = data;
	// 		scene.add( mesh );
	// 		// points = values = [];
	// }
 	// ========================================================

	// else if (intersects[0] && isLoaded){
	// 	var objName = intersects[0].object.name;
	// 	var mesh = scene.getObjectByName(objName);
	// 	var level = mesh.geometry.level;
	// 	var data = mesh.geometry.data;
	// 	var points = mesh.geometry.getAttribute('grid').array;
	// 	var values = mesh.geometry.getAttribute('values').array;
	// 	var dot = toIjk([intersects[0].point.x, intersects[0].point.y, intersects[0].point.z], mesh.geometry.data);
	// 	var val = getValueFromIjk(values, dot, mesh.geometry.data.dimensions[0]);
	// 	console.log(val);
	// }

	renderer.render( scene, camera );
}

// METABALLS FUNCTIONS

funs.gaussian = function(points, values, center, level, radius){
	tools.addGaussian(points, values, center, level, radius);
};
funs.multiquadric = function(points, values, center, level, radius){
	tools.addMultiquadric(points, values, center, level, radius);
};
funs.inverseMultiquadric = function(points, values, center, level, radius){
	tools.addInverseMultiquadric(points, values, center, level, radius);
};
funs.smooth = function(dot,values){
	tools.smooth(dot,values);
};


function initScene(){
	// SCENE
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xa8c9ff);
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(10*K,5*K,10*K);
	camera.lookAt(scene.position);
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer();
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.enabled = isMovingOn;
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xff0000);
	light.position.set(50,0,0);
	scene.add(light);
	var light = new THREE.PointLight(0x00cc00);
	light.position.set(0,50,0);
	scene.add(light);
	var light = new THREE.PointLight(0x0000ff);
	light.position.set(0,0,50);
	scene.add(light);
	var light = new THREE.PointLight(0x333333);
	light.position.set(-50,-50,-50);
	scene.add(light);
	// var light = new THREE.PointLight(0x333333);
	// light.position.set(-10,10,10);
	// scene.add(light);
	var light = new THREE.AmbientLight(0x333333);
	scene.add(light);
	// DEV surface
	// face();
};

// ==========================================================
// GUI modes ================================================
// ==========================================================

var rotateModeOn = function(){
  controls.enabled = true;
  isMovingOn = true;
};

var cadModeOn = function(){
	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mouseup', onMouseUp, false );
  document.addEventListener( 'mousemove', onMouseMove, false );
	controls.enabled = false;
  isCadOn = true;
};

var rotateModeOff = function(){
  controls.enabled = false;
  isMovingOn = false;
};

var cadModeOff = function(){
	document.removeEventListener( 'mousedown', onMouseDown, false );
	document.removeEventListener( 'mouseup', onMouseUp, false );
  document.removeEventListener( 'mousemove', onMouseMove, false );
  isCadOn = false;
};

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	event.preventDefault();
	if (event.clientX != old_pos.x || event.clientY != old_pos.y){
		isPosChanged = true;
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		old_pos.x = event.clientX;
		old_pos.y = event.clientY;
	}
	else{
		isPosChanged = false;
	}
}

function onMouseUp(){
	isDragging = false;
}

function onMouseDown(){
	isDragging = true;
}

window.addEventListener('keydown', function(event) {

    switch (event.keyCode){
      // SHIFT
      case 16:
								cadModeOff();
                rotateModeOn();
                break;

      //P (for dev)
      case 80:  // console.log(activeObj, activeObj.children[0]);
    }

  });

  window.addEventListener('keyup', function(event) {

    switch (event.keyCode){
      // SHIFT
      case 16:
                rotateModeOff();
								cadModeOn();
								if (isPicking){
									isCadOn = false;
								}
                break;
			case 13:
								console.log(scene);
    }

  });

function loadSurface(file){
		console.time('loadSurface');
		console.time('functor');

		var msgData = {
		  'function'  : 'createVolume',
		  'parameters': {
		    'surf_path'     : file,
		    // 'surf_path'     : "/Users/orobix/Desktop/testFunctor/moncone.stl",
		    'surf_uri'      : uuid.v4(),
		    'img_path_out'  : "/Users/orobix/Desktop/outputImage.nrrd",
		    'img_uri_out'   : uuid.v4(),
				'pointsMmRatio' : 10.0,
		    'distance'      : 1.0
		  }
		};

		console.log(msgData);

		rpc.send( msgData, function( msg ) {
		  console.log(msg);
			console.timeEnd('functor');
		  // callback( msg );
			var bb = {
				min : {
					x: msg.data.origin[0],
					y: msg.data.origin[1],
					z: msg.data.origin[2]
				},
				max: {
					x: msg.data.origin[0] + msg.data.spacing[0] * msg.data.extent[1],
					y: msg.data.origin[1] + msg.data.spacing[1] * msg.data.extent[3],
					z: msg.data.origin[2] + msg.data.spacing[2] * msg.data.extent[5]
				},
				center:{},
				center1:{},
				center2:{},
				dimX:0,
				dimY:0,
				dimZ:0
			};
			bb.center = {
				x: bb.min.x + (bb.max.x - bb.min.x)/2,
				y: bb.min.y + (bb.max.y - bb.min.y)/2,
				z: bb.min.z + (bb.max.z - bb.min.z)/2
			}
			bb.dimX = bb.max.x - bb.min.x,
			bb.dimY = bb.max.y - bb.min.y,
			bb.dimZ = bb.max.z - bb.min.z

			// check max dim
			var dimension = bb.dimX > bb.dimY ? bb.dimX : bb.dimY;
			dimension = dimension > bb.dimZ ? dimension : bb.dimZ;
			var center = new THREE.Vector3(bb.center.x, bb.center.y, bb.center.z);
			var values = new Float32Array(msg.arrays.pointData$ImageScalars);
			var points = tools.createGrid(bb.dimX, bb.dimY, bb.dimZ, center, msg.data.dimensions[0]).points;
			var level = 25;

			var geometry = tools.marchingCubes( points, values, level, true);
			geometry.addAttribute( 'values', new THREE.BufferAttribute( values, 1 ) );
			geometry.addAttribute( 'grid', new THREE.BufferAttribute( points, 3 ) );
			geometry.level = level;
			geometry.data = msg.data;
			var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0xffffff, side:THREE.DoubleSide, wireframe: false} );
			mesh = new THREE.Mesh( geometry, colorMaterial );
			mesh.name = file;
			scene.add(mesh);
			// scene.add(mesh2);
			// meshes.push(mesh);
			console.log(scene);
			console.timeEnd('loadSurface');
			isLoaded = true;
		});
}
