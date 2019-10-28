var THREE = require('three');
var STLLoader = require('three-stl-loader')(THREE);

var loader = new STLLoader();

loader.load('./AGO.stl', function (geometry) {
  var material = new THREE.MeshNormalMaterial();
  var mesh = new THREE.Mesh(geometry, material);
  console.log(mesh);
  var verts = geometry.attributes.position.array;
  var norms = geometry.attributes.normal.array;
  var distances = [];

  var ray = new THREE.Raycaster();
  var d = new THREE.Vector3();
  var n = new THREE.Vector3();

  geometry.computeBoundingBox();
  var center = geometry.boundingBox.getCenter();
  console.log(center)

  for (var v=0; v<verts.length; v+=3){
    d.set(verts[v], verts[v+1], verts[v+2]);
    // n.set(norms[v], norms[v+1], norms[v+2]).negate();
    n = d.clone().sub(center).negate();
    console.log(d,n)
    ray.set(d, n);
    var instersects = ray.intersectObject(mesh);
    if(instersects.length>0){
      distances.push(instersects[0].distance);
    }
  }
  console.log(distances)
  var sum = distances.reduce((a,b)=>(a+b));
  console.log(sum/distances.length);

});
