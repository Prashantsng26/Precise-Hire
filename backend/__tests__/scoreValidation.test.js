import { parseAIResponse } from '../utils/aiParser.js';
import {
  validateScoreResponse,
  PLACEHOLDER_SKILLS_ANALYSIS,
  PLACEHOLDER_EXPERIENCE_CALCULATION,
  PLACEHOLDER_QUALITY_EVALUATION,
  PLACEHOLDER_ROLE,
  PLACEHOLDER_JUSTIFICATION
} from '../utils/scoreValidation.js';

describe('scoreValidation.js', () => {
  const genuinelyGoodResponse = {
    reasoning_steps: {
      skills_analysis: 'Candidate demonstrates 4 years of Python and SQL in production ATS environments.',
      experience_calculation: 'Has 4 years of relevant engineering experience exceeding the 2 year requirement.',
      quality_evaluation: 'Clean chronological formatting with quantified metrics and achievements.'
    },
    role: 'Backend Developer',
    skills_score: 90,
    experience_score: 85,
    quality_score: 95,
    weighted_score: 89.5,
    matched_skills: ['Python', 'SQL'],
    missing_skills: ['Docker'],
    justification: 'Strong technical fit with proven database and backend service architecture experience.'
  };

  test('validates a genuinely good response as ok', () => {
    const result = validateScoreResponse(genuinelyGoodResponse, { requiredSkills: ['Python', 'SQL'] });
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  test('rejects the exact echoed-template response', () => {
    const echoedTemplate = {
      reasoning_steps: {
        skills_analysis: PLACEHOLDER_SKILLS_ANALYSIS,
        experience_calculation: PLACEHOLDER_EXPERIENCE_CALCULATION,
        quality_evaluation: PLACEHOLDER_QUALITY_EVALUATION
      },
      role: PLACEHOLDER_ROLE,
      skills_score: null,
      experience_score: null,
      quality_score: null,
      weighted_score: null,
      matched_skills: [],
      missing_skills: [],
      justification: PLACEHOLDER_JUSTIFICATION
    };

    const result = validateScoreResponse(echoedTemplate, { requiredSkills: ['Python', 'SQL'] });
    expect(result.ok).toBe(false);
    expect(result.reasons.some(r => r.includes('skills_score'))).toBe(true);
    expect(result.reasons.some(r => r.includes('experience_score'))).toBe(true);
    expect(result.reasons.some(r => r.includes('quality_score'))).toBe(true);
    expect(result.reasons.some(r => r.includes('justification contains placeholder'))).toBe(true);
    expect(result.reasons.some(r => r.includes('role equals placeholder'))).toBe(true);
    expect(result.reasons.some(r => r.includes('reasoning_steps.skills_analysis equals placeholder'))).toBe(true);
    expect(result.reasons.some(r => r.includes('matched_skills and missing_skills cannot both be empty'))).toBe(true);
  });

  test('rejects echoed template with angle brackets and normalized whitespace/case', () => {
    const echoedAngle = {
      reasoning_steps: {
        skills_analysis: ` <${PLACEHOLDER_SKILLS_ANALYSIS.toUpperCase()}> `,
        experience_calculation: `<${PLACEHOLDER_EXPERIENCE_CALCULATION}>`,
        quality_evaluation: `<${PLACEHOLDER_QUALITY_EVALUATION}>`
      },
      role: ` <${PLACEHOLDER_ROLE.toLowerCase()}> `,
      skills_score: 50,
      experience_score: 50,
      quality_score: 50,
      matched_skills: ['Python'],
      missing_skills: [],
      justification: `The evaluation is: <${PLACEHOLDER_JUSTIFICATION}> completed.`
    };

    const result = validateScoreResponse(echoedAngle, { requiredSkills: ['Python'] });
    expect(result.ok).toBe(false);
    expect(result.reasons.some(r => r.includes('justification contains placeholder'))).toBe(true);
    expect(result.reasons.some(r => r.includes('role equals placeholder'))).toBe(true);
    expect(result.reasons.some(r => r.includes('reasoning_steps.skills_analysis equals placeholder'))).toBe(true);
  });

  test('end-to-end: parser + validator on raw model string with "skills_score": 0-100 does not produce 100 and fails validation', () => {
    const rawModelString = `
    {
      "reasoning_steps": {
        "skills_analysis": "Step-by-step matching of skills...",
        "experience_calculation": "Detailing candidate's years of experience vs required...",
        "quality_evaluation": "Analysis of layout and achievement metrics..."
      },
      "role": "Categorized Role (e.g. Frontend Developer)",
      "skills_score": 0-100,
      "experience_score": 0-100,
      "quality_score": 0-100,
      "weighted_score": 0-100,
      "matched_skills": [],
      "missing_skills": [],
      "justification": "A summary of why this score was given, referencing the matching/missing skills and experience."
    }`;

    const parsed = parseAIResponse(rawModelString);

    // Verify parser turns 0-100 into null, NEVER into 100
    expect(parsed.skills_score).toBeNull();
    expect(parsed.skills_score).not.toBe(100);
    expect(parsed.experience_score).toBeNull();
    expect(parsed.experience_score).not.toBe(100);
    expect(parsed.quality_score).toBeNull();
    expect(parsed.quality_score).not.toBe(100);

    const validation = validateScoreResponse(parsed, { requiredSkills: ['Python', 'SQL'] });
    expect(validation.ok).toBe(false);
    expect(validation.reasons.length).toBeGreaterThanOrEqual(5);
  });

  test('accepts empty skill lists when requiredSkills is empty', () => {
    const candidate = {
      ...genuinelyGoodResponse,
      matched_skills: [],
      missing_skills: []
    };

    const resultEmptyArray = validateScoreResponse(candidate, { requiredSkills: [] });
    expect(resultEmptyArray.ok).toBe(true);

    const resultEmptyString = validateScoreResponse(candidate, { requiredSkills: '' });
    expect(resultEmptyString.ok).toBe(true);

    const resultNotSpecified = validateScoreResponse(candidate, { requiredSkills: 'Not specified' });
    expect(resultNotSpecified.ok).toBe(true);

    const resultUndefined = validateScoreResponse(candidate, {});
    expect(resultUndefined.ok).toBe(true);
  });

  test('fails when requiredSkills is non-empty and matched_skills & missing_skills are both empty or not arrays', () => {
    const bothEmpty = {
      ...genuinelyGoodResponse,
      matched_skills: [],
      missing_skills: []
    };
    expect(validateScoreResponse(bothEmpty, { requiredSkills: ['Python'] }).ok).toBe(false);

    const notArrays = {
      ...genuinelyGoodResponse,
      matched_skills: null,
      missing_skills: undefined
    };
    expect(validateScoreResponse(notArrays, { requiredSkills: ['Python'] }).ok).toBe(false);

    const matchedPresent = {
      ...genuinelyGoodResponse,
      matched_skills: ['Python'],
      missing_skills: []
    };
    expect(validateScoreResponse(matchedPresent, { requiredSkills: ['Python'] }).ok).toBe(true);

    const missingPresent = {
      ...genuinelyGoodResponse,
      matched_skills: [],
      missing_skills: ['Python']
    };
    expect(validateScoreResponse(missingPresent, { requiredSkills: ['Python'] }).ok).toBe(true);
  });

  test('fails for out-of-range, NaN, string numbers, and missing fields', () => {
    // String numbers must fail validation
    const stringNumbers = {
      ...genuinelyGoodResponse,
      skills_score: '90'
    };
    const resString = validateScoreResponse(stringNumbers);
    expect(resString.ok).toBe(false);
    expect(resString.reasons.some(r => r.includes('skills_score'))).toBe(true);

    // Out-of-range > 100
    const tooHigh = {
      ...genuinelyGoodResponse,
      quality_score: 105
    };
    const resHigh = validateScoreResponse(tooHigh);
    expect(resHigh.ok).toBe(false);
    expect(resHigh.reasons.some(r => r.includes('quality_score'))).toBe(true);

    // Out-of-range < 0
    const tooLow = {
      ...genuinelyGoodResponse,
      experience_score: -1
    };
    const resLow = validateScoreResponse(tooLow);
    expect(resLow.ok).toBe(false);
    expect(resLow.reasons.some(r => r.includes('experience_score'))).toBe(true);

    // NaN
    const nanScore = {
      ...genuinelyGoodResponse,
      skills_score: NaN
    };
    const resNaN = validateScoreResponse(nanScore);
    expect(resNaN.ok).toBe(false);
    expect(resNaN.reasons.some(r => r.includes('skills_score'))).toBe(true);

    // Missing score fields
    const missingScore = {
      ...genuinelyGoodResponse
    };
    delete missingScore.skills_score;
    const resMissing = validateScoreResponse(missingScore);
    expect(resMissing.ok).toBe(false);
    expect(resMissing.reasons.some(r => r.includes('skills_score'))).toBe(true);

    // Missing / empty justification
    const emptyJust = {
      ...genuinelyGoodResponse,
      justification: '   '
    };
    expect(validateScoreResponse(emptyJust).ok).toBe(false);

    const missingJust = {
      ...genuinelyGoodResponse
    };
    delete missingJust.justification;
    expect(validateScoreResponse(missingJust).ok).toBe(false);

    // Missing / empty role
    const emptyRole = {
      ...genuinelyGoodResponse,
      role: ''
    };
    expect(validateScoreResponse(emptyRole).ok).toBe(false);

    // Non-object input
    expect(validateScoreResponse(null).ok).toBe(false);
    expect(validateScoreResponse(undefined).ok).toBe(false);
    expect(validateScoreResponse([]).ok).toBe(false);
    expect(validateScoreResponse('string').ok).toBe(false);
  });
});
