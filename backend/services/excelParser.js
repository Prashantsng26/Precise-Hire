import xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

export function parseExcel(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  const candidates = data.map(row => {
    // Helper to find column by name (case-insensitive)
    const getVal = (keys) => {
      const key = Object.keys(row).find(k => keys.includes(k.toLowerCase()));
      return key ? row[key] : null;
    };

    const name = getVal(['name', 'candidate name', 'full name']);
    const email = getVal(['email', 'email address', 'mail']);
    
    if (!name || !email) return null;

    return {
      candidateId: uuidv4(),
      name,
      email,
      resumeLink: getVal(['resume link', 'resume', 'cv link', 'cv']),
      phone: getVal(['phone', 'mobile', 'contact', 'phone number']),
      linkedIn: getVal(['linkedin', 'linkedin profile', 'linkedin url']),
      status: 'pending',
      role: null,
      resumeText: null,
      createdAt: new Date().toISOString()
    };
  }).filter(c => c !== null);

  return candidates;
}
