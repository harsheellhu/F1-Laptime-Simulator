import { useEffect, useRef } from 'react';

/** Top-down circuit canvas view with animated car */
export default function TrackView({ circuitId = 1, isRunning, currentLap, totalLaps, lastLapTime, constructorColor = '#e8002d' }) {
  const cvs = useRef(null);
  const raf = useRef(null);
  const progress = useRef(0);
  const trail = useRef([]);
  const t = useRef(0);

  // Circuit path configs — hand-tuned SVG-like coordinates
  const TRACKS = {
    8:  { // Monaco
      pts: [[280,60],[400,50],[520,80],[600,160],[620,260],[580,360],[500,420],[380,440],[260,430],[160,380],[120,280],[140,180],[200,120],[280,60]],
      name:'Monaco', laps:78
    },
    12: { // Silverstone
      pts: [[150,160],[300,100],[480,110],[620,170],[680,260],[650,360],[560,420],[400,440],[240,420],[140,350],[100,250],[120,180],[150,160]],
      name:'Silverstone', laps:52
    },
    16: { // Monza
      pts: [[200,130],[550,130],[640,180],[650,280],[630,350],[580,380],[500,380],[420,350],[380,280],[380,200],[200,200],[130,260],[140,340],[200,380],[200,130]],
      name:'Monza', laps:53
    },
    14: { // Spa
      pts: [[130,280],[160,160],[260,100],[400,100],[520,150],[620,230],[660,330],[620,410],[520,430],[380,440],[250,420],[160,360],[130,280]],
      name:'Spa', laps:44
    },
    default: {
      pts: [[200,160],[350,100],[500,120],[620,200],[640,310],[580,400],[440,440],[280,430],[160,370],[130,270],[170,180],[200,160]],
      name:'Circuit', laps:60
    }
  };

  const track = TRACKS[circuitId] || TRACKS.default;

  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const pts = track.pts;

    // Parametric interpolation along poly-line
    const cumDist = [0];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i-1][0];
      const dy = pts[i][1] - pts[i-1][1];
      cumDist.push(cumDist[cumDist.length-1] + Math.hypot(dx, dy));
    }
    const totalDist = cumDist[cumDist.length-1];

    const pointAt = (frac) => {
      const target = frac * totalDist;
      for (let i = 1; i < pts.length; i++) {
        if (cumDist[i] >= target) {
          const seg = cumDist[i] - cumDist[i-1];
          const t = (target - cumDist[i-1]) / seg;
          return {
            x: pts[i-1][0] + t*(pts[i][0]-pts[i-1][0]),
            y: pts[i-1][1] + t*(pts[i][1]-pts[i-1][1]),
            angle: Math.atan2(pts[i][1]-pts[i-1][1], pts[i][0]-pts[i-1][0])
          };
        }
      }
      return { x: pts[0][0], y: pts[0][1], angle: 0 };
    };

    const W = () => canvas.width, H = () => canvas.height;
    const sx = () => W() / 800, sy = () => H() / 600;

    const spt = (p) => [p[0] * sx(), p[1] * sy()];

    const draw = () => {
      t.current += 0.016;
      const ctx = canvas.getContext('2d');
      const w = W(), h = H();

      // Background
      const bg = ctx.createRadialGradient(w/2,h/2,0, w/2,h/2,Math.max(w,h)*0.7);
      bg.addColorStop(0,'#121830'); bg.addColorStop(0.6,'#0a1020'); bg.addColorStop(1,'#060810');
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

      // Grid lines (tarmac texture)
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 0.5;
      for (let x=0;x<w;x+=36) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke(); }
      for (let y=0;y<h;y+=36) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke(); }

      const scaled = pts.map(p => spt(p));

      // Outer shadow
      ctx.beginPath();
      scaled.forEach((p,i) => i===0 ? ctx.moveTo(p[0],p[1]) : ctx.lineTo(p[0],p[1]));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 28*sx() + 8; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.stroke();

      // Grass
      ctx.strokeStyle = '#172510'; ctx.lineWidth = 28*sx() + 18; ctx.stroke();

      // Asphalt
      ctx.beginPath();
      scaled.forEach((p,i) => i===0 ? ctx.moveTo(p[0],p[1]) : ctx.lineTo(p[0],p[1]));
      ctx.closePath();
      ctx.strokeStyle = '#252535'; ctx.lineWidth = 28*sx(); ctx.stroke();

      // Kerbs (alternating dots)
      for (let i=0;i<scaled.length;i+=6) {
        const p = scaled[i];
        ctx.beginPath(); ctx.arc(p[0],p[1],2.5*sx(),0,Math.PI*2);
        ctx.fillStyle = Math.floor(i/3)%2===0 ? '#cc0020' : '#fff'; ctx.fill();
      }

      // White centre line
      ctx.setLineDash([8*sx(), 12*sx()]);
      ctx.beginPath();
      scaled.forEach((p,i) => i===0 ? ctx.moveTo(p[0],p[1]) : ctx.lineTo(p[0],p[1]));
      ctx.closePath();
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.stroke();
      ctx.setLineDash([]);

      // S/F line
      const sp = spt([pts[0][0], pts[0][1]]);
      for (let i=0;i<6;i++) {
        ctx.fillStyle = i%2===0 ? '#fff' : '#000';
        ctx.fillRect(sp[0]-2+i*3, sp[1]-14*sy(), 3, 28*sy());
      }

      // Sector markers
      [[0.33,'S1'],[0.67,'S2']].forEach(([frac,label]) => {
        const pt = pointAt(frac);
        const px = pt.x * sx(), py = pt.y * sy();
        ctx.fillStyle='rgba(14,14,28,0.82)';
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.roundRect(px-16,py-20,32,16,4); ctx.fill(); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font=`bold ${9*sx()}px Orbitron,monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,px,py-12);
      });

      // Car movement
      if (isRunning) progress.current = (progress.current + 0.0022) % 1;
      const car = pointAt(progress.current);
      const cx = car.x * sx(), cy = car.y * sy();

      // Trail
      trail.current.push({x:cx, y:cy, age:0});
      if (trail.current.length > 55) trail.current.shift();
      trail.current.forEach(pt => pt.age++);
      trail.current.forEach(pt => {
        const a = (1 - pt.age/55) * 0.45;
        const hex = constructorColor;
        ctx.beginPath(); ctx.arc(pt.x,pt.y,2*sx(),0,Math.PI*2);
        ctx.fillStyle = hex + Math.round(a*255).toString(16).padStart(2,'0');
        ctx.fill();
      });

      // Car glow
      const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,22*sx());
      glow.addColorStop(0, constructorColor+'55'); glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(cx-22*sx(),cy-22*sy(),44*sx(),44*sy());

      // Car body (top-down)
      ctx.save();
      ctx.translate(cx,cy); ctx.rotate(car.angle);
      const s = sx();

      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(-15*s,-4*s,30*s,8*s); // shadow

      ctx.fillStyle = constructorColor;
      ctx.beginPath(); ctx.ellipse(0,0,12*s,4*s,0,0,Math.PI*2); ctx.fill();

      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(2*s,0,4*s,2.5*s,0,0,Math.PI*2); ctx.fill();

      ctx.fillStyle = constructorColor;
      ctx.fillRect(9*s,-5*s,5*s,10*s); // front wing
      ctx.fillRect(-16*s,-5*s,3*s,10*s); // rear wing

      ctx.fillStyle='#111';
      [[-8,-5.5],[-8,5.5],[8,-5.5],[8,5.5]].forEach(([dx,dy]) => {
        ctx.beginPath(); ctx.ellipse(dx*s,dy*s,3*s,2*s,0,0,Math.PI*2); ctx.fill();
      });

      ctx.restore();

      // Circuit label
      ctx.fillStyle='rgba(255,255,255,0.12)';
      ctx.font=`bold ${10*sx()}px Orbitron,monospace`;
      ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText(track.name.toUpperCase(), 12, 12);

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); };
  }, [circuitId, isRunning, constructorColor]);

  return (
    <div className="track-wrap" style={{ position:'relative', width:'100%', height:'100%', minHeight:360 }}>
      <canvas ref={cvs} style={{ width:'100%', height:'100%', display:'block' }} />

      {/* HUD overlays */}
      <div style={{ position:'absolute', top:12, left:12, pointerEvents:'none' }}>
        <div className="glass-dark" style={{ padding:'8px 14px', marginBottom:8 }}>
          <div className="label" style={{ marginBottom:2 }}>LAP</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700 }}>{currentLap} / {totalLaps}</div>
        </div>
      </div>

      {lastLapTime && (
        <div style={{ position:'absolute', top:12, right:12, pointerEvents:'none' }}>
          <div className="glass-red" style={{ padding:'8px 14px' }}>
            <div className="label" style={{ marginBottom:2, color:'rgba(232,0,45,0.7)' }}>LAST LAP</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700, color:'var(--red)' }}>{lastLapTime}</div>
          </div>
        </div>
      )}

      <div style={{
        position:'absolute', bottom:12, right:12, pointerEvents:'none',
        display:'flex', alignItems:'center', gap:6,
        fontFamily:'var(--font-display)', fontSize:'0.6rem', letterSpacing:'0.1em',
        color: isRunning ? 'var(--green)' : 'var(--text-3)',
      }}>
        <span className={`status-dot ${isRunning ? 'online' : ''}`} style={{ width:5, height:5 }} />
        {isRunning ? 'LIVE' : 'STANDBY'}
      </div>
    </div>
  );
}
