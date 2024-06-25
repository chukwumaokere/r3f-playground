import * as THREE from 'three'
import { Canvas, ThreeElements, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, FirstPersonControls, KeyboardControls, OrbitControls, PerspectiveCamera, PointerLockControls, Sky, useTexture } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { Physics, RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { useSpring, animated, config } from '@react-spring/three';
import { Player } from './Player';
import grass from './assets/grass.jpg';
import dirt from './assets/dirt.jpg';

function Box(props: ThreeElements['mesh'] & {color?: string}) {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null!)
  const { scale } = useSpring({ scale: active ? 1.5 : 1, config: config.wobbly })
  
  /* useFrame((_state, delta) => (meshRef.current.rotation.x += delta))
  useFrame((_state, delta) => (meshRef.current.rotation.y += delta)) */

  return (
    <RigidBody colliders={'hull'} restitution={0.01}>
      <animated.mesh
        {...props}
        ref={meshRef}
        scale={scale}
        onClick={() => setActive(!active)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : props.color || 'orange'} />
      </animated.mesh>
    </RigidBody>
  )
}

function DirtBox(props: ThreeElements['mesh'] & {color?: string}) {
  const [active, setActive] = useState(false);
  const [hover, set] = useState<number | null>(null)
  const onMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    set(Math.floor(e.faceIndex! / 2))
  }, [])
  const onOut = useCallback(() => set(null), [])
  const meshRef = useRef<THREE.Mesh>(null!)
  const { scale } = useSpring({ scale: active ? 1.5 : 1, config: config.wobbly })
  const texture = useTexture(dirt)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <RigidBody colliders={'hull'} type='fixed' gravityScale={0} >
      <animated.mesh
        {...props}
        ref={meshRef}
        scale={scale}
        onClick={() => setActive(!active)}
        receiveShadow
        rotation={props.rotation}
        rotation-x={-Math.PI / 2}
        onPointerMove={onMove}
        onPointerOut={onOut}
      >
        <boxGeometry args={[1, 1, 1]} />
        {[...Array(6)].map((_, index) => (
          <meshStandardMaterial attach={`material-${index}`} key={index} map={texture} color={hover === index ? "hotpink" : "white"} />
        ))}
      </animated.mesh>
    </RigidBody>
  )
}

function Floor(props: any) {
  const texture = useTexture(grass)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return (
    <RigidBody colliders={'hull'} restitution={Math.PI / 30} type="fixed">
      <mesh receiveShadow rotation={props.rotation} position={[0, 0, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={texture} map-repeat={[240, 240]} color={props.color} />
      </mesh>
    </RigidBody>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight color="white" intensity={Math.PI} position={[0, 0, 5]} castShadow />
      <spotLight penumbra={0.5} position={[10, 10, 5]} castShadow />
      {/* 
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} /> 
      */}
    </>
  )
}

function Camera() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={75} position={[0, 20, 50]} />
      {/* <CameraControls /> */}
      {/* <OrbitControls makeDefault /> */}
      <FirstPersonControls makeDefault />
    </>
  )
}

function Crosshair() {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      transform: 'translate3d(-50%, -50%, 0)',
      border: '2px solid white'
    }}></div>
  )
}

function Scene() {
  const { camera, gl } = useThree();

  const [boxes, setBoxes] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      // Get mouse coordinates in normalized device coordinates (NDC)
      const ndc = new THREE.Vector2();
      ndc.x = (event.clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Convert NDC to world coordinates
      const vector = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));


      // Set the click position and spawn a box 10 units in the Z direction
      setBoxes((prev) => {
        return [...prev, pos.clone().add(new THREE.Vector3(0, 0, 10))]
      });
    };

    // Add event listener to the canvas
    gl.domElement.addEventListener('pointerdown', handlePointerDown);

    // Clean up event listener on component unmount
    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [camera, gl]);

  return (
    <Physics gravity={[0, -9.8, 0]}>
      <Sky sunPosition={[100, 20, 100]} />
      <Lights />
      <Camera />
      <group>
        {boxes.map((position, index) => (
          <DirtBox key={index} position={position} />
        ))}
      </group>
      <group position={[0, 50, -5]}>
        <Box position={[-1, 0, 0]} color='green' />
        <Box position={[1, 0, 0]} color="red" />
      </group>
      <Floor rotation={[Math.PI / -2, 0, 0]} color="green"  />
      <Player />
    </Physics>
  );
}

function App() {
  return (
    <>
    <KeyboardControls  map={[
        { name: "forward", keys: ["ArrowUp", "w", "W"] },
        { name: "backward", keys: ["ArrowDown", "s", "S"] },
        { name: "left", keys: ["ArrowLeft", "a", "A"] },
        { name: "right", keys: ["ArrowRight", "d", "D"] },
        { name: "jump", keys: ["Space"] },
        { name: "sprint", keys: ["ShiftLeft"]},
        { name: "crouch", keys: ["ControlLeft"]}
      ]}>
      <Canvas shadows>
        <Suspense>
          <Scene />
        </Suspense>
        <PointerLockControls />
        {/* <EffectComposer>
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer> */}
      </Canvas>
      <Crosshair />
    </KeyboardControls>
    </>
  )
}

export default App
