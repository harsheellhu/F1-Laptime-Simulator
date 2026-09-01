import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ModelViewer from './ModelViewer';

/** Starfield + speed-line animated canvas hero with 3D car dynamically overlapping bold text */
export default function HeroCanvas({ onLaunch }) {
  const containerRef = useRef(null);
  const ref = useRef(null);
  const raf = useRef(null);
  const state = useRef({ t: 0, stars: [], isVisible: true });

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');

    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      state.current.stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height,
        r: Math.random() * 1.3 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // IntersectionObserver to pause canvas animation when scrolled offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        state.current.isVisible = entry.isIntersecting;
        if (entry.isIntersecting && !raf.current) {
          raf.current = requestAnimationFrame(draw);
        }
      },
      { threshold: 0.05 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const draw = () => {
      if (!state.current.isVisible || document.hidden) {
        raf.current = null;
        return;
      }

      const { width: W, height: H } = cvs;
      const t = (state.current.t += 0.015);

      // Deep void background gradient
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.85);
      bg.addColorStop(0, '#0a0414');
      bg.addColorStop(0.5, '#05020c');
      bg.addColorStop(1, '#020206');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Distant stars
      state.current.stars.forEach((s) => {
        s.twinkle += 0.018;
        const a = 0.3 + 0.45 * Math.sin(s.twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });

      // Aerodynamic speed lines
      for (let i = 0; i < 8; i++) {
        const progress = (t * 0.3 + i * 0.14) % 1;
        const y = H * 0.32 + i * H * 0.055;
        const len = 70 + i * 25;
        const x = -len + (W + len * 2) * progress;
        const grad = ctx.createLinearGradient(x - len, y, x, y);
        grad.addColorStop(0, 'rgba(232,0,45,0)');
        grad.addColorStop(0.5, `rgba(232,0,45,${0.18 - i * 0.016})`);
        grad.addColorStop(1, 'rgba(232,0,45,0)');
        ctx.beginPath();
        ctx.moveTo(x - len, y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Soft ambient glowing light orbs
      const orb1 = ctx.createRadialGradient(W * 0.2, H * 0.5, 0, W * 0.2, H * 0.5, 340);
      orb1.addColorStop(0, 'rgba(232,0,45,0.08)');
      orb1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb1;
      ctx.fillRect(0, 0, W, H);

      const orb2 = ctx.createRadialGradient(W * 0.8, H * 0.5, 0, W * 0.8, H * 0.5, 280);
      orb2.addColorStop(0, 'rgba(99,102,241,0.06)');
      orb2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb2;
      ctx.fillRect(0, 0, W, H);

      raf.current = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (!document.hidden && state.current.isVisible && !raf.current) {
        raf.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: '100vh',
        minHeight: 700,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '70px 24px 30px',
        background: '#030308',
      }}
    >
      {/* Background Animated Canvas */}
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      {/* ── TOP SECTION (Badge & Subtitle) ── */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 16px',
            background: 'rgba(255, 24, 68, 0.08)',
            border: '1px solid rgba(255, 24, 68, 0.25)',
            borderRadius: 30,
            backdropFilter: 'blur(12px)',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--red)',
              animation: 'pulse-red 1.6s infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: 'var(--red)',
            }}
          >
            2024 REGULATION · AI TELEMETRY ENGINE
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)',
            color: 'rgba(255, 255, 255, 0.65)',
            maxWidth: 580,
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Trained on 120,000+ real Ergast telemetry laps. Real-time XGBoost tire modeling & race prediction.
        </motion.p>
      </div>

      {/* ── CENTER SECTION: Text with 3D Car overlapping right across it ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1300,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
        }}
      >
        {/* Layer A: Huge Hero Typography (Behind 3D Car) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.5rem, 11vw, 9.5rem)',
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: '-0.02em',
              textAlign: 'center',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color: '#ffffff',
              opacity: 0.85,
              textShadow: '0 0 50px rgba(255,255,255,0.1)',
            }}
          >
            F1 LAP TIME
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.2rem, 10vw, 8.8rem)',
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: '0.04em',
              textAlign: 'center',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #ff1844 0%, #ff6b8b 50%, #ff1844 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(255, 24, 68, 0.4)',
            }}
          >
            SIMULATOR
          </motion.div>
        </div>

        {/* Layer B: 3D Interactive F1 Car Model with Exhaust Effect Overlapping the Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 6,
            pointerEvents: 'auto',
          }}
        >
          <ModelViewer scale={125} />
        </div>
      </div>

      {/* ── BOTTOM SECTION: Sleek Stats & Launch Button ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Minimal Sleek Stats Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 24,
            padding: '8px 24px',
            background: 'rgba(15, 18, 28, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 40,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          {[
            { val: '120K+', label: 'Real Laps' },
            { val: '±0.18s', label: 'MAE Accuracy' },
            { val: 'RB19 #1', label: 'Verstappen' },
          ].map((s, idx) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#ffffff',
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.1em',
                    color: 'rgba(255, 255, 255, 0.45)',
                    textTransform: 'uppercase',
                  }}
                >
                  {s.label}
                </div>
              </div>
              {idx < 2 && <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.1)' }} />}
            </div>
          ))}
        </motion.div>

        {/* Minimal Action CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(255, 24, 68, 0.45)' }}
            whileTap={{ scale: 0.96 }}
            className="btn-primary"
            onClick={onLaunch}
            style={{
              fontSize: '0.78rem',
              padding: '13px 40px',
              borderRadius: 30,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(255, 24, 68, 0.3)',
            }}
          >
            🏁 Launch Simulator
            <motion.div
              animate={{ x: ['-200%', '300%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', repeatDelay: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                transform: 'skewX(-20deg)',
              }}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.96 }}
            className="btn-secondary"
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              fontSize: '0.78rem',
              padding: '13px 26px',
              borderRadius: 30,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
          >
            Architecture & Telemetry ↓
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
