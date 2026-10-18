import axios from 'axios';
import http from 'node:http';
import https from 'node:https';
import { createSafeLookup, validateResumeUrl } from '../utils/urlSafety.js';

const safeLookup = createSafeLookup();

const httpAgent = new http.Agent({
  lookup: safeLookup,
  keepAlive: false
});

const httpsAgent = new https.Agent({
  lookup: safeLookup,
  keepAlive: false
});

export async function fetchResume(url) {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid resume URL: URL must be a non-empty string');
    }

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

    // Validate final URL after rewriting
    validateResumeUrl(downloadUrl);

    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
      maxRedirects: 3,
      httpAgent,
      httpsAgent,
      beforeRedirect: (options, responseDetails) => {
        let redirectUrl = options.href;
        if (!redirectUrl && options.protocol && options.hostname) {
          redirectUrl = `${options.protocol}//${options.hostname}${options.path || ''}`;
        }
        if (!redirectUrl && responseDetails?.headers?.location) {
          try {
            redirectUrl = new URL(responseDetails.headers.location, downloadUrl).toString();
          } catch {
            redirectUrl = responseDetails.headers.location;
          }
        }
        if (redirectUrl) {
          validateResumeUrl(redirectUrl);
        }
      },
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
    let genericReason = 'network error';
    const msg = error.message || '';
    if (msg.includes('blocked') || msg.includes('Invalid resume URL') || msg.includes('private')) {
      genericReason = 'blocked url: private address or unsupported scheme';
    } else if (msg.includes('timeout') || error.code === 'ECONNABORTED') {
      genericReason = 'request timeout';
    } else if (msg.includes('maxContentLength') || msg.includes('maxBodyLength')) {
      genericReason = 'response size limit exceeded';
    } else if (msg.includes('maxRedirects')) {
      genericReason = 'too many redirects';
    }

    console.error(`Failed to fetch resume: ${genericReason}`);
    return {
      success: false,
      buffer: null,
      error: genericReason
    };
  }
}

