import * as THREE from 'three'
import { Canvas, ThreeElements, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useRef, useState } from 'react';
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { Physics, RigidBody } from "@react-three/rapier";

function Box(props: ThreeElements['mesh'] & {color?: string}) {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null!)
  
  /* useFrame((_state, delta) => (meshRef.current.rotation.x += delta))
  useFrame((_state, delta) => (meshRef.current.rotation.y += delta)) */

  return (
    <RigidBody colliders={'hull'} restitution={0.01}>
      <mesh
        {...props}
        ref={meshRef}
        scale={active ? 1.5 : 1}
        onClick={() => setActive(!active)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : props.color || 'orange'} />
      </mesh>
    </RigidBody>
  )
}

function Floor() {
  return (
    <RigidBody colliders={'hull'} gravityScale={0} restitution={1}>
      <mesh position={[0, 0, -50]}>
        <boxGeometry args={[100, 1, 100]} />
        <meshStandardMaterial color="green" />
      </mesh>
    </RigidBody>
  )
}

function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight color="white" intensity={Math.PI} position={[0, 0, 5]} />
      {/* <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} /> */}
      <PerspectiveCamera makeDefault fov={75} position={[0, 20, 50]} />
      <OrbitControls makeDefault />
      <Suspense>
        <Physics debug>
          <group position={[0, 50, -50]}>
            <Box position={[-1, 0, 0]} color='green' />
            <Box position={[1, 0, 0]} />
          </group>
          <Floor />
        </Physics>
      </Suspense>
      <EffectComposer>
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}

export default App
