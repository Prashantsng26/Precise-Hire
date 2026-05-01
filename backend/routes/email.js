import express from 'express';
import { sendInterviewInvites, sendAssessmentLinks, sendOfferLetters } from '../services/sesMailer.js';
import { updateCandidate } from '../services/dynamoService.js';

const router = express.Router();

router.post('/interview', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    console.log(`Received interview invitation request for ${candidates?.length} candidates.`);
    const results = await sendInterviewInvites(candidates, details);
    console.log('Interview invitation results:', results);
    
    for (const c of candidates) {
      await updateCandidate(c.candidateId, c.jobId, { status: 'invited', currentRound: 'Interview' });
    }

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/assessment', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    console.log(`Received assessment link request for ${candidates?.length} candidates.`);
    const results = await sendAssessmentLinks(candidates, details);
    console.log('Assessment link results:', results);
    
    for (const c of candidates) {
      await updateCandidate(c.candidateId, c.jobId, { status: 'assessment_sent' });
    }

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/offer', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    const results = await sendOfferLetters(candidates, details);
    
    for (const c of candidates) {
      await updateCandidate(c.candidateId, c.jobId, { status: 'offered', currentRound: 'Offer' });
    }

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
