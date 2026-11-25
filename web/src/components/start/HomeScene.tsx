"use client";
// The Start page's 3D picture: a home on a green island, two people at the door, a heart above. It builds itself piece
// by piece on load, leans toward the pointer anywhere over the hero, and turns when dragged (it springs back).
// Built from plain shapes in code (no downloaded models, nothing fetched), coloured from the tokens in tokens.css.
// Loaded only by Hero3D, after the page has shown.
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei/core/Float";
import { PresentationControls } from "@react-three/drei/web/PresentationControls";
import { useMemo, useRef, useState, type ReactNode } from "react";
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

/** A soft round shadow, drawn once into a small texture (cheaper than drei's ContactShadows on older phones). */
function softShadow(color: string) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, color); grad.addColorStop(0.55, color); grad.addColorStop(1, "transparent");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

/** Pops its children in after `delay` seconds: a short drop with a little overshoot, so the home "builds up". */
function Rise({ delay, children }: { delay: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    start.current ??= clock.elapsedTime;
    const k = Math.min(1, Math.max(0, (clock.elapsedTime - start.current - delay) / 0.55));
    const back = 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2;       // ease-out-back
    g.scale.setScalar(k === 0 ? 0.0001 : back);
    g.position.y = (1 - k) * 0.6;
  });
  return <group ref={ref} scale={0.0001}>{children}</group>;
}

/** Leans the whole scene toward the pointer, a few degrees at most. */
function Lean({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pointer.x * 0.35, 0.06);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.08, 0.06);
  });
  return <group ref={ref}>{children}</group>;
}

/** Three puffs rising from the chimney and fading, on a loop. */
function Smoke({ color }: { color: string }) {
  const puffs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    puffs.current.forEach((m, i) => {
      if (!m) return;
      const k = ((clock.elapsedTime * 0.35 + i / 3) % 1);
      m.position.set(0.25 * k + Math.sin(k * 4 + i) * 0.04, k * 0.6, -0.1 * k);
      m.scale.setScalar(0.05 + k * 0.08);
      (m.material as THREE.MeshStandardMaterial).opacity = 0.5 * (1 - k);
    });
  });
  return (
    <group position={[0.42, 1.45, -0.25]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => { puffs.current[i] = m; }}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={color} transparent depthWrite={false} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Home() {
  const c = useMemo(() => ({
    grass: token("--sage"), soil: token("--text-secondary"), walls: token("--bg-surface"), roof: token("--primary"),
    roofEdge: token("--primary-hover"), door: token("--text-primary"), glow: token("--on-hero-muted"), stone: token("--bg-sunken"),
    trunk: token("--text-secondary"), coatA: token("--text-heading"), coatB: token("--banner"), skin: token("--on-hero-muted"),
    flower: token("--on-hero-muted"),
  }), []);
  const shadow = useMemo(() => softShadow(c.door), [c.door]);
  const heart = useMemo(() => new THREE.ExtrudeGeometry(heartShape(), { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), []);
  const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    <meshStandardMaterial color={color} flatShading roughness={0.85} {...extra} />;
  const lit = { emissive: c.glow, emissiveIntensity: 0.9 };
  const person = (x: number, z: number, coat: string, h: number) => (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.16 * h, 0]}><capsuleGeometry args={[0.085, 0.18 * h, 4, 8]} />{mat(coat)}</mesh>
      <mesh position={[0, 0.36 * h + 0.04, 0]}><sphereGeometry args={[0.075, 12, 10]} />{mat(c.skin)}</mesh>
    </group>
  );

  return (
    <group position={[0, -0.85, 0]}>
      <Rise delay={0}>
        <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[1.85, 1.85, 0.14, 12]} />{mat(c.grass)}</mesh>
        <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[1.85, 1.45, 0.24, 12]} />{mat(c.soil)}</mesh>
      </Rise>
      <Rise delay={0.25}>
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.2, 0.9, 1]} />{mat(c.walls)}</mesh>
        <mesh position={[0, 0.28, 0.51]}><boxGeometry args={[0.28, 0.5, 0.04]} />{mat(c.door)}</mesh>
        <mesh position={[0.36, 0.5, 0.51]}><boxGeometry args={[0.24, 0.22, 0.04]} />{mat(c.glow, lit)}</mesh>
        <mesh position={[-0.36, 0.5, 0.51]}><boxGeometry args={[0.24, 0.22, 0.04]} />{mat(c.glow, lit)}</mesh>
        <pointLight position={[0, 0.5, 0.9]} color={c.glow} intensity={1.4} distance={2.2} />
      </Rise>
      <Rise delay={0.5}>
        <mesh position={[0, 1.17, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.05, 0.65, 4]} />{mat(c.roof)}</mesh>
        <mesh position={[0.42, 1.25, -0.25]}><boxGeometry args={[0.16, 0.36, 0.16]} />{mat(c.roofEdge)}</mesh>
        <Smoke color={c.walls} />
      </Rise>
      <Rise delay={0.7}>
        <group position={[1.25, 0, 0.3]}>
          <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.06, 0.08, 0.36, 6]} />{mat(c.trunk)}</mesh>
          <mesh position={[0, 0.6, 0]}><coneGeometry args={[0.34, 0.72, 7]} />{mat(c.grass)}</mesh>
        </group>
        <group position={[-1.3, 0, -0.35]}>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.05, 0.06, 0.24, 6]} />{mat(c.trunk)}</mesh>
          <mesh position={[0, 0.42, 0]}><coneGeometry args={[0.24, 0.5, 7]} />{mat(c.grass)}</mesh>
        </group>
      </Rise>
      <Rise delay={0.85}>
        {[[0, 0.75], [0.05, 1.05], [-0.02, 1.35]].map(([x, z], i) => (
          <mesh key={i} position={[x!, -0.04, z!]}><cylinderGeometry args={[0.13, 0.13, 0.03, 8]} />{mat(c.stone)}</mesh>
        ))}
        {[[-0.55, 0.62], [-0.72, 0.58], [0.58, 0.62], [0.74, 0.55]].map(([x, z], i) => (
          <mesh key={i} position={[x!, 0.04, z!]}><sphereGeometry args={[0.06, 8, 6]} />{mat(i % 2 ? c.roof : c.flower)}</mesh>
        ))}
      </Rise>
      <Rise delay={1.05}>
        {person(-0.32, 1.05, c.coatA, 1)}
        {person(0.3, 1.1, c.coatB, 0.85)}
      </Rise>
      <Rise delay={1.3}>
        <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2} floatingRange={[0, 0.2]}>
          <mesh geometry={heart} position={[-0.25, 2.05, 0.1]} rotation={[Math.PI, 0, Math.PI]} scale={0.55}>
            {mat(c.glow, { emissive: c.glow, emissiveIntensity: 0.45 })}
          </mesh>
        </Float>
      </Rise>
      <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.75, 1]}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshBasicMaterial map={shadow} transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** `paused` stops drawing while the picture is scrolled out of view, to save battery on older phones.
 *  `source` is the element whose pointer moves the scene (the whole hero, not just the canvas). */
export function HomeScene({ paused, source }: { paused: boolean; source?: HTMLElement | null }) {
  const [ready, setReady] = useState(false);
  return (
    <Canvas className={ready ? "scene shown" : "scene"} frameloop={paused ? "never" : "always"} dpr={[1, 2]}
      camera={{ position: [0, 1.5, 6.2], fov: 40 }} gl={{ antialias: true, alpha: true }}
      eventSource={source ?? undefined} eventPrefix="client"
      onCreated={() => setReady(true)} aria-hidden="true" style={{ touchAction: "pan-y" }}>
      <hemisphereLight args={[token("--on-hero-muted"), token("--hero-bg"), 1.3]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.7} color={token("--bg-surface")} />
      <Lean>
        <PresentationControls global={false} snap rotation={[0, -0.35, 0]} polar={[0, 0]} azimuth={[-0.9, 0.9]} speed={1.4}>
          <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.35} floatingRange={[-0.05, 0.05]}>
            <Home />
          </Float>
        </PresentationControls>
      </Lean>
    </Canvas>
  );
}
