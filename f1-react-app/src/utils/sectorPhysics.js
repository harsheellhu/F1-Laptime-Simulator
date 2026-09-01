/**
 * Sector Physics & Timing Calculations for Formula 1 Simulation
 * Calculates authentic Sector 1, Sector 2, Sector 3 times, purple/green sector records,
 * and detailed pit stop strategy execution metrics.
 */

import { formatTime } from '../api/client';

/** Formats sector seconds into ss.sss format */
export function formatSector(sec) {
  if (!sec || isNaN(sec)) return '--.---';
  return sec.toFixed(3);
}

/**
 * Splits a total lap time into authentic S1, S2, S3 based on circuit characteristics and tire wear.
 * @param {number} lapNum 
 * @param {number} totalLapSec 
 * @param {boolean} isPit 
 * @param {number} circuitLengthKm 
 * @param {number} gripLevel 0-100%
 */
export function calculateLapSectors(lapNum, totalLapSec, isPit, circuitLengthKm = 5.0, gripLevel = 100) {
  // Deterministic pseudo-random variation based on lap number for repeatable realism
  const seed = Math.sin(lapNum * 12.9898 + (totalLapSec * 100) % 10) * 43758.5453;
  const jitter1 = ((seed - Math.floor(seed)) - 0.5) * 0.18;
  const seed2 = Math.cos(lapNum * 78.233 + totalLapSec) * 43758.5453;
  const jitter2 = ((seed2 - Math.floor(seed2)) - 0.5) * 0.18;

  // Base proportion of sectors (approx 31% S1, 39% S2, 30% S3)
  let s1Ratio = 0.312 + jitter1 * 0.02;
  let s2Ratio = 0.395 + jitter2 * 0.02;
  let s3Ratio = 1.0 - (s1Ratio + s2Ratio);

  let pureTime = isPit ? totalLapSec - 22.5 : totalLapSec;
  
  // Apply grip penalty (lower grip = higher time)
  // At 40% grip, lap is ~30% slower
  const gripPenalty = 1.0 + ((100 - gripLevel) * 0.005);
  pureTime = pureTime * gripPenalty;

  if (pureTime < 50) pureTime = totalLapSec; // fallback

  let s1 = pureTime * s1Ratio;
  let s2 = pureTime * s2Ratio;
  let s3 = pureTime * s3Ratio;

  // If pit stop, the 22.5s pit lane delta is added primarily in Sector 3 (entry) or Sector 1 (exit)
  if (isPit) {
    s3 += 22.5;
  }

  return {
    s1: parseFloat(s1.toFixed(3)),
    s2: parseFloat(s2.toFixed(3)),
    s3: parseFloat(s3.toFixed(3)),
  };
}

/**
 * Analyzes an array of laps to compute session bests, personal bests,
 * theoretical best lap, and sector color classifications.
 *
 * Color Classifications:
 * - 'purple' (#a855f7): Fastest in the entire race session
 * - 'green'  (#00e676): Personal best sector achieved up to that lap
 * - 'yellow' (#ffb800): Standard / slower sector
 */
export function analyzeSectors(lapTimes = []) {
  if (!lapTimes || lapTimes.length === 0) {
    return {
      bestS1: null,
      bestS2: null,
      bestS3: null,
      theoreticalLap: null,
      theoreticalFormatted: '--:--.---',
      lapSectors: [],
    };
  }

  // Find absolute minimums across all non-pit laps
  let bestS1 = { time: Infinity, lap: null };
  let bestS2 = { time: Infinity, lap: null };
  let bestS3 = { time: Infinity, lap: null };

  const processedLaps = [];
  let runningBestS1 = Infinity;
  let runningBestS2 = Infinity;
  let runningBestS3 = Infinity;

  // First pass: find overall session bests
  lapTimes.forEach((l) => {
    const s = l.sectors || calculateLapSectors(l.lap, l.time, l.isPit);
    if (!l.isPit) {
      if (s.s1 < bestS1.time) bestS1 = { time: s.s1, lap: l.lap };
      if (s.s2 < bestS2.time) bestS2 = { time: s.s2, lap: l.lap };
      if (s.s3 < bestS3.time) bestS3 = { time: s.s3, lap: l.lap };
    }
  });

  // Second pass: tag each lap's sector colors
  lapTimes.forEach((l) => {
    const s = l.sectors || calculateLapSectors(l.lap, l.time, l.isPit);

    let s1Color = 'yellow';
    let s2Color = 'yellow';
    let s3Color = 'yellow';

    if (Math.abs(s.s1 - bestS1.time) < 0.001) {
      s1Color = 'purple';
    } else if (s.s1 < runningBestS1 && !l.isPit) {
      s1Color = 'green';
      runningBestS1 = s.s1;
    }

    if (Math.abs(s.s2 - bestS2.time) < 0.001) {
      s2Color = 'purple';
    } else if (s.s2 < runningBestS2 && !l.isPit) {
      s2Color = 'green';
      runningBestS2 = s.s2;
    }

    if (Math.abs(s.s3 - bestS3.time) < 0.001) {
      s3Color = 'purple';
    } else if (s.s3 < runningBestS3 && !l.isPit) {
      s3Color = 'green';
      runningBestS3 = s.s3;
    }

    processedLaps.push({
      ...l,
      sectors: s,
      sectorColors: { s1: s1Color, s2: s2Color, s3: s3Color },
    });
  });

  const theoreticalTime =
    bestS1.time !== Infinity && bestS2.time !== Infinity && bestS3.time !== Infinity
      ? bestS1.time + bestS2.time + bestS3.time
      : null;

  return {
    bestS1: bestS1.lap ? bestS1 : null,
    bestS2: bestS2.lap ? bestS2 : null,
    bestS3: bestS3.lap ? bestS3 : null,
    theoreticalLap: theoreticalTime ? parseFloat(theoreticalTime.toFixed(3)) : null,
    theoreticalFormatted: theoreticalTime ? formatTime(theoreticalTime) : '--:--.---',
    lapSectors: processedLaps,
  };
}

/**
 * Computes detailed pit stop execution data and stint tire analysis.
 */
export function analyzePitStops(pitLaps = [], totalLaps = 50) {
  const sortedPits = [...pitLaps].sort((a, b) => a - b);
  const stints = [];

  const compounds = [
    { name: 'Soft', color: '#ff1844', code: 'S', degFactor: 'High Grip / Rapid Deg' },
    { name: 'Medium', color: '#ffb800', code: 'M', degFactor: 'Optimal Balance' },
    { name: 'Hard', color: '#ffffff', code: 'H', degFactor: 'Maximum Durability' },
  ];

  let currentStart = 1;
  sortedPits.forEach((pitLap, idx) => {
    const compound = compounds[idx % compounds.length];
    stints.push({
      stint: idx + 1,
      startLap: currentStart,
      endLap: pitLap,
      length: pitLap - currentStart + 1,
      compound,
      pitLap,
      stationaryTime: (2.3 + (idx * 0.15) % 0.4).toFixed(2),
      totalLoss: '22.5s',
    });
    currentStart = pitLap + 1;
  });

  // Final stint
  if (currentStart <= totalLaps) {
    const finalCompound = compounds[stints.length % compounds.length];
    stints.push({
      stint: stints.length + 1,
      startLap: currentStart,
      endLap: totalLaps,
      length: totalLaps - currentStart + 1,
      compound: finalCompound,
      pitLap: null,
      stationaryTime: null,
      totalLoss: null,
    });
  }

  return {
    totalStops: sortedPits.length,
    pitLaps: sortedPits,
    stints,
    avgPitLoss: '22.5s',
    fastestStop: sortedPits.length > 0 ? '2.32s (Crew Alpha)' : 'N/A',
  };
}
