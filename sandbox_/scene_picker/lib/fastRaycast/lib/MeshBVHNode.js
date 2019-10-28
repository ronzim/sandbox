var intersectTris = require('./GeometryUtilities').intersectTris;
var intersectClosestTri = require('./GeometryUtilities').intersectClosestTri;
var arrayToBox = require('./BoundsUtilities').arrayToBox;

const boundingBox = new THREE.Box3();
const boxIntersection = new THREE.Vector3();
const xyzFields = [ 'x', 'y', 'z' ];

// export default
class MeshBVHNode {

	constructor() {

		this.boundingData = null;
		this.geometry = null;
		this.tris = null;
		this.children = null;
		this.splitAxis = - 1;

	}

	intersectRay( ray, target ) {

		arrayToBox( this.boundingData, boundingBox );

		return ray.intersectBox( boundingBox, target );

	}

	raycast( mesh, raycaster, ray, intersects, seenFaces ) {

		if ( this.tris ) intersectTris( mesh, this.geometry, raycaster, ray, this.tris, intersects, seenFaces );
		else this.children.forEach( c => {

			if ( c.intersectRay( ray, boxIntersection ) )
				c.raycast( mesh, raycaster, ray, intersects, seenFaces );

		} );

	}

	raycastFirst( mesh, raycaster, ray ) {

		if ( this.tris ) {

			return intersectClosestTri( mesh, this.geometry, raycaster, ray, this.tris );

		} else {

			// consider the position of the split plane with respect to the oncoming ray; whichever direction
			// the ray is coming from, look for an intersection among that side of the tree first

			const leftToRight = ray.direction[ xyzFields[ this.splitAxis ] ] <= 0;
			const c1 = leftToRight ? this.children[ 0 ] : this.children[ 1 ];
			const c2 = leftToRight ? this.children[ 1 ] : this.children[ 0 ];

			const c1Intersection = c1.intersectRay( ray, boxIntersection );
			const c1Result = c1Intersection ? c1.raycastFirst( mesh, raycaster, ray ) : null;
			const c2Intersection = c2.intersectRay( ray, boxIntersection );

			// if we got an intersection in the first node and it's closer than the second node's bounding
			// box, we don't need to consider the second node because it couldn't possibly be a better result

			if ( c1Result && c2Intersection ) {

				if ( c1Result.distance * c1Result.distance <= ray.origin.distanceToSquared( c2Intersection ) ) {

					return c1Result;

				}

			}

			// either there was no intersection in the first node, or there could still be a closer
			// intersection in the second, so check the second node and then take the better of the two

			const c2Result = c2Intersection ? c2.raycastFirst( mesh, raycaster, ray ) : null;

			if ( c1Result && c2Result ) {

				return c1Result.distance <= c2Result.distance ? c1Result : c2Result;

			} else {

				return c1Result || c2Result || null;

			}

		}

	}

}

exports.MeshBVHNode = MeshBVHNode;
