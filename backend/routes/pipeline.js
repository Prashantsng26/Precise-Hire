import express from 'express';
import { getCandidatesByJob, updateCandidate } from '../services/dynamoService.js';

const router = express.Router();

const DEFAULT_ROUNDS = ['ATS Screening', 'Interview', 'Technical Round', 'Verbal Round', 'Selected'];

router.get('/status/:jobId', async (req, res) => {
  try {
    const candidates = await getCandidatesByJob(req.params.jobId);
    
    const candidatesByRound = {};
    DEFAULT_ROUNDS.forEach(r => candidatesByRound[r] = []);
    candidatesByRound['Eliminated'] = [];

    candidates.forEach(c => {
      const round = c.currentRound || 'ATS Screening';
      if (!candidatesByRound[round]) candidatesByRound[round] = [];
      candidatesByRound[round].push(c);
    });

    const stats = {
      total: candidates.length,
      inProgress: candidates.filter(c => c.status !== 'eliminated' && c.currentRound !== 'Selected').length,
      eliminated: candidates.filter(c => c.status === 'eliminated').length,
      selected: candidates.filter(c => c.currentRound === 'Selected').length
    };

    res.json({ success: true, rounds: DEFAULT_ROUNDS, candidatesByRound, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { jobId, candidateIds } = req.body;
    for (const id of candidateIds) {
      await updateCandidate(id, jobId, { currentRound: 'ATS Screening', status: 'in_pipeline' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/mark-result', async (req, res) => {
  try {
    const { candidateId, jobId, result, currentRound } = req.body;
    
    if (result === 'fail') {
      await updateCandidate(candidateId, jobId, { status: 'eliminated', currentRound: 'Eliminated' });
    } else {
      const currentIndex = DEFAULT_ROUNDS.indexOf(currentRound);
      const nextRound = DEFAULT_ROUNDS[currentIndex + 1] || 'Selected';
      await updateCandidate(candidateId, jobId, { currentRound: nextRound, status: 'passed' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add-round', async (req, res) => {
  try {
    const { jobId, roundName } = req.body;
    // In a real app, we'd store custom rounds in the Jobs table.
    // For this prototype, we'll just acknowledge the request.
    res.json({ success: true, message: `Round ${roundName} added (Logic to be persisted in Job config)` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
