import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAM_LIVERIES, getLivery, getDriverProfile, getTeamCarModels } from '../data/teamLiveries';
import Car3DShowroom from './Car3DShowroom';

/**
 * Premium F1 Liquid Glass Car & Team Presentation Interface
 * - Team-specific car mapping (every team has its own authentic livery & specs)
 * - Dynamic team color ambient liquid glow
 * - Changeable Pirelli tire compounds visible on car
 * - Translucent liquid glass cards for Drivers, Technical Specs, and 5-Year Chassis
 * - Seamless cinematic team transitions
 */
export default function LiquidGlassHero({
  selectedDriverId,
  selectedConstructorId,
  onSelectDriver,
  onSelectConstructor,
  tireCompound = 'soft',
  onTireChange,
  onLaunch,
}) {
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'

  // Current active driver & team
  const driver = useMemo(() => getDriverProfile(selectedDriverId || 1), [selectedDriverId]);
  const livery = useMemo(
    () => getLivery(selectedConstructorId || driver.constructorId_num || 2),
    [selectedConstructorId, driver]
  );
  const carModels = useMemo(() => getTeamCarModels(livery.id), [livery.id]);
  const [selectedYear, setSelectedYear] = useState(2026);

  const teamList = useMemo(() => Object.values(TEAM_LIVERIES), []);
  const teamDrivers = useMemo(() => Object.entries(livery.drivers || {}).map(([id, d]) => ({ id: Number(id), ...d })), [livery]);

  // Current year car model
  const activeChassis = useMemo(
    () => carModels.find((m) => m.year === selectedYear) || carModels[0],
    [carModels, selectedYear]
  );

  const TIRE_COMPOUNDS = [
    { id: 'soft', label: 'SOFT', color: '#ff1844', dot: '🔴', grip: '100%', deg: 'High' },
    { id: 'medium', label: 'MED', color: '#ffd700', dot: '🟡', grip: '96%', deg: 'Med' },
    { id: 'hard', label: 'HARD', color: '#ffffff', dot: '⚪', grip: '92%', deg: 'Low' },
    { id: 'inter', label: 'INTER', color: '#00e676', dot: '🟢', grip: 'Wet 85%', deg: 'Damp' },
    { id: 'wet', label: 'WET', color: '#0099ff', dot: '🔵', grip: 'Rain 78%', deg: 'Monsoon' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(8, 10, 18, 0.95) 0%, rgba(4, 5, 10, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `0 24px 64px -12px rgba(0, 0, 0, 0.8), 0 0 40px ${livery.secondary}18`,
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: 24,
      }}
    >
      {/* ── Layer 1: Ambient Team Liquid Glow Gradient ── */}
      <motion.div
        key={livery.id + '_glow'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          top: '-15%',
          left: '25%',
          width: '50%',
          height: '60%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${livery.secondary}35 0%, ${livery.primary}20 50%, transparent 80%)`,
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Layer 2: Top Liquid Glass Team Selection Bar ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(10, 12, 22, 0.65)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Team Badges Horizontal Scroller */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 2,
            scrollbarWidth: 'none',
          }}
        >
          {teamList.map((team) => {
            const isSelected = livery.id === team.id;
            return (
              <button
                key={team.id}
                onClick={() => {
                  onSelectConstructor(team.constructorId_num);
                  const firstDriverId = Object.keys(team.drivers || {})[0];
                  if (firstDriverId) onSelectDriver(Number(firstDriverId));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  border: isSelected
                    ? `1.5px solid ${team.secondary}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected
                    ? `linear-gradient(135deg, ${team.secondary}22 0%, rgba(255,255,255,0.05) 100%)`
                    : 'rgba(255, 255, 255, 0.02)',
                  boxShadow: isSelected ? `0 0 16px ${team.secondary}44` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: team.secondary,
                    boxShadow: isSelected ? `0 0 8px ${team.secondary}` : 'none',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.68rem',
                    fontWeight: isSelected ? 800 : 500,
                    letterSpacing: '0.06em',
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                  }}
                >
                  {team.shortName.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3D vs 2D Render Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 3,
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            onClick={() => setViewMode('3d')}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === '3d' ? livery.secondary : 'transparent',
              color: viewMode === '3d' ? '#000000' : 'rgba(255,255,255,0.6)',
              boxShadow: viewMode === '3d' ? `0 0 12px ${livery.secondary}66` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            🏎️ 3D MODEL
          </button>
          <button
            onClick={() => setViewMode('2d')}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === '2d' ? livery.secondary : 'transparent',
              color: viewMode === '2d' ? '#000000' : 'rgba(255,255,255,0.6)',
              boxShadow: viewMode === '2d' ? `0 0 12px ${livery.secondary}66` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            📐 2D BLUEPRINT
          </button>
        </div>
      </div>

      {/* ── Layer 3: Main Car Hero Stage ── */}
      <div style={{ position: 'relative', zIndex: 5, padding: '24px 28px 16px' }}>
        {/* Team Headline & Spec Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.2em',
                  color: livery.secondary,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                FORMULA 1 · OFFICIAL TEAM SPECIFICATION
              </span>
            </div>
            <motion.h2
              key={livery.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.6rem, 3.2vw, 2.6rem)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {livery.name.toUpperCase()}
            </motion.h2>
          </div>

          {/* 5-Year Chassis Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)' }}>
              CHASSIS:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontFamily: 'var(--font-display)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {carModels.map((cm) => (
                <option key={cm.year} value={cm.year} style={{ background: '#0b0d14', color: '#fff' }}>
                  {cm.name} ({cm.year})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Dynamic Car Viewer Stage with Smooth Transitions ── */}
        <div style={{ position: 'relative', width: '100%', minHeight: 460 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={livery.id + '_' + driver.number + '_' + viewMode + '_' + selectedYear}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%' }}
            >
              {viewMode === '3d' ? (
                <Car3DShowroom
                  driverId={selectedDriverId || 1}
                  constructorId={livery.constructorId_num}
                  selectedYear={selectedYear}
                  tireCompound={tireCompound}
                  onTireChange={onTireChange}
                  style={{ height: 460 }}
                />
              ) : (
                /* 2D Vector Blueprint Stage */
                <div
                  style={{
                    background: 'rgba(6, 8, 14, 0.85)',
                    padding: '36px 24px',
                    borderRadius: 20,
                    border: `1px solid ${livery.secondary}33`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="100%"
                    height="140"
                    viewBox="0 0 460 120"
                    fill="none"
                    style={{ maxWidth: 640, filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.8))' }}
                  >
                    <defs>
                      <linearGradient id={`grad_lg_${livery.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={livery.wingColor || '#111'} />
                        <stop offset="25%" stopColor={livery.primary} />
                        <stop offset="75%" stopColor={livery.primary} />
                        <stop offset="90%" stopColor={livery.secondary} />
                        <stop offset="100%" stopColor={livery.accent || livery.secondary} />
                      </linearGradient>
                    </defs>

                    <rect x="50" y="32" width="22" height="56" rx="3" fill={livery.wingColor || '#111'} stroke="rgba(255,255,255,0.15)" />
                    <rect x="54" y="36" width="14" height="48" rx="2" fill={livery.secondary} />
                    <rect x="96" y="16" width="28" height="24" rx="4" fill="#141416" stroke={livery.wheelRimColor} strokeWidth="1.5" />
                    <rect x="96" y="80" width="28" height="24" rx="4" fill="#141416" stroke={livery.wheelRimColor} strokeWidth="1.5" />
                    <line x1="110" y1="40" x2="140" y2="52" stroke="#555" strokeWidth="2" />
                    <line x1="110" y1="80" x2="140" y2="68" stroke="#555" strokeWidth="2" />
                    <line x1="330" y1="40" x2="310" y2="52" stroke="#555" strokeWidth="2" />
                    <line x1="330" y1="80" x2="310" y2="68" stroke="#555" strokeWidth="2" />
                    <rect x="316" y="20" width="24" height="20" rx="4" fill="#141416" stroke={livery.wheelRimColor} strokeWidth="1.5" />
                    <rect x="316" y="80" width="24" height="20" rx="4" fill="#141416" stroke={livery.wheelRimColor} strokeWidth="1.5" />
                    <path d="M 120 46 L 300 46 L 310 52 L 310 68 L 300 74 L 120 74 Z" fill="#0c0d12" />
                    <path d="M 150 38 Q 230 36 270 48 L 260 72 Q 230 84 150 82 Z" fill={livery.primary} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <path d="M 72 54 L 160 52 Q 240 50 340 56 L 370 60 L 340 64 Q 240 70 160 68 L 72 66 Z" fill={`url(#grad_lg_${livery.id})`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
                    <ellipse cx="232" cy="60" rx="14" ry="7" fill={livery.haloColor} stroke="#fff" strokeWidth="1" />
                    <circle cx="232" cy="60" r="4" fill={driver.helmet || livery.secondary} />
                    <path d="M 370 60 L 400 36 L 410 36 L 400 60 L 410 84 L 400 84 Z" fill={livery.wingColor || '#111'} stroke={livery.secondary} strokeWidth="1" />
                    <text x="315" y="63" fontFamily="Orbitron, monospace" fontSize="12" fontWeight="900" fill={livery.numberColor} textAnchor="middle">
                      {driver.number}
                    </text>
                  </svg>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Layer 4: Liquid Glass Cards Dashboard Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginTop: 20,
          }}
        >
          {/* Glass Card 1: Official Team Drivers */}
          <div
            style={{
              background: 'rgba(12, 15, 26, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                OFFICIAL TEAM DRIVERS
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: livery.secondary }}>
                SELECT PILOT
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teamDrivers.map((d) => {
                const isCurrentDriver = (selectedDriverId || 1) === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelectDriver(d.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: isCurrentDriver
                        ? `1.5px solid ${livery.secondary}`
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      background: isCurrentDriver
                        ? `linear-gradient(90deg, ${livery.secondary}22 0%, rgba(255,255,255,0.02) 100%)`
                        : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isCurrentDriver ? `0 0 16px ${livery.secondary}33` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: d.helmet || livery.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          color: '#000000',
                          boxShadow: `0 0 10px ${livery.secondary}66`,
                        }}
                      >
                        #{d.number}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                          {d.name}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.45)' }}>
                          {d.code} · LEAD DRIVER
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: isCurrentDriver ? livery.secondary : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {isCurrentDriver ? 'ACTIVE 🏎️' : 'SWITCH'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Glass Card 2: Technical Powertrain & Aero Specs */}
          <div
            style={{
              background: 'rgba(12, 15, 26, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                TECHNICAL POWERTRAIN & AERO
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--green)' }}>
                TELEMETRY READY
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  Power Unit
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                  {activeChassis.power}% BHP
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  Aero Efficiency
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', fontWeight: 800, color: livery.secondary, marginTop: 2 }}>
                  {activeChassis.aero}% LOAD
                </div>
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
              <strong>Engine:</strong> {activeChassis.engine}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              {activeChassis.desc}
            </div>
          </div>

          {/* Glass Card 3: Pirelli Tire Strategy & Compound Selector */}
          <div
            style={{
              background: 'rgba(12, 15, 26, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                PIRELLI TIRE COMPOUND STRATEGY
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--gold)' }}>
                3D SYNCHRONIZED
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {TIRE_COMPOUNDS.map((t) => {
                const isSel = tireCompound === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTireChange && onTireChange(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 16,
                      cursor: 'pointer',
                      border: isSel ? `1.5px solid ${t.color}` : '1px solid rgba(255,255,255,0.06)',
                      background: isSel ? `${t.color}25` : 'rgba(255,255,255,0.02)',
                      boxShadow: isSel ? `0 0 12px ${t.color}44` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: isSel ? 800 : 500, color: isSel ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: '#ffffff' }}>
                <span>Selected: <strong style={{ color: livery.secondary }}>{tireCompound.toUpperCase()}</strong></span>
                <span>Pace Delta: <strong>{tireCompound === 'soft' ? '0.00s' : tireCompound === 'medium' ? '+0.42s' : '+0.95s'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
