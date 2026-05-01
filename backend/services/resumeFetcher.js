import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export async function fetchResume(url) {
  try {
    let downloadUrl = url;

    // Handle Google Drive
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}&confirm=t`;
      }
    }

    // Handle Dropbox
    if (url.includes('dropbox.com')) {
      downloadUrl = url.replace('?dl=0', '?dl=1');
    }
    
    // Handle Local File System
    if (url.startsWith('file://')) {
      const filePath = decodeURI(url.replace('file://', ''));
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                      ext === '.doc' ? 'application/msword' : 'application/pdf';
      
      console.log(`Local file fetched successfully: ${filePath} (${buffer.length} bytes)`);
      return { success: true, buffer, mimeType };
    }

    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const mimeType = response.headers['content-type'] || 'application/pdf';
    
    return {
      success: true,
      buffer: Buffer.from(response.data),
      mimeType
    };
  } catch (error) {
    console.error(`Failed to fetch resume from ${url}:`, error.message);
    return {
      success: false,
      buffer: null,
      error: error.message
    };
  }
}
