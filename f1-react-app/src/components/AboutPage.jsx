import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';

const FEATURE_DESCRIPTIONS = [
  { icon: '📐', key: 'lap_ratio',    title: 'Lap Ratio',          formula: 'lap / total_laps',                      color: '#0ea5e9',  desc: 'Normalizes lap position in race (0-1 scale)' },
  { icon: '🛞', key: 'tire_deg',     title: 'Tire Degradation',   formula: '0.6·L + 0.4·L²   (L = lap_ratio)',     color: '#e8002d',  desc: 'Polynomial wear curve - more realistic' },
  { icon: '🏎', key: 'grid_norm',    title: 'Grid Normalised',    formula: '(grid − 1) / 19',                      color: '#ff8000',  desc: 'Pole position = 0, last = 1' },
  { icon: '📅', key: 'year_norm',    title: 'Year Normalised',    formula: '(year − 2010) / 14',                   color: '#a855f7',  desc: 'Modern era (2010-2024) normalized' },
  { icon: '🗺', key: 'circuit_len', title: 'Circuit Length (km)', formula: 'metres / 1000',                         color: '#00e676',  desc: 'Convert circuit length to km' },
  { icon: '🤖', key: 'driver_enc',   title: 'Driver Encoding',    formula: 'LabelEncoder(driverId)',               color: '#ffd700',  desc: 'Map driver IDs to integers' },
];

const FORMULA_CARDS = [
  {
    title: 'Fuel Load Effect',
    formula: 'fuel_effect = (1 - fuel_norm) × 0.4',
    desc: 'Cars burn ~1.6kg fuel/lap. Lighter = faster! Up to 0.4s improvement.',
    icon: '⛽',
    color: '#00e676'
  },
  {
    title: 'Track Evolution',
    formula: 'track_evol = min(lap × 0.02, 0.3)',
    desc: 'Track "rubbers in" over laps - up to 0.3s faster.',
    icon: '✨',
    color: '#a855f7'
  },
  {
    title: 'Composite Team Score',
    formula: 'team_perf = (0.3P + 0.4A + 0.15L + 0.15H) / 100',
    desc: 'Power(30%) + Aero(40%) + Low/High speed combo.',
    icon: '🏎️',
    color: '#e8002d'
  },
  {
    title: 'Weather Impact',
    formula: 'wet_multiplier = 1.0 to 1.15',
    desc: 'Rain slows cars 0-15%. Wet skill matters!',
    icon: '🌧️',
    color: '#0ea5e9'
  },
  {
    title: 'Experience Factor',
    formula: 'exp_factor = ln(1+exp) / ln(21)',
    desc: 'Log scale - early years count more!',
    icon: '📈',
    color: '#ff8000'
  },
  {
    title: 'Age Performance',
    formula: 'age_factor = max(0.8, 1 - |age-29|/100)',
    desc: 'Peak at 29yo. +/- 1% per year away.',
    icon: '🎂',
    color: '#ffd700'
  },
];

const TerminalTypewriter = ({ text }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20%' }}
      variants={{
        visible: { transition: { staggerChildren: 0.015 } }
      }}
      style={{
        fontFamily: 'monospace',
        fontSize: '0.88rem',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'left',
        background: '#040206',
        padding: '24px 28px',
        borderRadius: '12px',
        border: '1px solid rgba(232,0,45,0.2)',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 16px 40px rgba(0,0,0,0.5)',
        maxWidth: 780,
        margin: '0 auto',
        lineHeight: 1.65,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, var(--red), transparent)' }} />
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f56' }} />
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#ffbd2e' }} />
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#27c93f' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: 'var(--green)' }}>strategy_env@pitwall</span>
        <span style={{ color: 'var(--text-3)' }}>:~/telemetry-models$</span> ./execute_xgboost.sh --explain
      </div>
      <div style={{ color: '#a0aab5' }}>
        {text.split("").map((char, i) => (
          <motion.span key={i} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
            {char}
          </motion.span>
        ))}
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ display: 'inline-block', width: 8, height: 16, background: 'var(--red)', verticalAlign: 'middle', marginLeft: 6 }}/>
      </div>
    </motion.div>
  );
};

export default function AboutPage({ onLaunch }) {
  const [modelInfo, setModelInfo]   = useState(null);
  const [formulae, setFormulae]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [apiOnline, setApiOnline]   = useState(false);

  useEffect(() => {
    Promise.all([api.modelInfo(), api.formulae()])
      .then(([mi, fm]) => { setModelInfo(mi); setFormulae(fm); setApiOnline(true); })
      .catch(() => setApiOnline(false))
      .finally(() => setLoading(false));
  }, []);

  const card = (children, style = {}) => (
    <div className="glass" style={{ padding:24, ...style }}>{children}</div>
  );

  const fadeUp = (delay = 0) => ({
    initial:{opacity:0,y:28}, whileInView:{opacity:1,y:0},
    viewport:{once:true}, transition:{delay, duration:0.6},
  });

  return (
    <div id="about" style={{ background:'var(--bg-deep)', borderTop:'1px solid var(--glass-border)' }}>
      {/* ── Model Status Banner ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 24px 0' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          background: apiOnline ? 'rgba(0,230,118,0.07)' : 'rgba(255,200,0,0.07)',
          border:`1px solid ${apiOnline ? 'rgba(0,230,118,0.2)' : 'rgba(255,200,0,0.2)'}`,
          borderRadius:'var(--radius-md)', padding:'12px 20px',
        }}>
          <span className={`status-dot ${apiOnline ? 'online' : 'offline'}`} />
          <span style={{ fontFamily:'var(--font-display)', fontSize:'0.65rem', letterSpacing:'0.12em',
            color: apiOnline ? 'var(--green)' : 'var(--gold)' }}>
            {apiOnline ? 'PYTHON BACKEND ONLINE — REAL ML PREDICTIONS ACTIVE' : 'BACKEND OFFLINE — START fastapi server to enable predictions'}
          </span>
          {apiOnline && modelInfo && (
            <span style={{ marginLeft:'auto', fontFamily:'var(--font-display)', fontSize:'0.6rem',
              color:'var(--text-3)', letterSpacing:'0.1em' }}>
              {modelInfo.model_type?.toUpperCase()} · MAE {modelInfo.test_mae?.toFixed(2)}s · R² {modelInfo.test_r2?.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {/* ── Section: About ── */}
      <section style={{ maxWidth:1200, margin:'0 auto', padding:'60px 24px' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:56 }}>
          <div className="divider-red" style={{ margin:'0 auto 12px' }} />
          <h2 className="heading-lg" style={{ marginBottom:28 }}>WHY XGBOOST IS THE PINNACLE</h2>
          <TerminalTypewriter text="Neural networks often overfit tabular data, and linear models fail to capture complex physical interactions. F1 racing relies on highly non-linear dynamics—like the exact moment tire grip falls off a cliff or how fuel weight dynamically interacts with track evolution. By layering 400 gradient-boosted decision trees over 120,000 real historical lap records, our XGBoost architecture isolates these non-linear physics natively without hallucinating. It's the ultimate algorithmic strategy engine." />
        </motion.div>

        {/* Feature cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:56 }}>
          {[
            { icon:'🤖', title:'XGBoost Model', color:'#e8002d',
              desc:'400 gradient-boosted trees trained on real Ergast F1 data covering 2010–2023 seasons across all circuits.' },
            { icon:'🛞', title:'Tire Degradation', color:'#ffd700',
              desc:'Polynomial degradation curve: 0.6·L + 0.4·L² where L is normalized lap ratio — models real compound wear.' },
            { icon:'📊', title:'Feature Engineering', color:'#0ea5e9',
              desc:'10 hand-crafted features: lap ratio, tire deg, grid norm, circuit length, year era, plus label-encoded IDs.' },
            { icon:'🏁', title:'Sky-View Animation', color:'#00e676',
              desc:'Canvas-rendered top-down track view with real car position updating each lap from the ML prediction.' },
            { icon:'⚙️', title:'Real Data Only', color:'#ff8000',
              desc:'No mock data. All predictions come from the Python FastAPI backend. API offline = simulator disabled.' },
            { icon:'📈', title:'Full Analytics', color:'#a855f7',
              desc:'Live lap-time trace, fastest lap highlight, pit stop markers, per-lap breakdown, and model performance stats.' },
          ].map((f, i) => (
            <motion.div key={f.title} {...fadeUp(i * 0.08)} className="glass"
              style={{ padding:24, cursor:'default' }}
              whileHover={{ y:-4, boxShadow:`0 12px 40px ${f.color}22` }}
              transition={{ duration:0.2 }}>
              <div style={{ fontSize:'1.8rem', marginBottom:12 }}>{f.icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'0.8rem', fontWeight:700, color:f.color, marginBottom:8 }}>{f.title}</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:'0.82rem', color:'var(--text-2)', lineHeight:1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Feature engineering formulae - SEXY GLASSMORPHISM EDITION */}
        <motion.div {...fadeUp(0.2)} style={{ marginBottom:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div className="divider-red" />
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:700, letterSpacing:'0.08em' }}>
              FEATURE ENGINEERING FORMULAE
            </h3>
          </div>
          
          {/* Main formulae cards with glass effect */}
          <div style={{ 
            display:'grid', 
            gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', 
            gap:16,
            marginBottom: 24
          }}>
            {FORMULA_CARDS.map((f, i) => (
              <motion.div 
                key={f.title} 
                {...fadeUp(i * 0.06)}
                className="glass"
                style={{ 
                  padding: '20px 24px',
                  borderLeft: `3px solid ${f.color}`,
                  background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(${f.color.split('').map(c => parseInt(c, 16)).join(',')},0.05) 100%)`,
                }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: `0 20px 60px ${f.color}33`,
                  borderLeftWidth: '4px'
                }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <span style={{ fontSize:'1.6rem' }}>{f.icon}</span>
                  <span style={{ 
                    fontFamily:'var(--font-display)', 
                    fontSize:'0.75rem', 
                    fontWeight:700, 
                    color:f.color,
                    textTransform:'uppercase',
                    letterSpacing:'0.1em'
                  }}>{f.title}</span>
                </div>
                <code style={{
                  display:'block', 
                  fontFamily:'monospace', 
                  fontSize:'0.85rem',
                  background:'rgba(0,0,0,0.4)', 
                  borderRadius:8, 
                  padding:'12px 16px',
                  color:'rgba(255,255,255,0.95)', 
                  border:`1px solid ${f.color}44`,
                  marginBottom: 10,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`
                }}>{f.formula}</code>
                <p style={{ 
                  fontFamily:'var(--font-ui)', 
                  fontSize:'0.72rem', 
                  color:'var(--text-2)',
                  lineHeight:1.5 
                }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
          
          {/* Simple feature cards row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
            {FEATURE_DESCRIPTIONS.map(f => (
              <div key={f.key} className="glass" style={{ 
                padding:'14px 16px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:'1rem' }}>{f.icon}</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'0.65rem', fontWeight:700, color:f.color }}>{f.title}</span>
                </div>
                <code style={{
                  display:'block', 
                  fontFamily:'monospace', 
                  fontSize:'0.7rem',
                  background:'rgba(0,0,0,0.35)', 
                  borderRadius:4, 
                  padding:'6px 10px',
                  color:'rgba(255,255,255,0.75)',
                }}>{f.formula}</code>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Model metrics (live from API) */}
        {apiOnline && modelInfo && (
          <motion.div {...fadeUp(0.3)} style={{ marginBottom:56 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div className="divider-red" />
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:700, letterSpacing:'0.08em' }}>
                MODEL PERFORMANCE (LIVE FROM BACKEND)
              </h3>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              {[
                { label:'Test MAE',  val:`${modelInfo.test_mae?.toFixed(3)}s`,   sub:'Mean Absolute Error',    color:'var(--green)' },
                { label:'Test RMSE', val:`${modelInfo.test_rmse?.toFixed(3)}s`,  sub:'Root Mean Sq. Error',   color:'#0ea5e9' },
                { label:'Test R²',   val:modelInfo.test_r2?.toFixed(4),          sub:'Coefficient of Determin.', color:'var(--gold)' },
                { label:'Samples',   val:`${(modelInfo.n_samples/1000).toFixed(0)}K`, sub:'Real F1 Lap Times', color:'var(--red)' },
              ].map(s => (
                <div key={s.label} className="glass" style={{ padding:'18px 16px', textAlign:'center' }}>
                  <div className="label" style={{ marginBottom:8 }}>{s.label}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:800, color:s.color }}>{s.val}</div>
                  <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.65rem', color:'var(--text-3)', marginTop:6 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Top features */}
            {modelInfo.top_features?.length > 0 && (
              <div className="glass" style={{ padding:24, marginTop:16 }}>
                <div className="label" style={{ marginBottom:16 }}>TOP FEATURE IMPORTANCES</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {modelInfo.top_features.slice(0,8).map(f => (
                    <div key={f.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.78rem', color:'var(--text-2)', width:180, flexShrink:0 }}>{f.name}</span>
                      <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                        <motion.div
                          initial={{width:0}} whileInView={{width:`${(f.importance/modelInfo.top_features[0].importance)*100}%`}}
                          viewport={{once:true}} transition={{duration:0.8, ease:'easeOut'}}
                          style={{ height:'100%', background:'linear-gradient(90deg,var(--red),#ff6080)', borderRadius:2 }}
                        />
                      </div>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:'0.7rem', color:'var(--red)', width:60, textAlign:'right' }}>
                        {(f.importance*100).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* XGBoost equation */}
        {formulae && (
          <motion.div {...fadeUp(0.4)} className="glass-red" style={{ padding:28, marginBottom:40 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div className="divider-red" />
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:700, color:'var(--red)', letterSpacing:'0.08em' }}>
                MODEL EQUATIONS
              </h3>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                { k:'Prediction',   v: formulae.prediction_equation },
                { k:'Objective',    v: formulae.objective_function },
                { k:'Regulariser',  v: formulae.regularisation },
                { k:'Outlier Rule', v: formulae.outlier_removal },
              ].map(e => (
                <div key={e.k}>
                  <div className="label" style={{ marginBottom:6 }}>{e.k}</div>
                  <code style={{
                    display:'block', fontSize:'0.78rem', fontFamily:'monospace',
                    background:'rgba(0,0,0,0.4)', borderRadius:8, padding:'10px 14px',
                    color:'rgba(255,255,255,0.85)', border:'1px solid rgba(232,0,45,0.15)',
                  }}>{e.v}</code>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20, fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--text-3)' }}>
              Data source: {formulae.data_source}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div {...fadeUp(0.5)} style={{ textAlign:'center' }}>
          <button className="btn-primary" onClick={onLaunch} style={{ padding:'16px 48px', fontSize:'0.8rem' }}>
            🏁 Open Simulator
          </button>
        </motion.div>
      </section>
    </div>
  );
}
