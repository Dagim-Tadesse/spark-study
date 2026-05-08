export type SRSGrade = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy

export interface SRSResult {
  interval: number;
  ease: number;
  nextReview: number;
}

/**
 * SM-2 Spaced Repetition Algorithm
 * Adapted for 4 difficulty levels: Again, Hard, Good, Easy
 */
export const srsService = {
  calculate(grade: SRSGrade, currentInterval: number, currentEase: number): SRSResult {
    let nextInterval: number;
    let nextEase: number = currentEase;

    // Map our 0-3 grade to SM-2 quality (0-5)
    // 0: Again -> 0
    // 1: Hard -> 3
    // 2: Good -> 4
    // 3: Easy -> 5
    const quality = grade === 0 ? 0 : grade + 2;

    if (quality >= 3) {
      // Correct response
      if (currentInterval === 0) {
        nextInterval = 1;
      } else if (currentInterval === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(currentInterval * currentEase);
      }

      // Calculate new ease factor
      nextEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (nextEase < 1.3) nextEase = 1.3;

      // Adjust interval based on grade specifically for Hard/Easy
      if (grade === 1) { // Hard
        nextInterval = Math.max(currentInterval + 1, Math.round(nextInterval * 0.8));
      } else if (grade === 3) { // Easy
        nextInterval = Math.round(nextInterval * 1.3);
      }
    } else {
      // Incorrect response
      nextInterval = 1;
      // We don't change ease on failure usually in some SM2 variants, 
      // or we can slightly penalize it.
      nextEase = Math.max(1.3, currentEase - 0.2);
    }

    const nextReview = Date.now() + nextInterval * 24 * 60 * 60 * 1000;

    return {
      interval: nextInterval,
      ease: nextEase,
      nextReview
    };
  },

  getLabel(grade: SRSGrade): string {
    switch (grade) {
      case 0: return "Again";
      case 1: return "Hard";
      case 2: return "Good";
      case 3: return "Easy";
    }
  },

  getEstimatedTime(interval: number): string {
    if (interval < 1) return "< 1d";
    if (interval === 1) return "1d";
    if (interval < 30) return `${interval}d`;
    const months = Math.floor(interval / 30);
    if (months < 12) return `${months}mo`;
    return `${(interval / 365).toFixed(1)}y`;
  }
};
