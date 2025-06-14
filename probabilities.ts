
import { OutcomeProbabilities } from '../types';

const getStrengthScore = (formString: string): number => {
  if (!formString || formString === 'N/A') {
    return 0;
  }
  const results = formString.split(' ');
  if (results.length !== 15) {
    console.warn(`Invalid form string length in getStrengthScore: "${formString}"`);
    return 0; // Should be handled by prior validation, but as a safeguard
  }

  let score = 0;
  for (let i = 0; i < 15; i++) {
    const result = results[i];
    let points = 0;
    if (result === 'W') points = 3;
    else if (result === 'D') points = 1;
    // L (Loss) gives 0 points

    // Last 5 matches (indices 10-14) get double weight
    const weight = (i >= 10) ? 2 : 1; 
    score += points * weight;
  }
  return score;
};

export const calculateOutcomeProbabilities = (
  homeForm: string,
  awayForm: string
): OutcomeProbabilities => {
  const scoreHome = getStrengthScore(homeForm);
  const scoreAway = getStrengthScore(awayForm);

  const P_D_BASE = 0.28; // Base probability for a draw (28%)

  if (scoreHome === 0 && scoreAway === 0) {
    // If no form data for both, or both have lost all weighted matches
    return { homeWin: 33, draw: 34, awayWin: 33 };
  }

  const totalStrength = scoreHome + scoreAway;
  let homeWinMarket: number, awayWinMarket: number;

  if (totalStrength === 0) { 
    // This case should be covered by the above, but as a safeguard for scoreHome > 0, scoreAway = 0 (or vice-versa) leading to totalStrength > 0
    // If one team has some strength and the other has zero, distribute remaining probability.
    // This implies one team has form, the other doesn't.
     homeWinMarket = scoreHome > 0 ? (1 - P_D_BASE) : 0;
     awayWinMarket = scoreAway > 0 ? (1 - P_D_BASE) : 0;
     if (scoreHome > 0 && scoreAway > 0) { // Should not happen if totalStrength is 0 unless logic error
        homeWinMarket = 0.5 * (1 - P_D_BASE);
        awayWinMarket = 0.5 * (1 - P_D_BASE);
     }
  } else {
    homeWinMarket = (scoreHome / totalStrength) * (1 - P_D_BASE);
    awayWinMarket = (scoreAway / totalStrength) * (1 - P_D_BASE);
  }
  
  const drawMarket = P_D_BASE;

  let homeWinPercent = Math.round(homeWinMarket * 100);
  let awayWinPercent = Math.round(awayWinMarket * 100);
  let drawPercent = Math.round(drawMarket * 100);

  // Adjust for rounding errors to ensure sum is 100%
  let totalPercent = homeWinPercent + awayWinPercent + drawPercent;
  const diff = 100 - totalPercent;

  if (diff !== 0) {
    // Add difference to the largest probability component to minimize distortion,
    // or to draw if it's a common scenario or to avoid favoring a team.
    // For simplicity, adding to draw.
    drawPercent += diff;
  }
  
  // Ensure no probability is negative after adjustment (highly unlikely with Math.round and positive markets)
  // And re-distribute if any component became too large making others negative if diff was large.
  // This simple adjustment is usually fine for diff = +/-1 or +/-2.
  if (homeWinPercent < 0) { homeWinPercent = 0; }
  if (awayWinPercent < 0) { awayWinPercent = 0; }
  if (drawPercent < 0) { drawPercent = 0; }
  
  totalPercent = homeWinPercent + awayWinPercent + drawPercent;
   if (totalPercent !== 100 && totalPercent > 0) {
     const scale = 100 / totalPercent;
     homeWinPercent = Math.round(homeWinPercent * scale);
     awayWinPercent = Math.round(awayWinPercent * scale);
     // Ensure sum is 100, assign remainder to draw as it's often most flexible
     drawPercent = 100 - homeWinPercent - awayWinPercent;
   } else if (totalPercent === 0 && (scoreHome > 0 || scoreAway > 0)) {
     // Failsafe: if all rounded to 0 but there was some strength
     return { homeWin: 33, draw: 34, awayWin: 33 };
   }


  return {
    homeWin: homeWinPercent,
    draw: drawPercent,
    awayWin: awayWinPercent,
  };
};
