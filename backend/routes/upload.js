import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { parseExcel, ExcelRowLimitError } from '../services/excelParser.js';
import { s3Client } from '../config/awsConfig.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { saveCandidates } from '../services/dynamoService.js';
import {
  assertAllowedUpload,
  clampField,
  isValidEmail,
  normalizeEmail
} from '../utils/uploadValidation.js';
import { validateResumeUrl } from '../utils/urlSafety.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    // Assert file kind and extension match accepted spreadsheet formats
    assertAllowedUpload({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    const candidates = parseExcel(req.file.buffer);
    
    // If no valid candidates found, return error (handles malformed/empty Excel)
    if (!candidates || candidates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid candidates found in the uploaded file. Ensure the Excel file has Name and Email columns.',
        count: 0,
        candidates: []
      });
    }

    const validCandidates = [];
    const allSkipped = [];
    const seenEmails = new Set();

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const row = i + 2;

      // Clamp fields
      c.name = clampField(c.name, 200);
      c.email = clampField(c.email, 254);
      if (c.resumeLink) {
        c.resumeLink = clampField(c.resumeLink, 2048);
      }

      // 1. Email validation
      if (!isValidEmail(c.email)) {
        allSkipped.push({ row, reason: 'invalid email' });
        continue;
      }

      // 2. Resume URL validation
      let validResume = false;
      try {
        if (c.resumeLink) {
          validateResumeUrl(c.resumeLink);
          validResume = true;
        }
      } catch {
        validResume = false;
      }

      if (!validResume) {
        allSkipped.push({ row, reason: 'invalid resume link' });
        continue;
      }

      // 3. Deduplication by lowercase email within the same upload (keep first occurrence)
      const normEmail = normalizeEmail(c.email);
      if (seenEmails.has(normEmail)) {
        allSkipped.push({ row, reason: 'duplicate email' });
        continue;
      }
      seenEmails.add(normEmail);

      validCandidates.push(c);
    }

    if (validCandidates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid candidates found in the uploaded file. Ensure the Excel file has Name and Email columns.',
        count: 0,
        candidates: [],
        skipped: allSkipped.slice(0, 50),
        skippedCount: allSkipped.length
      });
    }

    const jobId = uuidv4();
    const timestamp = Date.now();
    const key = `uploads/${jobId}/${timestamp}.xlsx`;

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));

    // Save to DynamoDB
    await saveCandidates(validCandidates, jobId);

    res.json({
      success: true,
      jobId,
      count: validCandidates.length,
      candidates: validCandidates.slice(0, 5), // Preview
      skipped: allSkipped.slice(0, 50),
      skippedCount: allSkipped.length
    });
  } catch (error) {
    if (error instanceof ExcelRowLimitError || error.name === 'ExcelRowLimitError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message && error.message.startsWith('Upload validation failed')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('Upload route error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process upload' });
  }
});

// Multer error handler (e.g. file too large, wrong mime type)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only Excel files are allowed!') {
    return res.status(400).json({ success: false, error: err.message });
  }
  console.error('Multer middleware error:', err.message);
  return res.status(500).json({ success: false, error: 'File upload error' });
});

export default router;
