import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import { parseAIResponse } from '../utils/aiParser.js';
import { calculateWeightedScore } from '../utils/scoring.js';

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

async function callLlama(prompt, maxTokens = 1500) {
  const completion = await client.chat.completions.create({
    model: 'meta/llama-3.1-70b-instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: maxTokens,
  }, {
    timeout: 40000 // 40 seconds timeout to prevent infinite hang
  });
  return completion.choices[0].message.content;
}

/**
 * Wrapper for callLlama with retry logic and exponential backoff
 */
async function callLlamaWithRetry(prompt, maxTokens = 1500, retries = 4, initialDelay = 2000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await callLlama(prompt, maxTokens);
    } catch (error) {
      attempt++;
      console.warn(`[AI] Attempt ${attempt} failed for Llama. Error: ${error.message}`);
      if (attempt >= retries) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`[AI] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function categorizeCandidates(candidates) {
  if (candidates.length === 0) return [];
  
  console.log(`[AI] Sequential ATS Categorization started for ${candidates.length} candidates...`);
  const results = [];
  const batches = [];
  
  // Categorize in batches of 10 to keep prompt size manageable
  for (let i = 0; i < candidates.length; i += 10) {
    batches.push(candidates.slice(i, i + 10));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`[AI] Categorizing batch ${batchIdx + 1} of ${batches.length}...`);
    
    const candidatesText = batch.map((c, idx) =>
      `INDEX ${idx}:\nName: ${c.name}\nResume Content:\n${(c.resumeText || 'No resume').substring(0, 3000)}`
    ).join('\n\n---\n\n');

    const prompt = `You are a strict HR role classifier. Read each resume and assign ONE role.

Available roles ONLY:
UI/UX Designer, Frontend Developer, Backend Developer, Full Stack Developer,
Data Scientist, Data Analyst, DevOps Engineer, Product Manager,
Android Developer, iOS Developer, Other

Rules:
- Base decision ONLY on actual resume content
- No resume text = assign "Other"
- Return ONLY valid JSON array, no explanation

Candidates:
${candidatesText}

Return ONLY:
[{"index":0,"role":"Frontend Developer"},{"index":1,"role":"Data Analyst"}]`;

    try {
      const response = await callLlamaWithRetry(prompt, 1500);
      const parsed = parseAIResponse(response);
      const batchResults = parsed.map(item => {
        if (batch[item.index]) return { ...batch[item.index], role: item.role };
        return null;
      }).filter(Boolean);
      results.push(...batchResults);
    } catch (e) {
      console.error(`[AI] Categorization failed for batch ${batchIdx + 1}:`, e.message);
      const fallback = batch.map(c => ({ ...c, role: c.role || 'Other' }));
      results.push(...fallback);
    }

    if (batchIdx < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  return results;
}

export async function scoreCandidates(candidates, jobDetails, weightage) {
  const { title, description, skills, minExperience } = jobDetails;
  
  console.log(`[AI] Sequential ATS Scoring started for ${candidates.length} candidates...`);
  const results = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    console.log(`[AI] Scoring candidate ${i + 1} of ${candidates.length}: ${candidate.name}...`);
    
    // Truncate to 6000 to keep tokens smaller and avoid token limits
    const resumeText = (candidate.resumeText || 'No resume').substring(0, 6000);
    const prompt = `### ROLE
You are a highly detailed Technical Recruiter and ATS. Analyze the resume against the JD.

### JOB DESCRIPTION
- Title: ${title}
- Required Skills: ${Array.isArray(skills) ? (skills.length > 0 ? skills.join(', ') : 'Not specified') : skills}
- Requirement: ${minExperience} years
- Context: ${description}

### CANDIDATE: ${candidate.name}
Resume: ${resumeText}

### OUTPUT ONLY JSON
{
  "role": "Categorized Role (e.g. Frontend Developer)",
  "skills_score": 0-100,
  "experience_score": 0-100,
  "quality_score": 0-100,
  "weighted_score": 0-100,
  "matched_skills": [],
  "missing_skills": [],
  "justification": ""
}`;

    try {
      const startTime = Date.now();
      const response = await callLlamaWithRetry(prompt, 1500);
      console.log(`[AI] Response received for ${candidate.name} in ${Date.now() - startTime}ms`);
      const item = parseAIResponse(response);
      const skills_score = Number(item.skills_score) || 0;
      const experience_score = Number(item.experience_score) || 0;
      const quality_score = Number(item.quality_score) || 0;
      const weighted_score = calculateWeightedScore({
        skills_score,
        experience_score,
        quality_score,
        weighted_score: item.weighted_score
      }, weightage);

      results.push({
        ...candidate,
        role: item.role || candidate.role || "Other",
        skills_score,
        experience_score,
        quality_score,
        weighted_score,
        matched_skills: item.matched_skills || [],
        missing_skills: item.missing_skills || [],
        justification: item.justification || "Scored."
      });
    } catch (e) {
      console.error(`[AI] Scoring failed for ${candidate.name}:`, e.message);
      results.push({
        ...candidate,
        role: candidate.role || "Other",
        skills_score: 0,
        experience_score: 0,
        quality_score: 0,
        weighted_score: 0,
        matched_skills: [],
        missing_skills: [],
        justification: `AI Error: ${e.message}`
      });
    }

    // Add a 1.2-second delay between candidates to stay under rate limits
    if (i < candidates.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }

  results.sort((a, b) => b.weighted_score - a.weighted_score);
  return results.map((c, idx) => ({ ...c, rank: idx + 1 }));
}

export async function generateEmailBody(type, details) {
  const prompts = {
    interview: `Write a professional interview invitation email.
Candidate: ${details.candidateName}
Position: ${details.jobTitle}
Date: ${details.date}, Time: ${details.time}
Meet Link: ${details.meetLink}
Write 3 short professional paragraphs. Start: "Dear ${details.candidateName},"
End: "Best regards, PreciseHire Recruitment Team"
Return only email body text.`,

    assessment: `Write a professional assessment invitation email.
Candidate: ${details.candidateName}, Position: ${details.jobTitle}
Assessment Link: ${details.assessmentUrl}, Deadline: ${details.deadline}
3 short paragraphs, professional tone.
Start: "Dear ${details.candidateName}," Return only email body.`,

    offer: `Write a formal job offer letter.
Candidate: ${details.candidateName}, Position: ${details.jobTitle}
Joining Date: ${details.joiningDate}
Formal warm tone. Start: "Dear ${details.candidateName},"
End: "Best regards, PreciseHire HR Team" Return only letter body.`
  };

  try {
    return await callLlamaWithRetry(prompts[type], 600);
  } catch (e) {
    console.error(`[AI] Email generation failed for ${type}:`, e.message);
    throw e;
  }
}
