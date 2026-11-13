import {
  sanitizeName,
  escapeHtml,
  resolveCompanyName,
  resolveJobTitle,
  renderSelectionEmail,
  renderRejectionEmail
} from '../utils/emailTemplates.js';

describe('emailTemplates.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.COMPANY_NAME;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sanitizeName', () => {
    test('substitutes normal names cleanly', () => {
      expect(sanitizeName('Alice Smith')).toBe('Alice Smith');
    });

    test('strips newlines and header-injection attempts', () => {
      const injectionAttempt = 'Bob\r\nBcc: evil@example.com\r\n';
      const sanitized = sanitizeName(injectionAttempt);
      expect(sanitized).toBe('Bob Bcc: evil@example.com');
      expect(sanitized).not.toContain('\r');
      expect(sanitized).not.toContain('\n');
    });

    test('collapses excessive whitespace and clamps length to 100 characters', () => {
      const longName = '   John     Jacob    ' + 'A'.repeat(120);
      const sanitized = sanitizeName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(100);
      expect(sanitized).not.toMatch(/\s{2,}/);
    });

    test('falls back to "Candidate" on empty, whitespace, or invalid inputs', () => {
      expect(sanitizeName('')).toBe('Candidate');
      expect(sanitizeName('   ')).toBe('Candidate');
      expect(sanitizeName('\r\n\t')).toBe('Candidate');
      expect(sanitizeName(null)).toBe('Candidate');
      expect(sanitizeName(undefined)).toBe('Candidate');
      expect(sanitizeName(123)).toBe('Candidate');
    });
  });

  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      const input = '<script>alert("xss" & \'hack\')</script>';
      const escaped = escapeHtml(input);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;hack&#39;)&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
    });
  });

  describe('resolveCompanyName', () => {
    test('returns cleaned companyName argument when provided', () => {
      expect(resolveCompanyName('  Acme Corp  ')).toBe('Acme Corp');
    });

    test('returns process.env.COMPANY_NAME when argument is not provided', () => {
      process.env.COMPANY_NAME = 'Env Enterprises';
      expect(resolveCompanyName()).toBe('Env Enterprises');
    });

    test('prefers argument over process.env.COMPANY_NAME', () => {
      process.env.COMPANY_NAME = 'Env Enterprises';
      expect(resolveCompanyName('Override Corp')).toBe('Override Corp');
    });

    test('returns empty string when neither is set or input is empty', () => {
      expect(resolveCompanyName()).toBe('');
      expect(resolveCompanyName('')).toBe('');
      expect(resolveCompanyName('   ')).toBe('');
      expect(resolveCompanyName(null)).toBe('');
      expect(resolveCompanyName(undefined)).toBe('');
    });

    test('sanitizes control characters and clamps to 100 characters', () => {
      const dirty = 'Company\r\nName\t' + 'X'.repeat(120);
      const resolved = resolveCompanyName(dirty);
      expect(resolved).not.toContain('\r');
      expect(resolved).not.toContain('\n');
      expect(resolved.length).toBeLessThanOrEqual(100);
    });
  });

  describe('resolveJobTitle', () => {
    test('sanitizes and trims job title', () => {
      expect(resolveJobTitle('  Software Engineer\r\n  ')).toBe('Software Engineer');
      expect(resolveJobTitle(null)).toBe('');
      expect(resolveJobTitle(undefined)).toBe('');
    });
  });

  describe('renderSelectionEmail', () => {
    test('renders selection email with name, jobTitle, and companyName', () => {
      const email = renderSelectionEmail({
        name: 'Jane Doe',
        jobTitle: 'Senior Full Stack Engineer',
        companyName: 'Acme Corp'
      });

      expect(email.subject).toBe('Congratulations: you have been selected for Senior Full Stack Engineer');
      expect(email.subject).not.toContain('Job Offer');
      expect(email.text).toContain('Dear Jane Doe,');
      expect(email.text).toContain('selected for the Senior Full Stack Engineer position at Acme Corp.');
      expect(email.text).toContain('Best regards,\nAcme Corp');
      expect(email.html).toContain('Dear Jane Doe,');
      expect(email.html).toContain('Acme Corp');
      expect(email.html).not.toContain('Job Offer');
    });

    test('renders selection email with jobTitle and WITHOUT companyName', () => {
      const email = renderSelectionEmail({
        name: 'Jane Doe',
        jobTitle: 'Senior Full Stack Engineer'
      });

      expect(email.subject).toBe('Congratulations: you have been selected for Senior Full Stack Engineer');
      expect(email.subject).not.toContain('Job Offer');
      expect(email.text).toContain('Dear Jane Doe,');
      expect(email.text).toContain('selected for the Senior Full Stack Engineer position.');
      expect(email.text).not.toContain('position at');
      expect(email.text).not.toContain('at the hiring team');
      expect(email.text).toContain('Best regards,\nThe hiring team');
      expect(email.html).toContain('The hiring team');
      expect(email.html).not.toContain('Job Offer');
    });

    test('never includes the words "Job Offer" under any configuration', () => {
      const withCompany = renderSelectionEmail({
        name: 'Sam',
        jobTitle: 'Architect',
        companyName: 'Acme Corp'
      });
      expect(withCompany.subject).not.toMatch(/job\s*offer/i);
      expect(withCompany.text).not.toMatch(/job\s*offer/i);
      expect(withCompany.html).not.toMatch(/job\s*offer/i);

      const withoutCompany = renderSelectionEmail({
        name: 'Sam',
        jobTitle: 'Architect'
      });
      expect(withoutCompany.subject).not.toMatch(/job\s*offer/i);
      expect(withoutCompany.text).not.toMatch(/job\s*offer/i);
      expect(withoutCompany.html).not.toMatch(/job\s*offer/i);

      const noTitle = renderSelectionEmail({
        name: 'Sam'
      });
      expect(noTitle.subject).not.toMatch(/job\s*offer/i);
      expect(noTitle.text).not.toMatch(/job\s*offer/i);
      expect(noTitle.html).not.toMatch(/job\s*offer/i);
    });

    test('handles header injection attempt in name safely without newlines', () => {
      const email = renderSelectionEmail({
        name: 'Bob\r\nBcc: attacker@example.com',
        jobTitle: 'Backend Dev',
        companyName: 'Acme Corp'
      });

      expect(email.subject).not.toContain('\r');
      expect(email.subject).not.toContain('\n');
      expect(email.text).toContain('Dear Bob Bcc: attacker@example.com,');
      expect(email.text).not.toContain('\r');
      expect(email.text).not.toMatch(/Bob\r?\nBcc:/);
    });

    test('escapes HTML script tags in candidate name in HTML output', () => {
      const email = renderSelectionEmail({
        name: '<script>alert(1)</script>',
        jobTitle: 'Security Analyst'
      });

      expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(email.html).not.toContain('<script>alert(1)</script>');
    });

    test('falls back to "Candidate" when name is empty', () => {
      const email = renderSelectionEmail({
        name: '   ',
        jobTitle: 'Designer'
      });

      expect(email.text).toContain('Dear Candidate,');
      expect(email.html).toContain('Dear Candidate,');
    });

    test('handles missing jobTitle gracefully with companyName', () => {
      const email = renderSelectionEmail({
        name: 'Carlos',
        companyName: 'Tech Innovators'
      });

      expect(email.subject).toBe('Congratulations: you have been selected');
      expect(email.text).toContain('selected for a position at Tech Innovators.');
      expect(email.text).toContain('Best regards,\nTech Innovators');
      expect(email.html).toContain('selected for a position at Tech Innovators');
    });

    test('handles missing jobTitle gracefully WITHOUT companyName', () => {
      const email = renderSelectionEmail({
        name: 'Carlos'
      });

      expect(email.subject).toBe('Congratulations: you have been selected');
      expect(email.text).toContain('selected for a position.');
      expect(email.text).not.toContain('position at');
      expect(email.text).not.toContain('at the hiring team');
      expect(email.text).toContain('Best regards,\nThe hiring team');
      expect(email.html).toContain('selected for a position.');
      expect(email.html).toContain('The hiring team');
    });

    test('resolves companyName from process.env.COMPANY_NAME or defaults to "The hiring team"', () => {
      const defaultEmail = renderSelectionEmail({ name: 'Sam' });
      expect(defaultEmail.subject).toBe('Congratulations: you have been selected');
      expect(defaultEmail.text).toContain('selected for a position.');
      expect(defaultEmail.text).not.toContain('at the hiring team');
      expect(defaultEmail.text).toContain('Best regards,\nThe hiring team');

      process.env.COMPANY_NAME = 'Global Systems';
      const envEmail = renderSelectionEmail({ name: 'Sam' });
      expect(envEmail.subject).toBe('Congratulations: you have been selected');
      expect(envEmail.text).toContain('selected for a position at Global Systems.');
      expect(envEmail.text).toContain('Best regards,\nGlobal Systems');
    });

    test('contains no unreplaced placeholders or undefined tokens', () => {
      const email = renderSelectionEmail({
        name: 'Maya',
        jobTitle: 'QA Engineer',
        companyName: 'Innovate'
      });

      expect(email.text).not.toContain('{');
      expect(email.text).not.toContain('}');
      expect(email.text).not.toContain('undefined');
      expect(email.text).not.toContain('null');
      expect(email.html).not.toContain('{');
      expect(email.html).not.toContain('}');
      expect(email.html).not.toContain('undefined');
    });
  });

  describe('renderRejectionEmail', () => {
    test('renders rejection email with name, jobTitle, and companyName', () => {
      const email = renderRejectionEmail({
        name: 'Jane Doe',
        jobTitle: 'Senior Full Stack Engineer',
        companyName: 'Acme Corp'
      });

      expect(email.subject).toBe('Your application for Senior Full Stack Engineer at Acme Corp');
      expect(email.text).toContain('Dear Jane Doe,');
      expect(email.text).toContain('Thank you for your interest in the Senior Full Stack Engineer position at Acme Corp.');
      expect(email.text).toContain('we have decided not to move forward');
      expect(email.text).toContain('Best regards,\nAcme Corp');
      expect(email.html).toContain('Dear Jane Doe,');
      expect(email.html).toContain('Acme Corp');
    });

    test('renders rejection email with jobTitle and WITHOUT companyName', () => {
      const email = renderRejectionEmail({
        name: 'Jane Doe',
        jobTitle: 'Senior Full Stack Engineer'
      });

      expect(email.subject).toBe('Your application for Senior Full Stack Engineer');
      expect(email.text).toContain('Dear Jane Doe,');
      expect(email.text).toContain('Thank you for your interest in the Senior Full Stack Engineer position.');
      expect(email.text).not.toContain('position at');
      expect(email.text).not.toContain('at the hiring team');
      expect(email.text).toContain('Best regards,\nThe hiring team');
      expect(email.html).toContain('The hiring team');
    });

    test('handles header injection attempt in name safely', () => {
      const email = renderRejectionEmail({
        name: 'Eve\r\nCc: secret@example.com',
        jobTitle: 'Lead Architect'
      });

      expect(email.text).toContain('Dear Eve Cc: secret@example.com,');
      expect(email.text).not.toContain('\r');
      expect(email.text).not.toMatch(/Eve\r?\nCc:/);
    });

    test('escapes HTML tags in candidate name in HTML output', () => {
      const email = renderRejectionEmail({
        name: '<b>Injected</b>',
        jobTitle: 'Frontend Dev'
      });

      expect(email.html).toContain('&lt;b&gt;Injected&lt;/b&gt;');
      expect(email.html).not.toContain('<b>Injected</b>');
    });

    test('falls back to "Candidate" when name is empty', () => {
      const email = renderRejectionEmail({
        name: null
      });

      expect(email.text).toContain('Dear Candidate,');
      expect(email.html).toContain('Dear Candidate,');
    });

    test('handles missing jobTitle gracefully with companyName', () => {
      const email = renderRejectionEmail({
        name: 'Alex',
        companyName: 'Tech Innovators'
      });

      expect(email.subject).toBe('Your application update');
      expect(email.text).toContain('Thank you for your interest in a position at Tech Innovators.');
      expect(email.text).toContain('Best regards,\nTech Innovators');
      expect(email.html).toContain('Tech Innovators');
    });

    test('handles missing jobTitle gracefully WITHOUT companyName', () => {
      const email = renderRejectionEmail({
        name: 'Alex'
      });

      expect(email.subject).toBe('Your application update');
      expect(email.text).toContain('Thank you for your interest in a position.');
      expect(email.text).not.toContain('at the hiring team');
      expect(email.text).toContain('Best regards,\nThe hiring team');
      expect(email.html).toContain('The hiring team');
    });

    test('resolves companyName from process.env.COMPANY_NAME or defaults to "The hiring team"', () => {
      const defaultEmail = renderRejectionEmail({ name: 'Sam', jobTitle: 'DevOps Engineer' });
      expect(defaultEmail.subject).toBe('Your application for DevOps Engineer');
      expect(defaultEmail.text).toContain('interest in the DevOps Engineer position.');
      expect(defaultEmail.text).not.toContain('at the hiring team');
      expect(defaultEmail.text).toContain('Best regards,\nThe hiring team');

      process.env.COMPANY_NAME = 'Global Systems';
      const envEmail = renderRejectionEmail({ name: 'Sam', jobTitle: 'DevOps Engineer' });
      expect(envEmail.subject).toBe('Your application for DevOps Engineer at Global Systems');
      expect(envEmail.text).toContain('interest in the DevOps Engineer position at Global Systems.');
      expect(envEmail.text).toContain('Best regards,\nGlobal Systems');
    });

    test('contains no unreplaced placeholders or undefined tokens', () => {
      const email = renderRejectionEmail({
        name: 'David',
        jobTitle: 'Data Scientist'
      });

      expect(email.text).not.toContain('{');
      expect(email.text).not.toContain('}');
      expect(email.text).not.toContain('undefined');
      expect(email.text).not.toContain('null');
      expect(email.html).not.toContain('{');
      expect(email.html).not.toContain('}');
      expect(email.html).not.toContain('undefined');
    });
  });
});
