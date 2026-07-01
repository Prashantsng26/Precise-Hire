import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import { parseAIResponse } from '../utils/aiParser.js';
import { calculateWeightedScore } from '../utils/scoring.js';

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

async function callLlama(prompt, model = 'meta/llama-3.1-8b-instruct', maxTokens = 1500) {
  const completion = await client.chat.completions.create({
    model: model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: maxTokens,
  }, {
    timeout: 25000 // 25 seconds timeout
  });
  return completion.choices[0].message.content;
}

/**
 * Wrapper for callLlama with retry logic, exponential backoff, and model fallback
 */
async function callLlamaWithRetry(prompt, maxTokens = 1500, retries = 2, initialDelay = 1500) {
  const models = ['meta/llama-3.1-8b-instruct', 'meta/llama-3.1-70b-instruct'];
  
  for (const model of models) {
    let attempt = 0;
    while (attempt < retries) {
      try {
        console.log(`[AI] Calling Llama using model: ${model} (attempt ${attempt + 1})...`);
        return await callLlama(prompt, model, maxTokens);
      } catch (error) {
        attempt++;
        console.warn(`[AI] Attempt ${attempt} failed for model ${model}. Error: ${error.message}`);
        
        if (attempt >= retries) {
          console.warn(`[AI] Model ${model} failed after all attempts. Switching model...`);
          break;
        }
        
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`[AI] Retrying ${model} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error('All Llama models and retries failed.');
}

export async function categorizeCandidates(candidates) {
  if (candidates.length === 0) return [];
  
  console.log(`[AI] Batched Parallel ATS Categorization started for ${candidates.length} candidates...`);
  const results = [];
  const BATCH_SIZE = 5;
  const batches = [];
  
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE));
  }

  const batchPromises = batches.map(async (batch, batchIdx) => {
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
      return parsed.map(item => {
        if (batch[item.index]) return { ...batch[item.index], role: item.role };
        return null;
      }).filter(Boolean);
    } catch (e) {
      console.error(`[AI] Categorization failed for batch ${batchIdx + 1}:`, e.message);
      return batch.map(c => ({ ...c, role: c.role || 'Other' }));
    }
  });

  const resolvedBatches = await Promise.all(batchPromises);
  return resolvedBatches.flat();
}

export async function scoreCandidates(candidates, jobDetails, weightage) {
  const { title, description, skills, minExperience } = jobDetails;
  
  console.log(`[AI] Batched Parallel ATS Scoring started for ${candidates.length} candidates...`);
  const results = [];
  const BATCH_SIZE = 3;

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    console.log(`[AI] Processing scoring batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(candidates.length / BATCH_SIZE)}...`);

    const batchPromises = batch.map(async (candidate) => {
      console.log(`[AI] Scoring candidate: ${candidate.name}...`);
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

        return {
          ...candidate,
          role: item.role || candidate.role || "Other",
          skills_score,
          experience_score,
          quality_score,
          weighted_score,
          matched_skills: item.matched_skills || [],
          missing_skills: item.missing_skills || [],
          justification: item.justification || "Scored."
        };
      } catch (e) {
        console.error(`[AI] Scoring failed for ${candidate.name}:`, e.message);
        return {
          ...candidate,
          role: candidate.role || "Other",
          skills_score: 0,
          experience_score: 0,
          quality_score: 0,
          weighted_score: 0,
          matched_skills: [],
          missing_skills: [],
          justification: `AI Error: ${e.message}`
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Tiny rest between batches to prevent rate limit spikes
    if (i + BATCH_SIZE < candidates.length) {
      await new Promise(r => setTimeout(r, 600));
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
