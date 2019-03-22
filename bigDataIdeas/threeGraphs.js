/*jshint esversion: 6 */
const _ = require('underscore');

const DIR = {
  'x' : new THREE.Vector3(1,0,0),
  'y' : new THREE.Vector3(0,1,0),
  'z' : new THREE.Vector3(0,0,1)
}

class ReferenceSystem extends THREE.Object3D {

  constructor(geometry, type, options){
    super();
    console.log(geometry, type, options)

    this.srcGeometry = geometry;
    this.type = type;
    this.options = options;

    this.origin = geometry.boundingBox.min;
    this.axis   = {};
    this.grids  = {};

    this.init();
  }

  init(){
    switch(this.type){
      case 'scatter2d' :
        this.initAxis('x');
        this.initAxis('y');
        this.initGrid('x','y');
        break;
      default:
        // ...
    }
  }

  initAxis(dir){
    var endPoint = this.origin.clone();
    endPoint[dir] = this.srcGeometry.boundingBox.max[dir];
    var axisGeometry = new THREE.LineGeometry();
    var bb = this.srcGeometry.boundingBox.clone();
    bb.expandByVector(bb.getSize().multiplyScalar(0.1));
    var x = dir == 'x' ? bb.max.x : bb.min.x;
    var y = dir == 'y' ? bb.max.y : bb.min.y;
    var z = dir == 'z' ? bb.max.z : bb.min.z;
    var endPoint = new THREE.Vector3(x, y, z);
    var plainPoints = threePointsArrayToPlainArray([
      bb.min,
      endPoint
    ]);
    axisGeometry.setPositions(plainPoints);
    var axisMaterial = new THREE.LineMaterial({
  		color: 0x000000,
  		linewidth: 0.001, // in pixels
  		// vertexColors: THREE.VertexColors,
  		// resolution:  // to be set by renderer, eventually
  		dashed: false
  	});;

    var line = new THREE.Mesh(axisGeometry, axisMaterial);
    // generateTicks(line, step); // TODO
    this.axis[dir] = line;
    this.add(line);
  }

  initGrid(label1, label2){
    var dir1 = DIR[label1];
    var dir2 = DIR[label2];
    var grid = new THREE.GridHelper();
    grid.rotateOnAxis(dir1.cross(dir2).normalize(), Math.PI/2);
    var x_pos = (dir1 == 'x' || dir2 == 'x') ? this.axis.x.geometry.boundingBox.x /2 : 0;
    var y_pos = (dir1 == 'y' || dir2 == 'y') ? this.axis.y.geometry.boundingBox.y /2 : 0;
    var z_pos = (dir1 == 'z' || dir2 == 'z') ? this.axis.z.geometry.boundingBox.z /2 : 0;
    grid.position.set(x_pos, y_pos, z_pos);
    var label = label1 + label2;
    this.grids[label] = grid;
    this.add(grid);
  }

}

// options : {
//  'x' : 'propertyOnXaxis',
//  'y' : 'propertyOnYaxis'
// }

class Graph extends THREE.Object3D {

  constructor(data, type, options) {

    super();

    this.data = data;
    this.type = type;
    this.options = options;

    this.origin = null;
    this.bb = null;
    this.content = null;
    this.refSys = null;
    this.mesh = null;

    console.log(this)

    this.initGraph();
  }

  initGraph(){
    console.log('init graph', this.type)

    switch(this.type){
      case "scatter2d" :
        var x = _.pluck(this.data, this.options.x);
        var y = _.pluck(this.data, this.options.y);
        var z = new Array(x.length).fill(0);
        var vertsArr = _.zip(x,y,z)
        var verts = _.map(vertsArr, v => {
          return new THREE.Vector3(parseFloat(v[0]), parseFloat(v[1]), parseFloat(v[2])); // TODO check datatype
        });
        var pointGeometry = new THREE.BufferGeometry().setFromPoints(verts);
        pointGeometry.computeBoundingBox();
        this.center = pointGeometry.boundingBox.getCenter();
        var pointMaterial = new THREE.PointsMaterial({
          size : 1.5,
          sizeAttenuation : false,
          color : 'red' // TODO props
        });
        this.mesh = new THREE.Points(pointGeometry, pointMaterial);
        this.add(this.mesh);
        break;

      case '' :
        break;
      default :
        console.log('default')
        // ...
      }

      this.initRefSys();
    }

    initRefSys(){
      console.log('initrefsys')
      this.refSys = new ReferenceSystem(
                          this.mesh.geometry,
                          this.type,
                          this.options
                        );
      this.add(this.refSys);
    }

}

// ================================================================
// Utils ==========================================================
// ================================================================

// From xyz array to THREE.Points array
function threePointsArrayToPlainArray(threeArray){
  var array = [];

  for (var p=0; p < threeArray.length; p++){
    array.push(threeArray[p].x);
    array.push(threeArray[p].y);
		let z = threeArray[p].z ? threeArray[p].z : 0;
    array.push(z);
  }

  return array;
}

// From xyz array to THREE.Points array
function plainArrayToThreePointsArray(array){
  var threeArray = [];

  for (var p=0; p < array.length; p+=3){
    threeArray.push(new THREE.Vector3(array[p], array[p+1], array[p+2]));
  }

  return threeArray;
}

// TODO
// this.add(obj) instead of this.obj = obj;
// resize axis (more space btw points)

// console.log(new Graph)
// console.log(new ReferenceSystem)

/// EXPORTS ///
exports.Graph = Graph;
