import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ModelViewer from './ModelViewer';

/** Starfield + speed-line animated canvas hero with 3D car */
export default function HeroCanvas({ onLaunch }) {
  const ref = useRef(null);
  const raf = useRef(null);
  const state = useRef({ t: 0, stars: [] });

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');

    const resize = () => {
      cvs.width  = window.innerWidth;
      cvs.height = window.innerHeight;
      // Regenerate stars on resize
      state.current.stars = Array.from({ length: 140 }, () => ({
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height,
        r: Math.random() * 1.4 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const { width: W, height: H } = cvs;
      const t = (state.current.t += 0.016);

      // Void background
      const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.8);
      bg.addColorStop(0, '#08031a');
      bg.addColorStop(0.5, '#04000e');
      bg.addColorStop(1, '#020208');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Stars
      state.current.stars.forEach(s => {
        s.twinkle += 0.018;
        const a = 0.35 + 0.45 * Math.sin(s.twinkle);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      });

      // Speed lines (left → right, red)
      for (let i = 0; i < 10; i++) {
        const progress = ((t * 0.35 + i * 0.12) % 1);
        const y = H * 0.28 + i * H * 0.048;
        const len = 60 + i * 22;
        const x = -len + (W + len * 2) * progress;
        const grad = ctx.createLinearGradient(x - len, y, x, y);
        grad.addColorStop(0, 'rgba(232,0,45,0)');
        grad.addColorStop(0.5, `rgba(232,0,45,${0.22 - i*0.018})`);
        grad.addColorStop(1, 'rgba(232,0,45,0)');
        ctx.beginPath(); ctx.moveTo(x-len, y); ctx.lineTo(x, y);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Soft glow orbs
      const orb1 = ctx.createRadialGradient(W*0.1, H*0.5, 0, W*0.1, H*0.5, 320);
      orb1.addColorStop(0, 'rgba(232,0,45,0.09)'); orb1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb1; ctx.fillRect(0, 0, W, H);

      const orb2 = ctx.createRadialGradient(W*0.9, H*0.5, 0, W*0.9, H*0.5, 260);
      orb2.addColorStop(0, 'rgba(80,0,220,0.07)'); orb2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb2; ctx.fillRect(0, 0, W, H);

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); };
  }, []);

  const fadeUp = (delay) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.7, ease: 'easeOut' },
  });

  return (
    <div style={{ position:'relative', height:'100vh', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <canvas ref={ref} style={{ position:'absolute', inset:0 }} />

      {/* ── Hero content ── */}
      <div style={{ position:'relative', zIndex:10, textAlign:'center', padding:'0 20px', maxWidth:900 }}>

        {/* Badge */}
        <motion.div {...fadeUp(0.1)} style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:28 }}>
          <div style={{
            background:'rgba(232,0,45,0.1)', border:'1px solid rgba(232,0,45,0.28)',
            borderRadius:40, padding:'5px 16px',
            fontFamily:'var(--font-display)', fontSize:'0.6rem', letterSpacing:'0.2em',
            color:'var(--red)',
          }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--red)', marginRight:8, verticalAlign:'middle', animation:'pulse-red 1.8s infinite' }} />
            FORMULA 1 · AI LAP TIME SIMULATOR · 2024
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="heading-xl" 
          style={{ marginBottom:20 }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.2 } }
          }}
          initial="hidden"
          animate="show"
        >
          <span style={{ display:'block', color:'#fff', perspective: 1000 }}>
            {Array.from("F1 LAP TIME").map((char, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, x: 100, skewX: -30, scaleX: 1.5, filter: 'blur(8px)' },
                  show: { opacity: 1, x: 0, skewX: 0, scaleX: 1, filter: 'blur(0px)', transition: { type: 'spring', damping: 15, stiffness: 300 } }
                }}
                style={{ display: 'inline-block', whiteSpace: 'pre' }}
              >
                {char}
              </motion.span>
            ))}
          </span>
          <motion.span 
            style={{
              display: 'block',
              color: '#e8002d',
              textShadow: '0 0 30px rgba(232,0,45,0.4)',
          }}>
            {Array.from("SIMULATOR").map((char, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, x: 100, skewX: -40, scaleX: 2, filter: 'blur(10px)' },
                  show: { opacity: 1, x: 0, skewX: 0, scaleX: 1, filter: 'blur(0px)', transition: { type: 'spring', damping: 12, stiffness: 250 } }
                }}
                style={{ display: 'inline-block', whiteSpace: 'pre' }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </motion.h1>

        {/* Sub */}
        <motion.p {...fadeUp(0.45)} style={{
          fontFamily:'var(--font-ui)', fontSize:'clamp(1rem,2.2vw,1.25rem)',
          color:'var(--text-2)', maxWidth:560, margin:'0 auto 36px', lineHeight:1.65,
        }}>
          Real ML predictions from <strong style={{color:'#fff'}}>120,000+</strong> real F1 lap records.
          XGBoost-powered. Sky-view race animation.
        </motion.p>

        {/* Stat row */}
        <motion.div {...fadeUp(0.6)} style={{ display:'flex', justifyContent:'center', gap:40, marginBottom:40 }}>
          {[
            ['120K+', 'Real Lap Records'],
            ['R² > 0.85', 'Model Accuracy'],
            ['±1.5s', 'Test MAE'],
          ].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, color:'var(--red)' }}>{v}</div>
              <div className="label" style={{ marginTop:4 }}>{l}</div>
            </div>
          ))}
        </motion.div>

{/* Floating 3D F1 car */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ repeat:Infinity, duration:3.2, ease:'easeInOut' }}
          style={{ 
            marginBottom: 36, 
            width: '120%', 
            marginLeft: '-10%',
            height: 500,
            position: 'relative',
          }}
        >
          <ModelViewer scale={120} />
        </motion.div>

        {/* CTAs */}
        <motion.div {...fadeUp(0.9)} style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(232,0,45,0.4)" }} 
            whileTap={{ scale: 0.95 }}
            className="btn-primary" 
            onClick={onLaunch} 
            style={{ fontSize: '0.78rem', padding: '14px 40px', overflow: 'hidden', position: 'relative' }}
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
            className="btn-ghost" 
            onClick={() => document.getElementById('about')?.scrollIntoView({behavior:'smooth'})}
          >
            Learn More ↓
          </motion.button>
        </motion.div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
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

      {/* Scroll cue */}
      <motion.div animate={{y:[0,8,0]}} transition={{repeat:Infinity,duration:2}}
        style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          fontFamily:'var(--font-display)', fontSize:'0.58rem', letterSpacing:'0.12em', color:'var(--text-4)',
        }}>
        SCROLL
        <div style={{ width:1, height:28, background:'linear-gradient(transparent,rgba(255,255,255,0.15))' }} />
      </motion.div>
    </div>
  );
}

function F1CarSVG() {
  return (
    <svg width="420" height="110" viewBox="0 0 420 110" fill="none">
      {/* Ground shadow */}
      <ellipse cx="210" cy="102" rx="140" ry="8" fill="rgba(232,0,45,0.12)" />
      {/* Rear wing main */}
      <rect x="22" y="26" width="50" height="6" rx="2" fill="#cc0020" />
      <rect x="26" y="32" width="42" height="14" rx="1" fill="#aa0018" />
      <line x1="47" y1="32" x2="47" y2="46" stroke="#ff2040" strokeWidth="1.5" />
      {/* DRS detail */}
      <rect x="24" y="24" width="46" height="3" rx="1" fill="#ff3050" opacity="0.75" />
      {/* Front nose */}
      <path d="M 360 53 L 402 60 L 402 66 L 360 61 Z" fill="#cc0020" />
      <rect x="356" y="68" width="52" height="5" rx="2" fill="#cc0020" />
      {/* Body */}
      <path d="M 50 53 Q 120 38 210 40 Q 300 42 360 53 L 360 73 Q 300 76 210 76 Q 120 74 50 68 Z" fill="#e8002d" />
      {/* Engine cover */}
      <path d="M 130 46 Q 210 34 290 46 L 290 57 Q 210 52 130 57 Z" fill="#b00018" />
      {/* Cockpit / Halo */}
      <path d="M 175 40 Q 210 26 248 40 L 248 53 Q 210 48 175 53 Z" fill="#111122" />
      <path d="M 178 41 Q 210 28 245 41" stroke="rgba(100,180,255,0.55)" strokeWidth="1.5" fill="none" />
      <path d="M 185 42 Q 210 33 235 42" stroke="#ffd700" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Sidepods */}
      <path d="M 100 56 Q 140 53 180 55 L 180 73 Q 140 72 100 70 Z" fill="#cc0020" />
      <path d="M 240 55 Q 280 53 320 56 L 320 70 Q 280 71 240 73 Z" fill="#cc0020" />
      {/* Car number */}
      <text x="265" y="68" fontFamily="Orbitron,monospace" fontSize="13" fontWeight="800" fill="white" opacity="0.85">1</text>
      {/* Rear wheels */}
      <ellipse cx="68" cy="75" rx="21" ry="21" fill="#111" />
      <ellipse cx="68" cy="75" rx="13" ry="13" fill="#1e1e1e" />
      <ellipse cx="68" cy="75" rx="5.5" ry="5.5" fill="#e8002d" />
      {/* Front wheels */}
      <ellipse cx="350" cy="75" rx="19" ry="19" fill="#111" />
      <ellipse cx="350" cy="75" rx="11" ry="11" fill="#1e1e1e" />
      <ellipse cx="350" cy="75" rx="5" ry="5" fill="#e8002d" />
      {/* Suspension */}
      <line x1="346" y1="66" x2="375" y2="62" stroke="#666" strokeWidth="1.5" />
      <line x1="346" y1="66" x2="375" y2="70" stroke="#666" strokeWidth="1.5" />
      <line x1="70" y1="64" x2="42" y2="62" stroke="#666" strokeWidth="1.5" />
      <line x1="70" y1="64" x2="42" y2="68" stroke="#666" strokeWidth="1.5" />
      {/* Speed lines */}
      <line x1="0" y1="54" x2="28" y2="54" stroke="rgba(232,0,45,0.55)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="62" x2="22" y2="62" stroke="rgba(232,0,45,0.35)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Exhaust */}
      <ellipse cx="50" cy="63" rx="7" ry="3.5" fill="rgba(255,110,20,0.28)" />
    </svg>
  );
}
