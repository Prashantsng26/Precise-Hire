import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

function cleanJSON(text) {
  text = text.trim();
  
  // Find the first occurrence of { or [
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  
  let start = -1;
  let end = -1;
  let bracketType = '';

  if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
    start = startObj;
    bracketType = '{';
  } else if (startArr !== -1) {
    start = startArr;
    bracketType = '[';
  }

  if (start === -1) return text;

  // Simple bracket matcher to find the matching closing bracket
  const closingType = bracketType === '{' ? '}' : ']';
  let stack = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === bracketType) stack++;
    else if (text[i] === closingType) {
      stack--;
      if (stack === 0) {
        end = i;
        break;
      }
    }
  }

  if (start !== -1 && end !== -1) {
    return text.substring(start, end + 1);
  }
  
  return text;
}

async function callLlama(prompt, maxTokens = 1500) {
  const completion = await client.chat.completions.create({
    model: 'meta/llama-3.1-70b-instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: maxTokens,
  });
  return completion.choices[0].message.content;
}

export async function categorizeCandidates(candidates) {
  if (candidates.length === 0) return [];
  
  // Categorize in batches of 10 to keep prompt size manageable
  const results = [];
  const batches = [];
  for (let i = 0; i < candidates.length; i += 10) {
    batches.push(candidates.slice(i, i + 10));
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
      const response = await callLlama(prompt);
      const parsed = JSON.parse(cleanJSON(response));
      return parsed.map(item => {
        if (batch[item.index]) return { ...batch[item.index], role: item.role };
        return null;
      }).filter(Boolean);
    } catch (e) {
      console.error(`Categorization failed batch ${batchIdx + 1}:`, e.message);
      return batch.map(c => ({ ...c, role: 'Other' }));
    }
  });

  const resolvedBatches = await Promise.all(batchPromises);
  return resolvedBatches.flat();
}

export async function scoreCandidates(candidates, jobDetails, weightage) {
  const { title, description, skills, minExperience } = jobDetails;
  
  console.log(`Batched Parallel ATS Scoring started for ${candidates.length} candidates...`);
  const results = [];
  const BATCH_SIZE = 3; // Reduced for stability

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    console.log(`[AI] Processing scoring batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(candidates.length / BATCH_SIZE)}...`);

    const batchPromises = batch.map(async (candidate) => {
      console.log(`[AI] Scoring candidate: ${candidate.name}...`);
      const resumeText = (candidate.resumeText || 'No resume').substring(0, 8000);
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
        const response = await callLlama(prompt, 1500);
        console.log(`[AI] Response received for ${candidate.name} in ${Date.now() - startTime}ms`);
        const item = JSON.parse(cleanJSON(response));
        return {
          ...candidate,
          role: item.role || candidate.role || "Other",
          skills_score: Number(item.skills_score) || 0,
          experience_score: Number(item.experience_score) || 0,
          quality_score: Number(item.quality_score) || 0,
          weighted_score: Number(item.weighted_score) || 0,
          matched_skills: item.matched_skills || [],
          missing_skills: item.missing_skills || [],
          justification: item.justification || "Scored."
        };
      } catch (e) {
        console.error(`[AI] Scoring failed for ${candidate.name}:`, e.message);
        return { ...candidate, weighted_score: 0, justification: "AI Error." };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Tiny rest between batches to prevent rate limit spikes
    if (i + BATCH_SIZE < candidates.length) {
      await new Promise(r => setTimeout(r, 500));
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

  return await callLlama(prompts[type], 600);
}
