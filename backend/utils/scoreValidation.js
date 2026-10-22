/**
 * Output template placeholder constants and score response validation.
 */

// Exported placeholder constants copied from the scoring prompt
export const PLACEHOLDER_SKILLS_ANALYSIS = "Step-by-step matching of skills...";
export const PLACEHOLDER_EXPERIENCE_CALCULATION = "Detailing candidate's years of experience vs required...";
export const PLACEHOLDER_QUALITY_EVALUATION = "Analysis of layout and achievement metrics...";
export const PLACEHOLDER_ROLE = "Categorized Role (e.g. Frontend Developer)";
export const PLACEHOLDER_JUSTIFICATION = "A summary of why this score was given, referencing the matching/missing skills and experience.";

export const PLACEHOLDERS = {
  skills_analysis: PLACEHOLDER_SKILLS_ANALYSIS,
  experience_calculation: PLACEHOLDER_EXPERIENCE_CALCULATION,
  quality_evaluation: PLACEHOLDER_QUALITY_EVALUATION,
  role: PLACEHOLDER_ROLE,
  justification: PLACEHOLDER_JUSTIFICATION
};

/**
 * Normalizes text for placeholder comparison:
 * - strips leading/trailing angle brackets (< and >)
 * - collapses whitespace
 * - trims and converts to lowercase
 *
 * @param {string} str
 * @returns {string}
 */
export function normalizePlaceholderText(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/^<+|>+$/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Validates the parsed ATS score response from an LLM.
 *
 * Requirements:
 * - skills_score, experience_score, quality_score must be finite numbers between 0 and 100
 * - justification must not be missing, empty, or contain a placeholder (case-insensitive, whitespace-normalized)
 * - role must not equal the role placeholder
 * - any reasoning_steps value must not equal its placeholder
 * - if requiredSkills is non-empty, matched_skills and missing_skills cannot both be empty or not arrays
 * - when requiredSkills is empty, empty skill lists are acceptable
 *
 * @param {any} parsed - Parsed AI response object
 * @param {object} [options]
 * @param {string[]|string} [options.requiredSkills] - Required skills from job details
 * @returns {{ ok: boolean, reasons: string[] }}
 */
export function validateScoreResponse(parsed, { requiredSkills } = {}) {
  const reasons = [];

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      reasons: ['Response must be a valid JSON object']
    };
  }

  // 1. Numeric score fields check: finite number between 0 and 100
  const scoreKeys = ['skills_score', 'experience_score', 'quality_score'];
  for (const key of scoreKeys) {
    const val = parsed[key];
    if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val) || val < 0 || val > 100) {
      reasons.push(`${key} must be a finite number between 0 and 100`);
    }
  }

  // 2. Justification check: missing, empty, or contains placeholder (case-insensitive, whitespace-normalized)
  const justification = parsed.justification;
  if (justification === undefined || justification === null) {
    reasons.push('justification is missing');
  } else if (typeof justification !== 'string') {
    reasons.push('justification must be a string');
  } else {
    const normJust = justification.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normJust === '') {
      reasons.push('justification is empty');
    } else {
      const normPlJust = PLACEHOLDER_JUSTIFICATION.trim().replace(/\s+/g, ' ').toLowerCase();
      if (normJust.includes(normPlJust)) {
        reasons.push('justification contains placeholder text');
      }
    }
  }

  // 3. Role check: equals role placeholder
  const role = parsed.role;
  if (!role || typeof role !== 'string' || !role.trim()) {
    reasons.push('role is missing or empty');
  } else {
    const normRole = normalizePlaceholderText(role);
    const normPlRole = normalizePlaceholderText(PLACEHOLDER_ROLE);
    if (normRole === normPlRole) {
      reasons.push('role equals placeholder');
    }
  }

  // 4. Reasoning steps check: any value equals its placeholder
  const reasoningSteps = parsed.reasoning_steps;
  if (reasoningSteps && typeof reasoningSteps === 'object' && !Array.isArray(reasoningSteps)) {
    const stepKeys = ['skills_analysis', 'experience_calculation', 'quality_evaluation'];
    for (const stepKey of stepKeys) {
      const stepVal = reasoningSteps[stepKey];
      if (typeof stepVal === 'string') {
        const normStep = normalizePlaceholderText(stepVal);
        const normPl = normalizePlaceholderText(PLACEHOLDERS[stepKey]);
        if (normStep === normPl) {
          reasons.push(`reasoning_steps.${stepKey} equals placeholder`);
        }
      }
    }
  }

  // 5. Skills lists check:
  // Normalize requiredSkills into a list of non-empty skill names
  let reqSkillsList = [];
  if (Array.isArray(requiredSkills)) {
    reqSkillsList = requiredSkills.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
  } else if (typeof requiredSkills === 'string') {
    const trimmed = requiredSkills.trim();
    if (trimmed && trimmed.toLowerCase() !== 'not specified') {
      reqSkillsList = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const matched = parsed.matched_skills;
  const missing = parsed.missing_skills;
  const matchedIsArray = Array.isArray(matched);
  const missingIsArray = Array.isArray(missing);

  if (reqSkillsList.length > 0) {
    const matchedCount = matchedIsArray ? matched.length : 0;
    const missingCount = missingIsArray ? missing.length : 0;
    if ((!matchedIsArray || matchedCount === 0) && (!missingIsArray || missingCount === 0)) {
      reasons.push('matched_skills and missing_skills cannot both be empty when required skills are specified');
    }
  }

  return {
    ok: reasons.length === 0,
    reasons
  };
}
