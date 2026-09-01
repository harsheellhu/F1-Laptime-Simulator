import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api, formatTime } from '../api/client';
import TrackView from './TrackView';
import {
  getLivery,
  getDriverProfile,
  getTeamCarModels,
} from '../data/teamLiveries';
import { getCircuitTrack } from '../data/circuitTracks';
import {
  calculateLapSectors,
  formatSector,
} from '../utils/sectorPhysics';

export default function MultiDriverComparison({
  drivers = [],
  circuits = [],
  constructors = [],
  apiOnline = false,
  initialCircuitId = 1,
}) {
  // Selected circuit
  const [circuitId, setCircuitId] = useState(initialCircuitId);
  const [laps, setLaps] = useState(30);

  // Multi-Driver Entries List (2 up to N drivers)
  const [selectedEntries, setSelectedEntries] = useState([
    {
      id: 'entry_1',
      driverId: 1, // Max Verstappen
      constructorId: 2, // Red Bull
      year: 2023, // 2023 RB19
      grid: 1,
      pit_lap_1: 15,
      pit_lap_2: null,
    },
    {
      id: 'entry_2',
      driverId: 3, // Lewis Hamilton
      constructorId: 1, // Mercedes
      year: 2020, // 2020 W11
      grid: 2,
      pit_lap_1: 18,
      pit_lap_2: null,
    },
    {
      id: 'entry_3',
      driverId: 5, // Charles Leclerc
      constructorId: 3, // Ferrari
      year: 2024, // 2024 SF-24
      grid: 3,
      pit_lap_1: 14,
      pit_lap_2: null,
    },
    {
      id: 'entry_4',
      driverId: 7, // Lando Norris
      constructorId: 4, // McLaren
      year: 2024, // 2024 MCL38
      grid: 4,
      pit_lap_1: 16,
      pit_lap_2: null,
    },
  ]);

  // Comparison execution state
  const [phase, setPhase] = useState('setup'); // 'setup' | 'live' | 'results'
  const [simResults, setSimResults] = useState(null);
  const [simLap, setSimLap] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const selectedCircuit = circuits.find((c) => c.circuitId_num === circuitId);
  const circuitMetadata = getCircuitTrack(circuitId);

  // Add a new driver to comparison
  const addDriver = () => {
    // Pick first driver not currently selected
    const existingIds = selectedEntries.map((e) => e.driverId);
    const candidate = drivers.find((d) => !existingIds.includes(d.driverId_num)) || drivers[0];
    if (!candidate) return;

    const profile = getDriverProfile(candidate.driverId_num);
    const newEntry = {
      id: `entry_${Date.now()}`,
      driverId: candidate.driverId_num,
      constructorId: profile.constructorId_num || 1,
      year: 2024,
      grid: selectedEntries.length + 1,
      pit_lap_1: Math.floor(laps / 2),
      pit_lap_2: null,
    };
    setSelectedEntries([...selectedEntries, newEntry]);
  };

  // Remove driver
  const removeDriver = (id) => {
    if (selectedEntries.length <= 2) return; // Keep at least 2 drivers
    setSelectedEntries(selectedEntries.filter((e) => e.id !== id));
  };

  // Update entry field
  const updateEntry = (id, key, val) => {
    setSelectedEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (key === 'driverId') {
          const profile = getDriverProfile(val);
          return {
            ...e,
            driverId: val,
            constructorId: profile.constructorId_num || e.constructorId,
          };
        }
        return { ...e, [key]: val };
      })
    );
  };

  // Run Multi-Driver Simulation
  const startComparison = useCallback(async () => {
    if (!apiOnline || selectedEntries.length < 2) return;
    setPhase('live');
    setIsRunning(true);
    setSimLap(0);

    try {
      const payload = {
        circuit_id: circuitId,
        circuit_length_km: selectedCircuit?.length_km || circuitMetadata?.length_km || 5.0,
        laps: laps,
        drivers: selectedEntries.map((e) => ({
          driver_id: e.driverId,
          constructor_id: e.constructorId,
          year: e.year,
          grid: e.grid,
          pit_lap_1: e.pit_lap_1,
          pit_lap_2: e.pit_lap_2,
        })),
      };

      const res = await api.compare(payload);
      setSimResults(res);

      let currentL = 0;
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        currentL += 1;
        setSimLap(currentL);
        if (currentL >= laps) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setTimeout(() => setPhase('results'), 600);
        }
      }, 700);
    } catch (e) {
      console.error('Error running comparison:', e);
      setIsRunning(false);
    }
  }, [circuitId, laps, selectedEntries, apiOnline, selectedCircuit, circuitMetadata]);

  const stopComparison = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  // Multi-Car rendering list
  const multiCarsList = useMemo(() => {
    return selectedEntries.map((e) => ({
      driverId: e.driverId,
      constructorId: e.constructorId,
    }));
  }, [selectedEntries]);

  // Telemetry chart trace data
  const chartTraceData = useMemo(() => {
    if (!simResults || !simResults.lap_traces) return [];
    return simResults.lap_traces.slice(0, simLap || laps);
  }, [simResults, simLap, laps]);

  // Current live leaderboard standings
  const currentLeaderboard = useMemo(() => {
    if (!simResults || !simResults.classification) return [];
    if (simLap === 0) {
      return selectedEntries.map((e, idx) => ({
        ...e,
        position: e.grid || idx + 1,
        lastLap: null,
        totalTime: 0,
        gap: 'GRID',
      }));
    }

    const standings = simResults.classification.map((d) => {
      const currentLapEntry = d.laps[Math.min(simLap - 1, d.laps.length - 1)];
      return {
        ...d,
        currentLapTime: currentLapEntry?.lap_time_sec,
        currentCumTime: currentLapEntry?.cum_time_sec,
        isPit: currentLapEntry?.is_pit,
      };
    });

    standings.sort((a, b) => (a.currentCumTime || 0) - (b.currentCumTime || 0));
    const leaderCum = standings[0]?.currentCumTime || 0;

    return standings.map((s, idx) => {
      const gap = s.currentCumTime - leaderCum;
      return {
        ...s,
        position: idx + 1,
        gapToLeader: idx === 0 ? 'LEADER' : `+${gap.toFixed(3)}s`,
      };
    });
  }, [simResults, simLap, selectedEntries]);

  return (
    <div style={{ maxWidth: 1380, margin: '0 auto' }}>
      {/* Top Bar Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'rgba(8, 10, 18, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.92rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '0.08em',
            }}
          >
            MULTI-DRIVER BATTLE ROYALE ({selectedEntries.length} DRIVERS)
          </div>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.74rem',
              color: 'var(--text-3)',
              marginTop: 2,
            }}
          >
            Compare 2 to N drivers with custom 5-year chassis models & strategies on real telemetry.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['setup', 'live', 'results'].map((tab) => (
            <button
              key={tab}
              onClick={() => setPhase(tab)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: phase === tab ? 'var(--red)' : 'transparent',
                color: phase === tab ? '#fff' : 'var(--text-3)',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Global Circuit & Race Distance Bar */}
            <div
              className="glass"
              style={{
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr auto',
                gap: 16,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div>
                <div className="label" style={{ marginBottom: 6 }}>
                  GRAND PRIX CIRCUIT
                </div>
                <select
                  className="f1-select"
                  value={circuitId}
                  onChange={(e) => setCircuitId(Number(e.target.value))}
                >
                  {circuits.map((c) => (
                    <option key={c.circuitId_num} value={c.circuitId_num}>
                      {c.name} ({c.country}) · {c.length_km}km
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="label">RACE DISTANCE</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--red)',
                    }}
                  >
                    {laps} Laps
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={70}
                  value={laps}
                  onChange={(e) => setLaps(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, var(--red) ${
                      ((laps - 5) / 65) * 100
                    }%, rgba(255,255,255,0.1) 0%)`,
                  }}
                />
              </div>

              <div>
                <button
                  className="btn-primary"
                  onClick={startComparison}
                  disabled={!apiOnline || selectedEntries.length < 2}
                  style={{ padding: '12px 28px', fontSize: '0.78rem' }}
                >
                  🏁 LAUNCH BATTLE
                </button>
              </div>
            </div>

            {/* Drivers Configuration Grid */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="label">
                CHOSEN DRIVERS ({selectedEntries.length} OF N CONTESTANTS)
              </div>
              <button
                className="btn-ghost"
                onClick={addDriver}
                style={{ padding: '6px 16px', fontSize: '0.66rem', color: 'var(--cyan)' }}
              >
                + ADD DRIVER TO COMPARISON
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
                marginBottom: 40,
              }}
            >
              {selectedEntries.map((entry, idx) => {
                const driverProf = getDriverProfile(entry.driverId);
                const livery = getLivery(entry.constructorId || driverProf.constructorId_num);
                const carModels = getTeamCarModels(livery.id);

                return (
                  <div
                    key={entry.id}
                    className="glass"
                    style={{
                      padding: '16px 18px',
                      borderLeft: `4px solid ${livery.secondary}`,
                      position: 'relative',
                    }}
                  >
                    {/* Header with Driver & Delete button */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: driverProf.helmet,
                            border: '1px solid #fff',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: '#fff',
                          }}
                        >
                          {driverProf.name}
                        </span>
                      </div>

                      {selectedEntries.length > 2 && (
                        <button
                          onClick={() => removeDriver(entry.id)}
                          style={{
                            background: 'rgba(255,50,50,0.1)',
                            border: '1px solid rgba(255,50,50,0.3)',
                            color: '#ff4444',
                            borderRadius: 4,
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                          }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    {/* Driver Selector */}
                    <div style={{ marginBottom: 10 }}>
                      <div className="label" style={{ marginBottom: 4 }}>
                        DRIVER
                      </div>
                      <select
                        className="f1-select"
                        value={entry.driverId}
                        onChange={(e) => updateEntry(entry.id, 'driverId', Number(e.target.value))}
                      >
                        {drivers.map((d) => (
                          <option key={d.driverId_num} value={d.driverId_num}>
                            {d.fullName} ({d.team}) · #{getDriverProfile(d.driverId_num).number}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 5-Year Car Model Selector */}
                    <div style={{ marginBottom: 10 }}>
                      <div className="label" style={{ marginBottom: 4 }}>
                        CAR CHASSIS (LAST 5 YEARS)
                      </div>
                      <select
                        className="f1-select"
                        value={entry.year}
                        onChange={(e) => updateEntry(entry.id, 'year', Number(e.target.value))}
                      >
                        {carModels.map((cm) => (
                          <option key={cm.year} value={cm.year}>
                            {cm.name} — {cm.desc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Grid Position & Pit Stop */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div className="label" style={{ marginBottom: 4 }}>
                          GRID START
                        </div>
                        <select
                          className="f1-select"
                          value={entry.grid}
                          onChange={(e) => updateEntry(entry.id, 'grid', Number(e.target.value))}
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((p) => (
                            <option key={p} value={p}>
                              P{p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="label" style={{ marginBottom: 4 }}>
                          PIT LAP
                        </div>
                        <select
                          className="f1-select"
                          value={entry.pit_lap_1 || ''}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              'pit_lap_1',
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        >
                          <option value="">No Stop</option>
                          {Array.from({ length: Math.max(0, laps - 4) }, (_, i) => i + 3).map((l) => (
                            <option key={l} value={l}>
                              Lap {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            {/* Live Track & Multi-Car Leaderboard Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
              {/* Multi-Car Synchronized Track Canvas */}
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
                  circuitId={circuitId}
                  multiCars={multiCarsList}
                  isRunning={isRunning}
                  currentLap={simLap}
                  totalLaps={laps}
                />
              </div>

              {/* Real-time Multi-Driver Timing Tower */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 4px',
                    marginBottom: 4,
                  }}
                >
                  <div className="label">LIVE RACE STANDINGS (LAP {simLap}/{laps})</div>
                  {isRunning && (
                    <button
                      onClick={stopComparison}
                      style={{
                        background: 'rgba(255,50,50,0.1)',
                        border: '1px solid rgba(255,50,50,0.3)',
                        color: '#ff4444',
                        borderRadius: 4,
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontSize: '0.62rem',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      ⏹ STOP
                    </button>
                  )}
                </div>

                {currentLeaderboard.map((entry, idx) => {
                  const driverProf = getDriverProfile(entry.driver_id || entry.driverId);
                  const livery = getLivery(entry.constructor_id || entry.constructorId);

                  return (
                    <div
                      key={entry.driver_id || entry.id}
                      className="glass"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderLeft: `4px solid ${livery.secondary}`,
                        background: idx === 0 ? 'rgba(255,215,0,0.06)' : 'rgba(8,10,18,0.7)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: idx === 0 ? 'var(--gold)' : 'var(--text-3)',
                            width: 22,
                          }}
                        >
                          P{entry.position}
                        </span>
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: '#fff',
                            }}
                          >
                            {driverProf.name}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.68rem',
                              color: livery.secondary,
                            }}
                          >
                            {livery.shortName} ({entry.year || 2024})
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: idx === 0 ? 'var(--gold)' : '#fff',
                          }}
                        >
                          {entry.gapToLeader || 'LEADER'}
                        </div>
                        {entry.currentLapTime && (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.62rem',
                              color: 'var(--text-4)',
                            }}
                          >
                            Last: {formatTime(entry.currentLapTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multi-Line Head-to-Head Telemetry Trace */}
            <div className="glass" style={{ padding: '18px 20px 10px' }}>
              <div className="label" style={{ marginBottom: 14 }}>
                HEAD-TO-HEAD SYNCHRONIZED LAP TIME COMPARISON
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartTraceData}>
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
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                    }}
                    labelFormatter={(l) => `Lap ${l}`}
                  />
                  <Legend />
                  {selectedEntries.map((e) => {
                    const dp = getDriverProfile(e.driverId);
                    const lv = getLivery(e.constructorId || dp.constructorId_num);
                    return (
                      <Line
                        key={e.driverId}
                        type="monotone"
                        dataKey={`driver_${e.driverId}_time`}
                        name={`${dp.name} (${lv.shortName})`}
                        stroke={lv.secondary}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {phase === 'results' && simResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Grand Prix Victory & Podium Banner */}
            <div
              className="glass-formula"
              style={{
                padding: '26px 30px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ fontSize: '3rem' }}>🏁</div>
                <div>
                  <div className="label" style={{ color: 'var(--gold)', marginBottom: 4 }}>
                    GRAND PRIX MULTI-DRIVER WINNER
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2rem',
                      fontWeight: 900,
                      color: '#fff',
                    }}
                  >
                    {getDriverProfile(simResults.winner_driver_id).name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--text-3)' }}>
                    {circuitMetadata?.name} · {laps} Laps Battle
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="label" style={{ marginBottom: 4 }}>
                  WINNING RACE TIME
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--gold)',
                  }}
                >
                  {simResults.classification[0]?.total_race_formatted}
                </div>
              </div>
            </div>

            {/* Official Classification Table */}
            <div className="glass" style={{ padding: '20px 24px', marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 14 }}>
                OFFICIAL RACE CLASSIFICATION & INTERVAL GAPS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.65rem',
                      color: 'var(--text-4)',
                    }}
                  >
                    <th style={{ padding: '8px 6px' }}>POS</th>
                    <th style={{ padding: '8px 6px' }}>DRIVER</th>
                    <th style={{ padding: '8px 6px' }}>CHASSIS (YEAR)</th>
                    <th style={{ padding: '8px 6px' }}>TOTAL TIME</th>
                    <th style={{ padding: '8px 6px' }}>GAP TO LEADER</th>
                    <th style={{ padding: '8px 6px' }}>FASTEST LAP</th>
                    <th style={{ padding: '8px 6px' }}>AVG PACE</th>
                    <th style={{ padding: '8px 6px' }}>STOPS</th>
                  </tr>
                </thead>
                <tbody>
                  {simResults.classification.map((d, idx) => {
                    const dp = getDriverProfile(d.driver_id);
                    const lv = getLivery(d.constructor_id);

                    return (
                      <tr
                        key={d.driver_id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: idx === 0 ? 'rgba(255,215,0,0.06)' : 'transparent',
                        }}
                      >
                        <td
                          style={{
                            padding: '10px 6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            color: idx === 0 ? 'var(--gold)' : '#fff',
                          }}
                        >
                          P{d.position}
                        </td>
                        <td style={{ padding: '10px 6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: dp.helmet,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#fff',
                              }}
                            >
                              {dp.name}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '10px 6px',
                            fontFamily: 'var(--font-ui)',
                            fontSize: '0.78rem',
                            color: lv.secondary,
                          }}
                        >
                          {lv.shortName} ({d.year})
                        </td>
                        <td
                          style={{
                            padding: '10px 6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                          }}
                        >
                          {d.total_race_formatted}
                        </td>
                        <td
                          style={{
                            padding: '10px 6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: idx === 0 ? 'var(--gold)' : 'var(--text-2)',
                          }}
                        >
                          {d.gap_to_leader}
                        </td>
                        <td
                          style={{
                            padding: '10px 6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.82rem',
                            color: 'var(--gold)',
                          }}
                        >
                          {d.fastest_lap_formatted}
                        </td>
                        <td
                          style={{
                            padding: '10px 6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.82rem',
                            color: 'var(--text-3)',
                          }}
                        >
                          {d.avg_lap_formatted}
                        </td>
                        <td
                          style={{
                            padding: '10px 6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {d.pit_stops?.length || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                className="btn-ghost"
                style={{ padding: '12px 36px', fontSize: '0.76rem' }}
                onClick={() => setPhase('setup')}
              >
                ⟲ NEW DRIVER BATTLE SETUP
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
