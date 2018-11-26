const geometryUtils = require('./geometryUtils');
const geometryUtils_ = require('./geometryUtils_intra');
const _ = require('underscore');

function generate(srcVerts, trgVerts, ln, jolly){
  console.time('generate')
  // spline & sample trgVerts to have equal number of points
  var sampling = geometryUtils_.plainArrayToThreePointsArray(trgVerts);
  var curve = new THREE.CatmullRomCurve3(sampling, true);
  var sampledPoints = curve.getPoints(srcVerts.length/3);
  sampledPoints.splice(-1); // avoid last-first duplicate

  // get nearest point for first point and reorder consequently the target (use 'extrusion direction' !!)
  var c1 = geometryUtils.getPointsCentroid(geometryUtils_.plainArrayToThreePointsArray(srcVerts));
  var c2 = geometryUtils.getPointsCentroid(sampledPoints);

  var direction = new THREE.Vector3().subVectors(c2,c1).normalize();
  if (jolly instanceof THREE.Scene){
    var ah = new THREE.ArrowHelper(direction, c1, 30);
    jolly.add(ah);
  }

  var s0 = new THREE.Vector3(srcVerts[0], srcVerts[1], srcVerts[2]);
  var distances = sampledPoints.map(p => new THREE.Vector3().subVectors(s0, p).dot(direction));
  var max = Math.max(...distances);
  var nearestId = distances.indexOf(max);
  var part1 = sampledPoints.slice(0,nearestId);
  var part2 = sampledPoints.slice(nearestId);
  sampledPoints = part2.concat(part1);

  if (jolly instanceof THREE.Scene){
    var s = new THREE.SphereGeometry(0.5, 8,8);
    var srcPoint = new THREE.Mesh(s,m);
    srcPoint.position.copy(s0)
    jolly.add(srcPoint);
    var trgPoint = new THREE.Mesh(s,m);
    trgPoint.position.copy(sampledPoints[nearestId]);
    jolly.add(trgPoint);
  }

  // to plain array ...xyzxyz...
  sampledPoints = geometryUtils_.threePointsArrayToPlainArray(sampledPoints);

  // DEV: render a single layer
  // single layer
  // var lg = new THREE.BufferGeometry();
  // var allVerts = sewer(cylVerts, sampledPoints);

  // lg.addAttribute( 'position', new THREE.BufferAttribute( allVerts, 3 ) );
  // var lm = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, wireframe: true});
  // var link = new THREE.Mesh(lg,lm);
  // jolly.add(link);
  // END DEV

  // compute ln layers
  var cyl_v3_vertices   = geometryUtils_.plainArrayToThreePointsArray(srcVerts);
  var sampl_v3_vertices = geometryUtils_.plainArrayToThreePointsArray(sampledPoints);
  var layers = [];

  var raw_layers = cyl_v3_vertices.map(function(v, i){
    var cube_v3 = sampl_v3_vertices[i];
    var line = new THREE.LineCurve3(v, cube_v3);
    var layersPoints = geometryUtils_.threePointsArrayToPlainArray(line.getPoints(ln-1));
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

  // sew each layer with the follower, storing vertices
  var finalVertices = new Float32Array(10000000).fill(99999);

  for (var f=0; f<layers.length-1; f++){
    var partialVertices = sewer(layers[f], layers[f+1]);
    finalVertices.set(partialVertices, layers[f].length*6*f);

    // DEV: render each layer mesh
    // layers[f].forEach(function(p,k,arr){
    // 	if (k%3 === 0){
    // 		var geometry = new THREE.SphereGeometry(0.3,8,8);
    // 		var material = new THREE.MeshBasicMaterial({depthTest:false, color: 'blue'});
    // 		point = new THREE.Mesh(geometry, material);
    // 		point.position.set(arr[k], arr[k+1], arr[k+2]);
    // 		jolly.add(point);
    // 	}
    // });
    // if (f === layers.length-2){
    // 	layers[f+1].forEach(function(p,k,arr){
    // 		if (k%3 === 0){
    // 			var geometry = new THREE.SphereGeometry(0.3,8,8);
    // 			var material = new THREE.MeshBasicMaterial({depthTest:false, color: 'blue'});
    // 			point = new THREE.Mesh(geometry, material);
    // 			point.position.set(arr[k], arr[k+1], arr[k+2]);
    // 			jolly.add(point);
    // 		}
    // 	});
    // }
    // END DEV
  }

  // slice away unused places
  finalVertices = finalVertices.subarray(0, finalVertices.indexOf(99999));

  var lg = new THREE.BufferGeometry();
  lg.addAttribute( 'position', new THREE.BufferAttribute( finalVertices, 3 ) );
  var lm = new THREE.MeshLambertMaterial({flatShading:false, color: 0x0000ff, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.8});
  var link = new THREE.Mesh(lg,lm);

  console.timeEnd('generate')
  console.log('>>>>>>>>>> final vertices: ', finalVertices.length/3);

  // TODO apply stretch
  // applyStretch(link, c1, direction, 0.5, 0.8, 'parabolic', function(mesh){
  // 	console.log(mesh)
  // 	jolly.add(mesh)
  // })

  if (jolly instanceof THREE.Scene){
    jolly.add(link);
  }
  else if (_.isFunction(jolly)){
    jolly(link);
  }
}

function sewer(a_verts, b_verts){
  if (a_verts.length !== b_verts.length){
    console.warn('vertices number mismatch');
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

  vertices.set(vertices1, 0);
  vertices.set(vertices2, vertices1.length);

  return vertices;

}

function computeEdgeList(geometry){
  let verts = geometry.attributes.position.array;
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
      console.log('>>>')
      outEdge.push(list[l][0]);
      outEdge.push(list[l][1]);
      outEdge.push(list[l][2]);
      outEdge.push(list[l][3]);
      outEdge.push(list[l][4]);
      outEdge.push(list[l][5]);
    }
  }
  return geometryUtils_.checkProfile(outEdge);
}

function reverse(inArray, elementDimension = 3){
  let outArray = [];
  for (let a = inArray.length; a > 0; a-=elementDimension){
    let subArray = inArray.slice(a-elementDimension, a);
    outArray = outArray.concat(subArray);
  }
  return outArray;
}

exports.computeEdgeList = computeEdgeList;
exports.extractBoundaryEdges = extractBoundaryEdges;
exports.reverse = reverse;
exports.generate = generate;
