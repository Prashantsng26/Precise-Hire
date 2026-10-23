import express from 'express';
import { 
  sendInterviewInvites, 
  sendAssessmentLinks, 
  sendOfferLetters, 
  sendRoundClearance, 
  sendRejectionEmail,
  sendEmail,
  sendBulkEmail
} from '../services/sesMailer.js';
import { 
  updateCandidate, 
  getCandidatesByJob, 
  getJob, 
  recordCandidateEmailSent 
} from '../services/dynamoService.js';
import { renderSelectionEmail, renderRejectionEmail } from '../utils/emailTemplates.js';
import {
  isValidKind,
  pickRecipients,
  getBulkMax,
  getSendDelayMs,
  isDryRun,
  tryAcquireBulkLock,
  releaseBulkLock
} from '../utils/bulkEmail.js';

const router = express.Router();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test route to verify SMTP setup
router.get('/test', async (req, res) => {
  try {
    const testUser = process.env.GMAIL_USER;
    console.log(`[SMTP TEST] Sending test email to ${testUser}...`);
    const result = await sendEmail(
      testUser, 
      'PreciseHire SMTP Test', 
      'This is a test email from PreciseHire to verify your Nodemailer Gmail SMTP configuration. If you are reading this, your email system is working correctly!'
    );
    
    if (result.success) {
      res.json({ success: true, message: `Test email sent successfully to ${testUser}` });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/interview', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    if (!Array.isArray(candidates)) {
      return res.json({ success: false, error: 'candidates must be an array', sent: 0, failed: 0 });
    }
    // Handle empty candidates array gracefully
    if (candidates.length === 0) {
      return res.json({ success: true, sent: 0, failed: 0 });
    }
    // Validate candidates objects
    for (const c of candidates) {
      if (!c || typeof c !== 'object' || !c.candidateId) {
        return res.json({ success: false, error: 'Each candidate must contain a candidateId', sent: 0, failed: 0 });
      }
    }
    console.log(`[EMAIL] Sending interview invites to ${candidates?.length} candidates...`);
    const results = await sendInterviewInvites(candidates, details);
    
    for (const c of candidates) {
      try {
        await updateCandidate(c.candidateId, c.jobId || details?.jobId, { status: 'invited', currentRound: 'Interview' });
      } catch (updateErr) {
        console.warn(`[EMAIL] Failed to update candidate ${c.candidateId} in DB:`, updateErr.message);
      }
    }

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/assessment', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    if (!Array.isArray(candidates)) {
      return res.json({ success: false, error: 'candidates must be an array', sent: 0, failed: 0 });
    }
    // Validate candidates objects
    for (const c of candidates) {
      if (!c || typeof c !== 'object' || !c.candidateId) {
        return res.json({ success: false, error: 'Each candidate must contain a candidateId', sent: 0, failed: 0 });
      }
    }
    console.log(`[EMAIL] Sending assessment links to ${candidates?.length} candidates...`);
    const results = await sendAssessmentLinks(candidates, details);
    
    for (const c of candidates) {
      try {
        await updateCandidate(c.candidateId, c.jobId || details?.jobId, { status: 'assessment_sent' });
      } catch (updateErr) {
        console.warn(`[EMAIL] Failed to update candidate ${c.candidateId} in DB:`, updateErr.message);
      }
    }

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/offer', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    if (!Array.isArray(candidates)) {
      return res.json({ success: false, error: 'candidates must be an array', sent: 0, failed: 0 });
    }
    // Validate candidates objects
    for (const c of candidates) {
      if (!c || typeof c !== 'object' || !c.candidateId) {
        return res.json({ success: false, error: 'Each candidate must contain a candidateId', sent: 0, failed: 0 });
      }
    }
    console.log(`[EMAIL] Sending offer letters to ${candidates?.length} candidates...`);
    const results = await sendOfferLetters(candidates, details);
    
    for (const c of candidates) {
      try {
        await updateCandidate(c.candidateId, c.jobId || details?.jobId, { status: 'offered', currentRound: 'Offer' });
      } catch (updateErr) {
        console.warn(`[EMAIL] Failed to update candidate ${c.candidateId} in DB:`, updateErr.message);
      }
    }

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/round-clearance', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    if (!Array.isArray(candidates)) {
      return res.json({ success: false, error: 'candidates must be an array', sent: 0, failed: 0 });
    }
    // Validate candidates objects
    for (const c of candidates) {
      if (!c || typeof c !== 'object' || !c.candidateId) {
        return res.json({ success: false, error: 'Each candidate must contain a candidateId', sent: 0, failed: 0 });
      }
    }
    console.log(`[EMAIL] Sending round clearance to ${candidates?.length} candidates...`);
    const results = await sendRoundClearance(candidates, details);
    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rejection', async (req, res) => {
  try {
    const { candidates, details } = req.body;
    if (!Array.isArray(candidates)) {
      return res.json({ success: false, error: 'candidates must be an array', sent: 0, failed: 0 });
    }
    // Validate candidates objects
    for (const c of candidates) {
      if (!c || typeof c !== 'object' || !c.candidateId) {
        return res.json({ success: false, error: 'Each candidate must contain a candidateId', sent: 0, failed: 0 });
      }
    }
    console.log(`[EMAIL] Sending rejection emails to ${candidates?.length} candidates...`);
    const results = await sendRejectionEmail(candidates, details);
    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bulk/preview', async (req, res) => {
  try {
    const { jobId, kind } = req.body || {};

    if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
      return res.status(400).json({ success: false, error: 'Missing or invalid jobId' });
    }

    const normKind = typeof kind === 'string' ? kind.trim().toLowerCase() : '';
    if (!isValidKind(normKind)) {
      return res.status(400).json({ success: false, error: 'Invalid kind: must be "selected" or "rejected"' });
    }

    const cleanJobId = jobId.trim();
    const [candidates, job] = await Promise.all([
      getCandidatesByJob(cleanJobId),
      getJob(cleanJobId)
    ]);

    const { toSend, skippedAlreadySent, skippedInvalid } = pickRecipients({
      candidates,
      kind: normKind
    });

    const total = toSend.length + skippedAlreadySent.length + skippedInvalid.length;

    let sample = null;
    if (toSend.length > 0) {
      const first = toSend[0];
      const jobTitle = job?.title || job?.jobTitle || '';
      const rendered = normKind === 'selected'
        ? renderSelectionEmail({ name: first.name, jobTitle })
        : renderRejectionEmail({ name: first.name, jobTitle });

      sample = {
        subject: rendered.subject,
        text: rendered.text
      };
    }

    return res.json({
      success: true,
      kind: normKind,
      total,
      alreadySent: skippedAlreadySent.length,
      toSend: toSend.length,
      sample
    });
  } catch (error) {
    console.error('[BULK EMAIL PREVIEW] Error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to generate bulk email preview' });
  }
});

router.post('/bulk/send', async (req, res) => {
  const { jobId, kind } = req.body || {};

  if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
    return res.status(400).json({ success: false, error: 'Missing or invalid jobId' });
  }

  const normKind = typeof kind === 'string' ? kind.trim().toLowerCase() : '';
  if (!isValidKind(normKind)) {
    return res.status(400).json({ success: false, error: 'Invalid kind: must be "selected" or "rejected"' });
  }

  const cleanJobId = jobId.trim();

  if (!tryAcquireBulkLock(cleanJobId, normKind)) {
    return res.status(409).json({
      success: false,
      error: 'Bulk email sending is already in progress for this job and kind'
    });
  }

  try {
    const [candidates, job] = await Promise.all([
      getCandidatesByJob(cleanJobId),
      getJob(cleanJobId)
    ]);

    const { toSend, skippedAlreadySent, skippedInvalid } = pickRecipients({
      candidates,
      kind: normKind
    });

    const total = toSend.length + skippedAlreadySent.length + skippedInvalid.length;
    const maxRecipients = getBulkMax();

    if (toSend.length > maxRecipients) {
      return res.status(400).json({
        success: false,
        error: `Recipients count (${toSend.length}) exceeds maximum allowed of ${maxRecipients}`
      });
    }

    if (isDryRun()) {
      console.log(`[BULK EMAIL] DRY RUN enabled for jobId: ${cleanJobId}, kind: ${normKind}, count: ${toSend.length}`);
      return res.json({
        success: true,
        dryRun: true,
        total,
        sent: toSend.length,
        skippedAlreadySent: skippedAlreadySent.length,
        skippedInvalid: skippedInvalid.length,
        failed: 0,
        failures: []
      });
    }

    const jobTitle = job?.title || job?.jobTitle || '';
    const delayMs = getSendDelayMs();
    let sentCount = 0;
    let failedCount = 0;
    const failures = [];

    console.log(`[BULK EMAIL] Starting send for jobId: ${cleanJobId}, kind: ${normKind}, count: ${toSend.length}`);

    for (let i = 0; i < toSend.length; i++) {
      const candidate = toSend[i];
      const emailContent = normKind === 'selected'
        ? renderSelectionEmail({ name: candidate.name, jobTitle })
        : renderRejectionEmail({ name: candidate.name, jobTitle });

      try {
        const sendResult = await sendBulkEmail({
          to: candidate.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });

        if (sendResult && sendResult.success) {
          sentCount++;
          const sentAt = new Date().toISOString();
          await recordCandidateEmailSent(candidate.candidateId, cleanJobId, normKind, sentAt);
          console.log(`[BULK EMAIL] Sent email for candidateId: ${candidate.candidateId}`);
        } else {
          failedCount++;
          failures.push({
            candidateId: candidate.candidateId,
            reason: 'Failed to deliver email'
          });
          console.warn(`[BULK EMAIL] Delivery failed for candidateId: ${candidate.candidateId}`);
        }
      } catch (_err) {
        failedCount++;
        failures.push({
          candidateId: candidate.candidateId,
          reason: 'Failed to deliver email'
        });
        console.warn(`[BULK EMAIL] Exception during send for candidateId: ${candidate.candidateId}`);
      }

      if (i < toSend.length - 1) {
        await sleep(delayMs);
      }
    }

    return res.json({
      success: true,
      dryRun: false,
      total,
      sent: sentCount,
      skippedAlreadySent: skippedAlreadySent.length,
      skippedInvalid: skippedInvalid.length,
      failed: failedCount,
      failures
    });
  } catch (error) {
    console.error('[BULK EMAIL] Fatal error during send for jobId:', cleanJobId, error.message);
    return res.status(500).json({ success: false, error: 'Internal error processing bulk email' });
  } finally {
    releaseBulkLock(cleanJobId, normKind);
  }
});

export default router;

