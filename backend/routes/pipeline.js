import express from 'express';
import { getCandidatesByJob, updateCandidate, getJob, updateJob } from '../services/dynamoService.js';

const router = express.Router();

const DEFAULT_WORKING_ROUNDS = ['ATS', 'Interview', 'Technical'];

export function getWorkingRounds(job) {
  if (Array.isArray(job?.rounds) && job.rounds.length > 0) {
    const filtered = job.rounds.filter(r => r !== 'Selected' && r !== 'Eliminated');
    return filtered.length > 0 ? filtered : [...DEFAULT_WORKING_ROUNDS];
  }
  return [...DEFAULT_WORKING_ROUNDS];
}

export function buildDisplayRounds(workingRounds) {
  return [...workingRounds, 'Selected', 'Eliminated'];
}

async function getPipelineData(jobId) {
  const [candidates, job] = await Promise.all([
    getCandidatesByJob(jobId),
    getJob(jobId)
  ]);
  
  const workingRounds = getWorkingRounds(job);
  const rounds = buildDisplayRounds(workingRounds);
  const candidatesByRound = {};
  rounds.forEach(r => candidatesByRound[r] = []);

  const pipelineCandidates = candidates.filter(c => c.status === 'in_pipeline' || c.status === 'passed' || c.status === 'eliminated');

  pipelineCandidates.forEach(c => {
    const round = c.currentRound || workingRounds[0];
    if (!candidatesByRound[round]) candidatesByRound[round] = [];
    candidatesByRound[round].push(c);
  });

  const stats = {
    total: pipelineCandidates.length,
    inProgress: pipelineCandidates.filter(c => c.status !== 'eliminated' && c.currentRound !== 'Selected').length,
    progressed: pipelineCandidates.filter(c => c.status !== 'eliminated' && c.currentRound !== 'Selected').length,
    eliminated: pipelineCandidates.filter(c => c.status === 'eliminated').length,
    selected: pipelineCandidates.filter(c => c.currentRound === 'Selected').length
  };

  return { rounds, candidatesByRound, stats };
}

router.get('/status/:jobId', async (req, res) => {
  try {
    const data = await getPipelineData(req.params.jobId);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { jobId, candidateIds } = req.body;

    // Input validation
    if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
      return res.status(400).json({ success: false, error: 'Missing or invalid jobId' });
    }
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, error: 'candidateIds must be a non-empty array' });
    }

    console.log(`[PIPELINE] Initializing pipeline for ${candidateIds.length} candidates...`);
    
    const job = await getJob(jobId);
    const workingRounds = getWorkingRounds(job);
    if (!job?.rounds) {
      await updateJob(jobId, { rounds: workingRounds });
    }

    for (const id of candidateIds) {
      try {
        await updateCandidate(id, jobId, { 
          currentRound: workingRounds[0], 
          status: 'in_pipeline' 
        });
      } catch (updateErr) {
        console.warn(`[PIPELINE] Failed to update candidate ${id}:`, updateErr.message);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[PIPELINE] Create error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/mark-result', async (req, res) => {
  try {
    const { candidateId, jobId, result, currentRound } = req.body;

    // Input validation
    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid candidateId' });
    }
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid jobId' });
    }
    if (!result || typeof result !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid result' });
    }

    const job = await getJob(jobId);
    const workingRounds = getWorkingRounds(job);
    
    if (result === 'fail') {
      await updateCandidate(candidateId, jobId, { status: 'eliminated', currentRound: 'Eliminated' });
    } else {
      const currentIndex = workingRounds.indexOf(currentRound);
      let nextRound = 'Selected';
      if (currentIndex !== -1 && currentIndex + 1 < workingRounds.length) {
        nextRound = workingRounds[currentIndex + 1];
      }
      const status = nextRound === 'Selected' ? 'passed' : 'in_pipeline';
      await updateCandidate(candidateId, jobId, { currentRound: nextRound, status });
    }
    
    const data = await getPipelineData(jobId);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('[PIPELINE] Mark result error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add-round', async (req, res) => {
  try {
    const { jobId, roundName } = req.body;
    if (!roundName || typeof roundName !== 'string' || !roundName.trim()) {
      return res.status(400).json({ success: false, error: 'Missing or invalid roundName' });
    }
    const cleanRoundName = roundName.trim();

    const job = await getJob(jobId);
    const workingRounds = getWorkingRounds(job);
    
    if (workingRounds.includes(cleanRoundName) || cleanRoundName === 'Selected' || cleanRoundName === 'Eliminated') {
      return res.json({ success: true, message: 'Round already exists' });
    }

    const newWorkingRounds = [...workingRounds, cleanRoundName];
    console.log(`[PIPELINE] Updating job ${jobId} with working rounds:`, newWorkingRounds);
    await updateJob(jobId, { rounds: newWorkingRounds });
    
    const data = await getPipelineData(jobId);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('[PIPELINE] Add round error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/move-candidate', async (req, res) => {
  try {
    const { candidateId, jobId, targetRound } = req.body;
    console.log(`[PIPELINE] Moving candidate ${candidateId} to ${targetRound}`);
    
    const update = { currentRound: targetRound };
    if (targetRound === 'Eliminated') {
      update.status = 'eliminated';
    } else if (targetRound === 'Selected') {
      update.status = 'passed';
    } else {
      update.status = 'in_pipeline';
    }
    
    await updateCandidate(candidateId, jobId, update);
    
    const data = await getPipelineData(jobId);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('[PIPELINE] Move error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
