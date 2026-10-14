"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, MeshDistortMaterial, Line } from "@react-three/drei"
import * as THREE from "three"

// ---------------------------------------------------------------------------
// Floating particles that drift gently in the background
// ---------------------------------------------------------------------------
function ParticleField({ count = 300 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!)

  const [positions, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const col = new Float32Array(count * 3)

    const palette = [
      new THREE.Color("#9c87ff"), // violet
      new THREE.Color("#7159df"), // deep violet
      new THREE.Color("#b8aafd"), // light violet
      new THREE.Color("#5c9be9"), // blue
      new THREE.Color("#58ac82"), // green
      new THREE.Color("#eb9b52"), // orange
    ]

    for (let i = 0; i < count; i++) {
      // Spread in a wide disc shape
      const theta = Math.random() * Math.PI * 2
      const r = 2 + Math.random() * 8
      const y = (Math.random() - 0.5) * 4

      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(theta) * r - 3

      sz[i] = 0.015 + Math.random() * 0.04

      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, sz, col]
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.12
    const geom = mesh.current.geometry
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      // Gentle circular drift
      const x0 = positions[ix]
      const y0 = positions[ix + 1]
      const z0 = positions[ix + 2]
      arr[ix] = x0 + Math.sin(t + i * 0.1) * 0.3
      arr[ix + 1] = y0 + Math.cos(t * 0.7 + i * 0.15) * 0.2
      arr[ix + 2] = z0 + Math.sin(t * 0.5 + i * 0.08) * 0.15
    }
    posAttr.needsUpdate = true
    mesh.current.rotation.y = t * 0.15
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.slice(), 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ---------------------------------------------------------------------------
// Glowing orb in the center – morphing distorted sphere
// ---------------------------------------------------------------------------
function GlowOrb() {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    meshRef.current.rotation.x = t * 0.15
    meshRef.current.rotation.z = t * 0.1
  })

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={[1.5, 0.2, -1]}>
        <icosahedronGeometry args={[1.6, 20]} />
        <MeshDistortMaterial
          color="#8069ee"
          emissive="#6048c9"
          emissiveIntensity={0.35}
          roughness={0.3}
          metalness={0.2}
          distort={0.35}
          speed={1.8}
          transparent
          opacity={0.18}
        />
      </mesh>
    </Float>
  )
}

// ---------------------------------------------------------------------------
// Orbital rings – glowing translucent torus knots
// ---------------------------------------------------------------------------
function OrbitalRing({
  radius,
  tube,
  rotation,
  color,
  speed,
}: {
  radius: number
  tube: number
  rotation: [number, number, number]
  color: string
  speed: number
}) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    ref.current.rotation.z = rotation[2] + t * speed
  })

  return (
    <mesh ref={ref} position={[1.5, 0.2, -1.5]} rotation={rotation}>
      <torusGeometry args={[radius, tube, 64, 100]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Connection lines – thin glowing lines between random points
// ---------------------------------------------------------------------------
function ConnectionLine({
  points,
  color,
}: {
  points: THREE.Vector3[]
  color: string
}) {
  const curvePoints = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      points[0],
      points[1],
      points[2]
    )
    return curve.getPoints(30).map((p) => [p.x, p.y, p.z] as [number, number, number])
  }, [points])

  return (
    <Line
      points={curvePoints}
      color={color}
      lineWidth={0.5}
      transparent
      opacity={0.12}
      depthWrite={false}
    />
  )
}

function ConnectionLines({ count = 18 }: { count?: number }) {
  const linesRef = useRef<THREE.Group>(null!)

  const lineData = useMemo(() => {
    const data: { points: THREE.Vector3[]; color: string }[] = []
    const colors = ["#9c87ff", "#5c9be9", "#58ac82", "#b8aafd"]

    for (let i = 0; i < count; i++) {
      const theta1 = Math.random() * Math.PI * 2
      const r1 = 2 + Math.random() * 5
      const y1 = (Math.random() - 0.5) * 3

      const theta2 = theta1 + (Math.random() - 0.5) * 1.5
      const r2 = r1 + (Math.random() - 0.5) * 3
      const y2 = y1 + (Math.random() - 0.5) * 2

      data.push({
        points: [
          new THREE.Vector3(Math.cos(theta1) * r1, y1, Math.sin(theta1) * r1 - 3),
          new THREE.Vector3(
            (Math.cos(theta1) * r1 + Math.cos(theta2) * r2) / 2,
            (y1 + y2) / 2 + (Math.random() - 0.5) * 0.8,
            (Math.sin(theta1) * r1 + Math.sin(theta2) * r2) / 2 - 3
          ),
          new THREE.Vector3(Math.cos(theta2) * r2, y2, Math.sin(theta2) * r2 - 3),
        ],
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
    return data
  }, [count])

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <group ref={linesRef}>
      {lineData.map((line, i) => (
        <ConnectionLine key={i} points={line.points} color={line.color} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Floating micro-nodes – small glowing spheres at network intersections
// ---------------------------------------------------------------------------
function FloatingNodes({ count = 12 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null!)

  const nodeData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 6 - 3,
      ] as [number, number, number],
      scale: 0.03 + Math.random() * 0.06,
      speed: 0.5 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2,
    }))
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const data = nodeData[i]
      if (!data) return
      child.position.y =
        data.position[1] + Math.sin(t * data.speed + data.offset) * 0.3
    })
  })

  return (
    <group ref={groupRef}>
      {nodeData.map((node, i) => (
        <mesh key={i} position={node.position} scale={node.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color="#b8aafd"
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Main exported scene — wraps everything in a Canvas
// ---------------------------------------------------------------------------
export default function HeroScene() {
  return (
    <div
      className="hero-three-canvas"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.3} color="#9c87ff" />
        <pointLight position={[-5, -3, 3]} intensity={0.2} color="#5c9be9" />

        <ParticleField count={280} />
        <GlowOrb />
        <OrbitalRing
          radius={3.2}
          tube={0.008}
          rotation={[-0.5, 0, 0]}
          color="#9c87ff"
          speed={0.05}
        />
        <OrbitalRing
          radius={2.5}
          tube={0.006}
          rotation={[0.4, 0.8, 0]}
          color="#5c9be9"
          speed={-0.03}
        />
        <ConnectionLines count={20} />
        <FloatingNodes count={14} />
      </Canvas>
    </div>
  )
}
