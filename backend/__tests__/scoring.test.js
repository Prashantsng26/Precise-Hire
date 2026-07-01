import { calculateWeightedScore } from '../utils/scoring.js';

describe('scoring.js', () => {
  test('should calculate correct weighted score with standard weights', () => {
    const scores = { skills_score: 80, experience_score: 90, quality_score: 70 };
    const weightage = { skills: 50, experience: 30, quality: 20 };

    // (80*50 + 90*30 + 70*20) / 100 = (4000 + 2700 + 1400) / 100 = 8100 / 100 = 81
    expect(calculateWeightedScore(scores, weightage)).toBe(81);
  });

  test('should calculate correctly and round to nearest integer', () => {
    const scores = { skills_score: 85, experience_score: 92, quality_score: 78 };
    const weightage = { skills: 45, experience: 35, quality: 20 };

    // (85*45 + 92*35 + 78*20) / 100 = (3825 + 3220 + 1560) / 100 = 8605 / 100 = 86.05 -> 86
    expect(calculateWeightedScore(scores, weightage)).toBe(86);

    const scores2 = { skills_score: 85, experience_score: 93, quality_score: 78 };
    // (85*45 + 93*35 + 78*20) / 100 = (3825 + 3255 + 1560) / 100 = 8640 / 100 = 86.4 -> 86
    expect(calculateWeightedScore(scores2, weightage)).toBe(86);
  });

  test('should default to average score when weightage object is missing', () => {
    const scores = { skills_score: 80, experience_score: 90, quality_score: 70 };
    // (80 + 90 + 70) / 3 = 240 / 3 = 80
    expect(calculateWeightedScore(scores, null)).toBe(80);
    expect(calculateWeightedScore(scores, undefined)).toBe(80);
  });

  test('should use raw weighted_score if provided and weightage is missing', () => {
    const scores = { skills_score: 80, experience_score: 90, quality_score: 70, weighted_score: 75 };
    expect(calculateWeightedScore(scores, null)).toBe(75);
  });

  test('should default to average score if total weight is 0', () => {
    const scores = { skills_score: 80, experience_score: 90, quality_score: 70 };
    const weightage = { skills: 0, experience: 0, quality: 0 };
    expect(calculateWeightedScore(scores, weightage)).toBe(80);
  });

  test('should handle missing scores fields gracefully', () => {
    const scores = { skills_score: 80 }; // missing experience and quality
    const weightage = { skills: 50, experience: 50 };
    // (80*50 + 0*50) / 100 = 40
    expect(calculateWeightedScore(scores, weightage)).toBe(40);
  });

  test('should handle string scores by converting them to numbers', () => {
    const scores = { skills_score: '80', experience_score: '90', quality_score: '70' };
    const weightage = { skills: 50, experience: 30, quality: 20 };
    expect(calculateWeightedScore(scores, weightage)).toBe(81);
  });

  test('should return 0 if scores object is falsy', () => {
    expect(calculateWeightedScore(null, { skills: 50 })).toBe(0);
    expect(calculateWeightedScore(undefined, { skills: 50 })).toBe(0);
  });
});
