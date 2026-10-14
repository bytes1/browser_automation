"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

// Pulsing star-field for the dark closing section
function Stars({ count = 150 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!)

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    const palette = [
      new THREE.Color("#c9bfff"),
      new THREE.Color("#a999ff"),
      new THREE.Color("#8069ee"),
      new THREE.Color("#ffffff"),
    ]

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2

      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [count])

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.03
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Glowing ring that slowly rotates
function GlowRing() {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    ref.current.rotation.z = state.clock.elapsedTime * 0.08
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.15
  })

  return (
    <mesh ref={ref} position={[2, 0, -2]}>
      <torusGeometry args={[2.8, 0.015, 32, 100]} />
      <meshBasicMaterial
        color="#a999ff"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function ClosingScene() {
  return (
    <div className="closing-three-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <Stars count={120} />
        <GlowRing />
      </Canvas>
    </div>
  )
}

