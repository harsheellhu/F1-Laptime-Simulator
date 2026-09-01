import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { getLivery, getDriverProfile } from '../data/teamLiveries';
import { f1Sound } from '../utils/f1EngineSound';

/**
 * Generates custom dynamic UV number decal for every driver (#1, #11, #44, #16, #4, etc.)
 * Mapped to the 'NUMBERS' material (1024x1024 resolution)
 */
function createDynamicNumbersTexture(driver, teamLivery) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 1024, 1024);

  const numStr = String(driver.number ?? '1');
  const numColor = teamLivery.numberColor || '#ffffff';
  const outlineColor = teamLivery.secondary || '#ff1844';

  const drawNum = (cx, cy, fontSz = 270, rot = 0) => {
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);

    ctx.font = `900 ${fontSz}px "Orbitron", "Rajdhani", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = outlineColor;
    ctx.shadowBlur = 20;

    ctx.lineWidth = fontSz * 0.16;
    ctx.strokeStyle = outlineColor;
    ctx.lineJoin = 'round';
    ctx.strokeText(numStr, 0, 0);

    ctx.fillStyle = numColor;
    ctx.fillText(numStr, 0, 0);

    ctx.lineWidth = fontSz * 0.035;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(numStr, 0, 0);

    ctx.restore();
  };

  // 1. Nosecone front number (exact center 270, 325)
  drawNum(270, 325, 310, 0);

  // 2. Left side engine cover (exact center 780, 295, rotated -90 deg)
  drawNum(780, 295, 280, -Math.PI / 2);

  // 3. Right side engine cover (exact center 780, 765, rotated +90 deg)
  drawNum(780, 765, 280, Math.PI / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates team-specific sponsor decals and logos.
 * Mapped to the 'STICKERS' material (2048x2048 resolution)
 */
function createDynamicSponsorsTexture(teamLivery) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 2048, 2048);

  const drawText = (text, cx, cy, font, color, align = 'center', rot = 0, shadow = null) => {
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    if (shadow && shadow.color) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur || 10;
    }
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  const drawBadge = (cx, cy, w, h, bgColor, text, textColor, rx = 8, rot = 0) => {
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-w / 2, -h / 2, w, h, rx);
    } else {
      ctx.rect(-w / 2, -h / 2, w, h);
    }
    ctx.fill();

    ctx.font = `900 ${Math.min(h * 0.55, 64)}px "Orbitron", "Rajdhani", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.fillText(text, 0, 0);
    
    ctx.restore();
  };

  const drawHPLogo = (cx, cy, r) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0096d6';
    ctx.fill();
    ctx.font = `italic 900 ${r * 1.2}px "Arial", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('hp', -r * 0.05, -r * 0.05);
    ctx.restore();
  };

  const drawChromeLogo = (cx, cy, r) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#1a73e8';
    ctx.fill();
    ctx.lineWidth = r * 0.15;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 6, Math.PI / 2 + Math.PI / 6);
    ctx.lineWidth = r * 0.4;
    ctx.strokeStyle = '#ea4335';
    ctx.stroke();
    ctx.restore();
  };

  if (teamLivery.sponsors) {
    teamLivery.sponsors.forEach(s => {
      if (s.type === 'text') drawText(s.text, s.x, s.y, s.font, s.color, s.align || 'center', s.rot || 0, s.shadow);
      else if (s.type === 'badge') drawBadge(s.x, s.y, s.w, s.h, s.bgColor, s.text, s.textColor, s.rx || 8, s.rot || 0);
      else if (s.type === 'custom' && s.name === 'hp') drawHPLogo(s.x, s.y, s.size);
      else if (s.type === 'custom' && s.name === 'chrome') drawChromeLogo(s.x, s.y, s.size);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates custom dynamic Pirelli Tire Compound Sidewall Texture
 */
function createTireCompoundTexture(compound) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const configs = {
    soft:   { color: '#ff1844', name: 'P ZERO', glow: 'rgba(255,24,68,0.9)' },
    medium: { color: '#ffd700', name: 'P ZERO', glow: 'rgba(255,215,0,0.9)' },
    hard:   { color: '#ffffff', name: 'P ZERO', glow: 'rgba(255,255,255,0.9)' },
    inter:  { color: '#00e676', name: 'CINTURATO', glow: 'rgba(0,230,118,0.9)' },
    wet:    { color: '#0099ff', name: 'CINTURATO', glow: 'rgba(0,153,255,0.9)' },
  };

  const c = configs[compound] || configs.soft;

  // Dark matte rubber background
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 512, 512);

  ctx.save();
  ctx.translate(256, 256);

  // Outer rubber border
  ctx.beginPath();
  ctx.arc(0, 0, 240, 0, Math.PI * 2);
  ctx.strokeStyle = '#222328';
  ctx.lineWidth = 14;
  ctx.stroke();

  // High-intensity Compound Color Stripe Ring
  ctx.beginPath();
  ctx.arc(0, 0, 205, 0, Math.PI * 2);
  ctx.strokeStyle = c.color;
  ctx.lineWidth = 26;
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 18;
  ctx.stroke();

  // Inner tire rim bevel
  ctx.beginPath();
  ctx.arc(0, 0, 145, 0, Math.PI * 2);
  ctx.strokeStyle = '#1a1b20';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Top Text: PIRELLI
  ctx.font = '900 36px "Orbitron", sans-serif';
  ctx.fillStyle = c.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 10;
  ctx.fillText('PIRELLI', 0, -205);

  // Bottom Text: P ZERO / CINTURATO
  ctx.font = '900 30px "Orbitron", sans-serif';
  ctx.fillText(c.name, 0, 205);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
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

    if (flameOuterRef.current) {
      const flicker = 1 + (Math.sin(t * 50) * 0.22 + Math.cos(t * 35) * 0.18) * throttle;
      flameOuterRef.current.scale.set((isRevving ? 1.4 : 0.7) * flicker, (isRevving ? 1.4 : 0.7) * flicker, (isRevving ? 1.8 : 0.75) * flicker);
    }
    if (flameInnerRef.current) {
      const flicker2 = 1 + Math.sin(t * 65 + 1.2) * 0.25;
      flameInnerRef.current.scale.set((isRevving ? 1.2 : 0.65) * flicker2, (isRevving ? 1.2 : 0.65) * flicker2, (isRevving ? 1.4 : 0.6) * flicker2);
    }
    if (flameCoreRef.current) {
      const flicker3 = 1 + Math.sin(t * 80) * 0.3;
      flameCoreRef.current.scale.set((isRevving ? 0.9 : 0.45) * flicker3, (isRevving ? 0.9 : 0.45) * flicker3, (isRevving ? 0.9 : 0.4) * flicker3);
    }
    if (lightRef.current) {
      lightRef.current.intensity = (isRevving ? 5.5 : 1.4) + Math.sin(t * 40) * (isRevving ? 1.8 : 0.4);
    }

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
      <mesh ref={flameOuterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.35]}>
        <coneGeometry args={[0.075, 0.7, 16, 1, true]} />
        <meshBasicMaterial color={isRevving ? '#ff3700' : '#ff7a00'} transparent opacity={isRevving ? 0.85 : 0.45} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={flameInnerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.2]}>
        <coneGeometry args={[0.05, 0.45, 16, 1, true]} />
        <meshBasicMaterial color={isRevving ? '#00f0ff' : '#ff9900'} transparent opacity={isRevving ? 0.9 : 0.6} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={flameCoreRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
        <coneGeometry args={[0.03, 0.25, 16, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={lightRef} color={isRevving ? '#ff4000' : '#ff8800'} intensity={2} distance={4.5} decay={2} />
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={particleData.positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={isRevving ? 0.07 : 0.035} color={isRevving ? '#ffcc44' : '#ff8822'} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

/**
 * ModelErrorBoundary — Graceful fallback handler.
 * If 3D asset fails, shows an authentic holographic wireframe placeholder in team colors.
 */
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, errorMsg: err?.message || 'Model format error' };
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.url !== this.props.url ||
      prevProps.liveryId !== this.props.liveryId ||
      prevProps.selectedYear !== this.props.selectedYear
    ) {
      this.setState({ hasError: false, errorMsg: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      const primaryColor = this.props.livery?.primary || '#14192b';
      const secondaryColor = this.props.livery?.secondary || '#ff1844';
      const teamName = this.props.livery?.name || 'FORMULA 1';
      const chassisName = this.props.livery?.chassis || 'CHASSIS';

      return (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[1.6, 0.5, 4.2]} />
            <meshStandardMaterial color={secondaryColor} wireframe transparent opacity={0.25} />
          </mesh>
          <Html center position={[0, 0.9, 0]}>
            <div
              style={{
                background: 'rgba(8, 10, 18, 0.92)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${secondaryColor}55`,
                borderRadius: 16,
                padding: '16px 24px',
                textAlign: 'center',
                color: '#ffffff',
                boxShadow: `0 16px 36px rgba(0,0,0,0.6), 0 0 20px ${secondaryColor}22`,
                minWidth: 220,
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: secondaryColor }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                  MODEL UNAVAILABLE
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)' }}>
                {teamName} · {this.props.selectedYear || 2026} {chassisName}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                TELEMETRY WIREFRAME ACTIVE
              </div>
            </div>
          </Html>
        </group>
      );
    }
    return this.props.children;
  }
}

const textureCache = {};
function getCachedTexture(key, generatorFn) {
  if (!textureCache[key]) {
    textureCache[key] = generatorFn();
  }
  return textureCache[key];
}

/**
 * GLBCar — Dedicated 3D GLB model renderer for Red Bull RB19
 */
function GLBCar({ scale = 1, isRevving, driverId, constructorId, tireCompound = 'soft', lapsDriven = 0, trackWetness = 0 }) {
  const [bounds, setBounds] = useState(null);

  const driver = useMemo(() => getDriverProfile(driverId), [driverId]);
  const livery = useMemo(() => getLivery(constructorId || driver.constructorId_num), [constructorId, driver]);
  const { scene } = useGLTF('/redbull_rb19_oracle__www.vecarz.com.glb');

  const numbersTexture = useMemo(() => getCachedTexture(`num_${driver.number}_${livery.id}`, () => createDynamicNumbersTexture(driver, livery)), [driver, livery]);
  const sponsorsTexture = useMemo(() => getCachedTexture(`sponsors_${livery.id}`, () => createDynamicSponsorsTexture(livery)), [livery]);
  const tireTexture = useMemo(() => getCachedTexture(`tire_${tireCompound}`, () => createTireCompoundTexture(tireCompound)), [tireCompound]);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const oldMat = Array.isArray(child.material) ? child.material[0] : child.material;
        const newMat = new THREE.MeshPhysicalMaterial();
        newMat.name = oldMat.name || '';
        if (oldMat.map !== undefined) newMat.map = oldMat.map;
        if (oldMat.normalMap !== undefined) newMat.normalMap = oldMat.normalMap;
        if (oldMat.roughnessMap !== undefined) newMat.roughnessMap = oldMat.roughnessMap;
        if (oldMat.metalnessMap !== undefined) newMat.metalnessMap = oldMat.metalnessMap;
        if (oldMat.color) newMat.color.copy(oldMat.color);
        if (oldMat.roughness !== undefined) newMat.roughness = oldMat.roughness;
        if (oldMat.metalness !== undefined) newMat.metalness = oldMat.metalness;
        if (oldMat.transparent !== undefined) newMat.transparent = oldMat.transparent;
        if (oldMat.opacity !== undefined) newMat.opacity = oldMat.opacity;
        if (oldMat.alphaTest !== undefined) newMat.alphaTest = oldMat.alphaTest;
        if (oldMat.side !== undefined) newMat.side = oldMat.side;
        child.material = newMat;
        child.userData.origMap = oldMat.map;
        child.userData.origColor = oldMat.color ? oldMat.color.clone() : new THREE.Color();
        child.userData.origRoughness = oldMat.roughness !== undefined ? oldMat.roughness : 0.5;
        child.userData.origMetalness = oldMat.metalness !== undefined ? oldMat.metalness : 0.5;
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if (child.isMesh && child.material) child.material.dispose();
      });
    };
  }, [clonedScene]);

  const compoundColors = {
    soft:   { hex: '#ff1844', name: 'SOFT' },
    medium: { hex: '#ffd700', name: 'MEDIUM' },
    hard:   { hex: '#ffffff', name: 'HARD' },
    inter:  { hex: '#00e676', name: 'INTER' },
    wet:    { hex: '#0099ff', name: 'WET' },
  };
  const activeCompound = compoundColors[tireCompound] || compoundColors.soft;

  useEffect(() => {
    const primaryColor = new THREE.Color(livery.primary || '#0b0c0e');
    const secondaryColor = new THREE.Color(livery.secondary || '#ff1844');
    const compColor = new THREE.Color(activeCompound.hex);

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const matName = (child.material.name || '').toUpperCase();
          if (matName === 'NUMBERS' || matName.includes('NUMBER')) {
            child.material.map = numbersTexture;
            child.material.transparent = true;
            child.material.alphaTest = 0.08;
            child.material.roughness = 0.35;
            child.material.metalness = 0.15;
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          } else if (matName === 'STICKERS') {
            child.material.map = child.userData.origMap;
            child.material.transparent = true;
            child.material.alphaTest = 0.5;
            child.material.needsUpdate = true;
          } else if (matName === 'BODY') {
            child.material.map = child.userData.origMap;
            child.material.color.copy(child.userData.origColor);
            child.material.roughness = 0.28;
            child.material.metalness = 0.15;
          } else if (matName === '12_-_CAR_PAINT') {
            child.material.map = child.userData.origMap;
            child.material.color.copy(child.userData.origColor);
            child.material.roughness = 0.25;
            child.material.metalness = 0.1;
          } else if (matName === 'MATERIAL_97') {
            child.material.color.set('#141416');
            child.material.roughness = 0.92;
            child.material.metalness = 0.0;
          } else if (matName === 'MATERIAL_102') {
            child.material.color.set(compColor);
            child.material.emissive.set(compColor);
            child.material.emissiveIntensity = 0.4;
            child.material.roughness = 0.75;
            child.material.metalness = 0.05;
          } else if (matName === 'MATERIAL_105') {
            child.material.color.set('#101114');
            child.material.roughness = 0.9;
            child.material.metalness = 0.0;
          } else if (matName === 'STICKERS_WHEEL') {
            child.material.color.set(compColor);
            child.material.emissive.set(compColor);
            child.material.emissiveIntensity = 0.8;
            child.material.roughness = 0.2;
            child.material.metalness = 0.05;
          } else if (matName === 'FRONT_RIMS' || matName === 'REAR_RIMS') {
            child.material.color.copy(child.userData.origColor);
          } else if (matName === 'FLASKS') {
            child.material.color.copy(child.userData.origColor);
          } else if (matName === 'BAKED_FIX_ROUE') {
            child.material.color.copy(child.userData.origColor);
          }
        }
      }
    });

    const dirtFactor = Math.min(1, lapsDriven / 60);
    const wetFactor = Math.min(1, trackWetness / 100);
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const matName = (child.material.name || '').toUpperCase();
        if (matName === 'BODY' || matName === '12_-_CAR_PAINT') {
          if (child.material.clearcoat !== undefined) {
            child.material.clearcoat = Math.min(1.0, (child.material.clearcoat || 0.4) + wetFactor * 0.6);
            child.material.clearcoatRoughness = Math.max(0.02, (child.material.clearcoatRoughness || 0.1) - wetFactor * 0.08);
          }
          if (dirtFactor > 0.1) {
            const origColor = child.material.color.clone();
            origColor.lerp(new THREE.Color('#1a1a1a'), dirtFactor * 0.12);
            child.material.color = origColor;
            child.material.roughness = Math.min(0.9, (child.material.roughness || 0.25) + dirtFactor * 0.15);
          }
        }
        if (matName === 'MATERIAL_105' || matName.includes('SLICK')) {
          const wearSmooth = 0.88 - dirtFactor * 0.2;
          child.material.roughness = Math.max(0.5, wearSmooth);
        }
      }
    });

    try {
      const box = new THREE.Box3().setFromObject(clonedScene);
      const bounds = {
        min: box.min.clone().multiplyScalar(scale * 0.008),
        max: box.max.clone().multiplyScalar(scale * 0.008),
      };
      bounds.min.z -= 0.5;
      bounds.max.z += 0.5;
      setBounds(bounds);
    } catch (e) {
      console.warn('[GLBCar] bounds error:', e);
    }
  }, [clonedScene, scale, livery, numbersTexture, sponsorsTexture, tireTexture, activeCompound, lapsDriven, trackWetness]);

  return (
    <group>
      <primitive object={clonedScene} scale={scale * 0.008} rotation={[0, 0, 0]} position={[0, 0, 0]} />
      <ExhaustFlame isRevving={isRevving} carBounds={bounds} />
    </group>
  );
}

/**
 * ProceduralF1Car — High-fidelity 3D procedural F1 vehicle for teams without dedicated GLB assets.
 * Rendered with authentic team livery colors, aerodynamic wings, halo, sidepods, and Pirelli tires.
 */
function ProceduralF1Car({ livery, driver, tireCompound = 'soft', isRevving, scale = 1, lapsDriven = 0, trackWetness = 0 }) {
  const primary = livery.primary || '#d40022';
  const secondary = livery.secondary || '#fff500';
  const wing = livery.wingColor || '#121212';
  const rim = livery.wheelRimColor || '#222222';
  const accent = livery.accent || secondary;

  const compColors = { soft: '#ff1844', medium: '#ffd700', hard: '#ffffff', inter: '#00e676', wet: '#0099ff' };
  const compColor = compColors[tireCompound] || compColors.soft;

  const dirtFactor = Math.min(1, lapsDriven / 60);
  const wetFactor = Math.min(1, trackWetness / 100);
  const clearcoatVal = Math.min(1.0, 0.9 + wetFactor * 0.1);
  const roughnessBody = Math.min(0.55, 0.18 + dirtFactor * 0.15);

  const bodyMat = { color: primary, roughness: roughnessBody, metalness: 0.35, clearcoat: clearcoatVal, clearcoatRoughness: 0.06 };
  const wingMat = { color: wing, roughness: 0.3, metalness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.1 };
  const accentMat = { color: secondary, roughness: 0.22, metalness: 0.4, clearcoat: 0.9, clearcoatRoughness: 0.06, emissive: secondary, emissiveIntensity: 0.08 };
  const tyreMat = { color: '#121214', roughness: 0.92, metalness: 0.0 };
  const rimMat = { color: rim, roughness: 0.35, metalness: 0.85 };
  const compMat = { color: compColor, roughness: 0.4, metalness: 0.1, emissive: compColor, emissiveIntensity: 0.6 };

  const exhaustBounds = useMemo(() => ({
    min: new THREE.Vector3(-0.3, -0.08, -1.9),
    max: new THREE.Vector3(0.3, 0.25, -2.0),
  }), []);

  return (
    <group scale={[scale * 0.72, scale * 0.72, scale * 0.72]} position={[0, -0.18, 0]}>
      {/* ── 1. MAIN CHASSIS / MONOCOQUE ── */}
      <mesh castShadow receiveShadow position={[0, 0.18, -0.05]}>
        <boxGeometry args={[0.64, 0.28, 3.2]} />
        <meshPhysicalMaterial {...bodyMat} />
      </mesh>

      {/* Nose cone extension */}
      <mesh castShadow receiveShadow position={[0, 0.15, 1.55]}>
        <boxGeometry args={[0.36, 0.18, 0.6]} />
        <meshPhysicalMaterial {...bodyMat} />
      </mesh>
      {/* Nose cone tip */}
      <mesh castShadow receiveShadow position={[0, 0.12, 1.88]}>
        <cylinderGeometry args={[0.04, 0.14, 0.42, 16]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>

      {/* ── 2. SIDEPODS (Left & Right with Undercut) ── */}
      <mesh castShadow receiveShadow position={[0.48, 0.12, -0.1]}>
        <boxGeometry args={[0.32, 0.22, 1.8]} />
        <meshPhysicalMaterial {...bodyMat} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.48, 0.12, -0.1]}>
        <boxGeometry args={[0.32, 0.22, 1.8]} />
        <meshPhysicalMaterial {...bodyMat} />
      </mesh>

      {/* Sidepod Aero Stripe (Team Accent) */}
      <mesh castShadow position={[0.56, 0.17, -0.1]}>
        <boxGeometry args={[0.04, 0.06, 1.7]} />
        <meshPhysicalMaterial {...accentMat} />
      </mesh>
      <mesh castShadow position={[-0.56, 0.17, -0.1]}>
        <boxGeometry args={[0.04, 0.06, 1.7]} />
        <meshPhysicalMaterial {...accentMat} />
      </mesh>

      {/* ── 3. ENGINE COVER & AIRBOX FIN ── */}
      <mesh castShadow receiveShadow position={[0, 0.4, -0.4]}>
        <boxGeometry args={[0.26, 0.28, 1.3]} />
        <meshPhysicalMaterial {...bodyMat} />
      </mesh>

      {/* ── 4. HALO COCKPIT SAFETY SYSTEM ── */}
      <mesh castShadow position={[0, 0.62, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.035, 12, 32, Math.PI]} />
        <meshPhysicalMaterial color="#0a0a0e" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* ── 5. FRONT WING ASSEMBLY ── */}
      {/* Main wing plane */}
      <mesh castShadow receiveShadow position={[0, -0.02, 2.08]}>
        <boxGeometry args={[1.62, 0.045, 0.38]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>
      {/* Cascade flap 1 */}
      <mesh castShadow position={[0, 0.05, 1.98]}>
        <boxGeometry args={[1.4, 0.03, 0.28]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>
      {/* Cascade flap 2 */}
      <mesh castShadow position={[0, 0.11, 1.9]}>
        <boxGeometry args={[1.1, 0.025, 0.2]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>
      {/* Left & Right Endplates */}
      <mesh castShadow position={[0.81, 0.04, 2.06]}>
        <boxGeometry args={[0.04, 0.14, 0.38]} />
        <meshPhysicalMaterial {...accentMat} />
      </mesh>
      <mesh castShadow position={[-0.81, 0.04, 2.06]}>
        <boxGeometry args={[0.04, 0.14, 0.38]} />
        <meshPhysicalMaterial {...accentMat} />
      </mesh>

      {/* ── 6. REAR WING & DRS FLAP ── */}
      <mesh castShadow receiveShadow position={[0, 0.74, -1.55]}>
        <boxGeometry args={[1.1, 0.055, 0.34]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>
      <mesh castShadow position={[0, 0.68, -1.52]}>
        <boxGeometry args={[1.0, 0.04, 0.28]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>
      {/* Rear Endplates */}
      <mesh castShadow position={[0.55, 0.68, -1.55]}>
        <boxGeometry args={[0.04, 0.25, 0.38]} />
        <meshPhysicalMaterial {...accentMat} />
      </mesh>
      <mesh castShadow position={[-0.55, 0.68, -1.55]}>
        <boxGeometry args={[0.04, 0.25, 0.38]} />
        <meshPhysicalMaterial {...accentMat} />
      </mesh>
      {/* DRS Pylon Support */}
      <mesh castShadow position={[0, 0.62, -1.55]}>
        <boxGeometry args={[0.06, 0.48, 0.05]} />
        <meshPhysicalMaterial color="#0a0a0e" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* ── 7. FLOOR & VENTURI DIFFUSER ── */}
      <mesh castShadow receiveShadow position={[0, -0.06, -0.4]}>
        <boxGeometry args={[1.28, 0.04, 2.6]} />
        <meshPhysicalMaterial color="#111116" roughness={0.65} metalness={0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.02, -1.52]}>
        <boxGeometry args={[0.9, 0.12, 0.55]} />
        <meshPhysicalMaterial color="#0e0e12" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* ── 8. PIRELLI WHEELS (Matte Black Rubber + Compound Stripe + Team Rim) ── */}
      {/* Front Left */}
      <group position={[0.78, -0.05, 1.45]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.31, 0.31, 0.28, 20]} />
          <meshPhysicalMaterial {...tyreMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.315, 0.315, 0.06, 20]} />
          <meshPhysicalMaterial {...compMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.32, 16]} />
          <meshPhysicalMaterial {...rimMat} />
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[-0.78, -0.05, 1.45]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.31, 0.31, 0.28, 20]} />
          <meshPhysicalMaterial {...tyreMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.315, 0.315, 0.06, 20]} />
          <meshPhysicalMaterial {...compMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.32, 16]} />
          <meshPhysicalMaterial {...rimMat} />
        </mesh>
      </group>

      {/* Rear Left */}
      <group position={[0.82, -0.03, -1.28]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.34, 20]} />
          <meshPhysicalMaterial {...tyreMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.355, 0.355, 0.07, 20]} />
          <meshPhysicalMaterial {...compMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.36, 16]} />
          <meshPhysicalMaterial {...rimMat} />
        </mesh>
      </group>

      {/* Rear Right */}
      <group position={[-0.82, -0.03, -1.28]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.34, 20]} />
          <meshPhysicalMaterial {...tyreMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.355, 0.355, 0.07, 20]} />
          <meshPhysicalMaterial {...compMat} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.36, 16]} />
          <meshPhysicalMaterial {...rimMat} />
        </mesh>
      </group>

      {/* ── 9. SUSPENSION WISHBONES ── */}
      <mesh position={[0.5, -0.03, 1.46]} rotation={[0, 0, Math.PI / 9]}>
        <boxGeometry args={[0.28, 0.025, 0.04]} />
        <meshPhysicalMaterial color="#1a1a20" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[-0.5, -0.03, 1.46]} rotation={[0, 0, -Math.PI / 9]}>
        <boxGeometry args={[0.28, 0.025, 0.04]} />
        <meshPhysicalMaterial color="#1a1a20" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* ── 10. EXHAUST SYSTEM & T-CAM ── */}
      <mesh position={[0.04, 0.26, -1.8]} rotation={[Math.PI / 12, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.28, 10]} />
        <meshPhysicalMaterial
          color="#2a2020"
          roughness={0.4}
          metalness={0.7}
          emissive={isRevving ? '#ff4400' : '#220800'}
          emissiveIntensity={isRevving ? 0.8 : 0.15}
        />
      </mesh>
      <mesh position={[0, 0.72, 0.18]}>
        <cylinderGeometry args={[0.04, 0.04, 0.18, 8]} />
        <meshPhysicalMaterial color={secondary} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Interactive Exhaust Flame */}
      <ExhaustFlame isRevving={isRevving} carBounds={exhaustBounds} />
    </group>
  );
}

/**
 * DynamicF1Car — Authoritative model resolver.
 * Routes to GLBCar for Red Bull (real asset) or ProceduralF1Car for all other teams.
 */
function DynamicF1Car({
  scale = 1,
  isRevving,
  driverId,
  constructorId,
  selectedYear = 2026,
  tireCompound = 'soft',
  lapsDriven = 0,
  trackWetness = 0,
}) {
  const driver = useMemo(() => getDriverProfile(driverId), [driverId]);
  const livery = useMemo(() => getLivery(constructorId || driver.constructorId_num), [constructorId, driver]);

  // Model existence check
  const isDedicatedGLB = livery.hasModel && Boolean(livery.carModel) && (selectedYear === 2026 || selectedYear === 2023);

  // Diagnostic logging in development mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        `[CAR] Team: ${livery.name} | Driver: ${driver.name} | Season: ${selectedYear} | Chassis: ${livery.chassis || '2026'} | Model: ${
          isDedicatedGLB ? livery.carModel : 'PROCEDURAL 3D'
        } | Status: READY`
      );
    }
  }, [livery, driver, selectedYear, isDedicatedGLB]);

  if (isDedicatedGLB) {
    return (
      <GLBCar
        scale={scale}
        isRevving={isRevving}
        driverId={driverId}
        constructorId={constructorId}
        tireCompound={tireCompound}
        lapsDriven={lapsDriven}
        trackWetness={trackWetness}
      />
    );
  }

  return (
    <ProceduralF1Car
      livery={livery}
      driver={driver}
      tireCompound={tireCompound}
      isRevving={isRevving}
      scale={scale}
      lapsDriven={lapsDriven}
      trackWetness={trackWetness}
    />
  );
}

function InteractiveShowroomCar({
  scale = 1,
  isDragging,
  isRevving,
  driverId,
  constructorId,
  selectedYear = 2026,
  tireCompound,
  cameraPreset,
  lapsDriven = 0,
  trackWetness = 0,
}) {
  const groupRef = useRef();
  const [autoRotate, setAutoRotate] = useState(true);

  const driver = useMemo(() => getDriverProfile(driverId), [driverId]);
  const livery = useMemo(() => getLivery(constructorId || driver.constructorId_num), [constructorId, driver]);
  const modelUrl = livery.hasModel ? livery.carModel : `procedural_${livery.id}_${selectedYear}`;

  useEffect(() => {
    if (isDragging || cameraPreset !== 'free') {
      setAutoRotate(false);
    } else {
      const timer = setTimeout(() => setAutoRotate(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isDragging, cameraPreset]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate && cameraPreset === 'free') {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.08}>
        <ModelErrorBoundary url={modelUrl} livery={livery} liveryId={livery.id} selectedYear={selectedYear}>
          <DynamicF1Car
            scale={scale}
            isRevving={isRevving}
            driverId={driverId}
            constructorId={constructorId}
            selectedYear={selectedYear}
            tireCompound={tireCompound}
            lapsDriven={lapsDriven}
            trackWetness={trackWetness}
          />
        </ModelErrorBoundary>
      </Float>
    </group>
  );
}

function ShowroomLoader() {
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
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-red 1.2s infinite' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.14em', color: '#ffffff' }}>
            SYNCHRONIZING 3D TELEMETRY {Math.round(progress)}%
          </span>
        </div>
        <div style={{ width: 140, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.max(5, progress)}%`, height: '100%', background: 'linear-gradient(90deg, #ff1844, #ff6b8b)', transition: 'width 0.2s ease' }} />
        </div>
      </div>
    </Html>
  );
}

/**
 * Big Dynamic 3D F1 Car Showroom with Team Livery, Driver Number, and Changeable Tires
 */
export default function Car3DShowroom({
  driverId,
  constructorId,
  selectedYear = 2026,
  tireCompound = 'soft',
  onTireChange,
  className = '',
  style = {},
  lapsDriven = 0,
  trackWetness = 0,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRevving, setIsRevving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraPreset, setCameraPreset] = useState('free');
  const controlsRef = useRef();

  const driver = useMemo(() => getDriverProfile(driverId), [driverId]);
  const livery = useMemo(() => getLivery(constructorId || driver.constructorId_num), [constructorId, driver]);

  const handlePreset = (preset) => {
    setCameraPreset(preset);
    if (!controlsRef.current) return;

    if (preset === 'front') {
      controlsRef.current.setAzimuthalAngle(0.65);
      controlsRef.current.setPolarAngle(1.35);
    } else if (preset === 'side') {
      controlsRef.current.setAzimuthalAngle(Math.PI / 2);
      controlsRef.current.setPolarAngle(1.4);
    } else if (preset === 'top') {
      controlsRef.current.setAzimuthalAngle(0);
      controlsRef.current.setPolarAngle(0.2);
    } else {
      controlsRef.current.setAzimuthalAngle(0.4);
      controlsRef.current.setPolarAngle(1.35);
    }
  };

  const handlePointerMove = () => {
    setIsRevving(true);
    f1Sound.setThrottle(0.6);
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

  const TIRE_OPTIONS = [
    { id: 'soft', label: 'SOFT', color: '#ff1844', dot: '🔴', desc: 'Max Pace' },
    { id: 'medium', label: 'MED', color: '#ffd700', dot: '🟡', desc: 'Balanced' },
    { id: 'hard', label: 'HARD', color: '#ffffff', dot: '⚪', desc: 'Durable' },
    { id: 'inter', label: 'INTER', color: '#00e676', dot: '🟢', desc: 'Damp' },
    { id: 'wet', label: 'WET', color: '#0099ff', dot: '🔵', desc: 'Monsoon' },
  ];

  return (
    <div
      className={`glass ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: 480,
        borderRadius: 20,
        overflow: 'hidden',
        border: `1px solid ${livery.secondary}55`,
        background: `radial-gradient(ellipse at 50% 60%, ${livery.primary}88 0%, #06070c 80%)`,
        boxShadow: `0 16px 48px rgba(0,0,0,0.6), inset 0 0 40px ${livery.secondary}22`,
        ...style,
      }}
    >
      {/* Team & Driver Header Pill Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          right: 16,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Team & Chassis Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(8, 10, 18, 0.8)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${livery.secondary}44`,
            borderRadius: 30,
            padding: '6px 14px',
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: livery.secondary,
              boxShadow: `0 0 10px ${livery.secondary}`,
            }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', fontWeight: 800, color: '#fff' }}>
              {livery.name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: livery.secondary }}>
              CHASSIS SPEC: {livery.chassis || livery.shortName.toUpperCase()} · {selectedYear}
            </div>
          </div>
        </div>

        {/* Driver Official Number Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(8, 10, 18, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 30,
            padding: '4px 12px 4px 6px',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: livery.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '0.82rem',
              fontWeight: 900,
              color: '#000',
              boxShadow: `0 0 12px ${livery.secondary}88`,
            }}
          >
            #{driver.number}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>
              {driver.name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)' }}>
              {driver.code} · OFFICIAL DRIVER
            </div>
          </div>
        </div>
      </div>

      {/* ── Dynamic Changeable Tire Compound Control Overlay ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 16,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(8, 10, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 30,
          padding: '6px 10px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.5)',
            marginRight: 4,
            marginLeft: 4,
          }}
        >
          TIRE:
        </span>
        {TIRE_OPTIONS.map((t) => {
          const isSel = tireCompound === t.id;
          return (
            <button
              key={t.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onTireChange) onTireChange(t.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 20,
                border: isSel ? `1px solid ${t.color}` : '1px solid rgba(255,255,255,0.08)',
                background: isSel ? `${t.color}22` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSel ? `0 0 10px ${t.color}44` : 'none',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.58rem',
                  fontWeight: isSel ? 800 : 500,
                  color: isSel ? '#ffffff' : 'rgba(255,255,255,0.6)',
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Camera Presets & Audio Controls Overlay ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 16,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(8, 10, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 30,
          padding: '4px 8px',
        }}
      >
        {[
          { id: 'free', label: '360°', icon: '🔄' },
          { id: 'front', label: 'FRONT', icon: '🏎️' },
          { id: 'side', label: 'SIDE', icon: '📐' },
          { id: 'top', label: 'TOP', icon: '🔝' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => handlePreset(btn.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.56rem',
              fontWeight: cameraPreset === btn.id ? 800 : 500,
              padding: '4px 8px',
              borderRadius: 14,
              border: cameraPreset === btn.id ? `1px solid ${livery.secondary}` : '1px solid transparent',
              background: cameraPreset === btn.id ? `${livery.secondary}22` : 'transparent',
              color: cameraPreset === btn.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {btn.label}
          </button>
        ))}

        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute F1 Engine' : 'Mute F1 Engine'}
          style={{
            background: 'transparent',
            border: 'none',
            color: isMuted ? 'rgba(255,255,255,0.3)' : livery.secondary,
            cursor: 'pointer',
            padding: '4px 6px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* ── 3D Canvas Scene ── */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2.8, 1.4, 3.8], fov: 42 }}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#040509']} />

        {/* Dynamic Stadium & Studio Lights */}
        <ambientLight intensity={0.65} />
        <spotLight
          position={[5, 8, 5]}
          angle={0.4}
          penumbra={0.8}
          intensity={2.8}
          color="#ffffff"
          castShadow
          shadow-bias={-0.0001}
        />
        <spotLight
          position={[-5, 6, -4]}
          angle={0.5}
          penumbra={0.8}
          intensity={2.0}
          color={livery.secondary}
        />
        <pointLight position={[0, -0.2, 0]} intensity={1.2} color={livery.primary} distance={6} />
        <directionalLight position={[0, 5, 0]} intensity={0.6} color="#ffffff" />

        {/* Soft Shadow Floor Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.55} />
        </mesh>

        <Suspense fallback={<ShowroomLoader />}>
          <Environment preset="night" />
          <InteractiveShowroomCar
            scale={scale}
            isDragging={isDragging}
            isRevving={isRevving}
            driverId={driverId}
            constructorId={constructorId}
            selectedYear={selectedYear}
            tireCompound={tireCompound}
            cameraPreset={cameraPreset}
            lapsDriven={lapsDriven}
            trackWetness={trackWetness}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={2.4}
          maxDistance={7.0}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 - 0.05}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
