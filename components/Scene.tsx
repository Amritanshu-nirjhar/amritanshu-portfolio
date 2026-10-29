"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Vector2, type ShaderMaterial } from "three";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  varying float vHeight;
  varying float vDist;

  // Cheap 2D value-noise, good enough for rolling hills.
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec3 p = position;
    vec2 q = p.xz * 0.35 + vec2(0.0, uTime * 0.15);
    float h = noise(q) * 1.4 + noise(q * 2.3) * 0.5;
    // Ripple pushed out from the cursor.
    float d = distance(p.xz, uMouse);
    h += sin(d * 3.0 - uTime * 4.0) * 0.35 * exp(-d * 0.6);
    p.y = h * (1.0 + uScroll * 1.5);
    vHeight = h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDist = -mv.z;
    gl_PointSize = 2.2 * (8.0 / vDist);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying float vHeight;
  varying float vDist;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    vec3 low = vec3(0.12);
    vec3 high = vec3(0.776, 0.957, 0.196); // lime accent
    vec3 c = mix(low, high, smoothstep(0.7, 1.8, vHeight));
    float fog = smoothstep(22.0, 6.0, vDist);
    gl_FragColor = vec4(c, fog);
  }
`;

function Terrain() {
  const mat = useRef<ShaderMaterial>(null);
  const mouse = useRef(new Vector2(0, 100));

  const [positions, uniforms] = useMemo(() => {
    const n = 160, size = 24, arr = new Float32Array(n * n * 3);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const k = (i * n + j) * 3;
        arr[k] = (i / (n - 1) - 0.5) * size;
        arr[k + 2] = (j / (n - 1) - 0.5) * size;
      }
    return [arr, { uTime: { value: 0 }, uScroll: { value: 0 }, uMouse: { value: new Vector2(0, 100) } }];
  }, []);

  useFrame((state, delta) => {
    const u = mat.current!.uniforms;
    const p = Math.min(window.scrollY / window.innerHeight, 1);
    u.uTime.value += delta;
    u.uScroll.value = p;
    // Project the pointer onto the ground plane (roughly) so the ripple follows it.
    mouse.current.set(state.pointer.x * 9, -state.pointer.y * 6 + 2);
    u.uMouse.value.lerp(mouse.current, delta * 4);
    state.camera.position.y = 3 - p * 1.5;
    state.camera.lookAt(0, 0, -2);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

export default function Scene() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // Client-only component (ssr: false), so matchMedia is safe here.
  const [still] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    // Stop rendering when the hero is off-screen to save battery/GPU.
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 3, 8], fov: 50 }}
        frameloop={still ? "demand" : visible ? "always" : "never"}
        gl={{ antialias: false, alpha: true }}
      >
        <Terrain />
      </Canvas>
    </div>
  );
}
