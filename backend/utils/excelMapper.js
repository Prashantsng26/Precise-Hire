import { v4 as uuidv4 } from 'uuid';

/**
 * Maps a single row object from Excel to a candidate database structure.
 * Returns null if name or email is missing.
 * @param {Object} row - Raw row object from excel sheet_to_json
 * @returns {Object|null}
 */
export function mapExcelRow(row) {
  if (!row || typeof row !== 'object') return null;

  const getVal = (keys) => {
    const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
    return key ? row[key] : null;
  };

  const name = getVal(['name', 'candidate name', 'full name']);
  const email = getVal(['email', 'email address', 'mail']);
  
  if (!name || !email) return null;

  return {
    candidateId: uuidv4(),
    name: String(name).trim(),
    email: String(email).trim(),
    resumeLink: getVal(['resume link', 'resume', 'cv link', 'cv']) ? String(getVal(['resume link', 'resume', 'cv link', 'cv'])).trim() : null,
    phone: getVal(['phone', 'mobile', 'contact', 'phone number']) ? String(getVal(['phone', 'mobile', 'contact', 'phone number'])).trim() : null,
    linkedIn: getVal(['linkedin', 'linkedin profile', 'linkedin url']) ? String(getVal(['linkedin', 'linkedin profile', 'linkedin url'])).trim() : null,
    status: 'pending',
    role: null,
    resumeText: null,
    createdAt: new Date().toISOString()
  };
}

/**
 * Maps an array of row objects to candidates.
 * @param {Array} data - Array of row objects
 * @returns {Array} - Array of mapped candidate objects
 */
export function mapExcelData(data) {
  if (!Array.isArray(data)) return [];
  return data.map(mapExcelRow).filter(c => c !== null);
}
