/**
 * Calculates a rounded weighted score (0-100) based on sub-scores and their weightages.
 * If weightage values sum up to 0 or weightage is missing, falls back to average score
 * or the parsed weighted score.
 * 
 * @param {Object} scores - Sub-scores object containing skills_score, experience_score, quality_score
 * @param {Object} weightage - Weightage configuration containing skills, experience, quality
 * @returns {number} Calculated weighted score (integer)
 */
export function calculateWeightedScore(scores, weightage) {
  if (!scores) return 0;

  const skillsScore = Number(scores.skills_score) || 0;
  const experienceScore = Number(scores.experience_score) || 0;
  const qualityScore = Number(scores.quality_score) || 0;

  if (!weightage || typeof weightage !== 'object') {
    // If no weightage is provided, fallback to the AI's weighted score if it exists,
    // otherwise average the scores.
    return scores.weighted_score !== undefined 
      ? Math.round(Number(scores.weighted_score) || 0)
      : Math.round((skillsScore + experienceScore + qualityScore) / 3);
  }

  const skillsWeight = weightage.skills !== undefined ? Number(weightage.skills) : 0;
  const experienceWeight = weightage.experience !== undefined ? Number(weightage.experience) : 0;
  const qualityWeight = weightage.quality !== undefined ? Number(weightage.quality) : 0;

  const totalWeight = skillsWeight + experienceWeight + qualityWeight;

  if (totalWeight <= 0) {
    return scores.weighted_score !== undefined 
      ? Math.round(Number(scores.weighted_score) || 0)
      : Math.round((skillsScore + experienceScore + qualityScore) / 3);
  }

  const weighted = (
    (skillsScore * skillsWeight) +
    (experienceScore * experienceWeight) +
    (qualityScore * qualityWeight)
  ) / totalWeight;

  return Math.round(weighted);
}
