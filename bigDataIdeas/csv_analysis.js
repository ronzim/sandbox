const Papa = require('papaparse')
const fs = require('fs-extra')
const _ = require('underscore')
var Plotly = require('plotly.js-dist')
// const THREE = require('./three.js')
// const threeGraph = require('./threeGraph_noise')
var ThreeGraph = require('./threeGraphs.js').Graph;
console.log(ThreeGraph)

const file = fs.createReadStream('../material/heart.csv');
Papa.parse(file, {
    header: true,
    // worker: true, // Don't bog down the main thread if its a big file
    // step: function(result) {
    //     // do stuff with result
    // },
    complete: function(results, file) {
      console.log(_.size(results), _.size(results.data))
      console.log(_.keys(results))
      console.log(results.meta.fields)

      loadGraph(results);
    }
});

function loadGraph(results){
  // console.log('here')
  // console.log(result)
  console.log(_.keys(results.data[0])[0])
  var ages = _.pluck(results.data, _.keys(results.data[0])[0]);
  var mhrs = _.pluck(results.data, "thalach");
  var bps  = _.pluck(results.data, "trestbps");
  // console.log(ages, mhr)

  var trace = {
    x: mhrs,
    y: bps,
    z: ages,
    name: '',
    mode: 'markers',
    marker: {
      size: 2,
      color: _.pluck(results.data, "sex")
    },
    // type: 'scatter3d',
    type: 'scatter',
    // text:  _.pluck(days, 'travelTime')
  };

  var layout = {
    xaxis: {},
    yaxis: {
      // label: 'travel time'
    },
    title:''
  };

  var data = [trace];

  Plotly.newPlot('graph-container', data, layout, {responsive: true});

  // console.log(threeGraph)
  // threeGraph.newGraph('three-container', data);
  console.log('here')

  var graph = new ThreeGraph(results.data, 'scatter2d', {'x': "thalach", 'y': "trestbps"})
  // var graph = new ThreeGraph(results.data, 'scatter2d');
  // var graph = new ThreeGraph();

  console.log('aaa', graph)

  // SCENE ---------------
  var container = document.getElementById('three-container');
  var renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xffffff, 1.0);
  console.log(container.clientWidth, container.clientHeight)
  renderer.setSize(1173, 450);
  container.appendChild(renderer.domElement);

  var camera = new THREE.PerspectiveCamera( 45, 1173 / 450, 0.1, 10000);
  // var camera = new THREE.OrthograpicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000);
  // camera.position.x = 250;
  // camera.position.y = 250;
  // camera.position.z = 250;
  camera.position.set(graph.center.x, graph.center.y, graph.center.z+100);
  var scene  = new THREE.Scene();
  var ah = new THREE.AxisHelper(200)
  var gh = new THREE.GridHelper(300, 60)
  gh.rotateZ(Math.PI)
  scene.add(ah)
  // scene.add(gh)
  var ambientLight = new THREE.AmbientLight( 0xaaaaaa, 0.7 );
  scene.add( ambientLight );
  // var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
  // camera.add( pointLight );
  scene.add( camera );

  console.log(scene)
  var controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.target.copy(graph.center)

  // TODO target change on pan -> wrong
  var centerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5,8,8),
    new THREE.MeshBasicMaterial({color: 'green'})
  )
  centerMesh.position.copy(graph.center);
  scene.add(centerMesh);

  scene.add(graph)

  // RENDER

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  animate();

}
