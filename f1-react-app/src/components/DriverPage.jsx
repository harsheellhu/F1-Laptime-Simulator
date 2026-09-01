import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DRIVERS_DATA, getDriverById } from '../data/driversData';
import { getLivery } from '../data/teamLiveries';
import Car3DShowroom from './Car3DShowroom';

/**
 * Premium F1 Simulation Driver Page
 * - Every driver has their authentic team car model & dynamic livery
 * - Racing game cockpit aesthetic with liquid glass depth & team ambient lighting
 * - Changeable Pirelli tire compounds visible on the 3D car in real-time
 * - Animated driver skill ratings & performance telemetry
 * - Interactive Head-to-Head Driver Comparison modal/drawer
 * - Recent Grand Prix race results history with finishing positions & points
 */
export default function DriverPage({ onLaunchSim, initialDriverId = 1 }) {
  const [activeDriverId, setActiveDriverId] = useState(initialDriverId);
  const [tireCompound, setTireCompound] = useState('soft');
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [compareDriverId, setCompareDriverId] = useState(null); // Comparison driver ID

  // Active Driver & Team Livery Data
  const driver = useMemo(() => getDriverById(activeDriverId), [activeDriverId]);
  const livery = useMemo(() => getLivery(driver.teamId), [driver]);
  const compareDriver = useMemo(() => (compareDriverId ? getDriverById(compareDriverId) : null), [compareDriverId]);

  // Teammate for quick comparison
  const teammate = useMemo(() => {
    return DRIVERS_DATA.find((d) => d.teamId === driver.teamId && d.id !== driver.id) || null;
  }, [driver]);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  });

  const RATING_METRICS = [
    { key: 'pace', label: 'RACE PACE', color: '#ff1844' },
    { key: 'qualifying', label: 'QUALIFYING SPEED', color: '#ffd700' },
    { key: 'racecraft', label: 'RACECRAFT & OVERTAKING', color: '#00f0ff' },
    { key: 'consistency', label: 'LAP CONSISTENCY', color: '#00e676' },
    { key: 'tireManagement', label: 'TIRE DEGRADATION MGMT', color: '#a855f7' },
    { key: 'wetSkill', label: 'WET WEATHER MASTERY', color: '#38bdf8' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--bg-void)', paddingBottom: 60 }}>
      {/* ── Ambient Dynamic Team Liquid Glow ── */}
      <motion.div
        key={driver.id + '_liquid_glow'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          position: 'fixed',
          top: 0,
          left: '20%',
          width: '60%',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at top, ${livery.secondary}30 0%, ${livery.primary}18 50%, transparent 75%)`,
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* ── 1. Horizontal 20-Driver Selector Carousel ── */}
        <div
          style={{
            marginBottom: 20,
            background: 'rgba(8, 10, 18, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '12px 16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.64rem',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
              }}
            >
              OFFICIAL 2024 FORMULA 1 GRID · SELECT PILOT
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: livery.secondary }}>
              20 / 20 DRIVERS ACTIVE
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}
          >
            {DRIVERS_DATA.map((d) => {
              const isSel = d.id === driver.id;
              const dLivery = getLivery(d.teamId);
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDriverId(d.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 16,
                    cursor: 'pointer',
                    border: isSel ? `1.5px solid ${dLivery.secondary}` : '1px solid rgba(255, 255, 255, 0.06)',
                    background: isSel
                      ? `linear-gradient(135deg, ${dLivery.secondary}25 0%, rgba(255,255,255,0.04) 100%)`
                      : 'rgba(255, 255, 255, 0.02)',
                    boxShadow: isSel ? `0 0 14px ${dLivery.secondary}44` : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: d.helmet || dLivery.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      color: '#000',
                    }}
                  >
                    #{d.number}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.72rem',
                        fontWeight: isSel ? 800 : 600,
                        color: isSel ? '#ffffff' : 'rgba(255,255,255,0.65)',
                      }}
                    >
                      {d.code}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.55rem',
                        color: dLivery.secondary,
                      }}
                    >
                      {dLivery.shortName}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Cinematic Driver Hero Stage ── */}
        <div
          style={{
            position: 'relative',
            borderRadius: 28,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(12, 15, 28, 0.85) 0%, rgba(6, 8, 16, 0.95) 100%)',
            border: `1px solid ${livery.secondary}44`,
            boxShadow: `0 24px 64px -12px rgba(0, 0, 0, 0.8), 0 0 40px ${livery.secondary}15`,
            marginBottom: 24,
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Header Info Overlay */}
          <div
            style={{
              padding: '24px 28px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 16,
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Driver Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span
                  style={{
                    background: livery.secondary,
                    color: '#000',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  #{driver.number}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    color: livery.secondary,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  {livery.name.toUpperCase()} · {driver.flag} {driver.nationality.toUpperCase()}
                </span>
              </div>

              <motion.h1
                key={driver.id + '_name'}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  margin: '0 0 8px 0',
                }}
              >
                {driver.fullName.toUpperCase()}
              </motion.h1>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.86rem',
                  color: 'rgba(255,255,255,0.65)',
                  maxWidth: 680,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {driver.bio}
              </p>
            </div>

            {/* Overall Rating Score & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Head-to-Head Compare Toggle */}
              {teammate && (
                <button
                  onClick={() => setCompareDriverId(compareDriverId ? null : teammate.id)}
                  style={{
                    background: compareDriverId ? 'rgba(255, 24, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: compareDriverId ? '1px solid var(--red)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 16,
                    padding: '8px 16px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  ⚔️ {compareDriverId ? 'CLOSE COMPARISON' : `COMPARE VS #${teammate.number} ${teammate.code}`}
                </button>
              )}

              {/* Overall Driver Rating Badge */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: `2px solid ${livery.secondary}`,
                  borderRadius: 20,
                  padding: '8px 20px',
                  textAlign: 'center',
                  boxShadow: `0 0 20px ${livery.secondary}44`,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    color: livery.secondary,
                    lineHeight: 1,
                  }}
                >
                  {driver.ratings.overall}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                  }}
                >
                  OVERALL RATING
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Prominent 3D Car Model Stage ── */}
          <div style={{ position: 'relative', width: '100%', minHeight: 480 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={driver.id + '_' + tireCompound + '_' + viewMode}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%' }}
              >
                <Car3DShowroom
                  driverId={driver.id}
                  constructorId={driver.constructorId_num}
                  tireCompound={tireCompound}
                  onTireChange={(c) => setTireCompound(c)}
                  style={{ height: 480 }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── 4. Driver Performance & Head-to-Head Comparison Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: compareDriver ? '1fr 1fr' : '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Performance Skill Ratings Card */}
          <div
            style={{
              background: 'rgba(10, 13, 24, 0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 24,
              padding: '24px 28px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', letterSpacing: '0.12em', color: livery.secondary, textTransform: 'uppercase', fontWeight: 700 }}>
                  TELEMETRY ATTRIBUTES
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0 0 0' }}>
                  PILOT PERFORMANCE BENCHMARK
                </h3>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)' }}>
                F1 2024 RATINGS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {RATING_METRICS.map((metric) => {
                const score = driver.ratings[metric.key];
                return (
                  <div key={metric.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: '#ffffff' }}>
                        {metric.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 800, color: metric.color }}>
                        {score} <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>/ 100</span>
                      </span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${metric.color}88, ${metric.color})`, borderRadius: 3 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* If Head-to-Head Comparison is Active */}
          {compareDriver ? (
            <div
              style={{
                background: 'rgba(10, 13, 24, 0.7)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                    HEAD-TO-HEAD TELEMETRY
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0 0 0' }}>
                    #{driver.number} {driver.code} VS #{compareDriver.number} {compareDriver.code}
                  </h3>
                </div>
                <button
                  onClick={() => setCompareDriverId(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {RATING_METRICS.map((metric) => {
                  const s1 = driver.ratings[metric.key];
                  const s2 = compareDriver.ratings[metric.key];
                  const diff = s1 - s2;
                  return (
                    <div key={metric.key} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.66rem', marginBottom: 4 }}>
                        <span style={{ color: livery.secondary, fontWeight: 700 }}>{s1}</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{metric.label}</span>
                        <span style={{ color: getLivery(compareDriver.teamId).secondary, fontWeight: 700 }}>{s2}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: diff > 0 ? 'var(--green)' : diff < 0 ? '#ff1844' : 'var(--text-4)' }}>
                        {diff > 0 ? `+${diff} Advantage` : diff < 0 ? `${diff} Deficit` : 'EQUAL'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Career Hall of Fame & Spec Cards */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Career Statistics Matrix */}
              <div
                style={{
                  background: 'rgba(10, 13, 24, 0.7)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 24,
                  padding: '20px 24px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', color: livery.secondary, textTransform: 'uppercase', fontWeight: 700 }}>
                  CAREER FORMULA 1 MILESTONES
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                  {[
                    { label: 'WORLD TITLES', val: driver.championships, color: 'var(--gold)' },
                    { label: 'RACE WINS', val: driver.careerWins, color: '#ff1844' },
                    { label: 'PODIUMS', val: driver.careerPodiums, color: '#00f0ff' },
                    { label: 'POLE POSITIONS', val: driver.careerPoles, color: '#00e676' },
                    { label: 'FASTEST LAPS', val: driver.fastestLaps, color: '#a855f7' },
                    { label: 'CAREER POINTS', val: driver.careerPoints, color: '#ffffff' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, color: stat.color }}>
                        {stat.val}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Car Powertrain Spec Snapshot */}
              <div
                style={{
                  background: 'rgba(10, 13, 24, 0.7)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 24,
                  padding: '20px 24px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', color: livery.secondary, textTransform: 'uppercase', fontWeight: 700 }}>
                    MACHINERY SPECIFICATION · {driver.car.model}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--green)' }}>
                    FIA 2024 REGULATION
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: 'rgba(255,255,255,0.4)' }}>POWER</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>{driver.car.horsepower}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: 'rgba(255,255,255,0.4)' }}>TOP SPEED</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', fontWeight: 800, color: livery.secondary, marginTop: 2 }}>{driver.car.topSpeed}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: 'rgba(255,255,255,0.4)' }}>0-100 KM/H</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>{driver.car.acceleration}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: 'rgba(255,255,255,0.4)' }}>DOWNFORCE</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>{driver.car.downforceKg}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Recent 2024 Grand Prix Results Cards ── */}
        <div
          style={{
            background: 'rgba(10, 13, 24, 0.7)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '24px 28px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', color: livery.secondary, textTransform: 'uppercase', fontWeight: 700 }}>
                2024 SEASON PERFORMANCE LOG
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0 0 0' }}>
                RECENT GRAND PRIX RESULTS
              </h3>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)' }}>
              OFFICIAL FIA TELEMETRY
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {driver.recentRaces.map((race) => (
              <motion.div
                key={race.grandPrix}
                whileHover={{ y: -4, scale: 1.02 }}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: race.pos === 'P1' ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  transition: 'all 0.2s ease',
                  boxShadow: race.pos === 'P1' ? '0 0 16px rgba(255, 184, 0, 0.2)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                    {race.grandPrix}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.88rem',
                      fontWeight: 900,
                      color: race.pos === 'P1' ? 'var(--gold)' : race.pos === 'P2' || race.pos === 'P3' ? '#00f0ff' : '#ffffff',
                    }}
                  >
                    {race.pos}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)' }}>
                  <span>Grid: {race.grid}</span>
                  <span style={{ color: race.points > 0 ? 'var(--green)' : 'rgba(255,255,255,0.3)' }}>+{race.points} PTS</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    color: livery.secondary,
                    marginTop: 6,
                    letterSpacing: '0.06em',
                  }}
                >
                  {race.status}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── 6. Bottom Simulation Launch Bar ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'rgba(10, 13, 24, 0.85)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${livery.secondary}44`,
            borderRadius: 24,
            padding: '16px 28px',
            boxShadow: `0 12px 40px ${livery.secondary}22`,
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
              SIMULATE RACE WITH {driver.fullName.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: 'rgba(255,255,255,0.5)' }}>
              Chassis: {driver.car.model} · Compound: {tireCompound.toUpperCase()}
            </div>
          </div>

          <button
            onClick={() => onLaunchSim && onLaunchSim(driver.id, driver.constructorId_num)}
            className="btn-primary"
            style={{
              padding: '12px 32px',
              fontSize: '0.8rem',
              background: `linear-gradient(90deg, ${livery.secondary}, #ff1844)`,
              boxShadow: `0 0 20px ${livery.secondary}55`,
            }}
          >
            🏁 Open Race Simulator with {driver.code}
          </button>
        </div>
      </div>
    </div>
  );
}
