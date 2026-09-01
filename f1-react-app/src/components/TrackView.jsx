import { useEffect, useRef } from 'react';
import { getCircuitTrack } from '../data/circuitTracks';
import { getDriverProfile, getLivery } from '../data/teamLiveries';

/**
 * Top-down authentic racetrack view with real circuit design & detailed team livery car(s).
 * Supports both single-car telemetry view and multi-car head-to-head racing comparison!
 */
export default function TrackView({
  circuitId = 1,
  driverId = 1,
  constructorId = 1,
  multiCars = null, // Array of { driverId, constructorId, name } for multi-driver comparison
  isRunning,
  currentLap,
  totalLaps,
  lastLapTime,
}) {
  const cvs = useRef(null);
  const raf = useRef(null);
  const progressRefs = useRef({});
  const trails = useRef({});
  const t = useRef(0);

  const track = getCircuitTrack(circuitId);
  const activeDriver = getDriverProfile(driverId);
  const activeLivery = getLivery(constructorId || activeDriver.constructorId_num);

  const carsToRender = multiCars && multiCars.length > 0
    ? multiCars
    : [{ driverId, constructorId, isLeader: true }];

  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const pts = track.pts || [
      [200, 480],
      [400, 480],
      [550, 440],
      [580, 300],
      [500, 180],
      [360, 160],
      [220, 260],
      [180, 400],
      [200, 480],
    ];

    // Compute cumulative distances along track polygon for constant-speed parametric interpolation
    const cumDist = [0];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      cumDist.push(cumDist[cumDist.length - 1] + Math.hypot(dx, dy));
    }
    const totalDist = cumDist[cumDist.length - 1] || 1;

    const pointAt = (frac) => {
      const target = ((frac % 1) + 1) % 1 * totalDist;
      for (let i = 1; i < pts.length; i++) {
        if (cumDist[i] >= target) {
          const seg = cumDist[i] - cumDist[i - 1];
          const segT = seg === 0 ? 0 : (target - cumDist[i - 1]) / seg;
          return {
            x: pts[i - 1][0] + segT * (pts[i][0] - pts[i - 1][0]),
            y: pts[i - 1][1] + segT * (pts[i][1] - pts[i - 1][1]),
            angle: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]),
          };
        }
      }
      return { x: pts[0][0], y: pts[0][1], angle: 0 };
    };

    // Initialize car offsets
    carsToRender.forEach((c, idx) => {
      const key = `${c.driverId}_${c.constructorId}`;
      if (progressRefs.current[key] === undefined) {
        progressRefs.current[key] = (idx * -0.035 + 1) % 1;
      }
      if (!trails.current[key]) {
        trails.current[key] = [];
      }
    });

    const draw = () => {
      t.current += 0.016;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      const sx = w / 800;
      const sy = h / 600;
      const scale = Math.min(sx, sy);
      const spt = (p) => [p[0] * sx, p[1] * sy];

      // Void / Deep Tarmac Background
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, '#0c0d18');
      bg.addColorStop(0.5, '#07080f');
      bg.addColorStop(1, '#040408');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Sector grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.018)';
      ctx.lineWidth = 1;
      const step = 40 * scale;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const scaled = pts.map((p) => spt(p));

      // 1. Runoff / Gravel Bed Buffer
      ctx.beginPath();
      scaled.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(20, 24, 38, 0.9)';
      ctx.lineWidth = 42 * scale;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // 2. Track Grass Verge / Outer Curbs
      ctx.strokeStyle = 'rgba(18, 50, 30, 0.4)';
      ctx.lineWidth = 34 * scale;
      ctx.stroke();

      // 3. Track Asphalt Surface
      ctx.beginPath();
      scaled.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.closePath();
      ctx.strokeStyle = '#181924';
      ctx.lineWidth = 26 * scale;
      ctx.stroke();

      // 4. Red & White Curbs
      const curbCount = 120;
      for (let i = 0; i < curbCount; i++) {
        const pt = pointAt(i / curbCount);
        const px = pt.x * sx;
        const py = pt.y * sy;
        const normAngle = pt.angle + Math.PI / 2;
        const offset = 14 * scale;

        ctx.fillStyle = i % 2 === 0 ? '#ff1844' : '#ffffff';
        ctx.beginPath();
        ctx.arc(px + Math.cos(normAngle) * offset, py + Math.sin(normAngle) * offset, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - Math.cos(normAngle) * offset, py - Math.sin(normAngle) * offset, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. DRS Activation Lines
      ctx.save();
      ctx.setLineDash([12 * scale, 8 * scale]);
      ctx.beginPath();
      scaled.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 6. White Racing Line Center Guides
      ctx.save();
      ctx.setLineDash([6 * scale, 14 * scale]);
      ctx.beginPath();
      scaled.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 7. Start / Finish Line
      const sf = pointAt(0);
      const sfx = sf.x * sx;
      const sfy = sf.y * sy;
      ctx.save();
      ctx.translate(sfx, sfy);
      ctx.rotate(sf.angle + Math.PI / 2);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(-14 * scale + i * (3.5 * scale), -2 * scale, 3.5 * scale, 4 * scale);
      }
      ctx.restore();

      // 8. Sector Markers
      [[0.33, 'S1', '#00f0ff'], [0.66, 'S2', '#ffb800']].forEach(([frac, label, col]) => {
        const pt = pointAt(frac);
        const px = pt.x * sx;
        const py = pt.y * sy;

        ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px - 14 * scale, py - 18 * scale, 28 * scale, 14 * scale, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.font = `bold ${8 * scale}px Orbitron, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, px, py - 11 * scale);
      });

      // 9. Render All Cars (Single or Multi-Car Comparison)
      carsToRender.forEach((c, idx) => {
        const key = `${c.driverId}_${c.constructorId}`;
        const driverProf = getDriverProfile(c.driverId);
        const carLivery = getLivery(c.constructorId || driverProf.constructorId_num);

        if (isRunning) {
          // Slight speed delta based on car index for realistic racing separation
          const speedMod = 0.0022 - idx * 0.00008;
          progressRefs.current[key] = ((progressRefs.current[key] || 0) + speedMod) % 1;
        }

        const carPos = pointAt(progressRefs.current[key] || 0);
        const cx = carPos.x * sx;
        const cy = carPos.y * sy;

        // Trail & slipstream
        if (!trails.current[key]) trails.current[key] = [];
        const tr = trails.current[key];
        tr.push({ x: cx, y: cy, age: 0 });
        if (tr.length > 35) tr.shift();
        tr.forEach((p) => p.age++);

        for (let i = 0; i < tr.length; i++) {
          const p = tr[i];
          const a = (1 - p.age / 35) * 0.45;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (1 - p.age / 35) * 3.5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = `${carLivery.secondary}${Math.round(a * 255)
            .toString(16)
            .padStart(2, '0')}`;
          ctx.fill();
        }

        // Car Glow
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22 * scale);
        glow.addColorStop(0, `${carLivery.secondary}55`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - 22 * scale, cy - 22 * scale, 44 * scale, 44 * scale);

        // Draw Car Body
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(carPos.angle);
        const s = scale * 1.05;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14 * s, 5.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rear Wing
        ctx.fillStyle = carLivery.wingColor || '#0a0a0a';
        ctx.fillRect(-14 * s, -6 * s, 3 * s, 12 * s);
        ctx.fillStyle = carLivery.secondary;
        ctx.fillRect(-13 * s, -4 * s, 1.8 * s, 8 * s);

        // Wheels
        ctx.fillStyle = '#111';
        [[-6.5, -6.5], [-6.5, 6.5], [8.5, -6], [8.5, 6]].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.ellipse(dx * s, dy * s, 3 * s, 1.8 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = carLivery.wheelRimColor || carLivery.secondary;
          ctx.beginPath();
          ctx.arc(dx * s, dy * s, 0.8 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111';
        });

        // Sidepods
        ctx.fillStyle = carLivery.primary;
        ctx.beginPath();
        ctx.ellipse(-1 * s, 0, 8.5 * s, 4.2 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Livery Accent
        ctx.fillStyle = carLivery.secondary;
        ctx.beginPath();
        ctx.moveTo(-3.5 * s, -3 * s);
        ctx.lineTo(5.5 * s, -0.8 * s);
        ctx.lineTo(5.5 * s, 0.8 * s);
        ctx.lineTo(-3.5 * s, 3 * s);
        ctx.closePath();
        ctx.fill();

        // Nosecone
        ctx.fillStyle = carLivery.primary;
        ctx.beginPath();
        ctx.moveTo(2.5 * s, -1.8 * s);
        ctx.lineTo(12 * s, -0.7 * s);
        ctx.lineTo(14 * s, 0);
        ctx.lineTo(12 * s, 0.7 * s);
        ctx.lineTo(2.5 * s, 1.8 * s);
        ctx.closePath();
        ctx.fill();

        // Front Wing
        ctx.fillStyle = carLivery.wingColor || '#0a0a0a';
        ctx.fillRect(10 * s, -6.5 * s, 3.5 * s, 13 * s);
        ctx.fillStyle = carLivery.accent || carLivery.secondary;
        ctx.fillRect(11 * s, -4.5 * s, 1.8 * s, 9 * s);

        // Cockpit & Helmet
        ctx.fillStyle = '#0a0a0c';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.5 * s, 2.2 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = driverProf.helmet || carLivery.secondary;
        ctx.beginPath();
        ctx.arc(-0.5 * s, 0, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();

        // Halo
        ctx.strokeStyle = carLivery.haloColor || carLivery.secondary;
        ctx.lineWidth = 1.4 * s;
        ctx.beginPath();
        ctx.arc(1.2 * s, 0, 2.2 * s, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        ctx.restore();

        // Driver Tag above Car in Multi-Car Mode
        if (carsToRender.length > 1) {
          ctx.save();
          ctx.fillStyle = 'rgba(8, 10, 18, 0.88)';
          ctx.strokeStyle = carLivery.secondary;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cx - 18 * scale, cy - 24 * scale, 36 * scale, 14 * scale, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fff';
          ctx.font = `bold ${7.5 * scale}px Orbitron, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${driverProf.code}`, cx, cy - 17 * scale);
          ctx.restore();
        }
      });

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
  }, [circuitId, driverId, constructorId, multiCars, isRunning, track, carsToRender]);

  return (
    <div
      className="track-wrap"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 360,
      }}
    >
      <canvas ref={cvs} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Track Overlay Header */}
      <div style={{ position: 'absolute', top: 12, left: 12, pointerEvents: 'none' }}>
        <div className="glass-dark" style={{ padding: '8px 14px', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: activeLivery.primary,
                border: `1px solid ${activeLivery.secondary}`,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {track.name.toUpperCase()}
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.68rem',
              color: 'var(--text-3)',
              marginTop: 2,
            }}
          >
            {track.location} · {track.length_km} km · {track.turns} Turns · {track.drs_zones} DRS
          </div>
        </div>

        {/* Lap Badge */}
        <div
          className="glass-dark"
          style={{
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div className="label">LAP</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {currentLap} / {totalLaps || track.laps}
          </div>
        </div>
      </div>

      {/* Driver Badge Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {carsToRender.length === 1 ? (
          <div
            className="glass-dark"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderLeft: `3px solid ${activeLivery.secondary}`,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: activeDriver.helmet,
                border: '1px solid #fff',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              #{activeDriver.number} {activeDriver.name}
            </span>
          </div>
        ) : (
          <div
            className="glass-dark"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'var(--cyan)' }}>
              MULTI-CAR BATTLE:
            </span>
            {carsToRender.map((c) => {
              const dp = getDriverProfile(c.driverId);
              const lv = getLivery(c.constructorId || dp.constructorId_num);
              return (
                <span
                  key={c.driverId}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    color: lv.secondary,
                    background: `${lv.primary}cc`,
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}
                >
                  #{dp.number} {dp.code}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {lastLapTime && (
        <div style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}>
          <div className="glass-red" style={{ padding: '8px 14px' }}>
            <div className="label" style={{ marginBottom: 2, color: 'var(--red)' }}>
              LEADER LAP
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {lastLapTime}
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Status */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.64rem',
          color: isRunning ? 'var(--green)' : 'var(--text-4)',
        }}
      >
        <span
          className={`status-dot ${isRunning ? 'online' : ''}`}
          style={{ width: 6, height: 6 }}
        />
        {isRunning ? 'LIVE MULTI-CAR TELEMETRY' : 'GRID STANDBY'}
      </div>
    </div>
  );
}
