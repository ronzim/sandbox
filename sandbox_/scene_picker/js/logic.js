var brush = require('../lib/brush.js');
var STLLoader = require('three-stl-loader')(THREE);

// var OBJLoader = require('../lib/OBJLoader.js')(THREE);
// instantiate obj loader
// var loader = new OBJLoader();
//
// // load a resource
// loader.load(
// 	// resource URL
// 	'../resources/upper.obj',
// 	// called when resource is loaded
// 	function (object) {
// 		scene.add( object );
// 	},
// 	// called when loading is in progresses
// 	function (xhr) {
// 		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
// 	},
// 	// called when loading has errors
// 	function (error) {
// 		console.log('An error happened');
// 	}
// );

function run(renderer, scene, controls){
  var loader = new STLLoader();
  loader.load('./resources/shoe.stl', function(geometry) {

    var material = new THREE.MeshBasicMaterial({wireframe:false});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'shoe';
    mesh.material.vertexColors = THREE.VertexColors;
    mesh.material.needsUpdate = true;

    scene.add(mesh);

    brush.toggleCADBrush(renderer, scene, controls, mesh.name, true);
    // brush.toggleCADBrush(scene, controls, false, mesh.name);

  });
}

module.exports.populate = run;
