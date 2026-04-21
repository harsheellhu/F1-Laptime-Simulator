import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState } from 'react';

function F1Car({ scale = 1 }) {
  const { scene } = useGLTF('/redbull_rb19_oracle__www.vecarz.com.glb');
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Fix material issues
        if (child.material) {
          child.material.transparent = false;
          child.material.depthWrite = true;
          child.material.depthTest = true;
          // If material has map/texture, clear it to avoid missing image error
          if (child.material.map && child.material.map.image === undefined) {
            child.material.map = null;
          }
          if (child.material.emissiveMap && child.material.emissiveMap.image === undefined) {
            child.material.emissiveMap = null;
          }
        }
      }
    });
  }, [scene]);
  
  return (
    <primitive 
      object={scene.clone()} 
      scale={scale * 0.008}
      rotation={[0, 0, 0]} 
      position={[0, 0, 0]}
    />
  );
}

function InteractiveCar({ scale = 1, isDragging }) {
  const groupRef = useRef();
  const [autoRotate, setAutoRotate] = useState(true);
  
  useEffect(() => {
    if (isDragging) {
      setAutoRotate(false);
    } else {
      setTimeout(() => setAutoRotate(true), 2000);
    }
  }, [isDragging]);
  
  useFrame((state, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });
  
  return (
    <group ref={groupRef}>
      <Float speed={1} rotationIntensity={0.05} floatIntensity={0.08}>
        <F1Car scale={scale} />
      </Float>
    </group>
  );
}

function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

export default function ModelViewer({ 
  scale = 80, 
  className = '',
  style = {}
}) {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div 
      className={className} 
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'visible',
        touchAction: 'none',
        ...style 
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ background: 'transparent', cursor: isDragging ? 'grabbing' : 'grab' }}
        camera={{ position: [0, 0, 12], fov: 20 }}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.style.clipPath = 'none';
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Environment preset="city" intensity={1} />
          
          <spotLight position={[0, 10, 8]} intensity={1.5} color="#ffffff" />
          <pointLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
          <pointLight position={[-5, 5, 5]} intensity={0.6} color="#ffffff" />
          <pointLight position={[0, -3, 5]} intensity={0.4} color="#e8002d" />
          <ambientLight intensity={0.5} />
          
          <InteractiveCar scale={scale} isDragging={isDragging} />
          
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

// Preload the model
useGLTF.preload('/redbull_rb19_oracle__www.vecarz.com.glb');