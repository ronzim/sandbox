//================================//
//= CHANGE GEOMETRY ON KEYPRESS ==//
//================================//

var moveFunction = function(bufferGeom,key){

  switch (key ) {
		case 81: // Q
				bufferGeom.position.z += 0.5;
				break;
		case 82: // R
        bufferGeom.position.y += 0.5;
				break;
		case 87: // W
        bufferGeom.position.z -= 0.5;
				break;
		case 69: // E
        bufferGeom.position.y -= 0.5;
				break;
    case 84: // T
        bufferGeom.position.x += 0.5;
    		break;
    case 89: // Y
        bufferGeom.position.x -= 0.5;
        break;
    case 65: // A
        bufferGeom.rotation.x += 10 * Math.PI/180;
        break;
    case 83: // S
        bufferGeom.rotation.y += 10 * Math.PI/180;
        break;
    case 68: // D
        bufferGeom.rotation.z += 10 * Math.PI/180;
        break;
    default:
        console.log("X axis +/- : T/Y");
        console.log("Y axis +/- : E/R");
        console.log("Z axis +/- : Q/W");
        console.log("X axis rotation : A");
        console.log("Y axis rotation : S");
        console.log("Z axis rotation : D");
  }

  var update = function(){
    console.log("update");
    bufferGeom.updateMatrix();
    bufferGeom.geometry.applyMatrix(bufferGeom.matrix);
    bufferGeom.matrix.identity();
    bufferGeom.position.set(0,0,0);
    bufferGeom.rotation.set(0,0,0);
    bufferGeom.scale.set(1,1,1);
  }

  update();

  return bufferGeom;

}

exports.moveFunction = moveFunction;
