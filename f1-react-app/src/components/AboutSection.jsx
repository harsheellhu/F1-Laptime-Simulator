import { motion } from 'framer-motion';
import { CIRCUITS, DRIVERS } from '../data/f1Data';

const SEASON_STATS = [
  { driver: 'M. Verstappen', team: 'Red Bull', points: 575, wins: 19, color: '#1E41FF' },
  { driver: 'S. Pérez', team: 'Red Bull', points: 285, wins: 2, color: '#1E41FF' },
  { driver: 'L. Hamilton', team: 'Mercedes', points: 234, wins: 0, color: '#00D2BE' },
  { driver: 'L. Norris', team: 'McLaren', points: 249, wins: 1, color: '#FF8000' },
  { driver: 'C. Leclerc', team: 'Ferrari', points: 206, wins: 0, color: '#DC0000' },
];

export default function AboutSection() {
  return (
    <section id="about" style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '80px 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div className="section-divider" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
            HOW IT WORKS
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Machine learning meets motorsport. Real physics, real strategy.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 64 }}>
          {[
            {
              icon: '🤖', title: 'ML Prediction', color: '#e8002d',
              desc: 'Random Forest & XGBoost models trained on 70+ years of F1 data. Predict lap times with ±0.3s accuracy.',
            },
            {
              icon: '🛞', title: 'Tire Strategy', color: '#ffd700',
              desc: 'Soft, Medium, Hard, Intermediate and Wet compounds modeled with real degradation curves over laps.',
            },
            {
              icon: '🌧️', title: 'Weather Engine', color: '#0090ff',
              desc: 'Five weather conditions affecting lap times, tire wear, and grip levels dynamically during the race.',
            },
            {
              icon: '🏁', title: 'Sky-View Track', color: '#00dc50',
              desc: 'Top-down animated race track visualization with your car moving in real-time, sector markers, and trail.',
            },
            {
              icon: '🔧', title: 'Pit Strategy', color: '#ff8000',
              desc: 'Automatic pit stop modelling at optimal strategy windows with 22s average stop time + variability.',
            },
            {
              icon: '📊', title: 'Full Analytics', color: '#c040ff',
              desc: 'Lap-by-lap charts, fastest lap highlight, pit stop markers, and complete race breakdown dashboard.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '24px',
                transition: 'box-shadow 0.3s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 32px ${f.color}22`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.title}</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 2024 Season snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
        >
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--red)', letterSpacing: '0.15em', marginBottom: 20 }}>2024 DRIVER STANDINGS</div>
            {SEASON_STATS.map((s, i) => (
              <div key={s.driver} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', width: 20, textAlign: 'right' }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600 }}>{s.driver}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: s.color, fontWeight: 700 }}>{s.points}pts</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.points / 575) * 100}%`, background: s.color, borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Circuit grid */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--red)', letterSpacing: '0.15em', marginBottom: 20 }}>AVAILABLE CIRCUITS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CIRCUITS.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1rem' }}>{c.flag}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.country}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>{(c.length / 1000).toFixed(3)}km</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{c.laps} laps</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
