/*
 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * @author daron1337 / http://daron1337.github.com
 * Running this will allow you to drag and rotate three.js objects around the screen.
 */

THREE.DragControls = function (_camera, _domElement ) {

	var _plane = new THREE.Plane();
	var _raycaster = new THREE.Raycaster();

	var _mouse = new THREE.Vector2();
	var _offset = new THREE.Vector3();
	var _intersection = new THREE.Vector3();

	var _selected = null, _hovered = null;

	var sumRotationValue;
	var sumTranslationValue = new THREE.Vector3(0.0,0.0,0.0);
	var previousMousePosition;

	//

	var scope = this;

	function activate() {

		_domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
		_domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
		_domElement.addEventListener( 'mouseup', onDocumentMouseCancel, false );
		_domElement.addEventListener( 'mouseleave', onDocumentMouseCancel, false );
		_domElement.addEventListener( 'touchmove', onDocumentTouchMove, false );
		_domElement.addEventListener( 'touchstart', onDocumentTouchStart, false );
		_domElement.addEventListener( 'touchend', onDocumentTouchEnd, false );

	}

	function deactivate() {

		_domElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
		_domElement.removeEventListener( 'mousedown', onDocumentMouseDown, false );
		_domElement.removeEventListener( 'mouseup', onDocumentMouseCancel, false );
		_domElement.removeEventListener( 'mouseleave', onDocumentMouseCancel, false );
		_domElement.removeEventListener( 'touchmove', onDocumentTouchMove, false );
		_domElement.removeEventListener( 'touchstart', onDocumentTouchStart, false );
		_domElement.removeEventListener( 'touchend', onDocumentTouchEnd, false );

	}

	function dispose() {

		deactivate();

	}

	function setRotationAxis(rotationAxis) {

		scope.rotationAxis = rotationAxis;

	}

	function setCenterOfRotation(centerOfRotation) {

		scope.centerOfRotation = centerOfRotation;

	}

	function setObjects( objects ) {

		scope.objects = objects;

	}

	function onDocumentMouseMove( event ) {

		event.preventDefault();

		var rect = _domElement.getBoundingClientRect();

		_mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
		_mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

		_raycaster.setFromCamera( _mouse, _camera );
		_raycaster.ray.position = _raycaster.ray.origin;

		// Rotation
		if ( _selected && scope.rotate && scope.enabled) {

			if (!previousMousePosition) {
				previousMousePosition =  {
					x: event.offsetX,
					y: event.offsetY
				};
			}

			var deltaMove = {
        x: event.offsetX - previousMousePosition.x,
        y: event.offsetY - previousMousePosition.y
    	};

			var rotationValue = Math.abs(deltaMove.x) > Math.abs(deltaMove.y) ? deltaMove.x : deltaMove.y;
			rotationValue*=THREE.Math.DEG2RAD;
			if (rotationValue == 0) {
				return;
			}

			if (!sumRotationValue) {
				sumRotationValue = 0;
			}
			sumRotationValue += rotationValue;

			_selected.matrixAutoUpdate = false;

			var matrix 			 = new THREE.Matrix4();

			// 1 move the object to the pivot point
			_selected.geometry.computeBoundingBox();
			var bb_center = _selected.geometry.boundingBox.getCenter();
			var position  = _selected.position;

			matrix.makeTranslation(
				 position.x - scope.centerOfRotation.x,
				 position.y - scope.centerOfRotation.y,
				 position.z - scope.centerOfRotation.z
			);

			var objMatrix = matrix.clone();

			_selected.geometry.applyMatrix(matrix);

			// 2 make the rotation
			var q1 = new THREE.Quaternion();
			q1.setFromAxisAngle( scope.rotationAxis, rotationValue );
			matrix.makeRotationFromQuaternion( q1 );
			_selected.geometry.applyMatrix( matrix );

			objMatrix.premultiply( matrix );

			// 3 move the object to the original point
			matrix.makeTranslation(
				 scope.centerOfRotation.x - position.x,
				 scope.centerOfRotation.y - position.y,
				 scope.centerOfRotation.z - position.z
			);
			_selected.geometry.applyMatrix( matrix );

			objMatrix.premultiply( matrix );

			previousMousePosition = {
				x: event.offsetX,
				y: event.offsetY
			};

			scope.dispatchEvent( { type: 'rotate', object: _selected, matrix: objMatrix } );

			return;

		}

		if ( _selected && !scope.rotate && scope.enabled ) {

			var objTrMatrix = null;

			if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

				var oldPosition = _selected.position.clone();
				var newPosition = _intersection.sub( _offset );
				_selected.position.copy( newPosition );
				var translation = newPosition.sub( oldPosition );
				objTrMatrix = new THREE.Matrix4();
				objTrMatrix.makeTranslation( translation.x, translation.y, translation.z );

				sumTranslationValue.add( translation );

			}

			scope.dispatchEvent( { type: 'drag', object: _selected, matrix: objTrMatrix } );

			return;

		}

		_raycaster.setFromCamera( _mouse, _camera );
		_raycaster.ray.position = _raycaster.ray.origin;

		var targets = scope.objects ? scope.objects : [];
		var intersects = _raycaster.intersectObjects( targets );

		if ( intersects.length > 0 ) {

			var object = intersects[ 0 ].object;

			_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), object.position );

			if ( _hovered !== object ) {

				scope.dispatchEvent( { type: 'hoveron', object: object } );

				_domElement.style.cursor = 'pointer';
				_hovered = object;

			}

		} else {

			if ( _hovered !== null ) {

				scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

				_domElement.style.cursor = 'auto';
				_hovered = null;

			}

		}

	}

	function onDocumentMouseDown( event ) {

		event.preventDefault();

		_raycaster.setFromCamera( _mouse, _camera );
		_raycaster.ray.position = _raycaster.ray.origin;

		var targets = scope.objects ? scope.objects : [];
		var intersects = _raycaster.intersectObjects( targets );

		if ( intersects.length > 0 ) {

			_selected = intersects[ 0 ].object;

			if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

				_offset.copy( _intersection ).sub( _selected.position );

			}

			_domElement.style.cursor = 'move';

			scope.dispatchEvent( { type: 'dragstart', object: _selected } );

		}


	}

	function onDocumentMouseCancel( event ) {
		event.preventDefault();

		if ( _selected ) {

			if ( scope.rotate ) {

				var rotMatrix = new THREE.Matrix4();

				rotMatrix.makeTranslation(
					 _selected.position.x - scope.centerOfRotation.x,
					 _selected.position.y - scope.centerOfRotation.y,
					 _selected.position.z - scope.centerOfRotation.z
				);

				scope.matrix = rotMatrix.clone();

				var q1 = new THREE.Quaternion();
				q1.setFromAxisAngle( scope.rotationAxis, sumRotationValue );
				rotMatrix.makeRotationFromQuaternion( q1 );

				scope.matrix.premultiply( rotMatrix );

				// 3 move the object to the original point
				rotMatrix.makeTranslation(
					 scope.centerOfRotation.x - _selected.position.x,
					 scope.centerOfRotation.y - _selected.position.y,
					 scope.centerOfRotation.z - _selected.position.z
				);

				scope.matrix.premultiply( rotMatrix );

				previousMousePosition = null;
				sumRotationValue = null;
			}

			else {

				var trMatrix = new THREE.Matrix4();

				trMatrix.makeTranslation(
					sumTranslationValue.x,
					sumTranslationValue.y,
					sumTranslationValue.z
				);

				scope.matrix = trMatrix.clone();

				sumTranslationValue = new THREE.Vector3( 0.0, 0.0, 0.0 );
			}

			_selected = null;

			scope.dispatchEvent( { type: 'dragend', object: _selected } );

		}

		_domElement.style.cursor = 'auto';

	}

	function onDocumentTouchMove( event ) {

		event.preventDefault();
		event = event.changedTouches[ 0 ];

		var rect = _domElement.getBoundingClientRect();

		_mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
		_mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

		_raycaster.setFromCamera( _mouse, _camera );

		if ( _selected && scope.enabled ) {

			if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

				_selected.position.copy( _intersection.sub( _offset ) );

			}

			scope.dispatchEvent( { type: 'drag', object: _selected } );

			return;

		}

	}

	function onDocumentTouchStart( event ) {

		event.preventDefault();
		event = event.changedTouches[ 0 ];

		var rect = _domElement.getBoundingClientRect();

		_mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
		_mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

		_raycaster.setFromCamera( _mouse, _camera );

		var intersects = _raycaster.intersectObjects( scope.objects );

		if ( intersects.length > 0 ) {

			_selected = intersects[ 0 ].object;

			_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _selected.position );

			if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

				_offset.copy( _intersection ).sub( _selected.position );

			}

			_domElement.style.cursor = 'move';

			scope.dispatchEvent( { type: 'dragstart', object: _selected } );

		}


	}

	function onDocumentTouchEnd( event ) {

		event.preventDefault();

		if ( _selected ) {

			scope.dispatchEvent( { type: 'dragend', object: _selected } );

			_selected = null;

		}

		_domElement.style.cursor = 'auto';

	}

	activate();

	// API
	this.scene   = null;
	this.enabled = true;
	this.rotate  = false;
	this.rotationAxis     = new THREE.Vector3(0.0, 1.0, 0.0);
	this.centerOfRotation = new THREE.Vector3(10.0, 10.0, 0.0);
	this.matrix           = new THREE.Matrix4();

	this.activate            = activate;
	this.deactivate 				 = deactivate;
	this.dispose             = dispose;
	this.setRotationAxis     = setRotationAxis;
	this.setCenterOfRotation = setCenterOfRotation;
	this.setObjects 				 = setObjects;

	// Backward compatibility

	this.on = function ( type, listener ) {

		console.warn( 'THREE.DragControls: on() has been deprecated. Use addEventListener() instead.' );
		scope.addEventListener( type, listener );

	};

	this.off = function ( type, listener ) {

		console.warn( 'THREE.DragControls: off() has been deprecated. Use removeEventListener() instead.' );
		scope.removeEventListener( type, listener );

	};

	this.notify = function ( type ) {

		console.error( 'THREE.DragControls: notify() has been deprecated. Use dispatchEvent() instead.' );
		scope.dispatchEvent( { type: type } );

	};

};

THREE.DragControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.DragControls.prototype.constructor = THREE.DragControls;
