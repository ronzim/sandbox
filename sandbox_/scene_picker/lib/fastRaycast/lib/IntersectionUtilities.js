// From THREE.js Mesh raycast
var vA = new THREE.Vector3();
var vB = new THREE.Vector3();
var vC = new THREE.Vector3();

var uvA = new THREE.Vector2();
var uvB = new THREE.Vector2();
var uvC = new THREE.Vector2();

var barycoord = new THREE.Vector3();
var intersectionPoint = new THREE.Vector3();
var intersectionPointWorld = new THREE.Vector3();

function uvIntersection( point, p1, p2, p3, uv1, uv2, uv3 ) {

	THREE.Triangle.getBarycoord( point, p1, p2, p3, barycoord );

	uv1.multiplyScalar( barycoord.x );
	uv2.multiplyScalar( barycoord.y );
	uv3.multiplyScalar( barycoord.z );

	uv1.add( uv2 ).add( uv3 );

	return uv1.clone();

}

function checkIntersection( object, material, raycaster, ray, pA, pB, pC, point ) {

	var intersect;
	if ( material.side === THREE.BackSide ) {

		intersect = ray.intersectTriangle( pC, pB, pA, true, point );

	} else {

		intersect = ray.intersectTriangle( pA, pB, pC, material.side !== THREE.DoubleSide, point );

	}

	if ( intersect === null ) return null;

	intersectionPointWorld.copy( point );
	intersectionPointWorld.applyMatrix4( object.matrixWorld );

	var distance = raycaster.ray.origin.distanceTo( intersectionPointWorld );

	if ( distance < raycaster.near || distance > raycaster.far ) return null;

	return {
		distance: distance,
		point: intersectionPointWorld.clone(),
		object: object
	};

}

function checkBufferGeometryIntersection( object, raycaster, ray, position, uv, a, b, c ) {

	vA.fromBufferAttribute( position, a );
	vB.fromBufferAttribute( position, b );
	vC.fromBufferAttribute( position, c );

	var intersection = checkIntersection( object, object.material, raycaster, ray, vA, vB, vC, intersectionPoint );

	if ( intersection ) {

		if ( uv ) {

			uvA.fromBufferAttribute( uv, a );
			uvB.fromBufferAttribute( uv, b );
			uvC.fromBufferAttribute( uv, c );

			intersection.uv = uvIntersection( intersectionPoint, vA, vB, vC, uvA, uvB, uvC );

		}

		var normal = new THREE.Vector3();
		intersection.face = new THREE.Face3( a, b, c, THREE.Triangle.normal( vA, vB, vC, normal ) );
		intersection.faceIndex = a;

	}

	return intersection;

}

exports.uvIntersection = uvIntersection;
exports.checkIntersection = checkIntersection;
exports.checkBufferGeometryIntersection = checkBufferGeometryIntersection;
