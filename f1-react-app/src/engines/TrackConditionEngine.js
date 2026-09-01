/**
 * TrackConditionEngine.js
 * Tracks real-time surface wetness, grip levels based on weather.
 */

export class TrackConditionEngine {
  constructor() {
    this.trackWetness = 0; // 0 (dry) to 100 (standing water)
    this.gripLevel = 100; // 0 to 100
  }

  tick(currentWeather) {
    // Rain increases wetness
    if (currentWeather.intensity > 0) {
      // Light rain adds ~5% per lap, Heavy rain adds ~20% per lap
      this.trackWetness += currentWeather.intensity * 20;
    } else {
      // Drying: Depends on track temp
      const dryingRate = (currentWeather.trackTemp / 10) * 1.5; // e.g. 30C = 4.5% drying per lap
      this.trackWetness -= dryingRate;
    }

    // Clamp
    this.trackWetness = Math.max(0, Math.min(100, this.trackWetness));

    // Calculate grip (100% when dry, drops to ~40% when 100% wet without Wets)
    // We just report absolute track grip here. Tyres will use this to find performance.
    this.gripLevel = 100 - (this.trackWetness * 0.6);
  }

  getCondition() {
    let name = 'DRY';
    if (this.trackWetness > 80) name = 'VERY WET';
    else if (this.trackWetness > 40) name = 'WET';
    else if (this.trackWetness > 15) name = 'DAMP';
    else if (this.trackWetness > 2) name = 'SLIGHTLY DAMP';

    return {
      wetness: parseFloat(this.trackWetness.toFixed(1)),
      grip: parseFloat(this.gripLevel.toFixed(1)),
      name
    };
  }
}
