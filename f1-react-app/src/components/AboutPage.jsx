import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';

const FEATURE_DESCRIPTIONS = [
  { icon: '📐', key: 'lap_ratio',    title: 'Lap Ratio',          formula: 'lap / total_laps',                      color: '#0ea5e9' },
  { icon: '🛞', key: 'tire_deg',     title: 'Tire Degradation',   formula: '0.6·L + 0.4·L²   (L = lap_ratio)',     color: '#e8002d' },
  { icon: '🏎', key: 'grid_norm',    title: 'Grid Normalised',    formula: '(grid − 1) / 19',                      color: '#ff8000' },
  { icon: '📅', key: 'year_norm',    title: 'Year Normalised',    formula: '(year − 2010) / 14',                   color: '#a855f7' },
  { icon: '🗺', key: 'circuit_len', title: 'Circuit Length (km)', formula: 'raw metres / 1000',                   color: '#00e676' },
  { icon: '🤖', key: 'driver_enc',   title: 'Driver Encoding',    formula: 'LabelEncoder(driverId)',               color: '#ffd700' },
];

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
          <h2 className="heading-lg" style={{ marginBottom:10 }}>HOW IT WORKS</h2>
          <p style={{ color:'var(--text-2)', fontFamily:'var(--font-body)', maxWidth:520, margin:'0 auto' }}>
            This simulator uses a machine learning model trained on over 120,000 real Formula 1 lap times sourced from the Ergast Motor Racing API dataset.
          </p>
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

        {/* Feature engineering formulae */}
        <motion.div {...fadeUp(0.2)} style={{ marginBottom:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div className="divider-red" />
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:700, letterSpacing:'0.08em' }}>
              FEATURE ENGINEERING FORMULAE
            </h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12 }}>
            {FEATURE_DESCRIPTIONS.map(f => (
              <div key={f.key} className="glass-dark" style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:'1.2rem' }}>{f.icon}</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'0.7rem', fontWeight:700, color:f.color }}>{f.title}</span>
                </div>
                <code style={{
                  display:'block', fontFamily:'monospace', fontSize:'0.78rem',
                  background:'rgba(0,0,0,0.35)', borderRadius:6, padding:'8px 12px',
                  color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.06)',
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
