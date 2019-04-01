const _ = require('underscore');

const DIR = {
  'x' : new THREE.Vector3(1,0,0),
  'y' : new THREE.Vector3(0,1,0),
  'z' : new THREE.Vector3(0,0,1)
}

class GridHelperCustom {

  constructor( size, divisions, color1, color2 ){
    console.log('1')
    this.size = size || 10;
    this.divisions = divisions || 10;
    this.color1 = new THREE.Color( color1 !== undefined ? color1 : 0x444444 );
    this.color2 = new THREE.Color( color2 !== undefined ? color2 : 0x888888 );

  	this.center = divisions / 2;
  	this.step = size / divisions;
  	this.halfSize = size / 2;

  	this.vertices = []
    this.colors = [];

    this.init();
  }

  init(){
    console.log('1')

    for ( var i = 0, j = 0, k = - this.halfSize; i <= this.divisions; i ++, k += this.step ) {

  		this.vertices.push( - this.halfSize, 0, k, this.halfSize, 0, k );
  		this.vertices.push( k, 0, - this.halfSize, k, 0, this.halfSize );
      console.log('1')

  		var color = i === this.center ? this.color1 : this.color2;
      console.log('1')

  		color.toArray( this.colors, j ); j += 3;
  		color.toArray( this.colors, j ); j += 3;
  		color.toArray( this.colors, j ); j += 3;
  		color.toArray( this.colors, j ); j += 3;
      console.log('1')
  	}

    console.log('1')

  	var geometry = new THREE.BufferGeometry();
  	geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
  	geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( this.colors, 3 ) );
    console.log('1')

  	var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
    console.log('1')

  	THREE.LineSegments.call( this, geometry, material );
    console.log('1')
  }

}

// GridHelperCustom.prototype = Object.create( THREE.LineSegments.prototype );
// GridHelperCustom.prototype.constructor = GridHelperCustom;

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
    this.dimensions = null;

    this.init();
  }

  init(){
    switch(this.type){
      case 'scatter2d' :
        this._computeDimensions();
        this._initAxis('x');
        this._initAxis('y');
        this._initGrid('x','y');
        // console.log(new GridHelperCustom())
        break;
      default:
        // ...
    }
  }

  _computeDimensions(){
    // get source bb and expand a little, then round to 10 //TODO make variable
    var bb = this.srcGeometry.boundingBox.clone();
    bb.expandByVector(bb.getSize().multiplyScalar(0.1));

    this.dimensions = bb;
  }

  _initAxis(dir){
    var axisGeometry = new THREE.LineGeometry();
    var bb = this.dimensions;
    var x = dir == 'x' ? bb.max.x : bb.min.x;
    var y = dir == 'y' ? bb.max.y : bb.min.y;
    var z = dir == 'z' ? bb.max.z : bb.min.z;
    var endPoint = new THREE.Vector3(x, y, z);
    var plainPoints = threePointsArrayToPlainArray([
      bb.min,
      endPoint
    ]);
    axisGeometry.setPositions(plainPoints);
    axisGeometry.computeBoundingBox();
    var axisMaterial = new THREE.LineMaterial({
  		color: 0x666666,
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

  _initGrid(label1, label2){
    var dir1 = DIR[label1];
    var dir2 = DIR[label2];
    var biggestSize = this._getMaxComponentAbs(this.dimensions.getSize());
    var grid = new GridHelperCustom(biggestSize, 10, 'red', 'blue');
    console.log(grid)
    grid.setRotationFromAxisAngle(dir1.normalize(), Math.PI/2);
    console.log(this.axis.x.geometry.boundingBox)
    var x_pos = (label1 == 'x' || label2 == 'x') ? this.axis.x.geometry.boundingBox.getCenter().x : 0;
    var y_pos = (label1 == 'y' || label2 == 'y') ? this.axis.y.geometry.boundingBox.getCenter().y : 0;
    var z_pos = (label1 == 'z' || label2 == 'z') ? this.axis.z.geometry.boundingBox.getCenter().z : 0;
    console.log(x_pos, y_pos, z_pos);
    grid.position.set(x_pos, y_pos, z_pos);
    var label = label1 + label2;
    this.grids[label] = grid;
    this.add(grid);
  }

  _getMaxComponentAbs(vector3){
    var max = Math.abs(vector3.x) > Math.abs(vector3.y) ?  vector3.x : vector3.y;
    max = max > Math.abs(vector3.z) ? max : vector3.z;
    return max;
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
