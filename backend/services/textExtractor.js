import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { textractClient } from '../config/awsConfig.js';
import { DetectDocumentTextCommand } from '@aws-sdk/client-textract';

export async function extractText(buffer, mimeType) {
  try {
    const isPdf = mimeType.includes('pdf') || buffer.slice(0, 4).toString() === '%PDF';
    
    if (isPdf) {
      // Step 1: Try pdf-parse
      try {
        const data = await pdf(buffer);
        if (data.text && data.text.trim().length > 150) {
          return { text: data.text, method: 'pdf-parse', success: true };
        }
      } catch (e) {
        console.log('pdf-parse failed, falling back to Textract');
      }

      // Step 2: Fallback to Textract
      try {
        const command = new DetectDocumentTextCommand({
          Document: { Bytes: buffer }
        });
        const response = await textractClient.send(command);
        const text = response.Blocks
          .filter(b => b.BlockType === 'LINE')
          .map(b => b.Text)
          .join('\n');
        
        return { text, method: 'textract', success: true };
      } catch (e) {
        console.error('Textract extraction failed:', e.message);
      }
    }

    if (mimeType.includes('officedocument.wordprocessingml.document') || mimeType.includes('msword')) {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, method: 'mammoth', success: true };
    }

    return { success: false, text: '', error: 'Unsupported file type' };
  } catch (error) {
    console.error('Extraction error:', error.message);
    return { success: false, text: '', error: error.message };
  }
}
