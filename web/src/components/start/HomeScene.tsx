"use client";
// The Start page's 3D picture: a small home on a green island with a heart floating above it. Everything is built from
// plain shapes in code (no downloaded models, nothing fetched), coloured from the tokens in tokens.css.
// Drag sideways to turn it; it springs back. Loaded only by Hero3D, after the page has shown.
import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei/core/Float";
import { PresentationControls } from "@react-three/drei/web/PresentationControls";
import { useMemo, useState } from "react";
import * as THREE from "three";

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.35);
  s.bezierCurveTo(-0.05, -0.28, -0.45, -0.05, -0.42, 0.18);
  s.bezierCurveTo(-0.4, 0.38, -0.12, 0.42, 0, 0.22);
  s.bezierCurveTo(0.12, 0.42, 0.4, 0.38, 0.42, 0.18);
  s.bezierCurveTo(0.45, -0.05, 0.05, -0.28, 0, -0.35);
  return s;
}

function Home() {
  const c = useMemo(() => ({
    island: token("--sage"), walls: token("--bg-surface"), roof: token("--primary"), door: token("--text-primary"),
    window: token("--on-hero-muted"), trunk: token("--text-secondary"), heart: token("--on-hero-muted"),
  }), []);
  const heart = useMemo(() => new THREE.ExtrudeGeometry(heartShape(), { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), []);
  const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    <meshStandardMaterial color={color} flatShading roughness={0.85} {...extra} />;

  return (
    <group position={[0, -0.95, 0]}>
      <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[1.7, 1.5, 0.24, 10]} />{mat(c.island)}</mesh>
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.2, 0.9, 1]} />{mat(c.walls)}</mesh>
      <mesh position={[0, 1.22, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.05, 0.65, 4]} />{mat(c.roof)}</mesh>
      <mesh position={[0, 0.3, 0.51]}><boxGeometry args={[0.28, 0.5, 0.04]} />{mat(c.door)}</mesh>
      <mesh position={[0.38, 0.55, 0.51]}><boxGeometry args={[0.24, 0.22, 0.04]} />{mat(c.window, { emissive: c.window, emissiveIntensity: 0.6 })}</mesh>
      <mesh position={[-0.38, 0.55, 0.51]}><boxGeometry args={[0.24, 0.22, 0.04]} />{mat(c.window, { emissive: c.window, emissiveIntensity: 0.6 })}</mesh>
      <group position={[1.15, 0, 0.35]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.06, 0.08, 0.4, 6]} />{mat(c.trunk)}</mesh>
        <mesh position={[0, 0.62, 0]}><coneGeometry args={[0.32, 0.7, 7]} />{mat(c.island)}</mesh>
      </group>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2} floatingRange={[0, 0.25]}>
        <mesh geometry={heart} position={[0, 1.95, 0]} rotation={[Math.PI, 0, Math.PI]} scale={0.6}>
          {mat(c.heart, { emissive: c.heart, emissiveIntensity: 0.35 })}
        </mesh>
      </Float>
    </group>
  );
}

/** `paused` stops drawing while the picture is scrolled out of view, to save battery on older phones. */
export function HomeScene({ paused }: { paused: boolean }) {
  const [ready, setReady] = useState(false);
  return (
    <Canvas className={ready ? "scene shown" : "scene"} frameloop={paused ? "never" : "always"} dpr={[1, 2]}
      camera={{ position: [0, 1.2, 5.4], fov: 40 }} gl={{ antialias: true, alpha: true }}
      onCreated={() => setReady(true)} aria-hidden="true" style={{ touchAction: "pan-y" }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <PresentationControls global={false} snap rotation={[0, -0.35, 0]} polar={[0, 0]} azimuth={[-0.9, 0.9]} speed={1.4}>
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4} floatingRange={[-0.05, 0.05]}>
          <Home />
        </Float>
      </PresentationControls>
    </Canvas>
  );
}
