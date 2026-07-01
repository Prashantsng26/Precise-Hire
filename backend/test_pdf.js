import { extractText } from './services/textExtractor.js';

async function run() {
  try {
    const res = await extractText(Buffer.from("%PDF-1.4..."), "application/pdf");
    console.log("Result:", res);
  } catch (e) {
    console.error("Exception:", e);
  }
}

run();
