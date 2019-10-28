const geometryUtils = require('./geometryUtils');
const _             = require('underscore');
const pjson         = require(path.join(rootPath, 'package.json'));
const vtkAPI        = require(utils.getNAPIvtkAPIPath());

const devUtils  = require(path.join(rootPath, 'resources', 'js', 'devUtils'));

const fillerValue = 999999;

// ================================================
// Manage base generation from scene objects ======
// ================================================

function createBase(bodyDataDisplayName, center, direction, cb) {
  var activeCaseId = _state.get(['application', 'active', 'case']);
  // get source geometry (get data id from state)
  var bodyGeometry = api.getRenderingSceneFromRenderer('r3D').getObjectByName(bodyDataDisplayName).geometry;
  var nonIndexedGeometry = bodyGeometry.clone().toNonIndexed();

  // pass mesh geometry to NAPI and get contour
  var vertices = nonIndexedGeometry.attributes.position.array.slice();
  var edge     = new Float32Array(vertices.length).fill(fillerValue);
  var out      = vtkAPI.extractEdge_VTK(vertices.slice(), vertices.length, center, direction, edge);
  var bodyEdge = edge.subarray(0, edge.indexOf(fillerValue));

  if (pjson.dev) {
    console.log('bodyEdge verts:', bodyEdge.length);
  }

  // checkProfile (reorder vertices)
  var bodyEdgeVerts = geometryUtils.checkProfile(bodyEdge);

  // get brushed surface
  var brushData = api.getBrushData(true);

  if (brushData.length == 0){
    console.warn('no brush data 😑');
    return;
  }

  // console.log('extracting edges...')
  // console.time('extract edges');

  // extract brush boundary edge (already reordered)
  // var brushEdges     = computeEdgeList(brushData);
  // var brushEdgeVerts = extractBoundaryEdges(brushEdges);
  // moved to napi-vtk:
  var edge_brush = new Float32Array(brushData.length).fill(fillerValue);
  var out_brush  = vtkAPI.extractEdge_VTK(brushData.slice(), brushData.length, [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], edge_brush);
  var brushEdge  = edge_brush.subarray(0, edge_brush.indexOf(fillerValue));
  // checkProfile (reorder vertices)
  // console.log('reordering...')
  var brushEdgeVerts = geometryUtils.checkProfile(brushEdge);
  // console.timeEnd('extract edges');

  if (pjson.dev) {
    console.log('brushEdgeVerts', brushEdgeVerts.length);
  }

  // generate base mesh
  // n (number of layers) could be an user input
  var n = Math.floor((bodyEdge.length/3) / 10);

  // check orientation and reverse if different
  var v1 = geometryUtils.plainArrayToThreePointsArray(bodyEdgeVerts);
  var v2 = geometryUtils.plainArrayToThreePointsArray(brushEdgeVerts);
  var l1 = v1.length;
  var l2 = v2.length;
  var n1 = new THREE.Plane().setFromCoplanarPoints(v1[0], v1[Math.floor(l1/2)], v1[l1-1]).normal;
  var n2 = new THREE.Plane().setFromCoplanarPoints(v2[0], v2[Math.floor(l2/2)], v2[l2-1]).normal;

  // DEV
  if (pjson.dev) {
    devUtils.renderVector('r3D', v1[0], n1, 'bodyEdgeNormal');
    devUtils.renderVector('r3D', v2[0], n2, 'brushEdgeNormal');
  }

  if(n1.dot(n2)<0){
    console.log('revert bodyEdge points 🔄');
    var dim = bodyEdgeVerts[0] instanceof THREE.Vector3 ? 1 : 3;
    bodyEdgeVerts = reverse(bodyEdgeVerts, dim);
  }

  if (pjson.dev){
    console.log('rendering points for dev 🕐')
    var p2draw1 = api.plainArrayToThreePointsArray(bodyEdgeVerts);
    var p2draw2 = api.plainArrayToThreePointsArray(brushEdgeVerts);
    p2draw1.forEach((p,i) => devUtils.renderPoint('r3D', p, 'p1' + i.toString(), i, 0.05));
    p2draw2.forEach((p,i) => devUtils.renderPoint('r3D', p, 'p2' + i.toString(), i, 0.05));
  }

  var base = generate(bodyEdgeVerts, brushEdgeVerts, n);

  if (cb) {
    console.log('linker DONE 😎', base.geometry.attributes.position.array.length);
    if (base){
      cb(base.geometry);
    }
    else{
      cb();
    }
  }
}

// =====================================================
// Check if array of vertices is oriented cw or ccw ====
// =====================================================

function computeVerse(verts){
  var v3array = verts[0] instanceof THREE.Vector3 ? verts : geometryUtils.plainArrayToThreePointsArray(verts);

  var v1 = v3array[0];
  var v2 = v3array[Math.floor(v3array.length/3)];
  var v3 = v3array[Math.floor(v3array.length*2/3)];

  var c = geometryUtils.getPointsCentroid([v1, v2, v3]);

  var e1 = new THREE.Vector3().subVectors(v1, c);
  var e2 = new THREE.Vector3().subVectors(v2, c);
  var e3 = new THREE.Vector3().subVectors(v3, c);

  // orientation = (y2 - y1)*(x3 - x2) - (y3 - y2)*(x2 - x1)

  var orientation = (e2.y - e1.y)*(e3.x - e2.x) - (e3.y - e2.y)*(e2.x - e1.x);

  return orientation;

}

// ==================================================================
// Generate a mesh linking two vertices arrays, with 'ln' layers ====
// ==================================================================

function generate(srcVerts, trgVerts, ln, sceneName){
  if (pjson.dev === true && sceneName){
    var scene = api.getRenderingSceneFromRenderer(sceneName);
  }

  if (srcVerts.length < 9 || trgVerts.length < 9){
    return false;
  }

  console.log('generating...');
  console.time('generate');

  // spline & sample trgVerts to have equal number of points on both sides
  var sampling = geometryUtils.plainArrayToThreePointsArray(trgVerts);
  var curve = new THREE.CatmullRomCurve3(sampling, true);
  var sampledPoints = curve.getPoints(srcVerts.length/3);
  sampledPoints.splice(-1); // avoid last-first duplicate

  // get nearest point for first point and reorder consequently the target (use 'extrusion direction' !!)
  var c1 = geometryUtils.getPointsCentroid(geometryUtils.plainArrayToThreePointsArray(srcVerts));
  var c2 = geometryUtils.getPointsCentroid(sampledPoints);
  var direction = new THREE.Vector3().subVectors(c2,c1); // NOTE: direction is not normalized!

  if (pjson.dev === true && sceneName){
    var ah = new THREE.ArrowHelper(direction, c1, 30);
    scene.add(ah);
  }

  var s0 = new THREE.Vector3(srcVerts[0], srcVerts[1], srcVerts[2]);
  var distances = sampledPoints.map(p => new THREE.Vector3().subVectors(p, direction).distanceTo(s0));
  var min = Math.min(...distances);
  var nearestId = distances.indexOf(min);
  var part1 = sampledPoints.slice(0,nearestId);
  var part2 = sampledPoints.slice(nearestId);
  sampledPoints = part2.concat(part1);

  if (pjson.dev === true && sceneName){
    var s = new THREE.SphereGeometry(0.5, 8,8);
    var srcPoint = new THREE.Mesh(s,m);
    srcPoint.position.copy(s0)
    scene.add(srcPoint);
    var trgPoint = new THREE.Mesh(s,m);
    trgPoint.position.copy(sampledPoints[nearestId]);
    scene.add(trgPoint);
  }

  // compute ln layers
  var layers = sampleSpace(srcVerts, sampledPoints, ln);

  // sew each layer with the follower, storing vertices
  // TODO compute exact number if possible
  // var finalVertices = new Float32Array(100000000).fill(99999);
  var arrayMaxDimension = srcVerts.length*3*ln*2;
  console.log('>>>>>>>>>>> arrayMaxDim', arrayMaxDimension);

  var finalVertices = new Float32Array(arrayMaxDimension).fill(99999);

  for (var f=0; f<layers.length-1; f++){
    var partialVertices = sewer(layers[f], layers[f+1]);
    try{
      finalVertices.set(partialVertices, layers[f].length*6*f);
    }
    catch(err){
      console.log(err);
      console.log(layers[f].length*6*f)
    }

    // DEV: render each layer mesh
    // layers[f].forEach(function(p,k,arr){
    // 	if (k%3 === 0){
    // 		var geometry = new THREE.SphereGeometry(0.3,8,8);
    // 		var material = new THREE.MeshBasicMaterial({depthTest:false, color: 'blue'});
    // 		point = new THREE.Mesh(geometry, material);
    // 		point.position.set(arr[k], arr[k+1], arr[k+2]);
    // 		scene.add(point);
    // 	}
    // });
    // if (f === layers.length-2){
    // 	layers[f+1].forEach(function(p,k,arr){
    // 		if (k%3 === 0){
    // 			var geometry = new THREE.SphereGeometry(0.3,8,8);
    // 			var material = new THREE.MeshBasicMaterial({depthTest:false, color: 'blue'});
    // 			point = new THREE.Mesh(geometry, material);
    // 			point.position.set(arr[k], arr[k+1], arr[k+2]);
    // 			scene.add(point);
    // 		}
    // 	});
    // }
    // END DEV
  }

  // slice away unused places
  finalVertices = finalVertices.subarray(0, finalVertices.indexOf(99999));

  // close top and bottom sides
  var finalTopVertices = new Float32Array(arrayMaxDimension).fill(99999);
  var finalBottomVertices = new Float32Array(arrayMaxDimension).fill(99999);

  // top
  var centerTopVerts = new Array(srcVerts.length).fill(0).map(function(e,k){
    switch (k%3){
      case 0: return c1.x;
        break;
      case 1: return c1.y;
        break;
      case 2: return c1.z;
        break;
    }
  });

  var topLayers = sampleSpace(srcVerts, centerTopVerts, ln);

  for (var f=0; f<topLayers.length-1; f++){
    var partialTopVertices = sewer(topLayers[f], topLayers[f+1]);
    finalTopVertices.set(partialTopVertices, topLayers[f].length*6*f);
  }

  // bottom
  var centerBottomVerts = new Array(sampledPoints.length*3).fill(0).map(function(e,k){
    switch (k%3){
      case 0: return c2.x;
        break;
      case 1: return c2.y;
        break;
      case 2: return c2.z;
        break;
    }
  });

  var bottomLayers = sampleSpace(sampledPoints, centerBottomVerts, ln);

  for (var f=0; f<bottomLayers.length-1; f++){
    var partialBottomVertices = sewer(bottomLayers[f], bottomLayers[f+1]);
    finalBottomVertices.set(partialBottomVertices, bottomLayers[f].length*6*f);
  }

  finalTopVertices = finalTopVertices.subarray(0, finalTopVertices.indexOf(99999));
  finalBottomVertices = finalBottomVertices.subarray(0, finalBottomVertices.indexOf(99999));

  var completeVertices = new Float32Array(finalVertices.length + finalTopVertices.length + finalBottomVertices.length);
  completeVertices.set(finalVertices, 0);
  completeVertices.set(finalTopVertices, finalVertices.length);
  completeVertices.set(finalBottomVertices, finalVertices.length + finalTopVertices.length);

  var lg = new THREE.BufferGeometry();
  lg.addAttribute( 'position', new THREE.BufferAttribute( completeVertices, 3 ) );
  lg.computeVertexNormals();
  lg.normalizeNormals();
  var lm = new THREE.MeshPhongMaterial({flatShading:false, color: 0x0000ff, side: THREE.DoubleSide, wireframe: false, transparent: true, opacity: 0.8});
  var link = new THREE.Mesh(lg,lm);

  console.timeEnd('generate')

  // TODO apply stretch
  // applyStretch(link, c1, direction, 0.5, 0.8, 'parabolic', function(mesh){
  // 	console.log(mesh)
  // 	scene.add(mesh)
  // })

  // if (cb && _.isFunction(cb)){
  //   cb(link);
  // }

  return link;
}

// =========================================================
// Sample space btw two contours generating point cloud ====
// =========================================================

function sampleSpace(srcVerts, trgVerts, ln) {

  var src_v3_vertices = srcVerts[0] instanceof THREE.Vector3 ? srcVerts : geometryUtils.plainArrayToThreePointsArray(srcVerts);
  var trg_v3_vertices = trgVerts[0] instanceof THREE.Vector3 ? trgVerts : geometryUtils.plainArrayToThreePointsArray(trgVerts);
  var layers = [];

  var raw_layers = src_v3_vertices.map(function(v, i) {
    var curr_v3 = trg_v3_vertices[i];
    var line = new THREE.LineCurve3(v, curr_v3);
    var layersPoints = geometryUtils.threePointsArrayToPlainArray(line.getPoints(ln-1));
    return _.chunk(layersPoints, 3);
  });

  // init array of arrays
  var layers = new Array(ln).fill(0).map(e => []);

  // fill with layers points
  for (var l=0; l<raw_layers.length; l++){
    for (var m=0; m<raw_layers[l].length; m++){
      layers[m] = layers[m].concat(raw_layers[l][m]);
    }
  }

  return layers;
}

// =========================================================================
// Create a simple mesh between two closed contours (vertices arrays) ======
// =========================================================================

function sewer(a_verts, b_verts){
  if (a_verts.length !== b_verts.length){
    console.warn('vertices number mismatch 😑');
    return;
  }

  var vertices = new Float32Array(a_verts.length*3*2);
  var vertices1 = new Float32Array(a_verts.length*3);
  var vertices2 = new Float32Array(a_verts.length*3);

  for (var k=0; k<a_verts.length-5; k+=3){
    vertices1[3*k]   = a_verts[k];
    vertices1[3*k+1] = a_verts[k+1];
    vertices1[3*k+2] = a_verts[k+2];
    vertices1[3*k+3] = b_verts[k];
    vertices1[3*k+4] = b_verts[k+1];
    vertices1[3*k+5] = b_verts[k+2];
    vertices1[3*k+6] = a_verts[k+3];
    vertices1[3*k+7] = a_verts[k+4];
    vertices1[3*k+8] = a_verts[k+5];
  }
  vertices1[3*k]   = a_verts[k];
  vertices1[3*k+1] = a_verts[k+1];
  vertices1[3*k+2] = a_verts[k+2];
  vertices1[3*k+3] = b_verts[k];
  vertices1[3*k+4] = b_verts[k+1];
  vertices1[3*k+5] = b_verts[k+2];
  vertices1[3*k+6] = a_verts[0];
  vertices1[3*k+7] = a_verts[1];
  vertices1[3*k+8] = a_verts[2];

  for (n=0; n<b_verts.length-5; n+=3){
    vertices2[3*n]   = b_verts[n];
    vertices2[3*n+1] = b_verts[n+1];
    vertices2[3*n+2] = b_verts[n+2];
    vertices2[3*n+3] = a_verts[n+3];
    vertices2[3*n+4] = a_verts[n+4];
    vertices2[3*n+5] = a_verts[n+5];
    vertices2[3*n+6] = b_verts[n+3];
    vertices2[3*n+7] = b_verts[n+4];
    vertices2[3*n+8] = b_verts[n+5];
  }
  vertices2[3*n]   = b_verts[k];
  vertices2[3*n+1] = b_verts[k+1];
  vertices2[3*n+2] = b_verts[k+2];
  vertices2[3*n+3] = a_verts[0];
  vertices2[3*n+4] = a_verts[1];
  vertices2[3*n+5] = a_verts[2];
  vertices2[3*n+6] = b_verts[0];
  vertices2[3*n+7] = b_verts[1];
  vertices2[3*n+8] = b_verts[2];

  // DEV: display w/ different colors
  // console.log(vertices1);
  // console.log(vertices2);
  // var lg1 = new THREE.BufferGeometry();
  // var lg2 = new THREE.BufferGeometry();
  // lg1.addAttribute( 'position', new THREE.BufferAttribute( vertices1, 3 ) );
  // lg2.addAttribute( 'position', new THREE.BufferAttribute( vertices2, 3 ) );
  // var lm1 = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
  // var lm2 = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide});
  // var link1 = new THREE.Mesh(lg1,lm1);
  // var link2 = new THREE.Mesh(lg2,lm2);
  // scene.add(link1);
  // scene.add(link2);
  // END DEV

  vertices.set(vertices1, 0);
  vertices.set(vertices2, vertices1.length);

  return vertices;

}

// ================================================================
// Compute list of all edges in a NON-INDEXED buffer geometry =====
// ================================================================

function computeEdgeList(verts) {
  let edgeList = [];

  for (let v = 0; v<verts.length; v+=9){
    let e1 = [verts[v], verts[v+1], verts[v+2], verts[v+3], verts[v+4], verts[v+5]];
    let e2 = [verts[v+3], verts[v+4], verts[v+5], verts[v+6], verts[v+7], verts[v+8]];
    let e3 = [verts[v+6], verts[v+7], verts[v+8], verts[v], verts[v+1], verts[v+2]];
    edgeList.push(e1);
    edgeList.push(e2);
    edgeList.push(e3);
  }

  return edgeList;

}

// ====================================================================
// Extract a continuous boundary edge from a list of single edges =====
// ====================================================================

function extractBoundaryEdges(list){
  var outEdge = [];

  for (let l = 0; l<list.length; l++){
    var res = _.filter(list, function(currEdge){
      let edge = list[l];
      let c1 = (edge[0] == currEdge[0] && edge[1] == currEdge[1] && edge[2] == currEdge[2]
             && edge[3] == currEdge[3] && edge[4] == currEdge[4] && edge[5] == currEdge[5]);
      let c2 = (edge[3] == currEdge[0] && edge[4] == currEdge[1] && edge[5] == currEdge[2]
             && edge[0] == currEdge[3] && edge[1] == currEdge[4] && edge[2] == currEdge[5]);
      return c1 || c2;
    })
    if (res.length == 1){
      outEdge.push(list[l][0]);
      outEdge.push(list[l][1]);
      outEdge.push(list[l][2]);
      outEdge.push(list[l][3]);
      outEdge.push(list[l][4]);
      outEdge.push(list[l][5]);
    }
  }
  // console.log(outEdge)

  return geometryUtils.checkProfile(outEdge);
}

// ===============================================================================================
// Reverse an array, specifying the dimension of an element (es. 3 for a xyz vertices array) =====
// ===============================================================================================

function reverse(inArray, elementDimension = 3){
  let outArray = [];
  for (let a = inArray.length; a > 0; a-=elementDimension){
    let subArray = inArray.slice(a-elementDimension, a);
    outArray = outArray.concat(subArray);
  }
  return outArray;
}

exports.createBase = createBase;
