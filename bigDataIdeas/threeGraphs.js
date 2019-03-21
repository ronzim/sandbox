console.log(THREE)

class Graph extends THREE.Object3D {

  // options : {
  //  'x' : 'propertyOnXaxis',
  //  'y' : 'propertyOnYaxis'
  // }

  constructor(data, type, options) {
    super();

    this.data = data;
    this.type = type;

    this.origin = null;
    this.bb = null;
    this.content = null;
    this.refSys = null;

    this.initGraph();
  }

  initGraph(){
    switch(this.type){
      case 'scatter2d' :
        var geometry = new THREE.BufferGeometry();
        var material = new THREE.PointsMaterial();
        this.content.mesh = new THREE.Mesh(geometry, material);
        break;
      case '' :
        break;
      default :
        // ...
      }
    }

    initRefSys(){
      this.refSys = new ReferenceSystem(
                          this.mesh.geometry,
                          this.type,
                          options
                        );
    }

}


class ReferenceSystem extends THREE.Object3D {

  constructor(geometry, type, options){
    super();

    this.srcGeometry = geometry;
    this.type = type;
    this.options = options;

    this.origin = geometry.boundingBox.min;
    this.axis   = null;
    this.grids  = null;

    this.init();
  }

  init(){
    switch(this.type){
      case '2d' :
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
    endPoint[dir] = this.geometry.boundingBox.max[dir];
    // TODO
    var axisGeometry = new THREE.LineGeometry();
    var axisMaterial = new THREE.LineMaterial();
    var line = new THREE.Mesh(axisGeometry, axisMaterial);

    generateTicks(line, step); // TODO

    this.axis[dir] = line;
  }

  initGrid(dir1, dir2){
    var grid = new THREE.GridHelper();
    grid.rotateOnAxis(dir1.cross(dir2).normalize(), Math.PI/2);
    var x_pos = (dir1 == 'x' || dir2 == 'x') ? this.axis.x.geometry.boundingBox.x /2 : 0;
    var y_pos = (dir1 == 'y' || dir2 == 'y') ? this.axis.y.geometry.boundingBox.y /2 : 0;
    var z_pos = (dir1 == 'z' || dir2 == 'z') ? this.axis.z.geometry.boundingBox.z /2 : 0;
    grid.position.set(x_pos, y_pos, z_pos);

    this.grid[dir1 + dir2] = grid;
  }

}

// TODO
// this.add(obj) instead of this.obj = obj;

console.log(new Graph)
console.log(new ReferenceSystem)
