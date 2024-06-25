import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d-compat"
import { useRef } from "react"
import { Vector3, useFrame } from "@react-three/fiber"
import { useKeyboardControls } from "@react-three/drei"
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier"

const SPEED = 5;
const direction = new THREE.Vector3()
const frontVector = new THREE.Vector3()
const sideVector = new THREE.Vector3()
const rotation = new THREE.Vector3()

export function Player({ lerp = THREE.MathUtils.lerp }) {
    const ref = useRef<RAPIER.RigidBody | null>(null);
    const rapier = useRapier()
    const [, get] = useKeyboardControls()
    useFrame((state) => {
      const { forward, backward, left, right, jump, sprint, crouch } = get()
      if (ref.current) {
        const speed = (sprint ? SPEED * 2 : SPEED) * (crouch ? 0.5 : 1)
        // update camera
        const velocity = ref.current.linvel();
        state.camera.position.set(ref.current.translation().x, ref.current.translation().y, ref.current.translation().z)
        // movement
        frontVector.set(0, 0, Number(backward) - Number(forward))
        sideVector.set(Number(left) - Number(right), 0, 0)
        direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(speed).applyEuler(state.camera.rotation)
        ref.current?.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, false)
        // jumping
        const world = rapier.world;
        const ray = world.castRay(new RAPIER.Ray(ref.current?.translation(), { x: 0, y: -1, z: 0 }), 1.75, false)
        const grounded = ray && ray.collider && Math.abs(ray.timeOfImpact) <= 1.75
        if (jump && grounded) ref.current?.setLinvel({ x: 0, y: 7.5, z: 0 }, false)
      }
    })
    return (
      <>
        <RigidBody ref={ref} colliders={false} mass={1} type="dynamic" position={[0, 10, 0]} enabledRotations={[false, false, false]}>
          <CapsuleCollider args={[0.75, 0.5]} />
        </RigidBody>
      </>
    )
  }