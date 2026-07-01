import { mapExcelRow, mapExcelData } from '../utils/excelMapper.js';

describe('excelMapper.js', () => {
  describe('mapExcelRow', () => {
    test('should map valid row with primary headers correctly', () => {
      const row = {
        'name': 'John Doe',
        'email': 'john.doe@example.com',
        'resume link': 'https://example.com/cv.pdf',
        'phone': '1234567890',
        'linkedin': 'https://linkedin.com/in/johndoe'
      };

      const result = mapExcelRow(row);

      expect(result).not.toBeNull();
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.resumeLink).toBe('https://example.com/cv.pdf');
      expect(result.phone).toBe('1234567890');
      expect(result.linkedIn).toBe('https://linkedin.com/in/johndoe');
      expect(result.status).toBe('pending');
      expect(result.candidateId).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    test('should match alternate case-insensitive headers', () => {
      const row = {
        'Candidate Name': '  Jane Smith  ',
        'Email Address': 'jane.smith@example.com',
        'CV': 'https://example.com/jane.pdf',
        'Contact': '987654321',
        'LinkedIn URL': 'https://linkedin.com/in/janesmith'
      };

      const result = mapExcelRow(row);

      expect(result).not.toBeNull();
      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('jane.smith@example.com');
      expect(result.resumeLink).toBe('https://example.com/jane.pdf');
      expect(result.phone).toBe('987654321');
      expect(result.linkedIn).toBe('https://linkedin.com/in/janesmith');
    });

    test('should return null if name is missing', () => {
      const row = {
        'email': 'missing.name@example.com',
        'resume link': 'https://example.com/cv.pdf'
      };
      expect(mapExcelRow(row)).toBeNull();
    });

    test('should return null if email is missing', () => {
      const row = {
        'name': 'Missing Email',
        'resume link': 'https://example.com/cv.pdf'
      };
      expect(mapExcelRow(row)).toBeNull();
    });

    test('should return null for empty/falsy inputs', () => {
      expect(mapExcelRow(null)).toBeNull();
      expect(mapExcelRow(undefined)).toBeNull();
      expect(mapExcelRow({})).toBeNull();
      expect(mapExcelRow('not-an-object')).toBeNull();
    });

    test('should trim string values', () => {
      const row = {
        'name': '  John Doe  ',
        'email': '  john.doe@example.com  ',
        'resume link': '  https://example.com/cv.pdf  '
      };

      const result = mapExcelRow(row);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.resumeLink).toBe('https://example.com/cv.pdf');
    });
  });

  describe('mapExcelData', () => {
    test('should filter out invalid rows and map valid ones', () => {
      const data = [
        { 'name': 'Alice', 'email': 'alice@example.com' },
        { 'email': 'no-name@example.com' }, // Invalid
        { 'name': 'Bob', 'email': 'bob@example.com' },
        { 'name': 'No Email' } // Invalid
      ];

      const result = mapExcelData(data);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
    });

    test('should return empty array for non-array inputs', () => {
      expect(mapExcelData(null)).toEqual([]);
      expect(mapExcelData(undefined)).toEqual([]);
      expect(mapExcelData({})).toEqual([]);
    });
  });
});
