var path = require('path');
var rpc  = require("./rpc");
var uuid = require("uuid");
var TrackballControls = require( path.join( rootPath, 'lib', 'TrackballControls.js'));

var initScene = function() {

  //================================//
  //====== SCENE SETUP =============//
  //================================//

  var renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
  document.getElementById("canvas-container").appendChild(renderer.domElement)
  renderer.setClearColor( 0xFFFFFF, 1 );
  renderer.setSize(2048,2048);

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 10;
  camera.position.y = 10;
  camera.position.x = 10;
  camera.lookAt(2,0,0);

  var control = new THREE.TrackballControls( camera, renderer.domElement );

  var light = new THREE.AmbientLight( 0x555555, 1 );
  scene.add(light);
  var directionalLight = new THREE.PointLight( 0xffffff, 1 );
  directionalLight.position.set (0,50,50);
  scene.add(directionalLight);
  var pointLight = new THREE.PointLight( 0xffffff, 0.1 );
  pointLight.position.set (0,-50,50);
  scene.add(pointLight);


  //================================//
  //====== SCENE CONTENT ===========//
  //================================//

  var gridPlane     = new THREE.GridHelper(30,50);
  var gridPlaneAxis = new THREE.AxisHelper(20);
  scene.add(gridPlane);
  scene.add(gridPlaneAxis);

  var sphereGeometry = new THREE.SphereGeometry(0.5,32,32);
  var sphereMaterial = new THREE.MeshBasicMaterial({wireframe:false, color:'red'});
  var sphereMesh     = new THREE.Mesh(sphereGeometry, sphereMaterial);

  scene.add(sphereMesh);

  // var strMime = "image/jpeg";
  // var imgData = renderer.domElement.toDataURL(strMime);
  // var fs = require('fs-extra');
  // fs.writeFileSync('./snap.jpeg', imgData);

  //================================//
  //=======RENDER FUNCTION==========//
  //================================//

  function render() {
  	requestAnimationFrame( render );
    control.update(0.5);
  	renderer.render( scene, camera );
  }

  render();

  console.log(renderer)

  var fs = require('fs-extra')

  // function download(filename, text) {
  //   var element = document.createElement('a');
  //   element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  //   element.setAttribute('download', filename);
  //
  //   element.style.display = 'none';
  //   document.body.appendChild(element);
  //
  //   element.click();
  //
  //   document.body.removeChild(element);
  // }
  //
  // // Start file download.
  // download("hello.txt","This is the content of my file :)");

  // renderer.domElement.toBlob(function(blob){
  //     console.log(blob)
  //     var a = document.createElement('a');
  //     var url = URL.createObjectURL(blob);
  //     console.log(url)
  //
  //     a.href = url;
  //     a.download = 'canvas.png';
  //     a.click();
  //
  //     // var imageBuffer = blob.buffer;
  //     // var imageName = '/Users/orobix/Desktop/img.png';
  //     // fs.createWriteStream(imageName).write(imageBuffer);
  //
  //     // var img = blobToFile(blob, imageName)
  //     // console.log(img)
  //
  //     var reader = new FileReader();
  //     reader.readAsArrayBuffer(blob);
  //     reader.addEventListener("loadend", function() {
  //        // reader.result contains the contents of blob as a typed array
  //        console.log('done', reader.result)
  //        fs.writeSync('/Users/orobix/Desktop/img.png', reader.result)
  //     });
  //
  //
  //
  //   }, 'image/png', 1.0);

// var strDownloadMime = "image/octet-stream";
//
//   saveAsImage()
//
//     function saveAsImage() {
//         var imgData, imgNode;
//
//         try {
//             var strMime = "image/jpeg";
//             imgData = renderer.domElement.toDataURL(strMime);
//
//             saveFile(imgData.replace(strMime, strDownloadMime), "test.jpg");
//
//         } catch (e) {
//             console.log(e);
//             return;
//         }
//
//     }
//
//     function saveFile(strData, filename) {
//
//         console.log(strData);
//
//         // Split the base64 string in data and contentType
//         var block = strData.split(";");
//         // Get the content type of the image
//         var contentType = block[0].split(":")[1];// In this case "image/gif"
//         // get the real base64 content of the file
//         var realData = block[1].split(",")[1];// In this case "R0lGODlhPQBEAPeoAJosM...."
//
//         // Convert it to a blob to upload
//         var blob = b64toBlob(realData, contentType);
//         console.log(blob)
//
//         // fs.createWriteStream('/Users/orobix/Desktop/img.png').write(blob)
//         fs.writeFileSync('/Users/orobix/Desktop/img.png', strData)
//
//         // var link = document.createElement('a');
//         // if (typeof link.download === 'string') {
//         //     document.body.appendChild(link); //Firefox requires the link to be in the body
//         //     link.download = filename;
//         //     link.href = strData;
//         //     link.click();
//         //     document.body.removeChild(link); //remove the link when done
//         // } else {
//         //     location.replace(uri);
//         // }
//     }
//
//     function b64toBlob(b64Data, contentType, sliceSize) {
//         contentType = contentType || '';
//         sliceSize = sliceSize || 512;
//
//         var byteCharacters = atob(b64Data);
//         var byteArrays = [];
//
//         for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
//             var slice = byteCharacters.slice(offset, offset + sliceSize);
//
//             var byteNumbers = new Array(slice.length);
//             for (var i = 0; i < slice.length; i++) {
//                 byteNumbers[i] = slice.charCodeAt(i);
//             }
//
//             var byteArray = new Uint8Array(byteNumbers);
//
//             byteArrays.push(byteArray);
//         }
//
//       var blob = new Blob(byteArrays, {type: contentType});
//       return blob;
    // }

  //   function downloadURI(uri, name) {
  //     var link = document.createElement("a");
  //     link.download = name;
  //     link.href = uri;
  //     // document.body.appendChild(link);
  //     link.click();
  //     // document.body.removeChild(link);
  //     delete link;
  //   }
  //
  //   function blobToFile(theBlob, fileName){
  //     //A Blob() is almost a File() - it's just missing the two properties below which we will add
  //     theBlob.lastModifiedDate = new Date();
  //     theBlob.name = fileName;
  //     return theBlob;
  //   }


  function snapshot() {
    // var canvas          = document.getElementById('app-container');
    var canvas = renderer.domElement
    console.log(canvas)

    var dataURL         = canvas.toDataURL();
    var data            = dataURL.substr( dataURL.indexOf( ',' ) + 1 );
    var buffer          = new Buffer( data, 'base64' );

    var filename = 'aaaa';
    var snapshotsFolder = "/Users/orobix/Desktop"
    var filepath = path.join( snapshotsFolder, filename ) + '.png';

    console.log(filepath);

    fs.writeFile(filepath, buffer.toString('binary'), 'binary', (err) => {
      if (err) {
        console.warn('cannot write file', err)
      };
      console.log('saved');
    });

  }

  snapshot()
};

exports.render = initScene;
