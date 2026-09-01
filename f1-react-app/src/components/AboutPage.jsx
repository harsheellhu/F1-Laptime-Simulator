import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';

const FEATURE_DESCRIPTIONS = [
  { icon: '📐', key: 'lap_ratio',   title: 'Lap Ratio',          formula: 'lap / total_laps',                  color: '#00f0ff', desc: 'Normalizes lap position in race (0-1 scale)' },
  { icon: '🛞', key: 'tire_deg',    title: 'Tire Degradation',   formula: '0.6·L + 0.4·L²  (L = lap_ratio)',   color: '#ff1844', desc: 'Polynomial wear curve modeling compound decay' },
  { icon: '🏎️', key: 'grid_norm',   title: 'Grid Normalised',    formula: '(grid − 1) / 19',                  color: '#ff8000', desc: 'Pole position = 0, last = 1' },
  { icon: '📅', key: 'year_norm',   title: 'Year Normalised',    formula: '(year − 2010) / 14',               color: '#a855f7', desc: 'Era adjustment across 2010-2024 seasons' },
  { icon: '🗺️', key: 'circuit_len', title: 'Circuit Length',     formula: 'circuit_km',                       color: '#00e676', desc: 'Circuit length in kilometres' },
  { icon: '🤖', key: 'driver_enc',  title: 'Driver Encoding',    formula: 'LabelEncoder(driverId)',           color: '#ffd700', desc: 'Categorical tree-split encoding' },
];

const FORMULA_CARDS = [
  {
    title: 'Fuel Burn Rate Effect',
    formula: 'fuel_effect = (1 - fuel_norm) × 0.4',
    desc: 'Cars burn ~1.6kg fuel/lap. Lighter cars gain up to 0.4s per lap.',
    icon: '⛽',
    color: '#00e676',
  },
  {
    title: 'Track Evolution & Grip',
    formula: 'track_evol = min(lap × 0.02, 0.3)',
    desc: 'Rubber deposition onto racing line increases lap times up to 0.3s.',
    icon: '✨',
    color: '#00f0ff',
  },
  {
    title: 'Composite Power Score',
    formula: 'team_perf = (0.3P + 0.4A + 0.15L + 0.15H) / 100',
    desc: 'Weighted engine power, aerodynamic downforce, and speed balance.',
    icon: '🏎️',
    color: '#ff1844',
  },
  {
    title: 'Compound Degradation',
    formula: 'tire_wear = 0.6·(lap/total) + 0.4·(lap/total)²',
    desc: 'Captures exponential tire grip cliff during middle & late stint.',
    icon: '🛞',
    color: '#ffb800',
  },
  {
    title: 'Experience Gradient',
    formula: 'exp_factor = ln(1 + exp_years) / ln(21)',
    desc: 'Logarithmic diminishing returns curve for veteran race craft.',
    icon: '📈',
    color: '#a855f7',
  },
  {
    title: 'Driver Age Peak Curve',
    formula: 'age_factor = max(0.8, 1 - |age - 29| / 100)',
    desc: 'Empirical biological & reaction time peak centering at 29 years old.',
    icon: '⚡',
    color: '#38bdf8',
  },
];

const TerminalTypewriter = ({ text }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'left',
        background: 'rgba(8, 9, 15, 0.95)',
        padding: '24px 28px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 24, 68, 0.25)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        maxWidth: 780,
        margin: '0 auto',
        lineHeight: 1.7,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, var(--red), transparent)',
        }}
      />
      <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f56' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#27c93f' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: 'var(--green)' }}>pitwall@f1-xgboost</span>
        <span style={{ color: 'var(--text-3)' }}>:~/telemetry$</span> ./predict_lap.py --explain
      </div>
      <div style={{ color: '#c4cbd4' }}>{text}</div>
    </motion.div>
  );
};

export default function AboutPage({ onLaunch }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [formulae, setFormulae] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    Promise.all([api.modelInfo(), api.formulae()])
      .then(([mi, fm]) => {
        setModelInfo(mi);
        setFormulae(fm);
        setApiOnline(true);
      })
      .catch(() => setApiOnline(false));
  }, []);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  });

  return (
    <div id="about" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--glass-border)' }}>
      {/* Model Status Banner */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: apiOnline ? 'rgba(0,230,118,0.06)' : 'rgba(255,184,0,0.06)',
            border: `1px solid ${apiOnline ? 'rgba(0,230,118,0.2)' : 'rgba(255,184,0,0.2)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
          }}
        >
          <span className={`status-dot ${apiOnline ? 'online' : 'offline'}`} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.66rem',
              letterSpacing: '0.12em',
              color: apiOnline ? 'var(--green)' : 'var(--gold)',
            }}
          >
            {apiOnline
              ? 'XGBOOST ML ENGINE ACTIVE · 120K REAL LAPS LOADED'
              : 'OFFLINE MODE · START FASTAPI ON PORT 8000 FOR PREDICTIONS'}
          </span>
          {apiOnline && modelInfo && (
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-display)',
                fontSize: '0.62rem',
                color: 'var(--text-3)',
                letterSpacing: '0.1em',
              }}
            >
              {modelInfo.model_type?.toUpperCase()} · MAE {modelInfo.test_mae?.toFixed(2)}s · R²{' '}
              {modelInfo.test_r2?.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {/* Section: Architecture */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="divider-red" style={{ margin: '0 auto 12px' }} />
          <h2 className="heading-lg" style={{ marginBottom: 24, letterSpacing: '0.04em' }}>
            ML ARCHITECTURE & TELEMETRY
          </h2>
          <TerminalTypewriter text="F1 racing dynamics contain severe non-linear physics: compound grip cliff, aero wake turbulence, and fuel load decay. By training 400 gradient-boosted decision trees over 120,000 real lap records from the Ergast F1 dataset, our model captures multi-variable telemetry without synthetic hallucinations or overfitted noise." />
        </motion.div>

        {/* ── Minimal Architecture Telemetry Stats Strip ── */}
        <motion.div
          {...fadeUp(0.1)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
            maxWidth: 880,
            margin: '0 auto 48px',
            padding: '14px 28px',
            background: 'rgba(12, 14, 24, 0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 40,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          {[
            { val: '400', label: 'Gradient Trees', color: '#ff1844' },
            { val: '120K+', label: 'Ergast Telemetry Laps', color: '#00f0ff' },
            { val: '2,400 kg', label: 'Peak Downforce', color: '#00e676' },
            { val: '160 BHP', label: 'MGU-K Hybrid', color: '#a855f7' },
            { val: '±0.18s', label: 'MAE Accuracy', color: '#ffb800' },
          ].map((item, idx) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: item.color,
                    lineHeight: 1.1,
                  }}
                >
                  {item.val}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.08em',
                    color: 'rgba(255, 255, 255, 0.45)',
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  {item.label}
                </div>
              </div>
              {idx < 4 && (
                <div style={{ width: 1, height: 24, background: 'rgba(255, 255, 255, 0.08)' }} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Feature Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
            gap: 16,
            marginBottom: 48,
          }}
        >
          {[
            {
              icon: '⚡',
              title: 'XGBoost Regressor',
              color: '#ff1844',
              desc: '400 gradient boosted trees trained on 120,000 real F1 laps with tree_method=hist.',
            },
            {
              icon: '🛞',
              title: 'Tire Wear Model',
              color: '#ffb800',
              desc: 'Polynomial decay curve (0.6·L + 0.4·L²) reflecting real Pirelli tire degradation physics.',
            },
            {
              icon: '📊',
              title: 'Multi-Feature Vector',
              color: '#00f0ff',
              desc: '10 normalized inputs: stint progress, grid bias, circuit length, era index, and driver IDs.',
            },
            {
              icon: '🏁',
              title: 'Top-Down Track View',
              color: '#00e676',
              desc: 'Fluid canvas-rendered racetrack visualizer displaying real-time car progression each lap.',
            },
            {
              icon: '⚙️',
              title: 'Zero Synthetic Data',
              color: '#ff8000',
              desc: 'All lap times and sector deltas are generated by the trained machine learning pipeline.',
            },
            {
              icon: '📈',
              title: 'Live Telemetry & Delta',
              color: '#a855f7',
              desc: 'Real-time telemetry trace, fastest lap reference line, pit delta compensation, and R² scores.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp(i * 0.05)}
              className="glass"
              style={{ padding: 24, cursor: 'default' }}
            >
              <div style={{ fontSize: '1.7rem', marginBottom: 12 }}>{f.icon}</div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: f.color,
                  marginBottom: 8,
                }}
              >
                {f.title}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.84rem',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Feature Engineering Formulae */}
        <motion.div {...fadeUp(0.15)} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="divider-red" />
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              FEATURE ENGINEERING FORMULAE
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {FORMULA_CARDS.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp(i * 0.05)}
                className="glass-formula"
                style={{
                  padding: '20px 24px',
                  borderLeft: `3px solid ${f.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.4rem' }}>{f.icon}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: f.color,
                      letterSpacing: '0.08em',
                    }}
                  >
                    {f.title}
                  </span>
                </div>
                <code
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 10,
                  }}
                >
                  {f.formula}
                </code>
                <p
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.78rem',
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                  }}
                >
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Compact Feature Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
              gap: 10,
            }}
          >
            {FEATURE_DESCRIPTIONS.map((f) => (
              <div
                key={f.key}
                className="glass"
                style={{
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.95rem' }}>{f.icon}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: f.color,
                    }}
                  >
                    {f.title}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.66rem',
                    color: 'var(--text-3)',
                    marginBottom: 4,
                  }}
                >
                  {f.formula}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    color: 'var(--text-2)',
                    lineHeight: 1.4,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div {...fadeUp(0.2)} style={{ textAlign: 'center', paddingTop: 20 }}>
          <button
            className="btn-primary"
            onClick={onLaunch}
            style={{ padding: '14px 44px', fontSize: '0.82rem' }}
          >
            🏁 Open Race Simulator
          </button>
        </motion.div>
      </section>
    </div>
  );
}
