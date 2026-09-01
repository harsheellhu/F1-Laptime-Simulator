/**
 * WeatherEngine.js
 * Simulates weather timeline, rain probability, and temperature.
 */

export const WEATHER_STATES = {
  DRY: { name: 'DRY', icon: '☀', intensity: 0, rainProb: 0, airTemp: 24, trackTempOffset: +8 },
  CLOUDY: { name: 'CLOUDY', icon: '☁', intensity: 0, rainProb: 15, airTemp: 22, trackTempOffset: +3 },
  LIGHT_RAIN: { name: 'LIGHT RAIN', icon: '🌦', intensity: 0.3, rainProb: 60, airTemp: 20, trackTempOffset: -1 },
  MODERATE_RAIN: { name: 'RAIN', icon: '🌧', intensity: 0.6, rainProb: 85, airTemp: 19, trackTempOffset: -3 },
  HEAVY_RAIN: { name: 'HEAVY RAIN', icon: '⛈', intensity: 1.0, rainProb: 100, airTemp: 17, trackTempOffset: -5 },
  DRYING: { name: 'DRYING', icon: '🌥', intensity: 0, rainProb: 5, airTemp: 21, trackTempOffset: +2 }
};

export class WeatherEngine {
  constructor() {
    this.timeline = []; // Forecast for next 20 laps
    this.currentLap = 0;
    
    // Setup initial random weather or dry
    const isDryStart = Math.random() > 0.3;
    let currentState = isDryStart ? WEATHER_STATES.DRY : WEATHER_STATES.CLOUDY;
    
    for (let i = 0; i < 20; i++) {
      this.timeline.push(this._generateNextState(currentState));
      currentState = this.timeline[i];
    }
  }

  _generateNextState(prevState) {
    // Markov-chain style state transitions
    let nextState = prevState;
    const r = Math.random();
    
    if (prevState.name === 'DRY') {
      if (r < 0.05) nextState = WEATHER_STATES.CLOUDY;
    } else if (prevState.name === 'CLOUDY') {
      if (r < 0.2) nextState = WEATHER_STATES.LIGHT_RAIN;
      else if (r < 0.1) nextState = WEATHER_STATES.DRY;
    } else if (prevState.name === 'LIGHT RAIN') {
      if (r < 0.3) nextState = WEATHER_STATES.MODERATE_RAIN;
      else if (r < 0.2) nextState = WEATHER_STATES.DRYING;
    } else if (prevState.name === 'RAIN') {
      if (r < 0.1) nextState = WEATHER_STATES.HEAVY_RAIN;
      else if (r < 0.2) nextState = WEATHER_STATES.LIGHT_RAIN;
    } else if (prevState.name === 'HEAVY RAIN') {
      if (r < 0.3) nextState = WEATHER_STATES.MODERATE_RAIN;
    } else if (prevState.name === 'DRYING') {
      if (r < 0.4) nextState = WEATHER_STATES.DRY;
      else if (r < 0.1) nextState = WEATHER_STATES.LIGHT_RAIN;
    }

    return {
      ...nextState,
      airTemp: nextState.airTemp + (Math.random() * 2 - 1),
      trackTemp: nextState.airTemp + nextState.trackTempOffset + (Math.random() * 4 - 2),
    };
  }

  getCurrentWeather() {
    return this.timeline[0];
  }

  getForecast(lapsAhead) {
    return this.timeline[Math.min(lapsAhead, this.timeline.length - 1)];
  }

  getTimeline() {
    return this.timeline;
  }

  tick() {
    this.currentLap++;
    // Shift timeline
    this.timeline.shift();
    // Add new forecast at the end
    const lastState = this.timeline[this.timeline.length - 1];
    this.timeline.push(this._generateNextState(lastState));
  }
}
