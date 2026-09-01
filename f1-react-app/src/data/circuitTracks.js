/**
 * Authentic F1 Circuit Coordinates & Topologies (2024 Calendar)
 * Coordinates plotted in 800x600 coordinate space, normalized and smoothed.
 */

export const CIRCUITS = {
  1: {
    id: 1,
    key: 'bahrain',
    name: 'Bahrain International Circuit',
    location: 'Sakhir, Bahrain',
    length_km: 5.412,
    turns: 15,
    drs_zones: 3,
    laps: 57,
    lap_record: '1:31.447 (Pedro de la Rosa, 2005)',
    // S/F straight -> T1 hairpin -> T2/3 -> T4 -> Esses T5-7 -> T8 hairpin -> T9/10 tricky left -> back straight -> T11 -> T13 -> T14/15
    pts: [
      [220, 480], // S/F line
      [420, 480], // Main Straight
      [580, 480], // T1 braking
      [640, 495], // T1 Hairpin
      [650, 460], // T2
      [630, 430], // T3
      [620, 320], // Straight to T4
      [640, 240], // T4 right-hander
      [580, 220], // T5
      [530, 240], // T6
      [480, 210], // T7 Esses
      [430, 230], // T8 Hairpin
      [360, 270], // Run to T9
      [310, 290], // T9
      [270, 310], // T10 downhill hairpin
      [240, 240], // Back straight run
      [260, 160], // T11
      [340, 140], // T12 sweeper
      [440, 140], // T13 right
      [450, 220], // Straight after T13
      [400, 340], // Run to final sector
      [340, 410], // T14 entry
      [280, 450], // T15 final corner
      [220, 480], // Back to S/F
    ]
  },

  2: {
    id: 2,
    key: 'jeddah',
    name: 'Jeddah Corniche Circuit',
    location: 'Jeddah, Saudi Arabia',
    length_km: 6.174,
    turns: 27,
    drs_zones: 3,
    laps: 50,
    lap_record: '1:30.734 (Lewis Hamilton, 2021)',
    // Ultra-long high speed coastal circuit with narrow sweepers and banked T13
    pts: [
      [140, 460], // S/F
      [200, 470], // T1/T2 chicane
      [240, 450],
      [300, 400], // T3-T4
      [360, 340], // T5-T8 sweepers
      [420, 280],
      [480, 210], // T9-T11
      [540, 150],
      [620, 100], // T12 run
      [680, 80],  // Banked T13 hairpin
      [710, 110],
      [680, 160],
      [610, 220], // High-speed return leg T14-T19
      [540, 270],
      [470, 320],
      [400, 360],
      [330, 410],
      [270, 440], // T22-T24
      [190, 430],
      [120, 390], // T27 final hairpin
      [100, 420],
      [140, 460], // Back to S/F
    ]
  },

  3: {
    id: 3,
    key: 'albert_park',
    name: 'Albert Park Circuit',
    location: 'Melbourne, Australia',
    length_km: 5.278,
    turns: 14,
    drs_zones: 4,
    laps: 58,
    lap_record: '1:19.813 (Charles Leclerc, 2024)',
    // Lakeside flowing loop with T1/2 chicane, T9/10 high speed lake sweeper
    pts: [
      [240, 500], // S/F
      [400, 500], // Pit straight
      [500, 490], // T1-T2 chicane
      [540, 440],
      [530, 360], // Run to T3
      [560, 310], // T3-T4
      [510, 280],
      [440, 270], // T5-T6
      [390, 250],
      [350, 210], // T7-T8
      [360, 150],
      [420, 110], // Lakeside sweeping flat-out run (T9-T10)
      [520, 100],
      [600, 120],
      [620, 180], // T11-T12 chicane
      [580, 240],
      [480, 380], // Infield run
      [410, 420], // T13
      [310, 450], // T14 final turn
      [240, 500], // Back to S/F
    ]
  },

  4: {
    id: 4,
    key: 'suzuka',
    name: 'Suzuka International Racing Course',
    location: 'Suzuka, Japan',
    length_km: 5.807,
    turns: 18,
    drs_zones: 1,
    laps: 53,
    lap_record: '1:30.983 (Lewis Hamilton, 2019)',
    // Famous figure-8 circuit with crossover bridge, Esses, Spoon curve, 130R
    pts: [
      [280, 490], // S/F line
      [440, 490], // First turn entry
      [540, 470], // T1-T2
      [580, 410],
      [530, 350], // S-Curves (Esses)
      [560, 300],
      [520, 260],
      [550, 210], // Dunlop curve
      [510, 170], // Degner 1
      [470, 170], // Degner 2
      [440, 220], // Under the bridge crossover!
      [360, 260],
      [300, 290], // Hairpin
      [260, 270],
      [290, 210], // 200R
      [340, 170],
      [330, 100], // Spoon Curve 1
      [260, 90],  // Spoon Curve 2
      [220, 130],
      [250, 200], // Back straight (Over the bridge crossover!)
      [410, 250],
      [450, 330], // 130R super-fast left
      [410, 420], // Casio Triangle chicane
      [330, 460], // Final corner
      [280, 490], // Back to S/F
    ]
  },

  5: {
    id: 5,
    key: 'shanghai',
    name: 'Shanghai International Circuit',
    location: 'Shanghai, China',
    length_km: 5.451,
    turns: 16,
    drs_zones: 2,
    laps: 56,
    lap_record: '1:32.238 (Michael Schumacher, 2004)',
    // "Shang" character layout: massive tightening snail turns 1-4, 1.2km back straight
    pts: [
      [220, 460], // S/F line
      [360, 460], // Main straight
      [480, 450], // T1 entry
      [560, 410], // Tightening Snail T1-T2
      [580, 340],
      [540, 300], // T3 inside loop
      [490, 330], // T4 exit
      [420, 380], // T5
      [360, 370], // T6 hairpin
      [380, 300], // T7-T8 high speed Esses
      [450, 260],
      [490, 210],
      [450, 160], // T9-T10
      [390, 170],
      [310, 200], // T11-T12 banking entry
      [260, 180], // T13 banking onto 1.2km straight
      [260, 90],  // Super long back straight
      [640, 90],  // Braking zone for T14
      [680, 130], // T14 hairpin
      [640, 200],
      [460, 360], // T16 final corner onto main straight
      [220, 460], // Back to S/F
    ]
  },

  6: {
    id: 6,
    key: 'miami',
    name: 'Miami International Autodrome',
    location: 'Miami, USA',
    length_km: 5.412,
    turns: 19,
    drs_zones: 3,
    laps: 57,
    lap_record: '1:29.708 (Max Verstappen, 2023)',
    // Hard Rock Stadium loop, marina chicane, tight under-the-turnpike chicane
    pts: [
      [220, 470], // S/F
      [400, 470], // Main straight
      [510, 460], // T1
      [560, 410], // T2-T3
      [540, 350],
      [580, 290], // T4-T6 sweeping esses
      [630, 240],
      [660, 170], // T7-T8 hairpin
      [610, 150],
      [530, 170], // T9-T10
      [430, 180], // T11 tight hairpin
      [370, 200],
      [330, 240], // T12-T13 marina section
      [260, 230], // T14-T15 tight chicane under bridge
      [210, 220],
      [160, 230], // Long back straight
      [140, 100],
      [520, 100], // Braking zone T17
      [570, 130], // T17 hairpin
      [480, 300], // T18-T19 stadium section
      [340, 420],
      [220, 470], // Back to S/F
    ]
  },

  7: {
    id: 7,
    key: 'imola',
    name: 'Autodromo Enzo e Dino Ferrari (Imola)',
    location: 'Imola, Italy',
    length_km: 4.909,
    turns: 19,
    drs_zones: 2,
    laps: 63,
    lap_record: '1:15.484 (Lewis Hamilton, 2020)',
    // Tamburello, Villeneuve, Tosa hairpin, Piratella, Acque Minerali, Rivazza
    pts: [
      [180, 470], // S/F
      [320, 470], // Pit straight
      [420, 440], // Tamburello chicane (T2-T4)
      [470, 420],
      [530, 380], // Villeneuve chicane (T5-T6)
      [570, 350],
      [620, 280], // Run to Tosa
      [650, 230], // Tosa hairpin (T7)
      [610, 190],
      [530, 170], // Piratella uphill (T9)
      [470, 180],
      [430, 230], // Acque Minerali (T11-T13)
      [380, 240],
      [340, 200], // Variante Alta (T14-T15)
      [300, 160],
      [220, 180], // Downhill to Rivazza
      [160, 240], // Rivazza 1 (T17)
      [140, 320], // Rivazza 2 (T18)
      [150, 400], // Final acceleration to line
      [180, 470], // Back to S/F
    ]
  },

  8: {
    id: 8,
    key: 'monaco',
    name: 'Circuit de Monaco',
    location: 'Monte Carlo, Monaco',
    length_km: 3.337,
    turns: 19,
    drs_zones: 1,
    laps: 78,
    lap_record: '1:12.909 (Lewis Hamilton, 2021)',
    // Sainte Devote -> Beau Rivage -> Casino -> Hairpin -> Tunnel -> Chicane -> Tabac -> Swimming pool -> Rascasse
    pts: [
      [220, 480], // S/F Line
      [340, 480], // Sainte Dévote braking
      [380, 460], // Sainte Dévote T1
      [440, 360], // Beau Rivage uphill
      [490, 280], // Massenet T2
      [520, 240], // Casino Square T3
      [510, 180], // Mirabeau Haute T4
      [460, 140], // Grand Hotel / Fairmont Hairpin T6
      [420, 160], // Mirabeau Bas T7
      [450, 210], // Portier T8
      [550, 240], // The Tunnel (fast right)
      [620, 300], // Tunnel exit
      [600, 360], // Nouvelle Chicane T10-T11
      [540, 380], // Tabac T12
      [460, 400], // Louis Chiron T13
      [410, 380], // Swimming Pool chicane T14-T16
      [340, 390],
      [270, 420], // La Rascasse T18
      [220, 450], // Anthony Noghès T19
      [220, 480], // Back to S/F
    ]
  },

  9: {
    id: 9,
    key: 'catalunya',
    name: 'Circuit de Barcelona-Catalunya',
    location: 'Montmeló, Spain',
    length_km: 4.675,
    turns: 14,
    drs_zones: 2,
    laps: 66,
    lap_record: '1:16.330 (Max Verstappen, 2023)',
    // Elf chicane, long Renault right hander, Campsa, new sweeping final corners
    pts: [
      [200, 490], // S/F
      [420, 490], // 1km main straight
      [560, 470], // T1-T2 Elf chicane
      [590, 420],
      [580, 320], // T3 long curving Renault corner
      [510, 250], // T4 Repsol
      [440, 240], // T5 Seat hairpin
      [410, 270],
      [450, 310], // T7-T8 uphill
      [490, 280],
      [540, 230], // T9 Campsa blind right
      [570, 160], // Back straight
      [470, 140], // T10 La Caixa hairpin
      [380, 170],
      [320, 240], // T12 Banc Sabadell
      [280, 330], // New fast sweeping T13-T14
      [230, 420],
      [200, 490], // Back to S/F
    ]
  },

  10: {
    id: 10,
    key: 'montreal',
    name: 'Circuit Gilles Villeneuve',
    location: 'Montreal, Canada',
    length_km: 4.361,
    turns: 14,
    drs_zones: 3,
    laps: 70,
    lap_record: '1:13.078 (Valtteri Bottas, 2019)',
    // Island track: Senna 'S', hairpins, Droit du Casino, Wall of Champions
    pts: [
      [140, 460], // S/F
      [240, 470], // T1-T2 Senna S
      [280, 430],
      [330, 390], // T3-T4 chicane
      [370, 350],
      [420, 310], // T6-T7 chicane
      [470, 260],
      [530, 210], // T8-T9 chicane under bridge
      [580, 170],
      [660, 130], // Hairpin entry
      [710, 110], // L'Epingle Hairpin (T10)
      [680, 70],
      [600, 90],  // Droit du Casino (1km back straight)
      [460, 160],
      [320, 230],
      [180, 300], // Wall of Champions chicane (T13-T14)
      [130, 370],
      [140, 460], // Back to S/F
    ]
  },

  11: {
    id: 11,
    key: 'spielberg',
    name: 'Red Bull Ring',
    location: 'Spielberg, Austria',
    length_km: 4.318,
    turns: 10,
    drs_zones: 3,
    laps: 71,
    lap_record: '1:05.619 (Carlos Sainz, 2020)',
    // Uphill Niki Lauda T1, steep Remus T3 hairpin, fast downhill sweeping final corners
    pts: [
      [220, 470], // S/F
      [380, 470], // Main straight
      [480, 450], // Niki Lauda Kurve (T1)
      [520, 410],
      [540, 260], // Steep uphill straight to T3
      [570, 140], // Remus hairpin (T3)
      [530, 100],
      [470, 120], // Downhill straight to T4
      [410, 160], // T4 right hander
      [350, 230], // T6-T7 Rauch sweepers
      [280, 310],
      [230, 370], // T9 Rindt corner
      [180, 420], // T10 final corner
      [220, 470], // Back to S/F
    ]
  },

  12: {
    id: 12,
    key: 'silverstone',
    name: 'Silverstone Circuit',
    location: 'Silverstone, United Kingdom',
    length_km: 5.891,
    turns: 18,
    drs_zones: 2,
    laps: 52,
    lap_record: '1:27.097 (Max Verstappen, 2020)',
    // Abbey, Farm, Loop, Wellington, Brooklands, Copse, Maggotts, Becketts, Chapel, Stowe, Vale, Club
    pts: [
      [180, 460], // S/F (Hamilton Straight)
      [300, 460], // Abbey (T1)
      [360, 440], // Farm Curve (T2)
      [400, 410], // Village (T3)
      [370, 370], // The Loop (T4 hairpin)
      [320, 390], // Aintree (T5)
      [280, 340], // Wellington Straight
      [240, 260], // Brooklands (T6)
      [200, 210], // Luffield (T7)
      [240, 160], // Woodcote (T8)
      [360, 130], // National Pit Straight
      [480, 110], // Copse (T9 high speed right)
      [580, 140], // Maggotts (T10-T11)
      [640, 180], // Becketts (T12-T13)
      [660, 240], // Chapel (T14)
      [620, 330], // Hangar Straight
      [550, 420], // Stowe (T15)
      [460, 450], // Vale (T16)
      [400, 470], // Club (T17-T18)
      [280, 470],
      [180, 460], // Back to S/F
    ]
  },

  13: {
    id: 13,
    key: 'hungaroring',
    name: 'Hungaroring',
    location: 'Mogyoród, Hungary',
    length_km: 4.381,
    turns: 14,
    drs_zones: 2,
    laps: 70,
    lap_record: '1:16.627 (Lewis Hamilton, 2020)',
    // Twisty, undulating 'kart track' layout with continuous flowing turns
    pts: [
      [200, 480], // S/F
      [440, 480], // Main straight
      [560, 460], // T1 downhill hairpin
      [580, 410],
      [520, 360], // T2 long downhill left
      [460, 330],
      [490, 270], // T4 fast blind crest
      [530, 220], // T5 long right
      [480, 170], // T6-T7 chicane
      [420, 170],
      [360, 200], // T8-T9 flowing sector
      [320, 260], // T10-T11
      [270, 310], // T12 right-hander
      [240, 370], // T13 penultimate corner
      [220, 430], // T14 final turn
      [200, 480], // Back to S/F
    ]
  },

  14: {
    id: 14,
    key: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    location: 'Stavelot, Belgium',
    length_km: 7.004,
    turns: 19,
    drs_zones: 2,
    laps: 44,
    lap_record: '1:46.286 (Valtteri Bottas, 2018)',
    // Legendary Ardennes rollercoaster: La Source -> Eau Rouge/Raidillon -> Kemmel -> Les Combes -> Pouhon -> Blanchimont -> Bus Stop
    pts: [
      [140, 420], // S/F
      [180, 440], // La Source hairpin (T1)
      [220, 430],
      [250, 370], // Downhill to Eau Rouge (T2)
      [270, 310], // Raidillon steep uphill (T3-T4)
      [300, 250],
      [380, 180], // Kemmel Straight (1km flat out)
      [480, 110], // Les Combes chicane (T5-T6)
      [540, 100], // Malmedy (T7)
      [590, 130], // Bruxelles hairpin (T8)
      [560, 190], // Speakers Corner (T9)
      [510, 250], // Double-apex Pouhon (T10-T11)
      [460, 320],
      [520, 360], // Fagnes chicane (T12-T13)
      [580, 380], // Campus / Stavelot (T14-T15)
      [640, 390], // Paul Frère (T16)
      [680, 340], // Blanchimont (flat out T17-T18)
      [580, 310],
      [360, 370], // Run to Bus Stop
      [240, 400], // Bus Stop Chicane (T19)
      [140, 420], // Back to S/F
    ]
  },

  15: {
    id: 15,
    key: 'zandvoort',
    name: 'Circuit Zandvoort',
    location: 'Zandvoort, Netherlands',
    length_km: 4.259,
    turns: 14,
    drs_zones: 2,
    laps: 72,
    lap_record: '1:11.097 (Lewis Hamilton, 2021)',
    // Tarzanbocht -> Gerlach -> Hugenholtz 18-degree banking -> Scheivlak dunes -> Arie Luyendyk banking
    pts: [
      [200, 480], // S/F
      [440, 480], // Pit straight
      [560, 460], // Tarzanbocht (T1)
      [580, 400],
      [530, 360], // Gerlachbocht (T2)
      [480, 330], // Hugenholtz Banked Corner (T3)
      [420, 340],
      [360, 310], // Hunserug (T4)
      [330, 250], // Rob Slotemaker (T5)
      [370, 190], // Scheivlak high speed dune sweeper (T7)
      [450, 140], // Mastersbocht (T8)
      [530, 130], // T9-T10 chicane
      [580, 170],
      [590, 250], // Hans Ernst Bocht (T11-T12)
      [530, 300],
      [460, 400], // Kumhobocht (T13)
      [360, 450], // Arie Luyendykbocht (T14 18-degree banked sweeper)
      [200, 480], // Back to S/F
    ]
  },

  16: {
    id: 16,
    key: 'monza',
    name: 'Autodromo Nazionale Monza',
    location: 'Monza, Italy',
    length_km: 5.793,
    turns: 11,
    drs_zones: 2,
    laps: 53,
    lap_record: '1:21.046 (Rubens Barrichello, 2004)',
    // Temple of Speed: Rettifilo chicane -> Curva Grande -> Roggia -> Lesmos -> Ascari -> Parabolica
    pts: [
      [180, 480], // S/F Main straight
      [420, 480], // 350 km/h braking zone
      [540, 460], // Variante del Rettifilo (T1-T2)
      [580, 420],
      [560, 310], // Curva Grande (T3 flat out)
      [510, 220], // Variante della Roggia (T4-T5)
      [460, 180],
      [490, 130], // 1st Lesmo (T6)
      [540, 100], // 2nd Lesmo (T7)
      [590, 90],
      [640, 130], // Serraglio downhill under bridge
      [680, 200],
      [650, 280], // Variante Ascari chicane (T8-T10)
      [580, 340],
      [470, 370], // Back straight to Parabolica
      [320, 380], // Curva Parabolica / Alboreto (T11 long sweeping right)
      [220, 430],
      [180, 480], // Back to S/F
    ]
  },

  17: {
    id: 17,
    key: 'singapore',
    name: 'Marina Bay Street Circuit',
    location: 'Marina Bay, Singapore',
    length_km: 4.940,
    turns: 19,
    drs_zones: 4,
    laps: 62,
    lap_record: '1:35.867 (Lewis Hamilton, 2023)',
    // Night race through Marina Bay: Sheares T1-3 -> Republic Blvd -> Padang -> Anderson Bridge
    pts: [
      [220, 480], // S/F Pit straight
      [400, 480], // Sheares T1-T2-T3
      [480, 450],
      [460, 390],
      [510, 340], // Republic Boulevard (T5)
      [580, 290],
      [640, 230], // Raffles Boulevard (T7 Padang)
      [580, 180],
      [510, 150], // Stamford (T8-T9)
      [440, 170],
      [380, 210], // Anderson Bridge (T11-T13)
      [330, 250],
      [270, 280], // New Straight bypass (eliminated grandstand chicanes)
      [340, 340],
      [410, 390], // T16-T17 chicane
      [350, 440], // Final turns T18-T19
      [220, 480], // Back to S/F
    ]
  },

  18: {
    id: 18,
    key: 'austin',
    name: 'Circuit of the Americas (COTA)',
    location: 'Austin, Texas, USA',
    length_km: 5.513,
    turns: 20,
    drs_zones: 2,
    laps: 56,
    lap_record: '1:36.169 (Charles Leclerc, 2019)',
    // Steep uphill T1 blind crest -> Maggotts/Becketts style Esses -> 1km back straight -> Triple-apex stadium loop
    pts: [
      [200, 480], // S/F
      [380, 480], // Steep 40m uphill run
      [480, 450], // Iconic Turn 1 hairpin
      [460, 380], // Downhill into Esses
      [510, 340], // T3-T4
      [480, 290], // T5-T6
      [530, 240], // T7-T8-T9 blind curves
      [570, 190], // T11 hairpin
      [520, 140],
      [420, 140], // 1km Back straight
      [260, 140], // T12 braking
      [220, 180], // Stadium section (T13-T15)
      [260, 240],
      [320, 280], // Triple apex right-hander (T16-T18 around tower)
      [380, 320],
      [360, 370],
      [300, 420], // T19-T20 final corners
      [200, 480], // Back to S/F
    ]
  },

  19: {
    id: 19,
    key: 'mexico',
    name: 'Autódromo Hermanos Rodríguez',
    location: 'Mexico City, Mexico',
    length_km: 4.304,
    turns: 17,
    drs_zones: 3,
    laps: 71,
    lap_record: '1:17.774 (Valtteri Bottas, 2021)',
    // 1.3km massive main straight -> Moisés Solana chicane -> Esses -> Foro Sol Baseball Stadium
    pts: [
      [140, 480], // S/F Line
      [480, 480], // 1.3km massive front straight
      [620, 460], // T1-T2-T3 chicane
      [660, 410],
      [620, 350],
      [540, 320], // Back straight to T4
      [460, 320], // T4-T5-T6 chicane
      [410, 280],
      [450, 230], // High-speed Esses section (T7-T11)
      [520, 200],
      [570, 160],
      [610, 120],
      [550, 90],  // Entry to Foro Sol Baseball Stadium (T12)
      [460, 110], // Stadium inside hairpin (T13-T15)
      [380, 140],
      [320, 220], // Exit stadium onto Peraltada (T16-T17)
      [240, 360], // Fast curved acceleration
      [140, 480], // Back to S/F
    ]
  },

  20: {
    id: 20,
    key: 'interlagos',
    name: 'Autódromo José Carlos Pace (Interlagos)',
    location: 'São Paulo, Brazil',
    length_km: 4.309,
    turns: 15,
    drs_zones: 2,
    laps: 71,
    lap_record: '1:10.540 (Valtteri Bottas, 2018)',
    // Senna S -> Curva do Sol -> Reta Oposta -> Descida do Lago -> Ferradura -> Pinheirinho -> Bico de Pato -> Junção
    pts: [
      [220, 480], // S/F Line
      [380, 480], // Main straight
      [500, 460], // Senna S Turn 1 downhill
      [540, 410], // Senna S Turn 2
      [520, 340], // Curva do Sol (T3)
      [460, 280], // Reta Oposta (back straight)
      [380, 220], // Descida do Lago (T4-T5)
      [320, 230],
      [360, 180], // Ferradura (T6-T7)
      [440, 140],
      [520, 120], // Pinheirinho (T8)
      [560, 150], // Bico de Pato tight hairpin (T9-T10)
      [530, 210],
      [460, 260], // Mergulho fast left (T11)
      [390, 310], // Junção uphill entry (T12)
      [310, 380], // Arquibancadas uphill drag
      [220, 480], // Back to S/F
    ]
  },

  21: {
    id: 21,
    key: 'yas_marina',
    name: 'Yas Marina Circuit',
    location: 'Abu Dhabi, UAE',
    length_km: 5.281,
    turns: 16,
    drs_zones: 2,
    laps: 58,
    lap_record: '1:26.103 (Max Verstappen, 2021)',
    // Fast Sector 1, North Hairpin, 1.2km back straight, sweeping Marsa corner, Marina Hotel
    pts: [
      [220, 480], // S/F Line
      [420, 480], // Pit straight
      [540, 460], // Turn 1 left-hander
      [570, 400], // Turn 2-3 chicane
      [530, 340],
      [560, 280], // Turn 5 North Hairpin
      [520, 220],
      [420, 140], // 1.2km Back Straight
      [280, 140], // Turn 6-7 chicane
      [220, 170],
      [260, 240], // Second DRS straight
      [340, 280], // Turn 9 sweeping banked corner
      [440, 290],
      [520, 250], // Marina Hotel section (T12-T14)
      [560, 190],
      [490, 360], // W Hotel underpass
      [380, 420], // Final turns T15-T16
      [220, 480], // Back to S/F
    ]
  },

  22: {
    id: 22,
    key: 'vegas',
    name: 'Las Vegas Strip Circuit',
    location: 'Las Vegas, Nevada, USA',
    length_km: 6.201,
    turns: 17,
    drs_zones: 2,
    laps: 50,
    lap_record: '1:35.490 (Oscar Piastri, 2023)',
    // Pit complex -> Koval -> MSG Sphere complex -> Sands Ave -> 1.9km Las Vegas Boulevard Strip
    pts: [
      [160, 480], // S/F Pit Building
      [280, 480], // T1-T2 hairpin
      [340, 450],
      [360, 380], // Koval Lane straight
      [380, 280],
      [440, 230], // MSG Sphere complex (T5-T9)
      [500, 210],
      [560, 240],
      [540, 300],
      [480, 330], // Sands Avenue (T10-T12)
      [420, 350],
      [390, 400],
      [390, 120], // The Strip (1.9km flat out at 350 km/h)
      [710, 120],
      [680, 200], // Harmon Avenue Chicane (T14-T16)
      [580, 240],
      [420, 380], // Turn 17 onto pit straight
      [160, 480], // Back to S/F
    ]
  },

  23: {
    id: 23,
    key: 'qatar',
    name: 'Lusail International Circuit',
    location: 'Lusail, Qatar',
    length_km: 5.419,
    turns: 16,
    drs_zones: 1,
    laps: 57,
    lap_record: '1:24.319 (Max Verstappen, 2023)',
    // Fast flowing high-downforce MotoGP track with triple-apex right hander
    pts: [
      [180, 480], // S/F Line (1km main straight)
      [460, 480],
      [580, 460], // Turn 1 downhill right
      [620, 410],
      [580, 350], // T2 left
      [520, 320], // T3
      [470, 280], // T4-T5
      [520, 230], // T6 hairpin
      [570, 200], // T7-T8 high speed
      [620, 160], // T9
      [580, 110], // T10 left
      [500, 110], // T11
      [430, 150], // Triple-Apex right hander (T12-T14)
      [370, 220],
      [330, 310],
      [270, 390], // Turn 15-16 final corners
      [180, 480], // Back to S/F
    ]
  }
};

/** Get circuit layout by circuitId_num or string key */
export function getCircuitTrack(circuitId) {
  if (!circuitId) return CIRCUITS[1];
  if (CIRCUITS[circuitId]) return CIRCUITS[circuitId];

  // Try finding by key
  for (const c of Object.values(CIRCUITS)) {
    if (c.key === circuitId) return c;
  }

  return CIRCUITS[1];
}
