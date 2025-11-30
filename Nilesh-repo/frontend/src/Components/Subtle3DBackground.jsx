"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useRef } from "react"

function FloatingShapes() {
  const groupRef = useRef(null)
  const cubeRef = useRef(null)
  const sphereRef = useRef(null)
  const octaRef = useRef(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = clock.getElapsedTime() * 0.15
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.08
    }

    /* Enhanced individual shape animations for more movement */
    if (cubeRef.current) {
      cubeRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 2
      cubeRef.current.rotation.z += 0.01
    }
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.cos(clock.getElapsedTime() * 0.6) * 2.5
      sphereRef.current.rotation.x += 0.008
    }
    if (octaRef.current) {
      octaRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 1.5
      octaRef.current.rotation.y += 0.015
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={cubeRef} position={[-3, 0, -5]} scale={2}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          color="#00d4ff"
          opacity={0.35}
          transparent
          emissive="#00d4ff"
          emissiveIntensity={0.5}
          wireframe={false}
        />
      </mesh>

      <mesh ref={sphereRef} position={[3, 1, -5]} scale={1.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhongMaterial color="#ffd700" opacity={0.32} transparent emissive="#ffd700" emissiveIntensity={0.45} />
      </mesh>

      <mesh ref={octaRef} position={[0, -1, -5]} scale={1.5}>
        <octahedronGeometry />
        <meshPhongMaterial
          color="#00ffcc"
          opacity={0.3}
          transparent
          wireframe={false}
          emissive="#00ffcc"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Additional floating accent shapes */}
      <mesh position={[-1.5, 2, -3]} scale={0.6} rotation={[0.5, 0.5, 0.5]}>
        <tetrahedronGeometry />
        <meshPhongMaterial color="#00d4ff" opacity={0.25} transparent emissive="#00d4ff" emissiveIntensity={0.3} />
      </mesh>

      <mesh position={[2, -2, -3]} scale={0.8} rotation={[0.3, 0.8, 0.2]}>
        <icosahedronGeometry />
        <meshPhongMaterial color="#ffd700" opacity={0.2} transparent emissive="#ffd700" emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

export default function Subtle3DBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.2} />
      <pointLight position={[5, 5, 8]} intensity={1} color="#00d4ff" />
      <pointLight position={[-5, -5, 8]} intensity={0.8} color="#ffd700" />
      <pointLight position={[0, 0, 10]} intensity={0.6} color="#00ffcc" />
      <FloatingShapes />
    </Canvas>
  )
}
