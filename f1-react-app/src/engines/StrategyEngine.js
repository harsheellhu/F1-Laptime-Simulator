/**
 * StrategyEngine.js
 * AI and Pit-Stop recommendation logic based on conditions and forecasts.
 */
import { TyrePerformanceEngine } from './TyrePerformanceEngine';

export class StrategyEngine {
  constructor(personality = 'BALANCED') {
    this.personality = personality; // AGGRESSIVE, BALANCED, CONSERVATIVE
  }

  evaluatePitStrategy(weatherEngine, trackConditionEngine, currentTyre, currentTyreAge, currentLap) {
    const trackCond = trackConditionEngine.getCondition();
    
    // Current tyre performance
    const currentPerformance = TyrePerformanceEngine.getPerformance(currentTyre, trackCond, currentTyreAge);
    
    // Best new tyre right now
    const bestImmediateTyre = TyrePerformanceEngine.getRecommendedTyre(trackCond, currentTyreAge, currentTyre);
    
    // Look ahead 5 laps for weather
    const forecast5 = weatherEngine.getForecast(5);
    const forecast10 = weatherEngine.getForecast(10);
    
    let pitScore = 0;
    let reason = '';
    let recommendTyre = bestImmediateTyre.compound;
    
    // 1. Degradation check
    if (currentPerformance < 60) {
      pitScore += (60 - currentPerformance);
      reason = 'High tyre degradation';
    } else if (currentPerformance < 40) {
      pitScore += 100; // MUST PIT
      reason = 'Tyres completely gone';
    }

    // 2. Weather crossover check (Slick to Wet or Wet to Slick)
    if (currentTyre.type === 'slick' && trackCond.wetness > 20) {
      pitScore += 80;
      reason = 'Track is too wet for slicks';
      recommendTyre = TyrePerformanceEngine.TYRE_COMPOUNDS?.INTERMEDIATE || {name: 'Intermediate'};
    } else if (currentTyre.type === 'wet' && trackCond.wetness < 10 && forecast5.intensity === 0) {
      pitScore += 70;
      reason = 'Track is drying, switch to slicks';
      recommendTyre = TyrePerformanceEngine.TYRE_COMPOUNDS?.MEDIUM || {name: 'Medium'};
    }

    // 3. Anticipate Weather (Look-ahead)
    // If we are on slicks, and heavy rain is coming in 5 laps
    if (currentTyre.type === 'slick' && forecast5.intensity > 0.5) {
      if (this.personality === 'AGGRESSIVE') {
        pitScore += 50; 
        reason = 'Aggressive early pit for rain';
        recommendTyre = TyrePerformanceEngine.TYRE_COMPOUNDS?.INTERMEDIATE || {name: 'Intermediate'};
      } else {
        pitScore += 20; // wait and see
      }
    }

    let decision = 'STAY OUT';
    if (pitScore > 80) decision = 'PIT NOW';
    else if (pitScore > 50) decision = 'PIT RECOMMENDED';
    else if (pitScore > 30) decision = 'CONSIDER PIT';

    const confidence = Math.min(99, 40 + pitScore * 0.6);

    return {
      decision,
      reason: reason || 'Optimal strategy',
      recommendedTyre: recommendTyre,
      pitScore,
      confidence: parseFloat(confidence.toFixed(1)),
      pitWindow: `Lap ${currentLap + 1} - ${currentLap + 3}`,
      currentPerformance: parseFloat(currentPerformance.toFixed(1))
    };
  }
}
