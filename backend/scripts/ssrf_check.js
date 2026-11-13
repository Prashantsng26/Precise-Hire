import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchResume } from '../services/resumeFetcher.js';

async function runCheck() {
  console.log('=== SSRF & LOCAL FILE INCLUSION VERIFICATION ===\n');

  // Create a harmless temporary file in OS temp directory (NEVER touch .env)
  const tempFilePath = path.join(os.tmpdir(), `ssrf_verification_test_${Date.now()}.txt`);
  fs.writeFileSync(tempFilePath, 'HARMLESS_VERIFICATION_CONTENT', 'utf-8');
  const tempFileUrl = pathToFileURL(tempFilePath).href;

  const testCases = [
    { label: 'file:///etc/passwd', url: 'file:///etc/passwd' },
    { label: `file://${tempFilePath} (harmless temp file)`, url: tempFileUrl },
    { label: 'http://127.0.0.1:3000 (loopback IP)', url: 'http://127.0.0.1:3000' },
    { label: 'http://localhost:3000 (localhost hostname)', url: 'http://localhost:3000' },
    { label: 'http://169.254.169.254/latest/meta-data/ (AWS metadata IP)', url: 'http://169.254.169.254/latest/meta-data/' }
  ];

  let allPassed = true;

  try {
    for (const { label, url } of testCases) {
      const res = await fetchResume(url);

      // PASS condition: fetch must fail (success === false) and return NO buffer
      if (res && res.success === false && res.buffer === null) {
        console.log(`PASS: ${label}`);
        console.log(`      Reason: ${res.error}\n`);
      } else {
        console.log(`FAIL: ${label}`);
        console.log(`      Unexpected result: success=${res?.success}, buffer=${res?.buffer ? 'PRESENT' : 'null'}\n`);
        allPassed = false;
      }
    }
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }

  console.log('------------------------------------------------');
  if (allPassed) {
    console.log('RESULT: ALL 5 SSRF & LOCAL FILE INCLUSION CHECKS PASSED');
    process.exit(0);
  } else {
    console.error('RESULT: AT LEAST ONE CHECK FAILED');
    process.exit(1);
  }
}

runCheck().catch((err) => {
  console.error('Unexpected script failure:', err.message);
  process.exit(1);
});
