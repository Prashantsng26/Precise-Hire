import xlsx from 'xlsx';
import { parseExcel, ExcelRowLimitError } from '../services/excelParser.js';

describe('excelParser.js', () => {
  const originalEnv = process.env.UPLOAD_MAX_ROWS;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.UPLOAD_MAX_ROWS = originalEnv;
    } else {
      delete process.env.UPLOAD_MAX_ROWS;
    }
  });

  // Helper to build in-memory workbook buffers without writing to disk
  function createWorkbookBuffer(sheetsData, bookType = 'xlsx') {
    const wb = xlsx.utils.book_new();
    for (const [sheetName, rows] of Object.entries(sheetsData)) {
      const ws = xlsx.utils.aoa_to_sheet(rows);
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
    }
    return xlsx.write(wb, { type: 'buffer', bookType });
  }

  test('normal parse: parses candidates with primary headers', () => {
    const buf = createWorkbookBuffer({
      'Candidates': [
        ['Name', 'Email', 'Resume Link', 'Phone', 'LinkedIn'],
        ['Alice Smith', 'alice@example.com', 'https://example.com/alice.pdf', '1234567890', 'https://linkedin.com/in/alicesmith'],
        ['Bob Jones', 'bob@example.com', 'https://example.com/bob.pdf', '0987654321', 'https://linkedin.com/in/bobjones']
      ]
    });

    const candidates = parseExcel(buf);
    expect(candidates).toHaveLength(2);
    expect(candidates[0].name).toBe('Alice Smith');
    expect(candidates[0].email).toBe('alice@example.com');
    expect(candidates[0].resumeLink).toBe('https://example.com/alice.pdf');
    expect(candidates[0].phone).toBe('1234567890');
    expect(candidates[0].linkedIn).toBe('https://linkedin.com/in/alicesmith');

    expect(candidates[1].name).toBe('Bob Jones');
    expect(candidates[1].email).toBe('bob@example.com');
  });

  test('case-insensitive headers: correctly maps varied case and alternative header names', () => {
    const buf = createWorkbookBuffer({
      'Sheet1': [
        ['  cAnDiDaTe NaMe  ', 'eMaIL aDdReSs', 'CV LINK', 'mobile', 'LINKEDIN PROFILE'],
        ['Carol Danvers', 'carol@example.com', 'https://example.com/carol.pdf', '5551234', 'https://linkedin.com/in/carol']
      ]
    });

    const candidates = parseExcel(buf);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].name).toBe('Carol Danvers');
    expect(candidates[0].email).toBe('carol@example.com');
    expect(candidates[0].resumeLink).toBe('https://example.com/carol.pdf');
    expect(candidates[0].phone).toBe('5551234');
    expect(candidates[0].linkedIn).toBe('https://linkedin.com/in/carol');
  });

  test('only the first sheet is read: ignores data in subsequent sheets', () => {
    const buf = createWorkbookBuffer({
      'FirstSheet': [
        ['Name', 'Email', 'Resume Link'],
        ['First User', 'first@example.com', 'https://example.com/first.pdf']
      ],
      'SecondSheet': [
        ['Name', 'Email', 'Resume Link'],
        ['Second User', 'second@example.com', 'https://example.com/second.pdf']
      ]
    });

    const candidates = parseExcel(buf);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].name).toBe('First User');
    expect(candidates[0].email).toBe('first@example.com');
    expect(candidates.some(c => c.name === 'Second User')).toBe(false);
  });

  test('exactly MAX_ROWS rows passes', () => {
    const testLimit = 5;
    process.env.UPLOAD_MAX_ROWS = String(testLimit);

    const rows = [['Name', 'Email', 'Resume Link']];
    for (let i = 1; i <= testLimit; i++) {
      rows.push([`Candidate ${i}`, `cand${i}@example.com`, `https://example.com/c${i}.pdf`]);
    }

    const buf = createWorkbookBuffer({ 'Sheet1': rows });
    const candidates = parseExcel(buf);

    expect(candidates).toHaveLength(testLimit);
    expect(candidates[0].name).toBe('Candidate 1');
    expect(candidates[testLimit - 1].name).toBe(`Candidate ${testLimit}`);
  });

  test('MAX_ROWS+1 rows is rejected with ExcelRowLimitError', () => {
    const testLimit = 5;
    process.env.UPLOAD_MAX_ROWS = String(testLimit);

    const rows = [['Name', 'Email', 'Resume Link']];
    for (let i = 1; i <= testLimit + 1; i++) {
      rows.push([`Candidate ${i}`, `cand${i}@example.com`, `https://example.com/c${i}.pdf`]);
    }

    const buf = createWorkbookBuffer({ 'Sheet1': rows });

    expect(() => {
      parseExcel(buf);
    }).toThrow(ExcelRowLimitError);

    try {
      parseExcel(buf);
    } catch (err) {
      expect(err).toBeInstanceOf(ExcelRowLimitError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe(`Sheet has more than ${testLimit} rows; split the file`);
    }
  });

  test('returns empty array when buffer is empty or workbook has no sheets', () => {
    expect(parseExcel(Buffer.alloc(0))).toEqual([]);
    expect(parseExcel(null)).toEqual([]);
    expect(parseExcel(undefined)).toEqual([]);
  });
});
