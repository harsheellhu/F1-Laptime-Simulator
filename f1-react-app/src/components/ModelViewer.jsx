import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { f1Sound } from '../utils/f1EngineSound';

/**
 * Generate high-definition #1 Championship Number texture (Max Verstappen RB19 #1)
 */
function createChampionshipNumberOneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 1024, 1024);

  const drawOne = (cx, cy, fontSz = 270, rot = 0) => {
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);

    ctx.font = `900 ${fontSz}px "Orbitron", "Rajdhani", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glowing red outline
    ctx.shadowColor = 'rgba(255, 24, 68, 0.85)';
    ctx.shadowBlur = 20;
    ctx.lineWidth = fontSz * 0.16;
    ctx.strokeStyle = '#e8002d';
    ctx.lineJoin = 'round';
    ctx.strokeText('1', 0, 0);

    // Pure white solid core
    ctx.fillStyle = '#ffffff';
    ctx.fillText('1', 0, 0);

    // Inner gold accent edge
    ctx.lineWidth = fontSz * 0.035;
    ctx.strokeStyle = '#ffd700';
    ctx.strokeText('1', 0, 0);

    ctx.restore();
  };

  // 1. Nosecone front number (exact center 270, 325)
  drawOne(270, 325, 310, 0);

  // 2. Left side engine cover (exact center 780, 295, rotated -90 deg)
  drawOne(780, 295, 280, -Math.PI / 2);

  // 3. Right side engine cover (exact center 780, 765, rotated +90 deg)
  drawOne(780, 765, 280, Math.PI / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Realistic 3D Exhaust Flame and Spark Particle System
 */
function ExhaustFlame({ isRevving, carBounds }) {
  const flameOuterRef = useRef();
  const flameInnerRef = useRef();
  const flameCoreRef = useRef();
  const lightRef = useRef();
  const particlesRef = useRef();

  const PARTICLE_COUNT = 32;
  const particleData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];
    const lifetimes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      velocities.push({
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04 + 0.02,
        vz: -(Math.random() * 0.15 + 0.08),
      });
      lifetimes[i] = Math.random();
    }
    return { positions, velocities, lifetimes };
  }, []);

  const exhaustPos = useMemo(() => {
    if (!carBounds) return [0, 0.28, -2.1];
    const x = (carBounds.min.x + carBounds.max.x) / 2;
    const y = carBounds.min.y + (carBounds.max.y - carBounds.min.y) * 0.26;
    const z = Math.min(carBounds.min.z, carBounds.max.z);
    return [x, y, z];
  }, [carBounds]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const throttle = isRevving ? 1.0 : 0.35;

    // Outer flame flickering & turbulence
    if (flameOuterRef.current) {
      const flicker = 1 + (Math.sin(t * 50) * 0.22 + Math.cos(t * 35) * 0.18) * throttle;
      const length = isRevving ? 1.8 : 0.75;
      const width = isRevving ? 1.4 : 0.7;
      flameOuterRef.current.scale.set(width * flicker, width * flicker, length * flicker);
    }

    // Mid flame (electric cyan to orange)
    if (flameInnerRef.current) {
      const flicker2 = 1 + Math.sin(t * 65 + 1.2) * 0.25;
      const length = isRevving ? 1.4 : 0.6;
      flameInnerRef.current.scale.set((isRevving ? 1.2 : 0.65) * flicker2, (isRevving ? 1.2 : 0.65) * flicker2, length * flicker2);
    }

    // Core flame (ultra-hot plasma white/blue)
    if (flameCoreRef.current) {
      const flicker3 = 1 + Math.sin(t * 80) * 0.3;
      flameCoreRef.current.scale.set((isRevving ? 0.9 : 0.45) * flicker3, (isRevving ? 0.9 : 0.45) * flicker3, (isRevving ? 0.9 : 0.4) * flicker3);
    }

    // Dynamic light flicker
    if (lightRef.current) {
      lightRef.current.intensity = (isRevving ? 5.5 : 1.4) + Math.sin(t * 40) * (isRevving ? 1.8 : 0.4);
    }

    // Animate spark particles shooting out rear
    if (particlesRef.current) {
      const posArray = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particleData.lifetimes[i] += delta * (isRevving ? 4.5 : 2.0);
        if (particleData.lifetimes[i] > 1.0) {
          particleData.lifetimes[i] = 0;
          posArray[i * 3] = (Math.random() - 0.5) * 0.08;
          posArray[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
          posArray[i * 3 + 2] = 0;
        } else {
          const v = particleData.velocities[i];
          posArray[i * 3] += v.vx * (isRevving ? 2.0 : 1.0);
          posArray[i * 3 + 1] += v.vy * (isRevving ? 2.0 : 1.0);
          posArray[i * 3 + 2] += v.vz * (isRevving ? 2.8 : 1.2);
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={exhaustPos}>
      {/* Outer Flame Cone */}
      <mesh ref={flameOuterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.35]}>
        <coneGeometry args={[0.075, 0.7, 16, 1, true]} />
        <meshBasicMaterial
          color={isRevving ? '#ff3700' : '#ff7a00'}
          transparent
          opacity={isRevving ? 0.85 : 0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Mid Flame Plume */}
      <mesh ref={flameInnerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.2]}>
        <coneGeometry args={[0.05, 0.45, 16, 1, true]} />
        <meshBasicMaterial
          color={isRevving ? '#00f0ff' : '#ff9900'}
          transparent
          opacity={isRevving ? 0.9 : 0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ultra-hot Core */}
      <mesh ref={flameCoreRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
        <coneGeometry args={[0.03, 0.25, 16, 1, true]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Exhaust Glow Light */}
      <pointLight
        ref={lightRef}
        color={isRevving ? '#ff4000' : '#ff8800'}
        intensity={2}
        distance={4.5}
        decay={2}
      />

      {/* Sparks / Heat Embers */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={particleData.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isRevving ? 0.07 : 0.035}
          color={isRevving ? '#ffcc44' : '#ff8822'}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/**
 * 3D Formula 1 Car Model (Full authentic baked textures preserved + Championship #1)
 */
function F1Car({ scale = 1, isRevving, onBoundsCalculated }) {
  const { scene } = useGLTF('/redbull_rb19_oracle__www.vecarz.com.glb');
  const [bounds, setBounds] = useState(null);

  const numberOneTexture = useMemo(() => createChampionshipNumberOneTexture(), []);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.transparent = false;
          child.material.depthWrite = true;
          child.material.depthTest = true;

          const matName = (child.material.name || '').toUpperCase();

          // Override car number to #1 (Max Verstappen) instead of #11
          if (matName === 'NUMBERS' || matName.includes('NUMBER')) {
            child.material = new THREE.MeshStandardMaterial({
              map: numberOneTexture,
              transparent: true,
              alphaTest: 0.1,
              roughness: 0.4,
              metalness: 0.2,
              side: THREE.DoubleSide,
            });
          }

          if (child.material.map && child.material.map.image === undefined) {
            child.material.map = null;
          }
          if (child.material.emissiveMap && child.material.emissiveMap.image === undefined) {
            child.material.emissiveMap = null;
          }
        }
      }
    });

    const box = new THREE.Box3().setFromObject(clonedScene);
    const scaledBox = {
      min: box.min.clone().multiplyScalar(scale * 0.008),
      max: box.max.clone().multiplyScalar(scale * 0.008),
    };
    setBounds(scaledBox);
    if (onBoundsCalculated) onBoundsCalculated(scaledBox);
  }, [clonedScene, scale, onBoundsCalculated, numberOneTexture]);

  return (
    <group>
      <primitive
        object={clonedScene}
        scale={scale * 0.008}
        rotation={[0, 0, 0]}
        position={[0, 0, 0]}
      />
      <ExhaustFlame isRevving={isRevving} carBounds={bounds} />
    </group>
  );
}

/**
 * Floating Interactive Car with smooth auto-rotation
 */
function InteractiveCar({ scale = 1, isDragging, isRevving }) {
  const groupRef = useRef();
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (isDragging) {
      setAutoRotate(false);
    } else {
      const timer = setTimeout(() => setAutoRotate(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.4} rotationIntensity={0.06} floatIntensity={0.12}>
        <F1Car scale={scale} isRevving={isRevving} />
      </Float>
    </group>
  );
}

function HolographicLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(8, 10, 18, 0.85)',
          padding: '14px 24px',
          borderRadius: 30,
          border: '1px solid rgba(255, 24, 68, 0.25)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--red)',
              animation: 'pulse-red 1.2s infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.68rem',
              letterSpacing: '0.14em',
              color: '#ffffff',
            }}
          >
            RB19 #1 TELEMETRY {Math.round(progress)}%
          </span>
        </div>
        <div
          style={{
            width: 140,
            height: 3,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(5, progress)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff1844, #ff6b8b)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      </div>
    </Html>
  );
}

export default function ModelViewer({ scale = 80, className = '', style = {} }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRevving, setIsRevving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 });
  const idleTimer = useRef(null);

  // Dynamic F1 Engine Rev on Cursor Move over Model
  const handlePointerMove = (e) => {
    const now = performance.now();
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    const dt = Math.max(16, now - lastMousePos.current.time);
    const speed = Math.hypot(dx, dy) / dt;

    lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };

    setIsRevving(true);
    const throttle = Math.min(0.95, 0.35 + speed * 0.7);
    f1Sound.setThrottle(throttle);

    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIsRevving(false);
      f1Sound.stop();
    }, 450);
  };

  const handlePointerDown = () => {
    setIsDragging(true);
    setIsRevving(true);
    f1Sound.start();
    f1Sound.setThrottle(0.95);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    f1Sound.setThrottle(0.35);
    setTimeout(() => f1Sound.stop(), 300);
  };

  const handlePointerEnter = () => {
    f1Sound.start();
    f1Sound.setThrottle(0.35);
  };

  const handlePointerLeave = () => {
    setIsDragging(false);
    setIsRevving(false);
    f1Sound.stop();
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    const muted = f1Sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div
      className={className}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        touchAction: 'none',
        position: 'relative',
        ...style,
      }}
    >
      {/* Sound & Interactive Engine Rev Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 20,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(8, 9, 15, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 24, 68, 0.25)',
          borderRadius: 30,
          padding: '6px 14px',
          boxShadow: isRevving ? '0 0 20px rgba(255, 24, 68, 0.4)' : '0 4px 16px rgba(0,0,0,0.5)',
          transition: 'all 0.25s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isRevving ? '#00e676' : 'var(--red)',
              animation: isRevving ? 'pulse-red 0.6s infinite' : 'none',
              boxShadow: isRevving ? '0 0 10px #00e676' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: isRevving ? '#00e676' : '#ffffff',
            }}
          >
            {isRevving ? 'RB19 #1 V6 TURBO ACTIVE' : 'HOVER FOR V6 ENGINE SOUND'}
          </span>
        </div>

        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute engine audio' : 'Mute engine audio'}
          style={{
            background: 'none',
            border: 'none',
            color: isMuted ? 'var(--text-4)' : 'var(--red)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{
          background: 'transparent',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        camera={{ position: [0, 0, 12], fov: 20 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.style.clipPath = 'none';
        }}
      >
        <Suspense fallback={<HolographicLoader />}>
          <Environment preset="city" intensity={1} />

          <spotLight position={[0, 10, 8]} intensity={1.6} color="#ffffff" />
          <pointLight position={[5, 5, 5]} intensity={0.7} color="#ffffff" />
          <pointLight position={[-5, 5, 5]} intensity={0.7} color="#ffffff" />
          <pointLight position={[0, -3, 5]} intensity={0.5} color="#ff1844" />
          <ambientLight intensity={0.5} />

          <InteractiveCar scale={scale} isDragging={isDragging} isRevving={isRevving} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            rotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}