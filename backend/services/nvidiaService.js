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
  const results = [];
  for (let i = 0; i < candidates.length; i += 5) {
    const batch = candidates.slice(i, i + 5);
    const candidatesText = batch.map((c, idx) =>
      `INDEX ${idx}:\nName: ${c.name}\nResume Content:\n${(c.resumeText || 'No resume').substring(0, 4000)}`
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
      parsed.forEach(item => {
        if (batch[item.index]) results.push({ ...batch[item.index], role: item.role });
      });
      console.log(`Categorized batch ${Math.floor(i/5)+1}`);
    } catch (e) {
      console.error(`Categorization failed batch ${Math.floor(i/5)+1}:`, e.message);
      batch.forEach(c => results.push({ ...c, role: 'Other' }));
    }
    await new Promise(r => setTimeout(r, 600));
  }
  return results;
}

export async function scoreCandidates(candidates, jobDetails, weightage) {
  const results = [];
  const { title, description, skills, minExperience } = jobDetails;
  const sw = weightage.skills || 40;
  const ew = weightage.experience || 30;
  const qw = weightage.quality || 30;

  console.log(`Professional ATS Scoring started for ${candidates.length} candidates...`);

  for (const candidate of candidates) {
    const resumeText = (candidate.resumeText || 'No resume').substring(0, 10000);
    
    const prompt = `### ROLE
You are a highly detailed Executive Technical Recruiter and ATS (Applicant Tracking System). Your task is to perform a granular analysis of the candidate's resume against the provided Job Description.

### JOB DESCRIPTION
- Title: ${title}
- Required Skills: ${Array.isArray(skills) ? (skills.length > 0 ? skills.join(', ') : 'Not specified') : skills}
- Minimum Experience Requirement: ${minExperience} years
- Job Context: ${description}

### CANDIDATE PROFILE
- Name: ${candidate.name}
- Resume Text:
${resumeText}

### INSTRUCTIONS
1. **Analyze Experience**: Calculate the candidate's total years of professional experience from their work history. 
2. **Analyze Skills**: Identify every skill in the resume that matches the "Required Skills" or the "Title" context.
3. **Scoring Logic**:
   - **Skills Score (0-100)**: Score based on the presence of core technologies mentioned in the JD. 80-100 for a strong match, 50-79 for a partial match, <50 if major requirements are missing.
   - **Experience Score (0-100)**: If total years >= ${minExperience}, score must be 85-100. If total years < ${minExperience}, score proportionally (e.g., if requirement is 5 and they have 2.5, score is 50). NEVER penalize for having more experience than required.
   - **Quality Score (0-100)**: Evaluate impact, clarity, and relevance.

### OUTPUT FORMAT
Return ONLY a valid JSON object.
{
  "total_years_found": 3.5,
  "skills_found": ["React", "JavaScript", "CSS"],
  "skills_score": 85,
  "experience_score": 100,
  "quality_score": 80,
  "weighted_score": 88.5,
  "matched_skills": ["React", "JavaScript"],
  "missing_skills": ["AWS"],
  "justification": "Detailed explanation of why the candidate received these scores, referencing specific parts of the resume and JD."
}`;

    try {
      const response = await callLlama(prompt, 2500);
      const item = JSON.parse(cleanJSON(response));
      
      results.push({
        ...candidate,
        skills_score: Math.min(100, Math.max(0, Number(item.skills_score) || 0)),
        experience_score: Math.min(100, Math.max(0, Number(item.experience_score) || 0)),
        quality_score: Math.min(100, Math.max(0, Number(item.quality_score) || 0)),
        weighted_score: Math.min(100, Math.max(0, Number(item.weighted_score) || 0)),
        matched_skills: item.matched_skills || [],
        missing_skills: item.missing_skills || [],
        justification: item.justification || "No justification provided."
      });
      console.log(`Scored ${candidate.name}: ${item.weighted_score}`);
    } catch (e) {
      console.error(`Scoring failed for ${candidate.name}:`, e.message);
      results.push({ ...candidate, skills_score:0, experience_score:0, quality_score:0, weighted_score:0, matched_skills:[], missing_skills:[], justification: "AI Error during scoring." });
    }
    // Respect rate limits for long context
    await new Promise(r => setTimeout(r, 1000));
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
