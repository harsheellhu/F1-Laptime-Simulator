import { useState } from 'react';
import { getLivery, getDriverProfile } from '../data/teamLiveries';
import Car3DShowroom from './Car3DShowroom';

/**
 * Pixel-accurate F1 Car Livery & Driver Specification 3D Showroom
 * Renders big dynamic 3D Formula 1 car styling with authentic
 * team wings, sidepods, halo, driver helmet, race number, and changeable Pirelli tires.
 */
export default function CarLiveryPreview({
  driverId,
  constructorId,
  tireCompound = 'soft',
  onTireChange,
  compact = false,
}) {
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'

  const driver = getDriverProfile(driverId);
  const livery = getLivery(constructorId || driver.constructorId_num);

  const {
    name: teamName,
    shortName,
    primary,
    secondary,
    accent,
    wingColor,
    haloColor,
    wheelRimColor,
    numberColor,
    pattern,
  } = livery;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: `0 12px 40px rgba(0,0,0,0.6), inset 0 0 20px ${primary}33`,
      }}
    >
      {/* View Mode Toggle Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(8, 10, 18, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: secondary,
              boxShadow: `0 0 8px ${secondary}`,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.66rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#ffffff',
            }}
          >
            {teamName.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: secondary,
            }}
          >
            #{driver.number} {driver.name}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('3d')}
            style={{
              background: viewMode === '3d' ? 'rgba(255, 24, 68, 0.25)' : 'transparent',
              border: viewMode === '3d' ? '1px solid var(--red)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: viewMode === '3d' ? '#ffffff' : 'var(--text-3)',
              borderRadius: 6,
              padding: '3px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🏎️ 3D MODEL
          </button>
          <button
            onClick={() => setViewMode('2d')}
            style={{
              background: viewMode === '2d' ? 'rgba(255, 24, 68, 0.25)' : 'transparent',
              border: viewMode === '2d' ? '1px solid var(--red)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: viewMode === '2d' ? '#ffffff' : 'var(--text-3)',
              borderRadius: 6,
              padding: '3px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📐 2D BLUEPRINT
          </button>
        </div>
      </div>

      {/* 3D Big Dynamic Showroom View */}
      {viewMode === '3d' ? (
        <Car3DShowroom
          driverId={driverId}
          constructorId={constructorId}
          tireCompound={tireCompound}
          onTireChange={onTireChange}
          style={{ height: compact ? 380 : 460, borderRadius: '0 0 16px 16px', border: 'none' }}
        />
      ) : (
        /* 2D Schematic View */
        <div
          style={{
            background: 'rgba(5, 6, 12, 0.85)',
            padding: '24px 20px',
            border: `1px solid ${secondary}44`,
            borderRadius: '0 0 16px 16px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px 0' }}>
            <svg
              width="100%"
              height="100"
              viewBox="0 0 460 120"
              fill="none"
              style={{ maxWidth: 440, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.7))' }}
            >
              <defs>
                <linearGradient id={`grad_body_${pattern}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={wingColor} />
                  <stop offset="25%" stopColor={primary} />
                  <stop offset="70%" stopColor={primary} />
                  <stop offset="90%" stopColor={secondary} />
                  <stop offset="100%" stopColor={accent} />
                </linearGradient>

                <linearGradient id={`grad_sidepod_${pattern}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={primary} />
                  <stop offset="50%" stopColor={secondary} />
                  <stop offset="100%" stopColor={primary} />
                </linearGradient>
              </defs>

              {/* Rear Wing Endplates & Flap */}
              <rect x="50" y="32" width="22" height="56" rx="3" fill={wingColor} stroke="rgba(255,255,255,0.15)" />
              <rect x="54" y="36" width="14" height="48" rx="2" fill={secondary} />

              {/* Rear Tires */}
              <rect x="96" y="16" width="28" height="24" rx="4" fill="#141416" stroke={wheelRimColor} strokeWidth="1.5" />
              <rect x="96" y="80" width="28" height="24" rx="4" fill="#141416" stroke={wheelRimColor} strokeWidth="1.5" />

              {/* Suspension Arms */}
              <line x1="110" y1="40" x2="140" y2="52" stroke="#555" strokeWidth="2" />
              <line x1="110" y1="80" x2="140" y2="68" stroke="#555" strokeWidth="2" />
              <line x1="330" y1="40" x2="310" y2="52" stroke="#555" strokeWidth="2" />
              <line x1="330" y1="80" x2="310" y2="68" stroke="#555" strokeWidth="2" />

              {/* Front Tires */}
              <rect x="316" y="20" width="24" height="20" rx="4" fill="#141416" stroke={wheelRimColor} strokeWidth="1.5" />
              <rect x="316" y="80" width="24" height="20" rx="4" fill="#141416" stroke={wheelRimColor} strokeWidth="1.5" />

              {/* Floor / Venturi Underbody */}
              <path d="M 120 46 L 300 46 L 310 52 L 310 68 L 300 74 L 120 74 Z" fill="#0c0d12" />

              {/* Sidepods */}
              <path d="M 150 38 Q 230 36 270 48 L 260 72 Q 230 84 150 82 Z" fill={`url(#grad_sidepod_${pattern})`} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

              {/* Central Monocoque Body */}
              <path d="M 72 54 L 160 52 Q 240 50 340 56 L 370 60 L 340 64 Q 240 70 160 68 L 72 66 Z" fill={`url(#grad_body_${pattern})`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

              {/* Halo Cockpit */}
              <ellipse cx="232" cy="60" rx="14" ry="7" fill={haloColor} stroke="#fff" strokeWidth="1" />
              <circle cx="232" cy="60" r="4" fill={driver.helmet || secondary} />

              {/* Front Nose Cone & Front Wing */}
              <path d="M 370 60 L 400 36 L 410 36 L 400 60 L 410 84 L 400 84 Z" fill={wingColor} stroke={secondary} strokeWidth="1" />

              {/* Driver Race Number */}
              <text x="315" y="63" fontFamily="Orbitron, monospace" fontSize="11" fontWeight="900" fill={numberColor} textAnchor="middle">
                {driver.number}
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
