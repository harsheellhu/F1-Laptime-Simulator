/**
 * TyrePerformanceEngine.js
 * Calculates suitability and degradation of tires based on track conditions.
 */

export const TYRE_COMPOUNDS = {
  SOFT: { name: 'Soft', color: '#ff1844', type: 'slick', optimalTemp: 95, lifeMax: 20 },
  MEDIUM: { name: 'Medium', color: '#ffb800', type: 'slick', optimalTemp: 105, lifeMax: 35 },
  HARD: { name: 'Hard', color: '#ffffff', type: 'slick', optimalTemp: 110, lifeMax: 50 },
  INTERMEDIATE: { name: 'Intermediate', color: '#00e676', type: 'wet', optimalTemp: 75, lifeMax: 35 },
  WET: { name: 'Wet', color: '#0099ff', type: 'wet', optimalTemp: 60, lifeMax: 50 },
};

export class TyrePerformanceEngine {
  
  static getPerformance(compound, trackCondition, tyreAgeLaps) {
    let score = 100;
    const wetness = trackCondition.wetness;
    
    // 1. Wetness Suitability
    if (compound.type === 'slick') {
      if (wetness > 30) score -= 80;
      else if (wetness > 15) score -= 50;
      else if (wetness > 5) score -= 20;
    } else if (compound.name === 'Intermediate') {
      // Optimal between 15% and 80% wetness
      if (wetness < 5) score -= 60; // overheats on dry
      else if (wetness < 15) score -= 20;
      else if (wetness > 85) score -= 30; // too wet
    } else if (compound.name === 'Wet') {
      // Optimal > 60% wetness
      if (wetness < 20) score -= 80; // rapidly overheats/destroys
      else if (wetness < 50) score -= 30;
    }

    // 2. Degradation
    const lifePercentage = Math.max(0, 100 - ((tyreAgeLaps / compound.lifeMax) * 100));
    
    // Non-linear cliff for tyres
    if (lifePercentage < 20) {
      score -= (20 - lifePercentage) * 2; // massive drop off
    }
    
    score = score - (100 - lifePercentage) * 0.2; // gradual wear drop
    
    // 3. Base Pace Differences (Slicks in dry)
    if (compound.name === 'Soft' && wetness < 5) score += 5;
    if (compound.name === 'Hard' && wetness < 5) score -= 3;

    return Math.max(0, Math.min(100, score));
  }

  static getRecommendedTyre(trackCondition, currentTyreAge, currentCompound) {
    const scores = Object.values(TYRE_COMPOUNDS).map(compound => {
      // Calculate score if we put a brand new tyre of this compound
      return {
        compound,
        score: this.getPerformance(compound, trackCondition, 0)
      };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0];
  }
}
