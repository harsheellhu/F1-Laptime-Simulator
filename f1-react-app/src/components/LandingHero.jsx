import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ModelViewer from './ModelViewer';

const STAR_COUNT = 120;

export default function LandingHero({ onEnter }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const starsRef = useRef([]);
  const timeRef = useRef(0);

  // Init stars
  useEffect(() => {
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.15 + 0.03,
      flicker: Math.random() * Math.PI * 2,
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    timeRef.current += 0.02;
    const t = timeRef.current;

    ctx.clearRect(0, 0, W, H);

    // Deep space gradient
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
    grad.addColorStop(0, '#0a0510');
    grad.addColorStop(0.5, '#060608');
    grad.addColorStop(1, '#020204');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    starsRef.current.forEach(s => {
      s.flicker += 0.02;
      const alpha = 0.4 + 0.4 * Math.sin(s.flicker);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });

    // Animated speed lines
    for (let i = 0; i < 8; i++) {
      const y = H * 0.3 + i * 35;
      const progress = ((t * 0.4 + i * 0.15) % 1);
      const startX = -200;
      const endX = W + 200;
      const lineX = startX + (endX - startX) * progress;
      const lineLen = 80 + i * 20;

      const lineGrad = ctx.createLinearGradient(lineX - lineLen, y, lineX, y);
      lineGrad.addColorStop(0, 'rgba(232,0,45,0)');
      lineGrad.addColorStop(0.5, `rgba(232,0,45,${0.2 - i * 0.02})`);
      lineGrad.addColorStop(1, 'rgba(232,0,45,0)');
      ctx.beginPath();
      ctx.moveTo(lineX - lineLen, y);
      ctx.lineTo(lineX, y);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Red glow orb (subtle)
    const orb = ctx.createRadialGradient(W * 0.15, H * 0.5, 0, W * 0.15, H * 0.5, 300);
    orb.addColorStop(0, 'rgba(232,0,45,0.08)');
    orb.addColorStop(1, 'rgba(232,0,45,0)');
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, W, H);

    // Second orb right side
    const orb2 = ctx.createRadialGradient(W * 0.85, H * 0.5, 0, W * 0.85, H * 0.5, 250);
    orb2.addColorStop(0, 'rgba(100,0,232,0.06)');
    orb2.addColorStop(1, 'rgba(100,0,232,0)');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, W, H);

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px' }}>
        {/* Season badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(232,0,45,0.12)', border: '1px solid rgba(232,0,45,0.3)',
            borderRadius: 40, padding: '6px 18px', marginBottom: 32,
            fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em',
            color: 'var(--red)', textTransform: 'uppercase',
          }}
        >
          <span style={{ width: 6, height: 6, background: 'var(--red)', borderRadius: '50%', animation: 'pulse-red 1.5s infinite' }} />
          Formula 1 · 2024 Season
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 8vw, 7rem)',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            marginBottom: 24,
          }}
        >
          <span style={{ display: 'block', color: '#ffffff' }}>F1 LAP TIME</span>
          <motion.span 
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            style={{
              display: 'block',
              background: 'linear-gradient(90deg, #e8002d 0%, #ff8096 50%, #e8002d 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
          }}>SIMULATOR</motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 560,
            margin: '0 auto 48px',
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          AI-powered race simulation. Predict lap times, model tire strategy, and watch your race unfold on the track.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 48 }}
        >
          {[
            { val: '20', label: 'Drivers' },
            { val: '10', label: 'Circuits' },
            { val: '±0.3s', label: 'Accuracy' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--red)' }}>{s.val}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* 3D F1 Car - floating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1.2, type: 'spring' }}
          style={{ marginBottom: 48, width: '120%', marginLeft: '-10%', height: 550 }}
        >
          <ModelViewer scale={130} />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(232,0,45,0.4)" }} 
            whileTap={{ scale: 0.95 }}
            className="btn-primary" 
            onClick={onEnter} 
            style={{ fontSize: '0.8rem', padding: '14px 36px', overflow: 'hidden', position: 'relative' }}
          >
            🏁 Launch Simulator
            <motion.div
              animate={{ x: ['-200%', '300%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                transform: 'skewX(-20deg)',
              }}
            />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }} 
            whileTap={{ scale: 0.95 }}
            className="btn-secondary" 
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More ↓
          </motion.button>
        </motion.div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          style={{
            marginTop: 48,
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 30,
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.5)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <span>Made by</span>
          <motion.span whileHover={{ scale: 1.1, color: '#e8002d' }} style={{ color: '#fff', fontWeight: 600, cursor: 'default', transition: 'color 0.2s' }}>Harshil Bhatt</motion.span>
          <span style={{ opacity: 0.5 }}>&amp;</span>
          <motion.span whileHover={{ scale: 1.1, color: '#e8002d' }} style={{ color: '#fff', fontWeight: 600, cursor: 'default', transition: 'color 0.2s' }}>Dhruvya Makadia</motion.span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem',
          fontFamily: 'var(--font-display)', letterSpacing: '0.1em',
        }}
      >
        <span>SCROLL</span>
        <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
      </motion.div>
    </div>
  );
}

function F1CarSVG() {
  return (
    <motion.div
      animate={{ y: [-4, 4, -4] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      style={{ display: 'inline-block' }}
    >
      <svg width="420" height="120" viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ground glow */}
        <ellipse cx="210" cy="108" rx="160" ry="10" fill="rgba(232,0,45,0.15)" />

        {/* Rear wing */}
        <rect x="22" y="28" width="48" height="6" rx="2" fill="#cc0020" />
        <rect x="26" y="34" width="40" height="16" rx="1" fill="#aa0018" />
        <line x1="46" y1="34" x2="46" y2="50" stroke="#ff2040" strokeWidth="1.5" />

        {/* Front nose & wing */}
        <path d="M 360 55 L 400 62 L 400 66 L 360 63 Z" fill="#cc0020" />
        <rect x="355" y="70" width="50" height="5" rx="2" fill="#cc0020" />

        {/* Main body */}
        <path d="M 50 55 Q 120 40 210 42 Q 300 44 360 55 L 360 75 Q 300 78 210 78 Q 120 76 50 70 Z" fill="#e8002d" />

        {/* Cockpit canopy */}
        <path d="M 175 42 Q 210 28 248 42 L 248 55 Q 210 50 175 55 Z" fill="#1a1a2e" />
        <path d="M 178 43 Q 210 30 245 43" stroke="rgba(100,180,255,0.6)" strokeWidth="1.5" fill="none" />

        {/* Sidepods */}
        <path d="M 100 58 Q 140 55 180 57 L 180 75 Q 140 74 100 72 Z" fill="#cc0020" />
        <path d="M 240 57 Q 280 55 320 58 L 320 72 Q 280 73 240 75 Z" fill="#cc0020" />

        {/* Engine cover */}
        <path d="M 130 48 Q 210 36 290 48 L 290 58 Q 210 54 130 58 Z" fill="#b00018" />

        {/* Halo */}
        <path d="M 185 44 Q 210 35 235 44" stroke="#ffd700" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Front suspension */}
        <line x1="350" y1="68" x2="380" y2="72" stroke="#888" strokeWidth="2" />
        <line x1="350" y1="68" x2="380" y2="64" stroke="#888" strokeWidth="2" />

        {/* Rear suspension */}
        <line x1="70" y1="66" x2="42" y2="64" stroke="#888" strokeWidth="2" />
        <line x1="70" y1="66" x2="42" y2="70" stroke="#888" strokeWidth="2" />

        {/* Rear wheels */}
        <ellipse cx="68" cy="78" rx="22" ry="22" fill="#111" />
        <ellipse cx="68" cy="78" rx="14" ry="14" fill="#222" />
        <ellipse cx="68" cy="78" rx="6" ry="6" fill="#e8002d" />
        <ellipse cx="68" cy="78" rx="2" ry="2" fill="#ffd700" />

        {/* Front wheels */}
        <ellipse cx="352" cy="78" rx="20" ry="20" fill="#111" />
        <ellipse cx="352" cy="78" rx="12" ry="12" fill="#222" />
        <ellipse cx="352" cy="78" rx="5" ry="5" fill="#e8002d" />
        <ellipse cx="352" cy="78" rx="2" ry="2" fill="#ffd700" />

        {/* DRS flap detail */}
        <rect x="24" y="26" width="44" height="3" rx="1" fill="#ff3050" opacity="0.8" />

        {/* Team number */}
        <text x="270" y="70" fontFamily="Orbitron, monospace" fontSize="14" fontWeight="800" fill="white" opacity="0.9">1</text>

        {/* Speed lines */}
        <line x1="0" y1="55" x2="30" y2="55" stroke="rgba(232,0,45,0.6)" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="62" x2="25" y2="62" stroke="rgba(232,0,45,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="68" x2="20" y2="68" stroke="rgba(232,0,45,0.25)" strokeWidth="1" strokeLinecap="round" />

        {/* Exhaust glow */}
        <ellipse cx="50" cy="65" rx="8" ry="4" fill="rgba(255,120,30,0.3)" />
        <ellipse cx="44" cy="65" rx="4" ry="2" fill="rgba(255,80,0,0.5)" />
      </svg>
    </motion.div>
  );
}
