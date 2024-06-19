import * as THREE from 'three'
import { Canvas, ThreeElements, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef, useState } from 'react';

function Box(props: ThreeElements['mesh']) {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((_state, delta) => (meshRef.current.rotation.x += delta))
  useFrame((_state, delta) => (meshRef.current.rotation.y += delta))

  return (
      <mesh
        {...props}
        ref={meshRef}
        scale={active ? 1.5 : 1}
        onClick={() => setActive(!active)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
      </mesh>
  )
}

function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <PerspectiveCamera makeDefault fov={75} position={[0, 0, 5]} />
      <OrbitControls makeDefault />
      <group position={[0, 0, 0]}>
        <Box position={[-1, 0, 0]} />
        <Box position={[1, 0, 0]} />
      </group>
    </Canvas>
  )
}

export default App
