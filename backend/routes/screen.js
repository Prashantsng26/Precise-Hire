import express from 'express';
import { getCandidatesByJob, saveJob, updateCandidate } from '../services/dynamoService.js';
import { fetchResume } from '../services/resumeFetcher.js';
import { extractText } from '../services/textExtractor.js';
import { categorizeCandidates, scoreCandidates } from '../services/nvidiaService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { jobId, jobDetails, weightage } = req.body;
    let candidates = await getCandidatesByJob(jobId);

    console.log(`Starting screening for ${candidates.length} candidates...`);

    // 1. Fetch & Extract Text if missing
    for (let candidate of candidates) {
      if (!candidate.resumeText && candidate.resumeLink) {
        console.log(`Fetching resume for ${candidate.name}...`);
        const fetchRes = await fetchResume(candidate.resumeLink);
        if (fetchRes.success) {
          const extractRes = await extractText(fetchRes.buffer, fetchRes.mimeType);
          if (extractRes.success) {
            console.log(`Extracted ${extractRes.text?.length || 0} characters for ${candidate.name}`);
            candidate.resumeText = extractRes.text;
            await updateCandidate(candidate.candidateId, jobId, { resumeText: extractRes.text });
          } else {
            console.error(`Failed to extract text for ${candidate.name}: ${extractRes.error}`);
          }
        } else {
          console.error(`Failed to fetch resume for ${candidate.name}: ${fetchRes.error}`);
        }
      }
    }

    // 2. Categorize (Keep for metadata)
    console.log('Categorizing candidates...');
    candidates = await categorizeCandidates(candidates);

    // 3. Score all candidates against the JD
    const filtered = candidates;

    // 4. Score
    console.log('Scoring candidates...');
    const scoredList = await scoreCandidates(filtered, jobDetails, weightage);

    // 5. Save results to Dynamo
    for (const c of scoredList) {
      const updates = {
        role: c.role,
        skills_score: c.skills_score,
        experience_score: c.experience_score,
        quality_score: c.quality_score,
        weighted_score: c.weighted_score,
        matched_skills: c.matched_skills,
        missing_skills: c.missing_skills,
        justification: c.justification,
        rank: c.rank,
        status: 'shortlisted'
      };
      await updateCandidate(c.candidateId, jobId, updates);
    }

    // 6. Save Job Details
    await saveJob({
      jobId,
      ...jobDetails,
      weightage,
      totalCandidates: scoredList.length
    });

    res.json({
      success: true,
      totalCandidates: candidates.length,
      roleMatchCount: scoredList.length,
      candidates: scoredList
    });
  } catch (error) {
    console.error('Screen route error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:jobId', async (req, res) => {
  try {
    const candidates = await getCandidatesByJob(req.params.jobId);
    candidates.sort((a, b) => (b.weighted_score || 0) - (a.weighted_score || 0));
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
