
class HelpersBoundingBox extends THREE.Object3D {
  constructor(dimIJK, halfDimIJK, ijk2LPS) {
    //
    super();

    // private vars
    // this._stack = stack; //DEV
    this.dimIJK = dimIJK;
    this.halfDimIJK = halfDimIJK;
    this.ijk2LPS = ijk2LPS;
    // END DEV

    this._visible = true;
    this._color = 0xFFFFFF;
    this._material = null;
    this._geometry = null;
    this._mesh = null;
    this._meshStack = null;

    // create object
    this._create();
  }

  // getters/setters
  set visible(visible) {
    this._visible = visible;
    if (this._mesh) {
      this._mesh.visible = this._visible;
    }
  }

  get visible() {
    return this._visible;
  }

  set color(color) {
    this._color = color;
    if (this._material) {
      this._material.color.set(this._color);
    }
  }

  get color() {
    return this._color;
  }

  // private methods
  _create() {
    // Convenience vars
    // const dimensions = this._stack.dimensionsIJK;
    // const halfDimensions = this._stack.halfDimensionsIJK;
    //DEV
    const dimensions = this.dimIJK;
    const halfDimensions = this.halfDimIJK;
    //END DEV
    const offset = new THREE.Vector3(-0.5, -0.5, -0.5);

    // Geometry
    const geometry = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
      halfDimensions.x + offset.x,
      halfDimensions.y + offset.y,
      halfDimensions.z + offset.z));
    this._geometry = geometry;

    // Material
    this._material = new THREE.MeshBasicMaterial({
      wireframe: true,
    });

    const mesh = new THREE.Mesh(this._geometry, null);
    mesh.applyMatrix(this.ijk2LPS);
    mesh.visible = this._visible;
    this._meshStack = mesh;

    this._mesh = new THREE.BoxHelper(this._meshStack, this._color);
    this._material = this._mesh.material;

    this.add(this._mesh);
  }

  _update(dimIJK, halfDimIJK, ijk2LPS) {
    if (this._mesh) {
      this.remove(this._mesh);
      this._mesh.geometry.dispose();
      this._mesh.geometry = null;
      this._mesh.material.dispose();
      this._mesh.material = null;
      this._mesh = null;
    }

    this.dimIJK = dimIJK;
    this.halfDimIJK = halfDimIJK;
    this.ijk2LPS = ijk2LPS;

    this._create();
  }

  dispose() {
    this._mesh.material.dispose();
    this._mesh.material = null;
    this._geometry.dispose();
    this._geometry = null;
    this._material.dispose();
    this._material = null;
  }
}

exports.HelpersBoundingBox = HelpersBoundingBox;
