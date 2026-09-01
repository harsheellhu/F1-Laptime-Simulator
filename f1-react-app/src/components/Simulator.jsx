import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { api, formatTime } from '../api/client';
import TrackView from './TrackView';
import CarLiveryPreview from './CarLiveryPreview';
import LiquidGlassHero from './LiquidGlassHero';
import MultiDriverComparison from './MultiDriverComparison';
import {
  getLivery,
  getDriverProfile,
  getTeamCarModels,
} from '../data/teamLiveries';
import { getCircuitTrack } from '../data/circuitTracks';
import {
  calculateLapSectors,
  analyzeSectors,
  analyzePitStops,
  formatSector,
} from '../utils/sectorPhysics';

import { WeatherEngine } from '../engines/WeatherEngine';
import { TrackConditionEngine } from '../engines/TrackConditionEngine';
import { StrategyEngine } from '../engines/StrategyEngine';
import { TYRE_COMPOUNDS } from '../engines/TyrePerformanceEngine';

const PIT_LOSS_SEC = 22.5;

export default function Simulator({ onBack }) {
  // Mode: 'single' | 'multi'
  const [simMode, setSimMode] = useState('single');

  // Reference data loaded from backend
  const [drivers, setDrivers] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loadErr, setLoadErr] = useState('');

  // User configuration (Single driver mode)
  const [cfg, setCfg] = useState({
    driver_id: null,
    constructor_id: null,
    circuit_id: null,
    grid: 1,
    laps: 30,
    year: 2024,
    strategyMode: 'auto', // auto | semi-auto | manual
  });

  // Simulation state
  const [phase, setPhase] = useState('setup'); // 'setup' | 'live' | 'results'
  const [simState, setSim] = useState({
    running: false,
    lapTimes: [],
    currentLap: 0,
    totalTime: 0,
    fastestLap: null,
    avgTime: 0,
    currentTime: null,
    pitStops: [],
    lastSectors: null,
    // Dynamic Simulation State
    weather: null,
    trackCond: null,
    strategyDecision: null,
    currentTyre: TYRE_COMPOUNDS.MEDIUM,
    tyreAge: 0,
    pitActive: false,
  });

  const intervalRef = useRef(null);
  const lapRef = useRef(0);
  const weatherRef = useRef(null);
  const trackRef = useRef(null);
  const strategyRef = useRef(null);

  // Load reference data from backend
  useEffect(() => {
    (async () => {
      try {
        const [h, dr, ci, co, mi] = await Promise.all([
          api.health(),
          api.drivers(),
          api.circuits(),
          api.constructors(),
          api.modelInfo(),
        ]);
        setDrivers(dr.drivers || []);
        setCircuits(ci.circuits || []);
        setConstructors(co.constructors || []);
        setModelInfo(mi);
        setApiOnline(true);

        if (dr.valid_driver_ids?.length) {
          const firstDriverId = dr.valid_driver_ids[0];
          const driverProfile = getDriverProfile(firstDriverId);
          const firstCirc = ci.valid_circuit_ids?.[0] ?? (ci.circuits?.[0]?.circuitId_num ?? 1);
          setCfg((p) => ({
            ...p,
            driver_id: firstDriverId,
            constructor_id: driverProfile.constructorId_num || 2,
            circuit_id: firstCirc,
            year: 2024,
          }));
        }
      } catch (e) {
        setApiOnline(false);
        setLoadErr('FastAPI backend offline. Start with: uvicorn f1_simulator.backend.main:app --port 8000');
      }
    })();
  }, []);

  // When updating driver, automatically sync constructor to that driver's team!
  const upd = (key, val) => {
    if (key === 'driver_id') {
      const profile = getDriverProfile(val);
      setCfg((p) => ({
        ...p,
        driver_id: val,
        constructor_id: profile.constructorId_num || p.constructor_id,
      }));
    } else {
      setCfg((p) => ({ ...p, [key]: val }));
    }
  };

  const selectedDriver = drivers.find((d) => d.driverId_num === cfg.driver_id);
  const selectedCircuit = circuits.find((c) => c.circuitId_num === cfg.circuit_id);
  const circuitMetadata = getCircuitTrack(cfg.circuit_id);
  const driverProfile = getDriverProfile(cfg.driver_id);
  const livery = getLivery(cfg.constructor_id || driverProfile.constructorId_num);
  const teamCarModels = getTeamCarModels(livery.id);

  // Sector and pit stop analysis
  const sectorAnalysis = useMemo(
    () => analyzeSectors(simState.lapTimes),
    [simState.lapTimes]
  );
  const pitAnalysis = useMemo(
    () =>
      analyzePitStops(
        [cfg.pit_lap_1, cfg.pit_lap_2].filter(Boolean),
        cfg.laps
      ),
    [cfg.pit_lap_1, cfg.pit_lap_2, cfg.laps]
  );

  // Start simulation
  const startSim = useCallback(async () => {
    if (!apiOnline) return;
    setPhase('live');
    lapRef.current = 0;
    
    // Initialize Engines
    weatherRef.current = new WeatherEngine();
    trackRef.current = new TrackConditionEngine();
    strategyRef.current = new StrategyEngine('BALANCED');

    setSim({
      running: true,
      lapTimes: [],
      currentLap: 0,
      totalTime: 0,
      fastestLap: null,
      avgTime: 0,
      currentTime: null,
      pitStops: [],
      lastSectors: null,
      weather: weatherRef.current.getCurrentWeather(),
      trackCond: trackRef.current.getCondition(),
      strategyDecision: null,
      currentTyre: TYRE_COMPOUNDS.MEDIUM,
      tyreAge: 0,
      pitActive: false,
    });

    const runLap = async () => {
      lapRef.current += 1;
      const lap = lapRef.current;

      try {
        const res = await api.predict({
          lap,
          grid: cfg.grid,
          total_laps: cfg.laps,
          driver_id: cfg.driver_id,
          constructor_id: cfg.constructor_id,
          circuit_id: cfg.circuit_id,
          circuit_length_km: selectedCircuit?.length_km || circuitMetadata?.length_km || 5.0,
          year: cfg.year,
        });

        setSim((prev) => {
          // 1. Advance engines
          weatherRef.current.tick();
          const currWeather = weatherRef.current.getCurrentWeather();
          trackRef.current.tick(currWeather);
          const trackCond = trackRef.current.getCondition();

          // 2. Strategy & Pit Logic
          let isPit = false;
          let pitActive = false;
          let newTyre = prev.currentTyre;
          let newTyreAge = prev.tyreAge + 1;
          
          const decision = strategyRef.current.evaluatePitStrategy(
            weatherRef.current,
            trackRef.current,
            prev.currentTyre,
            prev.tyreAge,
            lap
          );

          if (cfg.strategyMode === 'auto' && decision.decision === 'PIT NOW') {
            isPit = true;
            pitActive = true;
            newTyre = decision.recommendedTyre;
            newTyreAge = 0;
          } else if (cfg.strategyMode === 'manual' && prev.pitActive) {
            isPit = true;
            pitActive = false;
            // Simplified manual logic, assumes medium on pit
            newTyreAge = 0;
          }

          // 3. Lap Time Calculation
          const lapTime = res.lap_time_sec + (isPit ? PIT_LOSS_SEC : 0);
          const sectors = calculateLapSectors(lap, lapTime, isPit, 5.0, trackCond.grip);

          const times = [
            ...prev.lapTimes,
            { lap, time: lapTime, pure: res.lap_time_sec, isPit, sectors },
          ];
          const pureTimes = times.filter((l) => !l.isPit).map((l) => l.pure);
          
          return {
            ...prev,
            currentLap: lap,
            lapTimes: times,
            currentTime: lapTime,
            totalTime: prev.totalTime + lapTime,
            fastestLap: Math.min(...pureTimes),
            avgTime: pureTimes.reduce((a, b) => a + b, 0) / pureTimes.length,
            pitStops: isPit ? [...prev.pitStops, lap] : prev.pitStops,
            lastSectors: sectors,
            running: lap < cfg.laps,
            weather: currWeather,
            trackCond,
            strategyDecision: decision,
            currentTyre: newTyre,
            tyreAge: newTyreAge,
            pitActive,
          };
        });

        if (lap >= cfg.laps) {
          clearInterval(intervalRef.current);
          setSim((p) => ({ ...p, running: false }));
          setTimeout(() => setPhase('results'), 500);
        }
      } catch (e) {
        clearInterval(intervalRef.current);
        setSim((p) => ({ ...p, running: false }));
      }
    };

    await runLap();
    intervalRef.current = setInterval(runLap, 1200);
  }, [cfg, apiOnline, selectedCircuit, circuitMetadata]);

  const stopSim = () => {
    clearInterval(intervalRef.current);
    setSim((p) => ({ ...p, running: false }));
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const chartData = simState.lapTimes.map((l) => ({
    lap: l.lap,
    time: parseFloat(l.time.toFixed(3)),
    pure: parseFloat(l.pure.toFixed(3)),
  }));
  const fastestObj = simState.lapTimes.reduce(
    (b, l) => (!l.isPit && (!b || l.pure < b.pure) ? l : b),
    null
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--bg-void)' }}>
      {/* Top Header Mode Toggle & Navigation */}
      <div
        style={{
          maxWidth: 1380,
          margin: '0 auto',
          padding: '0 24px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            className="btn-ghost"
            style={{ padding: '6px 14px', fontSize: '0.66rem' }}
          >
            ← HOME
          </button>

          {/* Mode Switcher: Single vs Multi-Driver Battle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => setSimMode('single')}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.64rem',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: simMode === 'single' ? 'var(--red)' : 'transparent',
                color: simMode === 'single' ? '#fff' : 'var(--text-3)',
                transition: 'all 0.2s',
              }}
            >
              SINGLE DRIVER
            </button>
            <button
              onClick={() => setSimMode('multi')}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.64rem',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: simMode === 'multi' ? 'var(--red)' : 'transparent',
                color: simMode === 'multi' ? '#fff' : 'var(--text-3)',
                transition: 'all 0.2s',
                boxShadow: simMode === 'multi' ? '0 0 14px var(--red-glow)' : 'none',
              }}
            >
              MULTI-DRIVER BATTLE (2 TO N)
            </button>
          </div>
        </div>

        {/* Phase Tabs for Single Mode */}
        {simMode === 'single' && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: 4,
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {[
              { id: 'setup', label: '1. SETUP' },
              { id: 'live', label: '2. TELEMETRY & SECTORS' },
              { id: 'results', label: '3. RACE ARCHIVE' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPhase(tab.id)}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '6px 16px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  background: phase === tab.id ? 'var(--red)' : 'transparent',
                  color: phase === tab.id ? '#fff' : 'var(--text-3)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: phase === tab.id ? '0 0 16px var(--red-glow)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 24px 60px' }}>
        {!apiOnline && loadErr && <div className="offline-banner">⚠️ {loadErr}</div>}

        {/* Multi-Driver Comparison Mode */}
        {simMode === 'multi' ? (
          <MultiDriverComparison
            drivers={drivers}
            circuits={circuits}
            constructors={constructors}
            apiOnline={apiOnline}
            initialCircuitId={cfg.circuit_id || 1}
          />
        ) : (
          /* Single Driver Simulation Mode */
          <AnimatePresence mode="wait">
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <SetupPanel
                  cfg={cfg}
                  upd={upd}
                  drivers={drivers}
                  circuits={circuits}
                  constructors={constructors}
                  selectedDriver={selectedDriver}
                  circuitMetadata={circuitMetadata}
                  driverProfile={driverProfile}
                  livery={livery}
                  teamCarModels={teamCarModels}
                  apiOnline={apiOnline}
                  onStart={startSim}
                />
              </motion.div>
            )}

            {phase === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <LivePanel
                  simState={simState}
                  cfg={cfg}
                  chartData={chartData}
                  fastestObj={fastestObj}
                  sectorAnalysis={sectorAnalysis}
                  pitAnalysis={pitAnalysis}
                  circuitMetadata={circuitMetadata}
                  driverProfile={driverProfile}
                  livery={livery}
                  onStop={stopSim}
                />
              </motion.div>
            )}

            {phase === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <ResultsPanel
                  simState={simState}
                  cfg={cfg}
                  chartData={chartData}
                  fastestObj={fastestObj}
                  sectorAnalysis={sectorAnalysis}
                  pitAnalysis={pitAnalysis}
                  selectedDriver={selectedDriver}
                  selectedCircuit={selectedCircuit}
                  circuitMetadata={circuitMetadata}
                  driverProfile={driverProfile}
                  livery={livery}
                  modelInfo={modelInfo}
                  onReset={() => {
                    setPhase('setup');
                    setSim((s) => ({ ...s, lapTimes: [], completed: false }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SETUP PANEL
// ═══════════════════════════════════════════════════
function SetupPanel({
  cfg,
  upd,
  drivers,
  circuits,
  constructors,
  selectedDriver,
  circuitMetadata,
  driverProfile,
  livery,
  teamCarModels,
  apiOnline,
  onStart,
}) {
  const handleDriverChange = (driverId) => {
    upd('driver_id', driverId);
    const prof = getDriverProfile(driverId);
    if (prof && prof.constructorId_num) {
      upd('constructor_id', prof.constructorId_num);
    }
  };

  const handleConstructorChange = (constructorId) => {
    upd('constructor_id', constructorId);
    const teamLivery = getLivery(constructorId);
    const teamDriverIds = Object.keys(teamLivery.drivers || {}).map(Number);
    if (teamDriverIds.length > 0 && !teamDriverIds.includes(cfg.driver_id)) {
      upd('driver_id', teamDriverIds[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── 1. Top Liquid Glass Car & Team Presentation Stage ── */}
      <LiquidGlassHero
        selectedDriverId={cfg.driver_id}
        selectedConstructorId={cfg.constructor_id}
        onSelectDriver={handleDriverChange}
        onSelectConstructor={handleConstructorChange}
        tireCompound={cfg.tire_compound || 'soft'}
        onTireChange={(compound) => upd('tire_compound', compound)}
      />

      {/* ── 2. Circuit Selection, Race Parameters & Pit Strategy Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Authentic Circuit Selector */}
        <GlassCard title="GRAND PRIX CIRCUIT" sub="Official 2024 Track Topology">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 460,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {circuits.map((c) => {
              const isSel = cfg.circuit_id === c.circuitId_num;
              const trackData = getCircuitTrack(c.circuitId_num);
              return (
                <button
                  key={c.circuitId_num}
                  onClick={() => upd('circuit_id', c.circuitId_num)}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.82rem',
                    fontWeight: isSel ? 700 : 500,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: `1px solid ${isSel ? livery.secondary : 'rgba(255,255,255,0.04)'}`,
                    background: isSel
                      ? `linear-gradient(90deg, ${livery.secondary}22, rgba(255,255,255,0.02))`
                      : 'rgba(255,255,255,0.015)',
                    color: isSel ? '#fff' : 'var(--text-2)',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div>{trackData.name || c.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>
                      {c.country} · {trackData.turns} Turns · {trackData.drs_zones} DRS
                    </div>
                  </div>
                  <span
                    style={{
                      color: isSel ? livery.secondary : 'var(--text-4)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      marginLeft: 8,
                    }}
                  >
                    {c.length_km}km
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Parameters & Launch Sequence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <GlassCard title="RACE PARAMETERS" sub="Environmental & grid conditions">
            <SliderRow
              label="Grid Position"
              val={cfg.grid}
              min={1}
              max={20}
              unit={`P${cfg.grid}`}
              onChange={(v) => upd('grid', v)}
            />
            <SliderRow
              label="Race Distance (Laps)"
              val={cfg.laps}
              min={5}
              max={70}
              unit={`${cfg.laps} Laps`}
              onChange={(v) => upd('laps', v)}
              style={{ marginTop: 18 }}
            />
          </GlassCard>

          <GlassCard title="RACE STRATEGY ENGINE" sub="Weather prediction and pit intelligence">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="label">Strategy Control Mode</div>
              <select
                className="f1-select"
                style={{ padding: '10px' }}
                value={cfg.strategyMode || 'auto'}
                onChange={(e) => upd('strategyMode', e.target.value)}
              >
                <option value="auto">AUTO - AI manages pit stops</option>
                <option value="semi-auto">SEMI-AUTO - AI recommends, you approve</option>
                <option value="manual">MANUAL - You control all stops</option>
              </select>
            </div>
          </GlassCard>

          {/* Launch Action Card */}
          <div
            className="glass"
            style={{
              padding: 20,
              background: `linear-gradient(135deg, ${livery.secondary}18 0%, rgba(12, 14, 24, 0.9) 100%)`,
              border: `1px solid ${livery.secondary}44`,
              boxShadow: `0 8px 32px ${livery.secondary}22`,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.72rem',
                color: 'var(--text-3)',
                marginBottom: 12,
              }}
            >
              Simulating <strong style={{ color: '#fff' }}>{driverProfile.name}</strong> ({cfg.year}) with{' '}
              <strong style={{ color: livery.secondary }}>{livery.name}</strong> at{' '}
              <strong style={{ color: '#fff' }}>{circuitMetadata?.name || 'Circuit'}</strong>
            </div>
            <button
              className="btn-primary"
              onClick={onStart}
              disabled={!apiOnline || !cfg.driver_id || !cfg.circuit_id}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.82rem',
                background: `linear-gradient(90deg, ${livery.secondary}, #ff1844)`,
                boxShadow: `0 0 20px ${livery.secondary}66`,
              }}
            >
              {!apiOnline
                ? '⚠️ CONNECTING ML ENGINE...'
                : !cfg.driver_id || !cfg.circuit_id
                ? 'SELECT DRIVER & CIRCUIT'
                : '🚀 START SIMULATION'}
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
function LivePanel({
  simState,
  cfg,
  chartData,
  fastestObj,
  circuitMetadata,
  driverProfile,
  livery,
  onStop,
}) {
  const pct = (simState.currentLap / cfg.laps) * 100;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 20 }}>
        {/* Track Canvas */}
        <div
          style={{
            height: 480,
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          <TrackView
            circuitId={cfg.circuit_id}
            driverId={cfg.driver_id}
            constructorId={cfg.constructor_id}
            isRunning={simState.running}
            currentLap={simState.currentLap}
            totalLaps={cfg.laps}
            lastLapTime={simState.currentTime ? formatTime(simState.currentTime) : null}
          />
        </div>

        {/* Live Timing & Telemetry Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CarLiveryPreview driverId={cfg.driver_id} constructorId={cfg.constructor_id} compact={true} />

          {/* New: Weather Radar & Track Condition */}
          {simState.weather && (
            <div className="glass" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="label">WEATHER RADAR</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>AIR: {Math.round(simState.weather.airTemp)}°C | TRK: {Math.round(simState.weather.trackTemp)}°C</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <div style={{ color: simState.weather.intensity > 0 ? '#0099ff' : '#fff' }}>
                  NOW {simState.weather.icon}
                </div>
                <div style={{ color: 'var(--text-4)' }}>+5L</div>
                <div style={{ color: 'var(--text-4)' }}>+10L</div>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{simState.trackCond?.name} ({simState.trackCond?.wetness}% Wet)</span>
                <span>Grip: {simState.trackCond?.grip}%</span>
              </div>
              {/* Track Condition Bar */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${simState.trackCond?.wetness}%`, background: '#0099ff', transition: 'width 1s' }} />
              </div>
            </div>
          )}

          {/* New: Strategy Panel */}
          {simState.strategyDecision && (
            <div className="glass" style={{ padding: '12px 16px', border: simState.pitActive ? '1px solid #ffb800' : '1px solid rgba(255,255,255,0.08)' }}>
              <div className="label" style={{ marginBottom: 6, color: simState.pitActive ? '#ffb800' : 'var(--text-3)' }}>
                {simState.pitActive ? 'PIT STOP IN PROGRESS...' : 'RACE STRATEGY'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                 <div style={{ fontSize: '0.7rem' }}>TYRE: <strong style={{ color: simState.currentTyre.color }}>{simState.currentTyre.name}</strong> ({simState.tyreAge} Laps)</div>
                 <div style={{ fontSize: '0.7rem', color: simState.strategyDecision.decision === 'PIT NOW' ? '#ff1844' : 'var(--text-3)' }}>
                   {simState.strategyDecision.decision}
                 </div>
              </div>
              
              {!simState.pitActive && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>
                  Reason: {simState.strategyDecision.reason}<br/>
                  Recommend: <span style={{ color: simState.strategyDecision.recommendedTyre.color }}>{simState.strategyDecision.recommendedTyre.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Live Sector Timing Bar */}
          <div className="glass" style={{ padding: '12px 16px' }}>
            <div className="label" style={{ marginBottom: 8 }}>
              LIVE SECTOR DELTAS (LAP {simState.currentLap || 1})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { name: 'S1', time: simState.lastSectors?.s1 },
                { name: 'S2', time: simState.lastSectors?.s2 },
                { name: 'S3', time: simState.lastSectors?.s3 },
              ].map((s) => (
                <div
                  key={s.name}
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    textAlign: 'center',
                  }}
                >
                  <div className="label" style={{ fontSize: '0.55rem' }}>
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: s.time ? '#fff' : 'var(--text-4)',
                    }}
                  >
                    {formatSector(s.time)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {[
            { k: 'CURRENT LAP', v: `${simState.currentLap} / ${cfg.laps}`, c: '#fff' },
            { k: 'LAST LAP TIME', v: formatTime(simState.currentTime), c: '#fff' },
            {
              k: 'FASTEST LAP',
              v: formatTime(simState.fastestLap),
              c: 'var(--gold)',
              sub: `Lap ${fastestObj?.lap || '—'}`,
            },
            { k: 'AVERAGE PACE', v: formatTime(simState.avgTime), c: 'var(--text-2)' },
            { k: 'TOTAL TIME', v: formatTime(simState.totalTime), c: livery.secondary },
          ].map((s) => (
            <div
              key={s.k}
              className="glass"
              style={{
                padding: '9px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: `3px solid ${s.c === '#fff' ? 'rgba(255,255,255,0.15)' : s.c}`,
              }}
            >
              <div className="label">{s.k}</div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: s.c,
                    textAlign: 'right',
                  }}
                >
                  {s.v}
                </div>
                {s.sub && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.56rem',
                      color: 'var(--text-4)',
                      textAlign: 'right',
                    }}
                  >
                    {s.sub}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Stint Progress */}
          <div className="glass" style={{ padding: '10px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="label">STINT PROGRESS</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: livery.secondary,
                }}
              >
                {Math.round(pct)}%
              </div>
            </div>
            <div
              style={{
                height: 4,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${livery.primary}, ${livery.secondary})`,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {simState.running && (
            <button
              onClick={onStop}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'rgba(255,50,50,0.08)',
                border: '1px solid rgba(255,50,50,0.25)',
                color: '#ff4444',
                transition: 'all 0.2s',
              }}
            >
              ⏹ ABORT SIMULATION
            </button>
          )}
        </div>
      </div>

      {/* Real-time Telemetry Trace */}
      <div className="glass" style={{ padding: '18px 20px 10px' }}>
        <div className="label" style={{ marginBottom: 14 }}>
          REAL-TIME LAP TIME TELEMETRY TRACE ({circuitMetadata?.name || 'Circuit'})
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="lapG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={livery.secondary} stopOpacity={0.35} />
                <stop offset="95%" stopColor={livery.secondary} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="lap"
              stroke="rgba(255,255,255,0.15)"
              tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--text-4)' }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.0)"
              domain={['auto', 'auto']}
              tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--text-4)' }}
              tickFormatter={(v) => v.toFixed(1)}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(8,9,15,0.95)',
                border: `1px solid ${livery.secondary}66`,
                borderRadius: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
              }}
              formatter={(v) => [formatTime(v), 'Lap Time']}
              labelFormatter={(l) => `Lap ${l}`}
            />
            <Area
              type="monotone"
              dataKey="time"
              stroke={livery.secondary}
              strokeWidth={2}
              fill="url(#lapG)"
              dot={false}
            />
            {fastestObj && (
              <ReferenceLine
                y={fastestObj.pure}
                stroke="rgba(255,184,0,0.6)"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// RESULTS PANEL
// ═══════════════════════════════════════════════════
function ResultsPanel({
  simState,
  cfg,
  chartData,
  fastestObj,
  sectorAnalysis,
  pitAnalysis,
  circuitMetadata,
  driverProfile,
  livery,
  onReset,
}) {
  const { bestS1, bestS2, bestS3, theoreticalFormatted, lapSectors } = sectorAnalysis;

  const renderSectorBadge = (secTime, colorType) => {
    let bg = 'rgba(255,255,255,0.03)';
    let textCol = 'var(--text-2)';
    let border = 'transparent';

    if (colorType === 'purple') {
      bg = 'rgba(168, 85, 247, 0.2)';
      textCol = '#c084fc';
      border = '#a855f7';
    } else if (colorType === 'green') {
      bg = 'rgba(0, 230, 118, 0.15)';
      textCol = '#00e676';
      border = '#00e676';
    } else if (colorType === 'yellow') {
      bg = 'rgba(255, 184, 0, 0.1)';
      textCol = '#ffb800';
    }

    return (
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.74rem',
          fontWeight: colorType === 'purple' || colorType === 'green' ? 700 : 500,
          background: bg,
          color: textCol,
          border: `1px solid ${border}`,
          borderRadius: 4,
          padding: '2px 6px',
          display: 'inline-block',
          textAlign: 'center',
          minWidth: 48,
        }}
      >
        {formatSector(secTime)}
      </span>
    );
  };

  return (
    <div>
      {/* Race Winner Banner */}
      <div
        className="glass-formula"
        style={{
          padding: '26px 30px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: `4px solid ${livery.secondary}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: '2.8rem' }}>🏆</div>
          <div>
            <div className="label" style={{ color: livery.secondary, marginBottom: 4 }}>
              GRAND PRIX SIMULATION SUMMARY
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900 }}>
              {driverProfile.name} (#{driverProfile.number})
            </div>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.85rem',
                color: 'var(--text-3)',
                marginTop: 4,
              }}
            >
              {circuitMetadata?.name} · {cfg.laps} Laps · {livery.name} ({cfg.year})
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="label" style={{ marginBottom: 4 }}>
            TOTAL RACE TIME
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--gold)',
            }}
          >
            {formatTime(simState.totalTime)}
          </div>
        </div>
      </div>

      {/* Best Sectors & Theoretical Best Lap Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: 'BEST SECTOR 1',
            val: formatSector(bestS1?.time),
            sub: `Achieved on Lap ${bestS1?.lap || '—'}`,
            color: '#a855f7',
            badge: '🟣 PURPLE S1',
          },
          {
            label: 'BEST SECTOR 2',
            val: formatSector(bestS2?.time),
            sub: `Achieved on Lap ${bestS2?.lap || '—'}`,
            color: '#a855f7',
            badge: '🟣 PURPLE S2',
          },
          {
            label: 'BEST SECTOR 3',
            val: formatSector(bestS3?.time),
            sub: `Achieved on Lap ${bestS3?.lap || '—'}`,
            color: '#a855f7',
            badge: '🟣 PURPLE S3',
          },
          {
            label: 'THEORETICAL BEST LAP',
            val: theoreticalFormatted,
            sub: `Delta to actual: ${
              sectorAnalysis.theoreticalLap && fastestObj?.pure
                ? `-${(fastestObj.pure - sectorAnalysis.theoreticalLap).toFixed(3)}s`
                : '0.000s'
            }`,
            color: 'var(--cyan)',
            badge: '⚡ OPTIMAL LAP',
          },
        ].map((sec) => (
          <div
            key={sec.label}
            className="glass"
            style={{
              padding: '16px 18px',
              borderLeft: `3px solid ${sec.color}`,
              background: 'rgba(12, 14, 24, 0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="label">{sec.label}</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: sec.color,
                  fontWeight: 700,
                }}
              >
                {sec.badge}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: sec.color,
              }}
            >
              {sec.val}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.72rem',
                color: 'var(--text-4)',
                marginTop: 4,
              }}
            >
              {sec.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Pit Stop Strategy & Stints Analysis Card */}
      <div className="glass" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="label">
            PIT STOP STRATEGY & TIRE COMPOUND STINTS ({pitAnalysis.totalStops} STOPS)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--green)' }}>
            Average Pit Lane Delta: {pitAnalysis.avgPitLoss} · Fastest Box: {pitAnalysis.fastestStop}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pitAnalysis.stints.length}, 1fr)`, gap: 12 }}>
          {pitAnalysis.stints.map((st) => (
            <div
              key={st.stint}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '12px 14px',
                borderTop: `3px solid ${st.compound.color}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', fontWeight: 800 }}>
                  STINT {st.stint}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: st.compound.color,
                    background: `${st.compound.color}22`,
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {st.compound.name.toUpperCase()} ({st.compound.code})
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.76rem', color: 'var(--text-3)' }}>
                Laps {st.startLap} – {st.endLap} ({st.length} laps)
              </div>
              {st.pitLap && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--gold)',
                    marginTop: 6,
                  }}
                >
                  Boxed on Lap {st.pitLap} (Box: {st.stationaryTime}s)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Sector Telemetry Table & Lap Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Full Lap & Sector Breakdown Table */}
        <div
          className="glass"
          style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', height: 380 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="label">
              PER-LAP SECTOR BREAKDOWN (🟣 SESSION BEST · 🟢 PERSONAL BEST)
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: '#c084fc' }}>🟣 Purple = Session Best</span>
              <span style={{ color: '#00e676' }}>🟢 Green = Personal Best</span>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.62rem',
                    color: 'var(--text-4)',
                  }}
                >
                  <th style={{ padding: '6px 4px' }}>LAP</th>
                  <th style={{ padding: '6px 4px' }}>LAP TIME</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>SECTOR 1</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>SECTOR 2</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>SECTOR 3</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {lapSectors.map((l) => {
                  const isFastest = l.lap === fastestObj?.lap;
                  return (
                    <tr
                      key={l.lap}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: isFastest ? 'rgba(255,184,0,0.06)' : 'transparent',
                      }}
                    >
                      <td
                        style={{
                          padding: '6px 4px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          color: 'var(--text-4)',
                        }}
                      >
                        L{l.lap}
                      </td>
                      <td
                        style={{
                          padding: '6px 4px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: isFastest ? 'var(--gold)' : l.isPit ? 'var(--green)' : '#fff',
                        }}
                      >
                        {formatTime(l.time)}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        {renderSectorBadge(l.sectors.s1, l.sectorColors.s1)}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        {renderSectorBadge(l.sectors.s2, l.sectorColors.s2)}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        {renderSectorBadge(l.sectors.s3, l.sectorColors.s3)}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                        {l.isPit && (
                          <span
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.6rem',
                              color: 'var(--green)',
                              background: 'rgba(0,230,118,0.1)',
                              borderRadius: 3,
                              padding: '2px 5px',
                              marginLeft: 4,
                            }}
                          >
                            PIT
                          </span>
                        )}
                        {isFastest && (
                          <span
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.6rem',
                              color: 'var(--gold)',
                              background: 'rgba(255,184,0,0.12)',
                              borderRadius: 3,
                              padding: '2px 5px',
                              marginLeft: 4,
                            }}
                          >
                            FASTEST
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lap Trace Line Chart */}
        <div className="glass" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
          <div className="label" style={{ marginBottom: 14 }}>
            LAP TIME CONSISTENCY & TIRE DEGRADATION
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="lap"
                stroke="rgba(255,255,255,0.15)"
                tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--text-4)' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.0)"
                domain={['auto', 'auto']}
                tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--text-4)' }}
                tickFormatter={(v) => v.toFixed(1)}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(8,9,15,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                }}
                formatter={(v) => [formatTime(v), 'Lap Time']}
                labelFormatter={(l) => `Lap ${l}`}
              />
              <Line
                type="monotone"
                dataKey="time"
                stroke={livery.secondary}
                strokeWidth={2.5}
                dot={{ r: 2, fill: livery.secondary }}
              />
              <Line
                type="monotone"
                dataKey="pure"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="3 3"
              />
              {fastestObj && (
                <ReferenceLine
                  y={fastestObj.pure}
                  stroke="rgba(255,184,0,0.6)"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          className="btn-ghost"
          style={{ padding: '12px 36px', fontSize: '0.76rem' }}
          onClick={onReset}
        >
          ⟲ RECONFIGURE RACE
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════
function GlassCard({ title, sub, children }) {
  return (
    <div className="glass" style={{ padding: 20 }}>
      <div
        style={{
          marginBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'var(--red)',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ width: 3, height: 12, background: 'var(--red)', borderRadius: 1 }} />
          {title}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--text-4)' }}>
          {sub}
        </div>
      </div>
      {children}
    </div>
  );
}

function SliderRow({ label, val, min, max, unit, onChange, style }) {
  const pct = ((val - min) / (max - min)) * 100;
  return (
    <div style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-2)' }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--red)',
          }}
        >
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={val}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--red) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
    </div>
  );
}
