/**
 * F1 2026 Team Liveries & Driver Profiles
 * Authoritative mapping for the 11-team 2026 Grid
 */

export const TEAM_LIVERIES = {
  red_bull: {
    id: 'red_bull',
    constructorId_num: 2,
    name: 'Red Bull Racing',
    shortName: 'Red Bull',
    chassis: 'RB22',
    season: 2026,
    hasModel: true,
    carModel: '/redbull_rb19_oracle__www.vecarz.com.glb',
    primary: '#14192b',
    secondary: '#ff1844',
    accent: '#ffce00',
    wingColor: '#0b0e18',
    numberColor: '#ffffff',
    wheelRimColor: '#1a1a2e',
    drivers: {
      1: { number: 1, code: 'VER', name: 'Max Verstappen', helmet: '#ff1844', helmetVisor: '#ffd700' },
      6: { number: 6, code: 'HAD', name: 'Isack Hadjar', helmet: '#14192b', helmetVisor: '#ffffff' }
    },
    baseGraphics: [
      { type: 'gradient', x1: 0, y1: 0, x2: 500, y2: 0, stops: [[0, '#ffce00'], [1, '#14192b']], x: 0, y: 0, w: 500, h: 500 },
      { type: 'rect', x: 0, y: 950, w: 2048, h: 15, color: '#ff1844' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#060a18', text: 'BYBIT', textColor: '#ffffff', rx: 12 },
      { type: 'text', text: 'HONDA · RED BULL RACING', x: 1024, y: 280, font: '900 44px "Orbitron", sans-serif', color: '#ff1844' },
      { type: 'badge', x: 1024, y: 460, w: 220, h: 80, bgColor: '#ff1844', text: 'Red Bull', textColor: '#ffffff', rx: 10 },
      { type: 'text', text: 'TAG HEUER', x: 1024, y: 560, font: '900 42px "Orbitron", sans-serif', color: '#00b050' },
      { type: 'text', text: 'ORACLE', x: 480, y: 1220, font: '900 150px "Orbitron", sans-serif', color: '#ffffff', rot: -0.12, shadow: { color: '#ff1844', blur: 16 } },
      { type: 'text', text: 'Red Bull', x: 480, y: 1340, font: '900 80px "Arial Black", sans-serif', color: '#ff1844', rot: -0.12 },
      { type: 'text', text: 'Mobil 1', x: 480, y: 1430, font: '900 56px "Rajdhani", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'ORACLE', x: 1568, y: 1220, font: '900 150px "Orbitron", sans-serif', color: '#ffffff', rot: 0.12, shadow: { color: '#ff1844', blur: 16 } },
      { type: 'text', text: 'Red Bull', x: 1568, y: 1340, font: '900 80px "Arial Black", sans-serif', color: '#ff1844', rot: 0.12 },
      { type: 'text', text: 'Mobil 1', x: 1568, y: 1430, font: '900 56px "Rajdhani", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 180, h: 50, bgColor: '#ff1844', text: 'HRC', textColor: '#ffffff', rx: 6 },
      { type: 'badge', x: 1348, y: 880, w: 180, h: 50, bgColor: '#ff1844', text: 'HRC', textColor: '#ffffff', rx: 6 }
    ]
  },
  mercedes: {
    id: 'mercedes',
    constructorId_num: 1,
    name: 'Mercedes-AMG Petronas',
    shortName: 'Mercedes',
    chassis: 'W17',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#0c0d10',
    secondary: '#00d2be',
    accent: '#c0c0c0',
    wingColor: '#0b0c0e',
    numberColor: '#00d2be',
    wheelRimColor: '#1a2a2a',
    drivers: {
      63: { number: 63, code: 'RUS', name: 'George Russell', helmet: '#00b0ff', helmetVisor: '#ff0033' },
      12: { number: 12, code: 'ANT', name: 'Kimi Antonelli', helmet: '#00d2be', helmetVisor: '#111111' }
    },
    baseGraphics: [
      { type: 'rect', x: 0, y: 850, w: 2048, h: 18, color: '#00d2be' },
      { type: 'rect', x: 0, y: 875, w: 2048, h: 8, color: '#00d2be' },
      { type: 'gradient', x1: 0, y1: 0, x2: 0, y2: 400, stops: [[0, 'rgba(192,192,192,0.15)'], [1, 'rgba(0,0,0,0)']], x: 0, y: 0, w: 2048, h: 400 },
      { type: 'text', text: 'MERCEDES-AMG', x: 1024, y: 350, font: '900 50px "Orbitron", sans-serif', color: '#c0c0c0', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#00d2be', text: 'PETRONAS', textColor: '#0c0d10', rx: 12 },
      { type: 'text', text: 'INEOS', x: 1024, y: 280, font: '900 48px "Arial", sans-serif', color: '#990022' },
      { type: 'text', text: 'PETRONAS', x: 1024, y: 460, font: '900 50px "Orbitron", sans-serif', color: '#00d2be' },
      { type: 'badge', x: 1024, y: 550, w: 240, h: 60, bgColor: '#990022', text: 'INEOS', textColor: '#ffffff', rx: 8 },
      { type: 'text', text: 'PETRONAS', x: 480, y: 1210, font: '900 150px "Orbitron", sans-serif', color: '#00d2be', rot: -0.12 },
      { type: 'text', text: 'TeamViewer', x: 480, y: 1330, font: '800 70px "Rajdhani", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'INEOS', x: 480, y: 1420, font: '900 60px "Arial", sans-serif', color: '#990022', rot: -0.12 },
      { type: 'text', text: 'PETRONAS', x: 1568, y: 1210, font: '900 150px "Orbitron", sans-serif', color: '#00d2be', rot: 0.12 },
      { type: 'text', text: 'TeamViewer', x: 1568, y: 1330, font: '800 70px "Rajdhani", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'INEOS', x: 1568, y: 1420, font: '900 60px "Arial", sans-serif', color: '#990022', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 180, h: 50, bgColor: '#990022', text: 'INEOS', textColor: '#ffffff', rx: 6 },
      { type: 'badge', x: 1348, y: 880, w: 180, h: 50, bgColor: '#990022', text: 'INEOS', textColor: '#ffffff', rx: 6 }
    ]
  },
  ferrari: {
    id: 'ferrari',
    constructorId_num: 3,
    name: 'Scuderia Ferrari',
    shortName: 'Ferrari',
    chassis: 'SF-26',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#d40022',
    secondary: '#fff500',
    accent: '#ffffff',
    wingColor: '#121212',
    numberColor: '#ffffff',
    wheelRimColor: '#2a0008',
    drivers: {
      16: { number: 16, code: 'LEC', name: 'Charles Leclerc', helmet: '#d40022', helmetVisor: '#ffffff' },
      44: { number: 44, code: 'HAM', name: 'Lewis Hamilton', helmet: '#eaff00', helmetVisor: '#9900ee' }
    },
    baseGraphics: [
      { type: 'rect', x: 0, y: 900, w: 2048, h: 12, color: '#fff500' },
      { type: 'rect', x: 0, y: 920, w: 2048, h: 6, color: '#fff500' },
      { type: 'gradient', x1: 0, y1: 0, x2: 600, y2: 0, stops: [[0, '#1a0000'], [1, '#d40022']], x: 0, y: 0, w: 600, h: 500 },
      { type: 'gradient', x1: 0, y1: 1600, x2: 0, y2: 2048, stops: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']], x: 0, y: 1600, w: 2048, h: 448 },
      { type: 'custom', name: 'hp', x: 1024, y: 780, size: 70 },
      { type: 'text', text: 'SHELL', x: 1024, y: 500, font: '900 80px "Rajdhani", sans-serif', color: '#ffd700', align: 'center' },
      { type: 'text', text: 'Scuderia Ferrari', x: 1024, y: 350, font: '900 60px "Orbitron", sans-serif', color: '#ffffff', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#d40022', text: 'Santander', textColor: '#ffffff', rx: 12 },
      { type: 'text', text: 'FERRARI', x: 1024, y: 280, font: '900 48px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'badge', x: 1024, y: 460, w: 220, h: 60, bgColor: '#ffd700', text: 'SHELL', textColor: '#d40022', rx: 8 },
      { type: 'custom', name: 'hp', x: 1024, y: 560, size: 45 },
      { type: 'custom', name: 'hp', x: 480, y: 1220, size: 90 },
      { type: 'text', text: 'V-Power', x: 480, y: 1340, font: '900 70px "Rajdhani", sans-serif', color: '#ffd700', rot: -0.12 },
      { type: 'text', text: 'CEVA', x: 480, y: 1430, font: '900 64px "Orbitron", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'custom', name: 'hp', x: 1568, y: 1220, size: 90 },
      { type: 'text', text: 'V-Power', x: 1568, y: 1340, font: '900 70px "Rajdhani", sans-serif', color: '#ffd700', rot: 0.12 },
      { type: 'text', text: 'CEVA', x: 1568, y: 1430, font: '900 64px "Orbitron", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'custom', name: 'hp', x: 700, y: 880, size: 35 },
      { type: 'custom', name: 'hp', x: 1348, y: 880, size: 35 }
    ]
  },
  mclaren: {
    id: 'mclaren',
    constructorId_num: 4,
    name: 'McLaren F1 Team',
    shortName: 'McLaren',
    chassis: 'MCL40',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#ff8000',
    secondary: '#47c7fc',
    accent: '#111317',
    wingColor: '#111317',
    numberColor: '#111317',
    wheelRimColor: '#1a0d00',
    drivers: {
      4: { number: 4, code: 'NOR', name: 'Lando Norris', helmet: '#e2ff00', helmetVisor: '#111111' },
      81: { number: 81, code: 'PIA', name: 'Oscar Piastri', helmet: '#ffdf00', helmetVisor: '#0055ff' }
    },
    baseGraphics: [
      { type: 'gradient', x1: 0, y1: 1400, x2: 0, y2: 2048, stops: [[0, 'rgba(17,19,23,0)'], [0.3, '#111317'], [1, '#111317']], x: 0, y: 1400, w: 2048, h: 648 },
      { type: 'rect', x: 0, y: 860, w: 2048, h: 14, color: '#47c7fc' },
      { type: 'rect', x: 0, y: 880, w: 2048, h: 6, color: '#47c7fc' },
      { type: 'text', text: 'Google Chrome', x: 1024, y: 500, font: '900 80px "Rajdhani", sans-serif', color: '#ffffff', align: 'center' },
      { type: 'text', text: 'McLAREN', x: 1024, y: 350, font: '900 55px "Orbitron", sans-serif', color: '#111317', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#111317', text: 'OKX', textColor: '#ff8000', rx: 12 },
      { type: 'text', text: 'McLAREN', x: 1024, y: 280, font: '900 48px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'custom', name: 'chrome', x: 1024, y: 460, size: 40 },
      { type: 'text', text: 'VELO', x: 1024, y: 560, font: '900 52px "Arial", sans-serif', color: '#00f0ff' },
      { type: 'text', text: 'OKX', x: 480, y: 1210, font: '900 160px "Rajdhani", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'Google Chrome', x: 480, y: 1330, font: '800 60px "Rajdhani", sans-serif', color: '#111317', rot: -0.12 },
      { type: 'text', text: 'VELO', x: 480, y: 1420, font: '900 56px "Arial", sans-serif', color: '#00f0ff', rot: -0.12 },
      { type: 'text', text: 'OKX', x: 1568, y: 1210, font: '900 160px "Rajdhani", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'Google Chrome', x: 1568, y: 1330, font: '800 60px "Rajdhani", sans-serif', color: '#111317', rot: 0.12 },
      { type: 'text', text: 'VELO', x: 1568, y: 1420, font: '900 56px "Arial", sans-serif', color: '#00f0ff', rot: 0.12 },
      { type: 'custom', name: 'chrome', x: 700, y: 880, size: 30 },
      { type: 'custom', name: 'chrome', x: 1348, y: 880, size: 30 }
    ]
  },
  aston_martin: {
    id: 'aston_martin',
    constructorId_num: 5,
    name: 'Aston Martin Aramco',
    shortName: 'Aston Martin',
    chassis: 'AMR26',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#00594f',
    secondary: '#cedc00',
    accent: '#00332c',
    wingColor: '#111413',
    numberColor: '#cedc00',
    wheelRimColor: '#002820',
    drivers: {
      14: { number: 14, code: 'ALO', name: 'Fernando Alonso', helmet: '#0066ff', helmetVisor: '#ffd700' },
      18: { number: 18, code: 'STR', name: 'Lance Stroll', helmet: '#00594f', helmetVisor: '#ffffff' }
    },
    baseGraphics: [
      { type: 'rect', x: 0, y: 1500, w: 2048, h: 20, color: '#cedc00' },
      { type: 'text', text: 'ASTON MARTIN', x: 1024, y: 350, font: '900 50px "Orbitron", sans-serif', color: '#ffffff', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#00594f', text: 'aramco', textColor: '#cedc00', rx: 12 },
      { type: 'text', text: 'VALVOLINE', x: 1024, y: 280, font: '900 44px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'HONDA', x: 1024, y: 460, font: '900 48px "Rajdhani", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'aramco', x: 1024, y: 550, font: '900 56px "Rajdhani", sans-serif', color: '#cedc00' },
      { type: 'text', text: 'aramco', x: 480, y: 1210, font: '900 160px "Rajdhani", sans-serif', color: '#cedc00', rot: -0.12 },
      { type: 'text', text: 'HONDA', x: 480, y: 1330, font: '900 70px "Arial Black", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'BOMBARDIER', x: 480, y: 1420, font: '800 44px "Orbitron", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'aramco', x: 1568, y: 1210, font: '900 160px "Rajdhani", sans-serif', color: '#cedc00', rot: 0.12 },
      { type: 'text', text: 'HONDA', x: 1568, y: 1330, font: '900 70px "Arial Black", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'BOMBARDIER', x: 1568, y: 1420, font: '800 44px "Orbitron", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 180, h: 50, bgColor: '#ffffff', text: 'VALVOLINE', textColor: '#e8002d', rx: 6 },
      { type: 'badge', x: 1348, y: 880, w: 180, h: 50, bgColor: '#ffffff', text: 'VALVOLINE', textColor: '#e8002d', rx: 6 }
    ]
  },
  alpine: {
    id: 'alpine',
    constructorId_num: 6,
    name: 'Alpine F1 Team',
    shortName: 'Alpine',
    chassis: 'A526',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#0078d0',
    secondary: '#ff69b4',
    accent: '#111111',
    wingColor: '#0a0a0a',
    numberColor: '#ffffff',
    wheelRimColor: '#001a40',
    drivers: {
      10: { number: 10, code: 'GAS', name: 'Pierre Gasly', helmet: '#ffffff', helmetVisor: '#ff69b4' },
      43: { number: 43, code: 'COL', name: 'Franco Colapinto', helmet: '#0055ff', helmetVisor: '#ffffff' }
    },
    baseGraphics: [
      { type: 'gradient', x1: 0, y1: 1200, x2: 0, y2: 2048, stops: [[0, 'rgba(0,0,0,0)'], [1, '#ff69b4']], x: 0, y: 1200, w: 2048, h: 848 },
      { type: 'text', text: 'ALPINE', x: 1024, y: 350, font: '900 60px "Orbitron", sans-serif', color: '#ffffff', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#ff69b4', text: 'BWT', textColor: '#ffffff', rx: 12 },
      { type: 'text', text: 'ALPINE', x: 1024, y: 280, font: '900 48px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'BWT', x: 1024, y: 460, font: '900 52px "Arial", sans-serif', color: '#ff69b4' },
      { type: 'text', text: 'ALPINE', x: 1024, y: 550, font: '900 52px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'BWT', x: 480, y: 1210, font: '900 160px "Arial", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'Castrol', x: 480, y: 1330, font: '900 70px "Rajdhani", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'MERCEDES-AMG', x: 480, y: 1420, font: '900 42px "Rajdhani", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'BWT', x: 1568, y: 1210, font: '900 160px "Arial", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'Castrol', x: 1568, y: 1330, font: '900 70px "Rajdhani", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'MERCEDES-AMG', x: 1568, y: 1420, font: '900 42px "Rajdhani", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 180, h: 50, bgColor: '#ff69b4', text: 'BWT', textColor: '#ffffff', rx: 6 },
      { type: 'badge', x: 1348, y: 880, w: 180, h: 50, bgColor: '#ff69b4', text: 'BWT', textColor: '#ffffff', rx: 6 }
    ]
  },
  williams: {
    id: 'williams',
    constructorId_num: 7,
    name: 'Williams Racing',
    shortName: 'Williams',
    chassis: 'FW48',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#041e42',
    secondary: '#00a3e0',
    accent: '#ffffff',
    wingColor: '#020b18',
    numberColor: '#ffffff',
    wheelRimColor: '#020f22',
    drivers: {
      55: { number: 55, code: 'SAI', name: 'Carlos Sainz', helmet: '#fff500', helmetVisor: '#d40022' },
      23: { number: 23, code: 'ALB', name: 'Alex Albon', helmet: '#ff1493', helmetVisor: '#041e42' }
    },
    baseGraphics: [
      { type: 'rect', x: 0, y: 1000, w: 2048, h: 20, color: '#00a3e0' },
      { type: 'text', text: 'WILLIAMS', x: 1024, y: 350, font: '900 55px "Orbitron", sans-serif', color: '#00a3e0', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#041e42', text: 'KOMATSU', textColor: '#ffffff', rx: 12 },
      { type: 'text', text: 'WILLIAMS RACING', x: 1024, y: 280, font: '900 44px "Orbitron", sans-serif', color: '#00a0de' },
      { type: 'text', text: 'W WILLIAMS', x: 1024, y: 460, font: '900 50px "Orbitron", sans-serif', color: '#00a0de' },
      { type: 'badge', x: 1024, y: 550, w: 240, h: 60, bgColor: '#bf6c30', text: 'DURACELL', textColor: '#ffffff', rx: 8 },
      { type: 'text', text: 'KOMATSU', x: 480, y: 1220, font: '900 130px "Orbitron", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'badge', x: 480, y: 1340, w: 360, h: 60, bgColor: '#bf6c30', text: 'DURACELL', textColor: '#ffffff', rx: 10, rot: -0.12 },
      { type: 'text', text: 'kraken', x: 480, y: 1430, font: '900 54px "Rajdhani", sans-serif', color: '#5741d9', rot: -0.12 },
      { type: 'text', text: 'KOMATSU', x: 1568, y: 1220, font: '900 130px "Orbitron", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'badge', x: 1568, y: 1340, w: 360, h: 60, bgColor: '#bf6c30', text: 'DURACELL', textColor: '#ffffff', rx: 10, rot: 0.12 },
      { type: 'text', text: 'kraken', x: 1568, y: 1430, font: '900 54px "Rajdhani", sans-serif', color: '#5741d9', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 160, h: 60, bgColor: '#ff6600', text: 'Gulf', textColor: '#041e42', rx: 8 },
      { type: 'badge', x: 1348, y: 880, w: 160, h: 60, bgColor: '#ff6600', text: 'Gulf', textColor: '#041e42', rx: 8 }
    ]
  },
  rb: {
    id: 'rb',
    constructorId_num: 8,
    name: 'Racing Bulls',
    shortName: 'RB',
    chassis: 'VCARB 03',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#1634cb',
    secondary: '#ffffff',
    accent: '#ff1844',
    wingColor: '#0a1033',
    numberColor: '#ffffff',
    wheelRimColor: '#0a1060',
    drivers: {
      30: { number: 30, code: 'LAW', name: 'Liam Lawson', helmet: '#0055ff', helmetVisor: '#ffffff' },
      34: { number: 34, code: 'LIN', name: 'Arvid Lindblad', helmet: '#ff0033', helmetVisor: '#ffffff' }
    },
    baseGraphics: [
      { type: 'gradient', x1: 0, y1: 1400, x2: 0, y2: 2048, stops: [[0, 'rgba(0,0,0,0)'], [1, '#ffffff']], x: 0, y: 1400, w: 2048, h: 648 },
      { type: 'text', text: 'RACING BULLS', x: 1024, y: 350, font: '900 50px "Orbitron", sans-serif', color: '#ffffff', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#1238d6', text: 'VISA', textColor: '#ffffff', rx: 12 },
      { type: 'text', text: 'CASH APP · RB F1 TEAM', x: 1024, y: 280, font: '900 42px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'VISA', x: 1024, y: 460, font: '900 60px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'badge', x: 1024, y: 550, w: 240, h: 60, bgColor: '#00d632', text: 'Cash App', textColor: '#ffffff', rx: 8 },
      { type: 'text', text: 'VISA', x: 480, y: 1210, font: '900 160px "Orbitron", sans-serif', color: '#ffffff', rot: -0.12, shadow: { color: '#ffffff', blur: 16 } },
      { type: 'text', text: 'Cash App', x: 480, y: 1330, font: '900 70px "Rajdhani", sans-serif', color: '#00d632', rot: -0.12 },
      { type: 'text', text: 'HUGO BOSS', x: 480, y: 1420, font: '900 52px "Orbitron", sans-serif', color: '#1634cb', rot: -0.12 },
      { type: 'text', text: 'VISA', x: 1568, y: 1210, font: '900 160px "Orbitron", sans-serif', color: '#ffffff', rot: 0.12, shadow: { color: '#ffffff', blur: 16 } },
      { type: 'text', text: 'Cash App', x: 1568, y: 1330, font: '900 70px "Rajdhani", sans-serif', color: '#00d632', rot: 0.12 },
      { type: 'text', text: 'HUGO BOSS', x: 1568, y: 1420, font: '900 52px "Orbitron", sans-serif', color: '#1634cb', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 200, h: 55, bgColor: '#e8002d', text: 'HRC', textColor: '#ffffff', rx: 8 },
      { type: 'badge', x: 1348, y: 880, w: 200, h: 55, bgColor: '#e8002d', text: 'HRC', textColor: '#ffffff', rx: 8 }
    ]
  },
  audi: {
    id: 'audi',
    constructorId_num: 9,
    name: 'Audi F1 Team',
    shortName: 'Audi',
    chassis: 'R26',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#1a1a1a',
    secondary: '#ff0000',
    accent: '#ffffff',
    wingColor: '#000000',
    numberColor: '#ffffff',
    wheelRimColor: '#111111',
    drivers: {
      27: { number: 27, code: 'HUL', name: 'Nico Hülkenberg', helmet: '#ff0000', helmetVisor: '#ffffff' },
      5: { number: 5, code: 'BOR', name: 'Gabriel Bortoleto', helmet: '#00ff00', helmetVisor: '#000000' }
    },
    baseGraphics: [
      { type: 'rect', x: 0, y: 1300, w: 2048, h: 40, color: '#ff0000' },
      { type: 'gradient', x1: 0, y1: 0, x2: 400, y2: 0, stops: [[0, '#ff0000'], [1, '#1a1a1a']], x: 0, y: 0, w: 400, h: 400 },
      { type: 'text', text: 'AUDI SPORT', x: 1024, y: 350, font: '900 50px "Orbitron", sans-serif', color: '#ff0000', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#ff0000', text: 'AUDI SPORT', textColor: '#ffffff', rx: 12 },
      { type: 'text', text: 'BP', x: 1024, y: 280, font: '900 44px "Orbitron", sans-serif', color: '#009900' },
      { type: 'text', text: '0000', x: 1024, y: 460, font: '900 70px "Arial", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'Castrol', x: 1024, y: 550, font: '900 52px "Rajdhani", sans-serif', color: '#ffffff' },
      { type: 'text', text: '0000', x: 480, y: 1220, font: '900 150px "Arial", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'BP', x: 480, y: 1350, font: '900 80px "Orbitron", sans-serif', color: '#009900', rot: -0.12 },
      { type: 'text', text: 'Castrol', x: 480, y: 1430, font: '800 46px "Rajdhani", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: '0000', x: 1568, y: 1220, font: '900 150px "Arial", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'BP', x: 1568, y: 1350, font: '900 80px "Orbitron", sans-serif', color: '#009900', rot: 0.12 },
      { type: 'text', text: 'Castrol', x: 1568, y: 1430, font: '800 46px "Rajdhani", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 180, h: 50, bgColor: '#ff0000', text: 'AUDI', textColor: '#ffffff', rx: 6 },
      { type: 'badge', x: 1348, y: 880, w: 180, h: 50, bgColor: '#ff0000', text: 'AUDI', textColor: '#ffffff', rx: 6 }
    ]
  },
  haas: {
    id: 'haas',
    constructorId_num: 10,
    name: 'Haas F1 Team',
    shortName: 'Haas',
    chassis: 'VF-26',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#181920',
    secondary: '#e8002d',
    accent: '#f0f0f2',
    wingColor: '#181920',
    numberColor: '#ffffff',
    wheelRimColor: '#101015',
    drivers: {
      31: { number: 31, code: 'OCO', name: 'Esteban Ocon', helmet: '#e8002d', helmetVisor: '#ffffff' },
      87: { number: 87, code: 'BEA', name: 'Oliver Bearman', helmet: '#ffd700', helmetVisor: '#111111' }
    },
    baseGraphics: [
      { type: 'gradient', x1: 0, y1: 1500, x2: 0, y2: 2048, stops: [[0, 'rgba(0,0,0,0)'], [1, '#e8002d']], x: 0, y: 1500, w: 2048, h: 548 },
      { type: 'text', text: 'HAAS F1 TEAM', x: 1024, y: 350, font: '900 50px "Orbitron", sans-serif', color: '#ffffff', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#e8002d', text: 'TOYOTA GAZOO RACING', textColor: '#ffffff', rx: 12 },
      { type: 'text', text: 'HAAS F1 TEAM', x: 1024, y: 280, font: '900 44px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'badge', x: 1024, y: 460, w: 140, h: 140, bgColor: '#e8002d', text: 'H', textColor: '#ffffff', rx: 14 },
      { type: 'text', text: 'TOYOTA', x: 1024, y: 570, font: '900 46px "Rajdhani", sans-serif', color: '#e8002d' },
      { type: 'text', text: 'MoneyGram', x: 480, y: 1220, font: '900 120px "Rajdhani", sans-serif', color: '#e8002d', rot: -0.12, shadow: { color: '#e8002d', blur: 16 } },
      { type: 'text', text: 'HAAS', x: 480, y: 1340, font: '900 90px "Orbitron", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'TOYOTA', x: 480, y: 1430, font: '800 52px "Arial Black", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'MoneyGram', x: 1568, y: 1220, font: '900 120px "Rajdhani", sans-serif', color: '#e8002d', rot: 0.12, shadow: { color: '#e8002d', blur: 16 } },
      { type: 'text', text: 'HAAS', x: 1568, y: 1340, font: '900 90px "Orbitron", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'TOYOTA', x: 1568, y: 1430, font: '800 52px "Arial Black", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'Palm Angels', x: 700, y: 880, font: '900 44px "Georgia", serif', color: '#ffffff', rot: -0.15 },
      { type: 'text', text: 'Palm Angels', x: 1348, y: 880, font: '900 44px "Georgia", serif', color: '#ffffff', rot: 0.15 }
    ]
  },
  cadillac: {
    id: 'cadillac',
    constructorId_num: 11,
    name: 'Cadillac F1 Team',
    shortName: 'Cadillac',
    chassis: 'CD-01',
    season: 2026,
    hasModel: false,
    carModel: null,
    primary: '#000000',
    secondary: '#ffb81c',
    accent: '#c0c0c0',
    wingColor: '#000000',
    numberColor: '#ffb81c',
    wheelRimColor: '#1a1400',
    drivers: {
      11: { number: 11, code: 'PER', name: 'Sergio Perez', helmet: '#00b140', helmetVisor: '#ffffff' },
      77: { number: 77, code: 'BOT', name: 'Valtteri Bottas', helmet: '#00ffff', helmetVisor: '#000000' }
    },
    baseGraphics: [
      { type: 'rect', x: 0, y: 900, w: 2048, h: 20, color: '#ffb81c' },
      { type: 'text', text: 'CADILLAC RACING', x: 1024, y: 350, font: '900 50px "Orbitron", sans-serif', color: '#ffb81c', align: 'center' }
    ],
    sponsors: [
      { type: 'badge', x: 1024, y: 160, w: 1400, h: 180, bgColor: '#ffb81c', text: 'CADILLAC', textColor: '#000000', rx: 12 },
      { type: 'text', text: 'GM', x: 1024, y: 280, font: '900 44px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'GM', x: 1024, y: 460, font: '900 50px "Arial", sans-serif', color: '#ffb81c' },
      { type: 'text', text: 'CADILLAC', x: 1024, y: 550, font: '900 50px "Orbitron", sans-serif', color: '#ffffff' },
      { type: 'text', text: 'CADILLAC', x: 480, y: 1220, font: '900 130px "Orbitron", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'GM Financial', x: 480, y: 1340, font: '900 70px "Rajdhani", sans-serif', color: '#ffb81c', rot: -0.12 },
      { type: 'text', text: 'V-Series', x: 480, y: 1430, font: '900 54px "Rajdhani", sans-serif', color: '#ffffff', rot: -0.12 },
      { type: 'text', text: 'CADILLAC', x: 1568, y: 1220, font: '900 130px "Orbitron", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'text', text: 'GM Financial', x: 1568, y: 1340, font: '900 70px "Rajdhani", sans-serif', color: '#ffb81c', rot: 0.12 },
      { type: 'text', text: 'V-Series', x: 1568, y: 1430, font: '900 54px "Rajdhani", sans-serif', color: '#ffffff', rot: 0.12 },
      { type: 'badge', x: 700, y: 880, w: 160, h: 60, bgColor: '#000000', text: 'V-Series', textColor: '#ffb81c', rx: 8 },
      { type: 'badge', x: 1348, y: 880, w: 160, h: 60, bgColor: '#000000', text: 'V-Series', textColor: '#ffb81c', rx: 8 }
    ]
  }
};

/** Helper to get livery by constructorId or constructorId_num or driverId_num */
export function getLivery(teamIdentifier) {
  if (!teamIdentifier) return TEAM_LIVERIES.red_bull;
  
  if (TEAM_LIVERIES[teamIdentifier]) return TEAM_LIVERIES[teamIdentifier];

  for (const team of Object.values(TEAM_LIVERIES)) {
    if (team.constructorId_num === teamIdentifier) return team;
  }

  for (const team of Object.values(TEAM_LIVERIES)) {
    if (team.drivers[teamIdentifier]) return team;
  }

  return TEAM_LIVERIES.red_bull;
}

/** Helper to get driver profile by driverId_num */
export function getDriverProfile(driverId_num) {
  for (const team of Object.values(TEAM_LIVERIES)) {
    if (team.drivers[driverId_num]) {
      return {
        ...team.drivers[driverId_num],
        teamId: team.id,
        teamName: team.name,
        teamShort: team.shortName,
        constructorId_num: team.constructorId_num,
        livery: team,
      };
    }
  }
  return {
    number: 1,
    code: 'VER',
    name: 'Max Verstappen',
    helmet: '#ff1844',
    helmetVisor: '#ffd700',
    teamId: 'red_bull',
    teamName: 'Red Bull Racing',
    teamShort: 'Red Bull',
    constructorId_num: 2,
    livery: TEAM_LIVERIES.red_bull,
  };
}

/** Official 5-year chassis lineage mapping per team */
const CHASSIS_HISTORY = {
  red_bull: [
    { year: 2026, name: 'RB22', modelUrl: '/redbull_rb19_oracle__www.vecarz.com.glb', hasModel: true },
    { year: 2025, name: 'RB21', modelUrl: null, hasModel: false },
    { year: 2024, name: 'RB20', modelUrl: null, hasModel: false },
    { year: 2023, name: 'RB19', modelUrl: '/redbull_rb19_oracle__www.vecarz.com.glb', hasModel: true },
    { year: 2022, name: 'RB18', modelUrl: null, hasModel: false },
  ],
  ferrari: [
    { year: 2026, name: 'SF-26', modelUrl: null, hasModel: false },
    { year: 2025, name: 'SF-25', modelUrl: null, hasModel: false },
    { year: 2024, name: 'SF-24', modelUrl: null, hasModel: false },
    { year: 2023, name: 'SF-23', modelUrl: null, hasModel: false },
    { year: 2022, name: 'F1-75', modelUrl: null, hasModel: false },
  ],
  mercedes: [
    { year: 2026, name: 'W17', modelUrl: null, hasModel: false },
    { year: 2025, name: 'W16', modelUrl: null, hasModel: false },
    { year: 2024, name: 'W15', modelUrl: null, hasModel: false },
    { year: 2023, name: 'W14', modelUrl: null, hasModel: false },
    { year: 2022, name: 'W13', modelUrl: null, hasModel: false },
  ],
  mclaren: [
    { year: 2026, name: 'MCL40', modelUrl: null, hasModel: false },
    { year: 2025, name: 'MCL39', modelUrl: null, hasModel: false },
    { year: 2024, name: 'MCL38', modelUrl: null, hasModel: false },
    { year: 2023, name: 'MCL60', modelUrl: null, hasModel: false },
    { year: 2022, name: 'MCL36', modelUrl: null, hasModel: false },
  ],
  aston_martin: [
    { year: 2026, name: 'AMR26', modelUrl: null, hasModel: false },
    { year: 2025, name: 'AMR25', modelUrl: null, hasModel: false },
    { year: 2024, name: 'AMR24', modelUrl: null, hasModel: false },
    { year: 2023, name: 'AMR23', modelUrl: null, hasModel: false },
    { year: 2022, name: 'AMR22', modelUrl: null, hasModel: false },
  ],
  alpine: [
    { year: 2026, name: 'A526', modelUrl: null, hasModel: false },
    { year: 2025, name: 'A525', modelUrl: null, hasModel: false },
    { year: 2024, name: 'A524', modelUrl: null, hasModel: false },
    { year: 2023, name: 'A523', modelUrl: null, hasModel: false },
    { year: 2022, name: 'A522', modelUrl: null, hasModel: false },
  ],
  williams: [
    { year: 2026, name: 'FW48', modelUrl: null, hasModel: false },
    { year: 2025, name: 'FW47', modelUrl: null, hasModel: false },
    { year: 2024, name: 'FW46', modelUrl: null, hasModel: false },
    { year: 2023, name: 'FW45', modelUrl: null, hasModel: false },
    { year: 2022, name: 'FW44', modelUrl: null, hasModel: false },
  ],
  rb: [
    { year: 2026, name: 'VCARB 03', modelUrl: null, hasModel: false },
    { year: 2025, name: 'VCARB 02', modelUrl: null, hasModel: false },
    { year: 2024, name: 'VCARB 01', modelUrl: null, hasModel: false },
    { year: 2023, name: 'AT04', modelUrl: null, hasModel: false },
    { year: 2022, name: 'AT03', modelUrl: null, hasModel: false },
  ],
  audi: [
    { year: 2026, name: 'R26', modelUrl: null, hasModel: false },
    { year: 2025, name: 'C45', modelUrl: null, hasModel: false },
    { year: 2024, name: 'C44', modelUrl: null, hasModel: false },
    { year: 2023, name: 'C43', modelUrl: null, hasModel: false },
    { year: 2022, name: 'C42', modelUrl: null, hasModel: false },
  ],
  haas: [
    { year: 2026, name: 'VF-26', modelUrl: null, hasModel: false },
    { year: 2025, name: 'VF-25', modelUrl: null, hasModel: false },
    { year: 2024, name: 'VF-24', modelUrl: null, hasModel: false },
    { year: 2023, name: 'VF-23', modelUrl: null, hasModel: false },
    { year: 2022, name: 'VF-22', modelUrl: null, hasModel: false },
  ],
  cadillac: [
    { year: 2026, name: 'CD-01', modelUrl: null, hasModel: false },
    { year: 2025, name: 'CD-PRE', modelUrl: null, hasModel: false },
    { year: 2024, name: 'CD-EXP', modelUrl: null, hasModel: false },
    { year: 2023, name: 'CD-DEV', modelUrl: null, hasModel: false },
    { year: 2022, name: 'CD-CONCEPT', modelUrl: null, hasModel: false },
  ],
};

/** Helper to get the 5-year chassis lineage for a team */
export function getTeamCarModels(teamId) {
  if (CHASSIS_HISTORY[teamId]) {
    return CHASSIS_HISTORY[teamId];
  }
  const livery = TEAM_LIVERIES[teamId] || TEAM_LIVERIES['red_bull'];
  const shortCode = livery.shortName.toUpperCase().replace(/\s/g, '');
  return [
    { year: 2026, name: `${shortCode}26`, modelUrl: null, hasModel: false },
    { year: 2025, name: `${shortCode}25`, modelUrl: null, hasModel: false },
    { year: 2024, name: `${shortCode}24`, modelUrl: null, hasModel: false },
    { year: 2023, name: `${shortCode}23`, modelUrl: null, hasModel: false },
    { year: 2022, name: `${shortCode}22`, modelUrl: null, hasModel: false },
  ];
}
