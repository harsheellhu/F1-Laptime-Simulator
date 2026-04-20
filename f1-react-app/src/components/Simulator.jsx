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
  const pitOpts = [null, ...Array.from({length:Math.floor(cfg.laps*0.8)},(_,i)=>i+3)];

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div className="divider-red" style={{ marginBottom:10 }} />
        <h2 className="heading-lg">RACE CONFIGURATION</h2>
        <p style={{ color:'var(--text-3)', fontFamily:'var(--font-ui)', marginTop:6 }}>
          All parameters feed directly into the real ML model.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 340px', gap:20 }}>
        {/* Left col */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <GlassCard title="🏎 DRIVER" sub="Select from real 2024 grid">
            <select className="f1-select" value={cfg.driver_id ?? ''} onChange={e=>upd('driver_id',Number(e.target.value))}>
              <option value="">-- Select Driver --</option>
              {drivers.map(d => (
                <option key={d.driverId_num} value={d.driverId_num}>
                  {d.nationality ? `${d.fullName}` : d.fullName || `Driver ${d.driverId_num}`}
                </option>
              ))}
            </select>
            {selectedDriver && (
              <div style={{ marginTop:14, padding:'14px 16px', background:'rgba(255,255,255,0.04)',
                border:'1px solid var(--glass-border)', borderRadius:'var(--radius-sm)',
                display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  width:44, height:44, borderRadius:10, background:'var(--red)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem',
                }}>{selectedDriver.race_skill || '?'}</div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:700 }}>{selectedDriver.fullName}</div>
                  <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.72rem', color:'var(--text-3)', marginTop:3 }}>
                    {selectedDriver.team} · {selectedDriver.nationality}
                    {selectedDriver.championships > 0 && ` · ${selectedDriver.championships}× WDC 🏆`}
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    {[['Race',selectedDriver.race_skill],['Qual',selectedDriver.qualifying_skill],['Wet',selectedDriver.wet_skill]].map(([l,v])=>(
                      <div key={l} style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:'0.85rem', fontWeight:700, color:'var(--red)' }}>{v}</div>
                        <div className="label">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard title="🔧 CONSTRUCTOR" sub="Select team">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              {constructors.map(c => (
                <button key={c.constructorId_num}
                  onClick={() => upd('constructor_id', c.constructorId_num)}
                  style={{
                    fontFamily:'var(--font-ui)', fontSize:'0.78rem', fontWeight:600,
                    padding:'10px', borderRadius:'var(--radius-sm)', cursor:'pointer',
                    border:`1px solid ${cfg.constructor_id===c.constructorId_num ? '#e8002d' : 'var(--glass-border)'}`,
                    background: cfg.constructor_id===c.constructorId_num ? 'var(--red-glass)' : 'var(--glass-3)',
                    color: cfg.constructor_id===c.constructorId_num ? 'var(--red)' : 'var(--text-2)',
                    transition:'all 0.18s',
                  }}>
                  {c.name}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Centre col */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <GlassCard title="📍 CIRCUIT" sub="Select from real F1 calendar">
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflowY:'auto' }}>
              {circuits.map(c => (
                <button key={c.circuitId_num}
                  onClick={() => upd('circuit_id', c.circuitId_num)}
                  style={{
                    fontFamily:'var(--font-ui)', fontSize:'0.8rem', fontWeight: cfg.circuit_id===c.circuitId_num?600:400,
                    padding:'10px 14px', borderRadius:'var(--radius-sm)', textAlign:'left', cursor:'pointer',
                    border:`1px solid ${cfg.circuit_id===c.circuitId_num?'var(--red)':'rgba(255,255,255,0.05)'}`,
                    background: cfg.circuit_id===c.circuitId_num?'var(--red-glass)':'var(--glass-3)',
                    color: cfg.circuit_id===c.circuitId_num?'var(--red)':'var(--text-2)',
                    transition:'all 0.18s',
                    display:'flex', justifyContent:'space-between',
                  }}>
                  <span>{c.country} · {c.name}</span>
                  <span style={{ color:'var(--text-3)', fontSize:'0.68rem' }}>{c.length_km}km</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right col — params + launch */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <GlassCard title="⚙️ PARAMETERS" sub="Race settings">
            <SliderRow label="Grid Position"  val={cfg.grid}  min={1}  max={20} unit={`P${cfg.grid}`}  onChange={v=>upd('grid',v)} />
            <SliderRow label="Number of Laps" val={cfg.laps}  min={5}  max={70} unit={`${cfg.laps} laps`} onChange={v=>upd('laps',v)} style={{marginTop:18}} />
            <SliderRow label="Race Year"      val={cfg.year}  min={2010} max={2023} unit={cfg.year} onChange={v=>upd('year',v)} style={{marginTop:18}} />
          </GlassCard>

          <GlassCard title="🔧 PIT STOP STRATEGY" sub="Optional — leave blank for no stops">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['pit_lap_1','Stop 1'],['pit_lap_2','Stop 2']].map(([key,label])=>(
                <div key={key}>
                  <div className="label" style={{ marginBottom:6 }}>{label}</div>
                  <select className="f1-select" value={cfg[key]??''} onChange={e=>upd(key,e.target.value?Number(e.target.value):null)}>
                    <option value="">No stop</option>
                    {Array.from({length:cfg.laps-4},(_,i)=>i+3).map(l=>(
                      <option key={l} value={l}>Lap {l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, fontFamily:'var(--font-ui)', fontSize:'0.72rem', color:'var(--text-3)' }}>
              Pit stop adds {PIT_LOSS_SEC}s time loss per stop
            </div>
          </GlassCard>

          {/* Summary + launch */}
          <div className="glass-red" style={{ padding:20 }}>
            <div className="label" style={{ color:'var(--red)', marginBottom:14 }}>LAUNCH SUMMARY</div>
            {[
              ['Driver',     selectedDriver?.fullName || '—'],
              ['Team',       selectedConstr?.name || '—'],
              ['Circuit',    selectedCircuit?.name || '—'],
              ['Laps',       cfg.laps],
              ['Grid',       `P${cfg.grid}`],
              ['Year',       cfg.year],
              ['Pit Stops',  [cfg.pit_lap_1,cfg.pit_lap_2].filter(Boolean).map(l=>`L${l}`).join(', ')||'None'],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--text-3)' }}>{k}</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', fontWeight:600 }}>{v}</span>
              </div>
            ))}
            <button className="btn-primary" onClick={onStart}
              disabled={!apiOnline || !cfg.driver_id || !cfg.circuit_id}
              style={{ width:'100%', marginTop:18, padding:14 }}>
              {apiOnline ? '🏁 Start Simulation' : '⚠️ Backend Offline'}
            </button>
          </div>
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
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:18, marginBottom:18 }}>
        <div style={{ height:420 }}>
          <TrackView
            circuitId={selectedCircuit?.circuitId_num || 1}
            isRunning={simState.running}
            currentLap={simState.currentLap}
            totalLaps={cfg.laps}
            lastLapTime={simState.currentTime ? formatTime(simState.currentTime) : null}
            constructorColor={carColor}
          />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            {k:'CURRENT LAP', v:`${simState.currentLap} / ${cfg.laps}`, c:'#fff'},
            {k:'LAST LAP',    v:formatTime(simState.currentTime), c:'#fff'},
            {k:'FASTEST LAP', v:formatTime(simState.fastestLap),  c:'var(--gold)', sub:`Lap ${fastestObj?.lap||'—'}`},
            {k:'AVG LAP',     v:formatTime(simState.avgTime),     c:'var(--text-2)'},
            {k:'TOTAL TIME',  v:formatTime(simState.totalTime),   c:'var(--text-2)'},
          ].map(s=>(
            <div key={s.k} className="glass" style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div className="label">{s.k}</div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', fontWeight:700, color:s.c, textAlign:'right' }}>{s.v}</div>
                {s.sub && <div className="label" style={{ textAlign:'right' }}>{s.sub}</div>}
              </div>
            </div>
          ))}

          {/* Pit stops */}
          <div className="glass" style={{ padding:'12px 16px' }}>
            <div className="label" style={{ marginBottom:8 }}>PIT STOPS</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {simState.pitStops.length===0 ? (
                <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--text-3)' }}>None yet</span>
              ) : simState.pitStops.map(l=>(
                <span key={l} style={{
                  fontFamily:'var(--font-display)', fontSize:'0.68rem',
                  background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.25)',
                  color:'var(--gold)', borderRadius:6, padding:'2px 10px',
                }}>Lap {l}</span>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="glass" style={{ padding:'12px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div className="label">RACE PROGRESS</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'0.6rem', color:'var(--red)' }}>{Math.round(pct)}%</div>
            </div>
            <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
              <motion.div animate={{width:`${pct}%`}} transition={{duration:0.4}}
                style={{ height:'100%', background:'linear-gradient(90deg,var(--red),#ff6080)', borderRadius:3 }} />
            </div>
          </div>

          {simState.running && (
            <button onClick={onStop} style={{
              fontFamily:'var(--font-display)', fontSize:'0.68rem', fontWeight:600,
              letterSpacing:'0.1em', padding:'10px', borderRadius:'var(--radius-sm)', cursor:'pointer',
              background:'rgba(255,60,60,0.1)', border:'1px solid rgba(255,60,60,0.25)', color:'#ff5050',
            }}>⏹ Stop</button>
          )}
        </div>
      </div>

      {/* Live chart */}
      <div className="glass" style={{ padding:'18px 18px 8px' }}>
        <div className="label" style={{ marginBottom:14 }}>LIVE LAP TIME TRACE</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="lapG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e8002d" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#e8002d" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="lap" stroke="rgba(255,255,255,0.15)" tick={{fontSize:9,fontFamily:'Orbitron,monospace',fill:'var(--text-3)'}} />
            <YAxis stroke="rgba(255,255,255,0.15)" domain={['auto','auto']} tick={{fontSize:9,fontFamily:'Orbitron,monospace',fill:'var(--text-3)'}} tickFormatter={v=>v.toFixed(1)} />
            <Tooltip
              contentStyle={{background:'#0c0c1a',border:'1px solid rgba(232,0,45,0.3)',borderRadius:8,fontFamily:'Orbitron,monospace',fontSize:'0.65rem'}}
              labelStyle={{color:'var(--text-3)'}} itemStyle={{color:'var(--red)'}}
              formatter={v=>[formatTime(v),'Lap Time']} labelFormatter={l=>`Lap ${l}`}
            />
            <Area type="monotone" dataKey="time" stroke="#e8002d" strokeWidth={2} fill="url(#lapG)" dot={false} />
            {fastestObj && <ReferenceLine y={fastestObj.pure} stroke="rgba(255,215,0,0.5)" strokeDasharray="4 4" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
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
      <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}}
        className="glass-red" style={{ padding:'28px 32px', marginBottom:24,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ fontSize:'3rem' }}>🏆</div>
          <div>
            <div className="label" style={{ marginBottom:4 }}>RACE COMPLETE · REAL ML PREDICTIONS</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, color:'var(--gold)' }}>
              {selectedDriver?.fullName || 'Driver'}
            </div>
            <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.82rem', color:'var(--text-2)', marginTop:4 }}>
              {selectedCircuit?.name} · {cfg.laps} Laps · {selectedConstr?.name}
              {modelInfo && <span style={{color:'var(--text-3)'}}> · {modelInfo.model_type?.toUpperCase()} model</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="label" style={{ marginBottom:6 }}>TOTAL TIME</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800 }}>{formatTime(simState.totalTime)}</div>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {icon:'⚡',k:'FASTEST LAP', v:formatTime(simState.fastestLap), sub:`Lap ${fastestObj?.lap||'—'}`, c:'var(--gold)'},
          {icon:'📊',k:'AVG LAP',     v:formatTime(simState.avgTime), sub:'All laps', c:'#fff'},
          {icon:'🔧',k:'PIT STOPS',   v:simState.pitStops.length, sub:simState.pitStops.map(l=>`L${l}`).join(', ')||'None', c:'var(--green)'},
          {icon:'🏁',k:'STARTED',     v:`P${cfg.grid}`, sub:`${cfg.year} season`, c:'var(--red)'},
        ].map(s=>(
          <motion.div key={s.k} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="glass" style={{ padding:'20px 18px' }}>
            <div style={{ fontSize:'1.5rem', marginBottom:8 }}>{s.icon}</div>
            <div className="label" style={{ marginBottom:6 }}>{s.k}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.68rem', color:'var(--text-3)', marginTop:4 }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart + table */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:18, marginBottom:24 }}>
        <div className="glass" style={{ padding:'18px 18px 8px' }}>
          <div className="label" style={{ marginBottom:14 }}>FULL RACE LAP TIMES</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="lap" stroke="rgba(255,255,255,0.15)" tick={{fontSize:9,fontFamily:'Orbitron,monospace',fill:'var(--text-3)'}} />
              <YAxis stroke="rgba(255,255,255,0.15)" domain={['auto','auto']} tick={{fontSize:9,fontFamily:'Orbitron,monospace',fill:'var(--text-3)'}} tickFormatter={v=>v.toFixed(1)} />
              <Tooltip
                contentStyle={{background:'#0c0c1a',border:'1px solid rgba(232,0,45,0.3)',borderRadius:8,fontFamily:'Orbitron,monospace',fontSize:'0.65rem'}}
                formatter={v=>[formatTime(v),'Lap Time']} labelFormatter={l=>`Lap ${l}`}
              />
              <Line type="monotone" dataKey="time" stroke="#e8002d" strokeWidth={2} dot={{r:2,fill:'#e8002d'}} />
              <Line type="monotone" dataKey="pure" stroke="rgba(232,0,45,0.35)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              {fastestObj && <ReferenceLine y={fastestObj.pure} stroke="rgba(255,215,0,0.5)" strokeDasharray="5 5" />}
              {simState.pitStops.map(l=>(<ReferenceLine key={l} x={l} stroke="rgba(0,230,118,0.4)" strokeDasharray="3 3" />))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:16, marginTop:10, paddingLeft:8 }}>
            {[['—— Total time','#e8002d'],['- - Pure lap','rgba(232,0,45,0.5)'],['— — Fastest','rgba(255,215,0,0.6)'],['| Pit stop','rgba(0,230,118,0.5)']].map(([l,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:16, height:2, background:c }} />
                <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.62rem', color:'var(--text-3)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lap table */}
        <div className="glass" style={{ padding:16, overflowY:'auto', maxHeight:300 }}>
          <div className="label" style={{ marginBottom:12 }}>LAP BREAKDOWN</div>
          {simState.lapTimes.map(l=>(
            <div key={l.lap} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'0.62rem', color:'var(--text-3)', width:24 }}>L{l.lap}</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'0.72rem', fontWeight:600,
                color: l.lap===fastestObj?.lap?'var(--gold)': l.isPit?'var(--green)':'#fff' }}>
                {formatTime(l.time)}
              </span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'0.6rem', color:'var(--text-3)' }}>
                {formatTime(l.pure)}
              </span>
              {l.isPit && <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.58rem', color:'var(--green)', background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:4, padding:'1px 5px' }}>PIT</span>}
              {l.lap===fastestObj?.lap && <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.58rem', color:'var(--gold)', background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:4, padding:'1px 5px' }}>⚡FL</span>}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-ghost" onClick={onReset}>← New Simulation</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════
function GlassCard({ title, sub, children }) {
  return (
    <div className="glass" style={{ padding:20 }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.16em', color:'var(--red)', marginBottom:2 }}>{title}</div>
        <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.72rem', color:'var(--text-3)' }}>{sub}</div>
      </div>
      {children}
    </div>
  );
}

function SliderRow({ label, val, min, max, unit, onChange, style }) {
  const pct = ((val - min) / (max - min)) * 100;
  return (
    <div style={style}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.8rem', color:'var(--text-2)' }}>{label}</span>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'0.8rem', fontWeight:700, color:'var(--red)' }}>{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={val}
        onChange={e=>onChange(Number(e.target.value))}
        style={{ background:`linear-gradient(to right, var(--red) ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
      />
    </div>
  );
}
