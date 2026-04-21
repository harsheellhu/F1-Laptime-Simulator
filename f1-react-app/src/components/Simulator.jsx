import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { api, formatTime } from '../api/client';
import TrackView from './TrackView';

const PIT_LOSS_SEC = 22.5;

// Constructor color map (circuitId → hex) — matched to backend IDs
const CONS_COLORS = {
  1:'#00D2BE',2:'#1E41FF',3:'#DC0000',4:'#FF8000',5:'#006F62',
  6:'#0090FF',7:'#005AFF',8:'#2B4562',9:'#900000',10:'#CCCCCC',
};

export default function Simulator({ onBack }) {
  // ── API data (loaded once)
  const [drivers,      setDrivers]      = useState([]);
  const [circuits,     setCircuits]     = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [modelInfo,    setModelInfo]    = useState(null);
  const [apiOnline,    setApiOnline]    = useState(false);
  const [loadErr,      setLoadErr]      = useState('');

  // ── User configuration
  const [cfg, setCfg] = useState({
    driver_id: null, constructor_id: null, circuit_id: null,
    grid: 1, laps: 30, year: 2023,
    pit_lap_1: null, pit_lap_2: null,
  });

  // ── Simulation state
  const [phase, setPhase] = useState('setup'); // setup | live | results
  const [simState, setSim] = useState({
    running:false, lapTimes:[], currentLap:0, totalTime:0,
    fastestLap:null, avgTime:0, currentTime:null, pitStops:[],
  });

  const intervalRef = useRef(null);
  const lapRef      = useRef(0);

  // ── Load reference data from backend
  useEffect(() => {
    (async () => {
      try {
        const [h, dr, ci, co, mi] = await Promise.all([
          api.health(), api.drivers(), api.circuits(), api.constructors(), api.modelInfo(),
        ]);
        setDrivers(dr.drivers || []);
        setCircuits(ci.circuits || []);
        setConstructors(co.constructors || []);
        setModelInfo(mi);
        setApiOnline(true);

        // Auto-select first valid IDs - use the numeric IDs from the dataset
        if (dr.valid_driver_ids?.length) {
          const firstDriver = dr.valid_driver_ids[0];
          const firstConstr = co.constructors?.[0]?.constructorId_num || 1;
          const firstCirc   = ci.valid_circuit_ids?.[0];
          setCfg(p => ({
            ...p,
            driver_id: firstDriver,
            constructor_id: firstConstr,
            circuit_id: firstCirc ?? (ci.circuits?.[0]?.circuitId_num ?? 1),
          }));
        }
      } catch (e) {
        setApiOnline(false);
        setLoadErr('Python backend is offline. Start the FastAPI server first: uvicorn f1_simulator.backend.main:app --reload --port 8000');
      }
    })();
  }, []);

  const upd = (key, val) => setCfg(p => ({ ...p, [key]: val }));

  const selectedDriver  = drivers.find(d => d.driverId_num === cfg.driver_id);
  const selectedCircuit = circuits.find(c => c.circuitId_num === cfg.circuit_id);
  const selectedConstr  = constructors.find(c => c.constructorId_num === cfg.constructor_id);
  const carColor = CONS_COLORS[cfg.constructor_id] || '#e8002d';

  // ── Start simulation
  const startSim = useCallback(async () => {
    if (!apiOnline) return;
    setPhase('live');
    lapRef.current = 0;
    setSim({ running:true, lapTimes:[], currentLap:0, totalTime:0, fastestLap:null, avgTime:0, currentTime:null, pitStops:[] });

    const runLap = async () => {
      lapRef.current += 1;
      const lap = lapRef.current;

      try {
        const res = await api.predict({
          lap,
          grid:               cfg.grid,
          total_laps:         cfg.laps,
          driver_id:          cfg.driver_id,
          constructor_id:     cfg.constructor_id,
          circuit_id:         cfg.circuit_id,
          circuit_length_km:  selectedCircuit?.length_km || 5.0,
          year:               cfg.year,
        });

        const isPit = [cfg.pit_lap_1, cfg.pit_lap_2].includes(lap);
        const lapTime = res.lap_time_sec + (isPit ? PIT_LOSS_SEC : 0);

        setSim(prev => {
          const times = [...prev.lapTimes, { lap, time: lapTime, pure: res.lap_time_sec, isPit }];
          const pureTimes = times.filter(l => !l.isPit).map(l => l.pure);
          return {
            ...prev,
            currentLap: lap,
            lapTimes:   times,
            currentTime: lapTime,
            totalTime:  prev.totalTime + lapTime,
            fastestLap: Math.min(...pureTimes),
            avgTime:    pureTimes.reduce((a,b)=>a+b,0) / pureTimes.length,
            pitStops:   isPit ? [...prev.pitStops, lap] : prev.pitStops,
            running:    lap < cfg.laps,
          };
        });

        if (lap >= cfg.laps) {
          clearInterval(intervalRef.current);
          setSim(p => ({ ...p, running:false }));
          setTimeout(() => setPhase('results'), 600);
        }
      } catch (e) {
        clearInterval(intervalRef.current);
        setSim(p => ({ ...p, running:false }));
      }
    };

    await runLap();
    intervalRef.current = setInterval(runLap, 700);
  }, [cfg, apiOnline, selectedCircuit]);

  const stopSim = () => {
    clearInterval(intervalRef.current);
    setSim(p => ({ ...p, running:false }));
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const chartData = simState.lapTimes.map(l => ({
    lap: l.lap,
    time: parseFloat(l.time.toFixed(3)),
    pure: parseFloat(l.pure.toFixed(3)),
  }));
  const fastestObj = simState.lapTimes.reduce((b,l) => !l.isPit && (!b || l.pure < b.pure) ? l : b, null);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)' }}>
      {/* ── Sticky header ── */}
      <header style={{
        position:'sticky', top:0, zIndex:200,
        background:'rgba(3,3,10,0.92)', backdropFilter:'blur(24px)',
        borderBottom:'1px solid var(--glass-border)', padding:'0 24px',
      }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center', height:60, gap:16 }}>
          <button onClick={onBack} className="btn-ghost" style={{ padding:'7px 16px', fontSize:'0.6rem' }}>← HOME</button>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, background:'var(--red)', borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontWeight:900, fontSize:'0.8rem',
              boxShadow:'0 0 16px var(--red-glow)',
            }}>F1</div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.08em' }}>LAP TIME SIMULATOR</div>
              <div className="label">{selectedCircuit?.name || 'Select circuit'}</div>
            </div>
          </div>

          {/* Tab nav */}
          <nav style={{ flex:1, display:'flex', justifyContent:'center', gap:4 }}>
            {['setup','live','results'].map(tab => (
              <button key={tab} onClick={() => setPhase(tab)} style={{
                fontFamily:'var(--font-display)', fontSize:'0.62rem', fontWeight:600,
                letterSpacing:'0.1em', textTransform:'uppercase',
                padding:'7px 18px', borderRadius:7, border:'none', cursor:'pointer',
                background: phase===tab ? 'var(--red)' : 'transparent',
                color: phase===tab ? '#fff' : 'var(--text-3)',
                transition:'all 0.2s',
                boxShadow: phase===tab ? '0 0 14px var(--red-glow)' : 'none',
              }}>{tab}</button>
            ))}
          </nav>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className={`status-dot ${apiOnline?'online':'offline'}`} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:'0.6rem', letterSpacing:'0.1em',
              color: apiOnline ? 'var(--green)' : 'var(--gold)' }}>
              {apiOnline ? 'API ONLINE' : 'API OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 24px 60px' }}>
        {/* Offline warning */}
        {!apiOnline && loadErr && (
          <div className="offline-banner">
            ⚠️ {loadErr}
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.div key="setup"
              initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
              transition={{duration:0.25}}>
              <SetupPanel
                cfg={cfg} upd={upd}
                drivers={drivers} circuits={circuits} constructors={constructors}
                selectedDriver={selectedDriver} selectedCircuit={selectedCircuit} selectedConstr={selectedConstr}
                apiOnline={apiOnline} onStart={startSim}
              />
            </motion.div>
          )}
          {phase === 'live' && (
            <motion.div key="live"
              initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
              transition={{duration:0.25}}>
              <LivePanel
                simState={simState} cfg={cfg} chartData={chartData}
                fastestObj={fastestObj} selectedCircuit={selectedCircuit}
                carColor={carColor} onStop={stopSim}
              />
            </motion.div>
          )}
          {phase === 'results' && (
            <motion.div key="results"
              initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
              transition={{duration:0.25}}>
              <ResultsPanel
                simState={simState} cfg={cfg} chartData={chartData}
                fastestObj={fastestObj}
                selectedDriver={selectedDriver} selectedCircuit={selectedCircuit}
                selectedConstr={selectedConstr} modelInfo={modelInfo}
                onReset={() => { setPhase('setup'); setSim(s=>({...s,lapTimes:[],completed:false})); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SETUP PANEL
// ═══════════════════════════════════════════════════
function SetupPanel({ cfg, upd, drivers, circuits, constructors, selectedDriver, selectedCircuit, selectedConstr, apiOnline, onStart }) {
  return (
    <div>
      <div style={{ marginBottom:32 }}>
        <div className="divider-red" style={{ marginBottom:14 }} />
        <h2 className="heading-lg" style={{ letterSpacing: '0.05em' }}>RACE CONFIGURATION</h2>
        <p style={{ color:'var(--text-3)', fontFamily:'var(--font-ui)', marginTop:8, fontSize: '0.9rem' }}>
          Select parameters to feed into the XGBoost engine.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 340px', gap:24 }}>
        {/* Left col */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <GlassCard title="DRIVER" sub="Select from real 2024 grid" delay={0.1}>
            <select className="f1-select" value={cfg.driver_id ?? ''} onChange={e=>upd('driver_id',Number(e.target.value))}>
              <option value="">-- Select Driver --</option>
              {drivers.map(d => (
                <option key={d.driverId_num} value={d.driverId_num}>
                  {d.nationality ? `${d.fullName}` : d.fullName || `Driver ${d.driverId_num}`}
                </option>
              ))}
            </select>
            {selectedDriver && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ marginTop:16, padding:'16px', background:'rgba(255,255,255,0.03)',
                border:'1px solid var(--glass-border)', borderRadius:'12px',
                display:'flex', alignItems:'center', gap:16, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                <div style={{
                  width:48, height:48, borderRadius:12, background:'linear-gradient(135deg, var(--red), #800018)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.2rem',
                  boxShadow:'0 4px 12px rgba(232,0,45,0.4)', border: '1px solid #ff4d6d'
                }}>{selectedDriver.race_skill || '?'}</div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:800 }}>{selectedDriver.fullName}</div>
                  <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--text-3)', marginTop:4 }}>
                    {selectedDriver.team} · {selectedDriver.nationality}
                  </div>
                  <div style={{ display:'flex', gap:12, marginTop:8 }}>
                    {[['Race',selectedDriver.race_skill],['Qual',selectedDriver.qualifying_skill],['Wet',selectedDriver.wet_skill]].map(([l,v])=>(
                      <div key={l} style={{ textAlign:'center', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 6 }}>
                        <div style={{ fontFamily:'Orbitron, monospace', fontSize:'0.85rem', fontWeight:700, color:'var(--red)' }}>{v}</div>
                        <div className="label" style={{ fontSize: '0.55rem' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </GlassCard>

          <GlassCard title="CONSTRUCTOR" sub="Select team" delay={0.2}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {constructors.map(c => {
                const isSel = cfg.constructor_id===c.constructorId_num;
                return (
                <button key={c.constructorId_num}
                  onClick={() => upd('constructor_id', c.constructorId_num)}
                  style={{
                    fontFamily:'var(--font-ui)', fontSize:'0.78rem', fontWeight:700,
                    padding:'12px', borderRadius:'8px', cursor:'pointer',
                    border:`1px solid ${isSel ? '#e8002d' : 'rgba(255,255,255,0.05)'}`,
                    background: isSel ? 'rgba(232,0,45,0.15)' : 'rgba(0,0,0,0.3)',
                    color: isSel ? '#fff' : 'var(--text-3)',
                    boxShadow: isSel ? 'inset 0 0 12px rgba(232,0,45,0.3), 0 0 10px rgba(232,0,45,0.2)' : 'none',
                    transition:'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}>
                  {c.name}
                </button>
              )})}
            </div>
          </GlassCard>
        </div>

        {/* Centre col */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <GlassCard title="CIRCUIT" sub="Select from real F1 calendar" delay={0.3}>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:400, overflowY:'auto', paddingRight: 4 }}>
              {circuits.map(c => {
                const isSel = cfg.circuit_id===c.circuitId_num;
                return (
                <button key={c.circuitId_num}
                  onClick={() => upd('circuit_id', c.circuitId_num)}
                  style={{
                    fontFamily:'var(--font-ui)', fontSize:'0.85rem', fontWeight: isSel?700:500,
                    padding:'12px 16px', borderRadius:'8px', textAlign:'left', cursor:'pointer',
                    border:`1px solid ${isSel?'var(--red)':'rgba(255,255,255,0.04)'}`,
                    background: isSel?'linear-gradient(90deg, rgba(232,0,45,0.2), rgba(232,0,45,0.05))':'rgba(0,0,0,0.25)',
                    color: isSel?'#fff':'var(--text-2)',
                    transition:'all 0.2s',
                    display:'flex', justifyContent:'space-between', alignItems: 'center'
                  }}>
                  <span>{c.country} <span style={{ opacity: 0.5, margin: '0 6px' }}>|</span> {c.name}</span>
                  <span style={{ color:isSel?'var(--red)':'var(--text-4)', fontFamily: 'Orbitron, monospace', fontSize:'0.7rem' }}>{c.length_km}km</span>
                </button>
              )})}
            </div>
          </GlassCard>
        </div>

        {/* Right col — params + launch */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <GlassCard title="PARAMETERS" sub="Race settings" delay={0.4}>
            <SliderRow label="Grid Position"  val={cfg.grid}  min={1}  max={20} unit={`P${cfg.grid}`}  onChange={v=>upd('grid',v)} />
            <SliderRow label="Number of Laps" val={cfg.laps}  min={5}  max={70} unit={`${cfg.laps}`} onChange={v=>upd('laps',v)} style={{marginTop:24}} />
            <SliderRow label="Race Year"      val={cfg.year}  min={2010} max={2024} unit={cfg.year} onChange={v=>upd('year',v)} style={{marginTop:24}} />
          </GlassCard>

          <GlassCard title="PIT STRATEGY" sub="Optional — leave blank for no stops" delay={0.5}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['pit_lap_1','Stop 1'],['pit_lap_2','Stop 2']].map(([key,label])=>(
                <div key={key}>
                  <div className="label" style={{ marginBottom:8 }}>{label}</div>
                  <select className="f1-select" style={{ padding: '10px' }} value={cfg[key]??''} onChange={e=>upd(key,e.target.value?Number(e.target.value):null)}>
                    <option value="">No stop</option>
                    {Array.from({length:cfg.laps-4},(_,i)=>i+3).map(l=>(
                      <option key={l} value={l}>Lap {l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Summary + launch */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="glass-red" style={{ padding: 24, boxShadow: '0 10px 40px rgba(232,0,45,0.15)' }}>
            <div className="label" style={{ color:'var(--red)', marginBottom:16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-red 2s infinite' }} />
              LAUNCH SEQUENCE
            </div>
            {[
              ['Driver',     selectedDriver?.fullName || '—'],
              ['Team',       selectedConstr?.name || '—'],
              ['Circuit',    selectedCircuit?.name || '—'],
              ['Laps',       cfg.laps],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--text-3)' }}>{k}</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:'0.8rem', fontWeight:700 }}>{v}</span>
              </div>
            ))}
            
            <motion.button 
              whileHover={apiOnline ? { scale: 1.03, boxShadow: '0 0 30px rgba(232,0,45,0.6)' } : {}}
              whileTap={apiOnline ? { scale: 0.97 } : {}}
              className="btn-primary" 
              onClick={onStart}
              disabled={!apiOnline || !cfg.driver_id || !cfg.circuit_id}
              style={{ width:'100%', marginTop:24, padding:'16px', fontSize: '0.9rem', letterSpacing: '0.05em' }}
            >
              {apiOnline ? '🚀 INITIATE SIMULATION' : '⚠️ BACKEND OFFLINE'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// LIVE PANEL
// ═══════════════════════════════════════════════════
function LivePanel({ simState, cfg, chartData, fastestObj, selectedCircuit, carColor, onStop }) {
  const pct = simState.currentLap / cfg.laps * 100;
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, marginBottom:24 }}>
        <div style={{ height:460, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
          <TrackView
            circuitId={selectedCircuit?.circuitId_num || 1}
            isRunning={simState.running}
            currentLap={simState.currentLap}
            totalLaps={cfg.laps}
            lastLapTime={simState.currentTime ? formatTime(simState.currentTime) : null}
            constructorColor={carColor}
          />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* LIVE Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 4 }}>
            <div className="label" style={{ color:'var(--text-4)' }}>TELEMETRY FEED</div>
            {simState.running ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0033', animation: 'pulse-red 1s infinite' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: '#ff0033', letterSpacing: '0.1em' }}>LIVE</span>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.1em' }}>FINISHED</div>
            )}
          </div>

          {[
            {k:'CURRENT LAP', v:`${simState.currentLap} / ${cfg.laps}`, c:'#fff'},
            {k:'LAST LAP',    v:formatTime(simState.currentTime), c:'#fff'},
            {k:'FASTEST LAP', v:formatTime(simState.fastestLap),  c:'var(--gold)', sub:`Lap ${fastestObj?.lap||'—'}`},
            {k:'AVG LAP',     v:formatTime(simState.avgTime),     c:'var(--text-2)'},
            {k:'TOTAL TIME',  v:formatTime(simState.totalTime),   c:'var(--text-2)'},
          ].map((s, i)=>(
            <motion.div key={s.k} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} 
              className="glass" style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft: `3px solid ${s.c === '#fff' ? 'rgba(255,255,255,0.2)' : s.c}` }}>
              <div className="label" style={{ color: 'var(--text-3)' }}>{s.k}</div>
              <div>
                <div style={{ fontFamily:'Orbitron, monospace', fontSize:'1.15rem', fontWeight:700, color:s.c, textAlign:'right', textShadow: s.c !== '#fff' ? `0 0 12px ${s.c}66` : 'none' }}>{s.v}</div>
                {s.sub && <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: 'var(--text-4)', textAlign:'right', marginTop: 4 }}>{s.sub}</div>}
              </div>
            </motion.div>
          ))}

          {/* Pit stops */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass" style={{ padding:'14px 18px' }}>
            <div className="label" style={{ marginBottom:10 }}>PIT STOPS</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {simState.pitStops.length===0 ? (
                <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.8rem', color:'var(--text-4)' }}>None executed</span>
              ) : simState.pitStops.map(l=>(
                <span key={l} style={{
                  fontFamily:'Orbitron, monospace', fontSize:'0.75rem', fontWeight: 600,
                  background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.3)',
                  color:'var(--gold)', borderRadius:4, padding:'4px 12px',
                }}>L{l}</span>
              ))}
            </div>
          </motion.div>

          {/* Progress */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass" style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <div className="label">RACE PROGRESS</div>
              <div style={{ fontFamily:'Orbitron, monospace', fontSize:'0.7rem', color:'var(--red)' }}>{Math.round(pct)}%</div>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
              <motion.div animate={{width:`${pct}%`}} transition={{duration:0.4}}
                style={{ height:'100%', background:'linear-gradient(90deg, #ff0033, #ff4060)', borderRadius:3, boxShadow: '0 0 10px rgba(255,0,51,0.5)' }} />
            </div>
          </motion.div>

          {simState.running && (
            <button onClick={onStop} style={{
              fontFamily:'var(--font-display)', fontSize:'0.75rem', fontWeight:700,
              letterSpacing:'0.1em', padding:'12px', borderRadius:'8px', cursor:'pointer',
              background:'rgba(255,50,50,0.1)', border:'1px solid rgba(255,50,50,0.3)', color:'#ff4444',
              transition: 'all 0.2s'
            }}>⏹ ABORT SIMULATION</button>
          )}
        </div>
      </div>

      {/* Live chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass" style={{ padding:'20px 24px 10px' }}>
        <div className="label" style={{ marginBottom:18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--red)'}}>■</span> LIVE LAP TIME TRACE
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="lapG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e8002d" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#e8002d" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="lap" stroke="rgba(255,255,255,0.2)" tick={{fontSize:10,fontFamily:'Orbitron,monospace',fill:'var(--text-4)'}} tickMargin={8} />
            <YAxis stroke="rgba(255,255,255,0.0)" domain={['auto','auto']} tick={{fontSize:10,fontFamily:'Orbitron,monospace',fill:'var(--text-4)'}} tickFormatter={v=>v.toFixed(1)} width={40} />
            <Tooltip
              contentStyle={{background:'rgba(10,10,18,0.95)',border:'1px solid rgba(232,0,45,0.5)',borderRadius:8,fontFamily:'Orbitron,monospace',fontSize:'0.75rem', boxShadow: '0 10px 30px rgba(0,0,0,0.8)'}}
              labelStyle={{color:'var(--text-4)'}} itemStyle={{color:'var(--red)'}}
              formatter={v=>[formatTime(v),'Lap Time']} labelFormatter={l=>`Lap ${l}`} cursor={{ stroke: 'rgba(232,0,45,0.4)', strokeWidth: 2, strokeDasharray: '4 4' }}
            />
            <Area type="monotone" dataKey="time" stroke="#e8002d" strokeWidth={3} fill="url(#lapG)" dot={false} activeDot={{ r: 6, fill: '#fff', stroke: '#e8002d', strokeWidth: 2 }} />
            {fastestObj && <ReferenceLine y={fastestObj.pure} stroke="rgba(255,215,0,0.6)" strokeDasharray="4 4" strokeWidth={2} />}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// RESULTS PANEL
// ═══════════════════════════════════════════════════
function ResultsPanel({ simState, cfg, chartData, fastestObj, selectedDriver, selectedCircuit, selectedConstr, modelInfo, onReset }) {
  return (
    <div>
      {/* Winner banner */}
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{ duration: 0.6, type: "spring" }}
        style={{ padding:'36px 40px', marginBottom:32, background: 'linear-gradient(135deg, rgba(232,0,45,0.15) 0%, rgba(0,0,0,0.5) 100%)',
          border: '1px solid rgba(232,0,45,0.3)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(232,0,45,0.1)',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ fontSize:'3.5rem', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.4))' }}>🏆</div>
          <div>
            <div className="label" style={{ marginBottom:6, color: 'var(--red)', letterSpacing: '0.15em' }}>SIMULATION ARCHIVE</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'2.4rem', fontWeight:900, color:'#fff', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
              {selectedDriver?.fullName || 'Driver'}
            </div>
            <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.9rem', color:'var(--text-3)', marginTop:6 }}>
              {selectedCircuit?.name} <span style={{ opacity:0.5, margin:'0 8px' }}>|</span> {cfg.laps} Laps <span style={{ opacity:0.5, margin:'0 8px' }}>|</span> {selectedConstr?.name}
            </div>
          </div>
        </div>
        <div style={{ textAlign:'right', background: 'rgba(0,0,0,0.4)', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="label" style={{ marginBottom:8 }}>TOTAL RACE TIME</div>
          <div style={{ fontFamily:'Orbitron, monospace', fontSize:'2.2rem', fontWeight:800, color: 'var(--gold)' }}>{formatTime(simState.totalTime)}</div>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:32 }}>
        {[
          {icon:'⚡',k:'FASTEST LAP', v:formatTime(simState.fastestLap), sub:`Lap ${fastestObj?.lap||'—'}`, c:'var(--gold)'},
          {icon:'📊',k:'AVG LAP',     v:formatTime(simState.avgTime), sub:'All laps', c:'#fff'},
          {icon:'🔧',k:'PIT STOPS',   v:simState.pitStops.length, sub:simState.pitStops.map(l=>`L${l}`).join(', ')||'None', c:'var(--green)'},
          {icon:'🏁',k:'GRID START',  v:`P${cfg.grid}`, sub:`${cfg.year} chassis`, c:'var(--red)'},
        ].map((s,i)=>(
          <motion.div key={s.k} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{ delay: i * 0.1 }}
            className="glass" style={{ padding:'24px 20px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '4rem', opacity: 0.05 }}>{s.icon}</div>
            <div className="label" style={{ marginBottom:12 }}>{s.k}</div>
            <div style={{ fontFamily:'Orbitron, monospace', fontSize:'1.6rem', fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--text-4)', marginTop:6 }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart + table */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, marginBottom:32 }}>
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{ delay: 0.4 }} className="glass" style={{ padding:'24px 24px 16px' }}>
          <div className="label" style={{ marginBottom:20 }}>LAP TIME DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="lap" stroke="rgba(255,255,255,0.15)" tick={{fontSize:10,fontFamily:'Orbitron,monospace',fill:'var(--text-4)'}} tickMargin={10} />
              <YAxis stroke="rgba(255,255,255,0.0)" domain={['auto','auto']} tick={{fontSize:10,fontFamily:'Orbitron,monospace',fill:'var(--text-4)'}} tickFormatter={v=>v.toFixed(1)} width={40} />
              <Tooltip
                contentStyle={{background:'rgba(10,10,18,0.95)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,fontFamily:'Orbitron,monospace',fontSize:'0.75rem', boxShadow: '0 10px 40px rgba(0,0,0,0.8)'}}
                formatter={v=>[formatTime(v),'Lap Time']} labelFormatter={l=>`Lap ${l}`} cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <Line type="monotone" dataKey="time" stroke="#e8002d" strokeWidth={3} dot={{r:3,fill:'#e8002d', strokeWidth:0}} activeDot={{r:6, fill:'#fff'}} />
              <Line type="monotone" dataKey="pure" stroke="rgba(255,255,255,0.3)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              {fastestObj && <ReferenceLine y={fastestObj.pure} stroke="rgba(255,215,0,0.6)" strokeDasharray="4 4" strokeWidth={2} />}
              {simState.pitStops.map(l=>(<ReferenceLine key={l} x={l} stroke="rgba(0,230,118,0.6)" strokeDasharray="4 4" strokeWidth={2} />))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:20, marginTop:16, paddingLeft:10 }}>
            {[['—— Total time','#e8002d'],['- - Pure lap','rgba(255,255,255,0.4)'],['— — Fastest','rgba(255,215,0,0.6)'],['| Pit stop','rgba(0,230,118,0.6)']].map(([l,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:16, height:2, background:c }} />
                <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.7rem', color:'var(--text-3)' }}>{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Lap table */}
        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{ delay: 0.5 }} className="glass" style={{ padding: '24px 0 0 0', display: 'flex', flexDirection: 'column', height: 350 }}>
          <div className="label" style={{ marginBottom:16, paddingLeft: 24 }}>LAP BREAKDOWN</div>
          <div style={{ overflowY:'auto', flex: 1, padding: '0 24px 24px 24px' }}>
            {simState.lapTimes.map((l, i)=>(
              <motion.div key={l.lap} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.02 }}
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:'0.7rem', color:'var(--text-4)', width:28 }}>L{l.lap}</span>
                <span style={{ fontFamily:'Orbitron, monospace', fontSize:'0.85rem', fontWeight:700,
                  color: l.lap===fastestObj?.lap?'var(--gold)': l.isPit?'var(--green)':'#fff' }}>
                  {formatTime(l.time)}
                </span>
                <span style={{ fontFamily:'Orbitron, monospace', fontSize:'0.65rem', color:'var(--text-4)' }}>
                  {formatTime(l.pure)}
                </span>
                <div style={{ width: 45, textAlign: 'right' }}>
                  {l.isPit && <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.6rem', color:'var(--green)', background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:4, padding:'2px 6px' }}>PIT</span>}
                  {l.lap===fastestObj?.lap && <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.6rem', color:'var(--gold)', background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:4, padding:'2px 6px' }}>FL</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <button className="btn-secondary" style={{ padding: '14px 40px', fontSize: '0.8rem' }} onClick={onReset}>
          ⟲ CONFIGURE NEW RACE
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════
function GlassCard({ title, sub, children, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="glass" 
      style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', color:'var(--red)', marginBottom:6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 4, height: 14, background: 'var(--red)', borderRadius: 2 }} />
          {title}
        </div>
        <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--text-4)' }}>{sub}</div>
      </div>
      {children}
    </motion.div>
  );
}

function SliderRow({ label, val, min, max, unit, onChange, style }) {
  const pct = ((val - min) / (max - min)) * 100;
  return (
    <div style={style}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.85rem', color:'var(--text-2)' }}>{label}</span>
        <span style={{ fontFamily:'Orbitron, monospace', fontSize:'0.9rem', fontWeight:700, color:'var(--red)' }}>{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={val}
        onChange={e=>onChange(Number(e.target.value))}
        style={{ 
          background:`linear-gradient(to right, var(--red) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
          boxShadow: `0 0 10px rgba(232,0,45,${pct > 0 ? 0.3 : 0})`
        }}
      />
    </div>
  );
}
