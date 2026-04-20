export const DRIVERS = [
  { id: 1, name: 'Lewis Hamilton', code: 'HAM', team: 'Mercedes', number: 44, nationality: '🇬🇧', color: '#00D2BE' },
  { id: 2, name: 'Max Verstappen', code: 'VER', team: 'Red Bull', number: 1, nationality: '🇳🇱', color: '#1E41FF' },
  { id: 3, name: 'Charles Leclerc', code: 'LEC', team: 'Ferrari', number: 16, nationality: '🇲🇨', color: '#DC0000' },
  { id: 4, name: 'Carlos Sainz', code: 'SAI', team: 'Ferrari', number: 55, nationality: '🇪🇸', color: '#DC0000' },
  { id: 5, name: 'Lando Norris', code: 'NOR', team: 'McLaren', number: 4, nationality: '🇬🇧', color: '#FF8000' },
  { id: 6, name: 'Esteban Ocon', code: 'OCO', team: 'Alpine', number: 31, nationality: '🇫🇷', color: '#0090FF' },
  { id: 7, name: 'Fernando Alonso', code: 'ALO', team: 'Aston Martin', number: 14, nationality: '🇪🇸', color: '#006F62' },
  { id: 8, name: 'Oscar Piastri', code: 'PIA', team: 'McLaren', number: 81, nationality: '🇦🇺', color: '#FF8000' },
  { id: 9, name: 'George Russell', code: 'RUS', team: 'Mercedes', number: 63, nationality: '🇬🇧', color: '#00D2BE' },
  { id: 10, name: 'Valtteri Bottas', code: 'BOT', team: 'Alfa Romeo', number: 77, nationality: '🇫🇮', color: '#900000' },
  { id: 11, name: 'Pierre Gasly', code: 'GAS', team: 'Alpine', number: 10, nationality: '🇫🇷', color: '#0090FF' },
  { id: 12, name: 'Yuki Tsunoda', code: 'TSU', team: 'AlphaTauri', number: 22, nationality: '🇯🇵', color: '#2B4562' },
  { id: 13, name: 'Lance Stroll', code: 'STR', team: 'Aston Martin', number: 18, nationality: '🇨🇦', color: '#006F62' },
  { id: 14, name: 'Nico Hülkenberg', code: 'HUL', team: 'Haas', number: 27, nationality: '🇩🇪', color: '#FFFFFF' },
  { id: 19, name: 'Sergio Pérez', code: 'PER', team: 'Red Bull', number: 11, nationality: '🇲🇽', color: '#1E41FF' },
];

export const CONSTRUCTORS = [
  { id: 1, name: 'Mercedes', color: '#00D2BE', logo: '⭐' },
  { id: 2, name: 'Red Bull', color: '#1E41FF', logo: '🐂' },
  { id: 3, name: 'Ferrari', color: '#DC0000', logo: '🐎' },
  { id: 4, name: 'McLaren', color: '#FF8000', logo: '🦁' },
  { id: 5, name: 'Aston Martin', color: '#006F62', logo: '🏹' },
  { id: 6, name: 'Alpine', color: '#0090FF', logo: '⛵' },
  { id: 7, name: 'Williams', color: '#005AFF', logo: '🔵' },
  { id: 8, name: 'AlphaTauri', color: '#2B4562', logo: '🐂' },
  { id: 9, name: 'Alfa Romeo', color: '#900000', logo: '🍀' },
  { id: 10, name: 'Haas', color: '#FFFFFF', logo: '⚪' },
];

export const CIRCUITS = [
  { id: 1, name: 'Circuit de Monaco', country: 'Monaco', flag: '🇲🇨', length: 3337, laps: 78, type: 'street' },
  { id: 2, name: 'Silverstone Circuit', country: 'Great Britain', flag: '🇬🇧', length: 5891, laps: 52, type: 'classic' },
  { id: 3, name: 'Monza Circuit', country: 'Italy', flag: '🇮🇹', length: 5793, laps: 53, type: 'classic' },
  { id: 4, name: 'Spa-Francorchamps', country: 'Belgium', flag: '🇧🇪', length: 7004, laps: 44, type: 'classic' },
  { id: 5, name: 'Circuit de Catalunya', country: 'Spain', flag: '🇪🇸', length: 4657, laps: 66, type: 'modern' },
  { id: 6, name: 'Suzuka Circuit', country: 'Japan', flag: '🇯🇵', length: 5807, laps: 53, type: 'classic' },
  { id: 7, name: 'Albert Park', country: 'Australia', flag: '🇦🇺', length: 5278, laps: 58, type: 'street' },
  { id: 8, name: 'Bahrain International', country: 'Bahrain', flag: '🇧🇭', length: 5412, laps: 57, type: 'modern' },
  { id: 9, name: 'Yas Marina Circuit', country: 'Abu Dhabi', flag: '🇦🇪', length: 5281, laps: 58, type: 'modern' },
  { id: 10, name: 'Circuit of the Americas', country: 'USA', flag: '🇺🇸', length: 5513, laps: 56, type: 'modern' },
];

// Track SVG paths for sky-view simulation (simplified bezier circuits)
export const TRACK_CONFIGS = {
  1: { // Monaco
    viewBox: '0 0 800 600',
    path: 'M 400 100 C 500 80, 620 120, 680 200 C 740 280, 720 380, 660 440 C 600 500, 500 520, 400 500 C 300 480, 200 440, 160 360 C 120 280, 140 180, 200 140 C 260 100, 320 110, 400 100 Z',
    pitLane: 'M 390 100 L 390 80 L 410 80 L 410 100',
    trackWidth: 20,
    color: '#2a2a3a',
    features: ['Hairpin', 'Tunnel', 'Swimming Pool'],
    baseTime: 74,
    laps: 78,
  },
  2: { // Silverstone
    viewBox: '0 0 800 600',
    path: 'M 150 200 C 200 120, 350 100, 480 130 C 610 160, 700 200, 730 300 C 760 400, 700 500, 580 530 C 460 560, 300 540, 200 490 C 100 440, 80 340, 100 280 C 110 240, 130 220, 150 200 Z',
    trackWidth: 22,
    color: '#1e2030',
    features: ['Copse', 'Maggots', 'Becketts', 'Chapel'],
    baseTime: 90,
    laps: 52,
  },
  3: { // Monza
    viewBox: '0 0 800 600',
    path: 'M 200 150 L 600 150 C 680 150, 700 200, 700 300 L 700 400 C 700 480, 640 520, 560 520 L 240 520 C 160 520, 140 460, 140 380 L 140 280 C 140 200, 170 150, 200 150 Z',
    trackWidth: 24,
    color: '#1a2040',
    features: ['Variante del Rettifilo', 'Lesmo 1', 'Lesmo 2', 'Parabolica'],
    baseTime: 82,
    laps: 53,
  },
  4: { // Spa
    viewBox: '0 0 800 600',
    path: 'M 120 300 C 120 180, 200 100, 320 100 C 420 100, 480 140, 540 180 C 600 220, 660 200, 700 260 C 740 320, 720 420, 660 460 C 600 500, 500 520, 390 510 C 280 500, 200 460, 160 400 C 130 360, 120 340, 120 300 Z',
    trackWidth: 22,
    color: '#1a2830',
    features: ['Eau Rouge', 'Raidillon', 'Pouhon', 'Bus Stop'],
    baseTime: 107,
    laps: 44,
  },
  5: { // Catalunya
    viewBox: '0 0 800 600',
    path: 'M 160 250 C 160 160, 240 100, 380 100 C 520 100, 640 160, 680 260 C 720 360, 680 460, 580 490 C 480 520, 340 510, 260 470 C 180 430, 160 350, 160 250 Z',
    trackWidth: 20,
    color: '#1e1e2a',
    features: ['Turn 1', 'Elf', 'Renault', 'Campsa'],
    baseTime: 81,
    laps: 66,
  },
  6: { // Suzuka
    viewBox: '0 0 800 600',
    path: 'M 300 100 C 450 80, 600 140, 680 260 C 720 320, 720 400, 680 460 C 640 520, 560 540, 460 540 L 340 540 C 240 540, 160 500, 140 420 C 120 340, 160 260, 220 210 C 260 170, 280 130, 300 100 Z',
    trackWidth: 20,
    color: '#1a1e38',
    features: ['130R', 'Spoon', 'S-Curves', 'Degner'],
    baseTime: 91,
    laps: 53,
  },
  7: { // Albert Park
    viewBox: '0 0 800 600',
    path: 'M 200 180 C 250 120, 400 100, 530 140 C 660 180, 720 280, 700 380 C 680 480, 580 540, 440 540 C 300 540, 180 480, 160 380 C 140 300, 160 220, 200 180 Z',
    trackWidth: 20,
    color: '#202830',
    features: ['Turn 1', 'Turn 6', 'Turn 9', 'Turn 13'],
    baseTime: 83,
    laps: 58,
  },
  8: { // Bahrain
    viewBox: '0 0 800 600',
    path: 'M 160 280 C 160 160, 270 90, 420 90 C 570 90, 680 180, 680 310 C 680 420, 600 500, 480 520 C 360 540, 240 500, 190 420 C 165 370, 160 330, 160 280 Z',
    trackWidth: 22,
    color: '#28201a',
    features: ['Turn 1', 'Turn 4', 'Turn 10', 'Turn 14'],
    baseTime: 91,
    laps: 57,
  },
  9: { // Yas Marina
    viewBox: '0 0 800 600',
    path: 'M 150 300 C 150 180, 250 100, 400 100 C 550 100, 660 180, 680 300 C 700 420, 620 520, 490 530 C 370 540, 260 490, 200 420 C 165 375, 150 345, 150 300 Z',
    trackWidth: 22,
    color: '#10202e',
    features: ['Turn 1', 'Turn 8', 'Turn 11', 'Turn 17'],
    baseTime: 88,
    laps: 58,
  },
  10: { // COTA
    viewBox: '0 0 800 600',
    path: 'M 180 200 C 200 120, 320 80, 450 100 C 580 120, 680 200, 700 320 C 720 440, 640 540, 500 540 C 360 540, 220 480, 180 380 C 150 310, 160 250, 180 200 Z',
    trackWidth: 22,
    color: '#1a201a',
    features: ['Turn 1', 'Esses', 'Turn 12', 'Turn 20'],
    baseTime: 97,
    laps: 56,
  },
};

export const formatLapTime = (seconds) => {
  if (!seconds) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${String(secs).padStart(6, '0')}`;
};

// Simulate lap time locally (fallback if backend is down)
export const simulateLapTimeLocal = (driverId, constructorId, circuitId, lap, grid, weather = 'dry', tireCompound = 'medium') => {
  const circuit = CIRCUITS.find(c => c.id === circuitId) || CIRCUITS[0];
  const baseTime = (TRACK_CONFIGS[circuitId]?.baseTime || 85);

  // Driver skill factors
  const driverFactors = { 1: 0.97, 2: 0.96, 3: 0.98, 4: 0.99, 5: 0.985, 7: 0.99, 9: 0.985, 19: 0.995 };
  const driverFactor = driverFactors[driverId] || 1.0;

  // Constructor performance
  const constructorFactors = { 1: 0.98, 2: 0.97, 3: 0.99, 4: 0.995, 5: 1.01 };
  const constructorFactor = constructorFactors[constructorId] || 1.02;

  // Tire degradation
  const tireFactor = {
    soft: 1 + (lap - 1) * 0.003,
    medium: 1 + (lap - 1) * 0.002,
    hard: 1 + (lap - 1) * 0.0012,
    inter: 1.05 + (lap - 1) * 0.001,
    wet: 1.15 + (lap - 1) * 0.0008,
  }[tireCompound] || 1 + (lap - 1) * 0.002;

  // Weather impact
  const weatherFactor = { dry: 1.0, cloudy: 1.01, drizzle: 1.06, wet: 1.14, storm: 1.22 }[weather] || 1.0;

  // Grid position (slows down as position increases)
  const gridFactor = 1 + (grid - 1) * 0.0008;

  // Random lap variation ±0.2s
  const variation = (Math.random() - 0.5) * 0.4;

  const lapTime = baseTime * driverFactor * constructorFactor * tireFactor * weatherFactor * gridFactor + variation;
  return Math.max(60, lapTime);
};
