/**
 * Email templates for bulk candidate communications.
 * Pure functions: no external dependencies, no LLM calls.
 */

/**
 * Sanitizes candidate name:
 * - strips control characters and line breaks
 * - collapses whitespace
 * - clamps to 100 characters
 * - falls back to "Candidate" if empty
 *
 * @param {any} raw
 * @returns {string}
 */
export function sanitizeName(raw) {
  if (typeof raw !== 'string') return 'Candidate';
  // Strip control characters (\x00-\x1F, \x7F-\x9F) and line breaks (\r, \n)
  const stripped = raw.replace(/[\r\n\x00-\x1F\x7F-\x9F]/g, ' ');
  // Collapse whitespace
  const collapsed = stripped.replace(/\s+/g, ' ').trim();
  if (!collapsed) return 'Candidate';
  const clamped = collapsed.slice(0, 100).trim();
  return clamped || 'Candidate';
}

/**
 * Escapes characters for safe HTML inclusion: &, <, >, ", '
 *
 * @param {any} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resolves and normalizes company name.
 * Falls back to process.env.COMPANY_NAME or empty string if not set.
 *
 * @param {string} [companyName]
 * @returns {string}
 */
export function resolveCompanyName(companyName) {
  if (typeof companyName === 'string' && companyName.trim()) {
    return companyName.replace(/[\r\n\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').slice(0, 100).trim();
  }
  const envCompany = process.env.COMPANY_NAME;
  if (typeof envCompany === 'string' && envCompany.trim()) {
    return envCompany.replace(/[\r\n\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').slice(0, 100).trim();
  }
  return '';
}

/**
 * Normalizes job title (optional).
 *
 * @param {string} [jobTitle]
 * @returns {string}
 */
export function resolveJobTitle(jobTitle) {
  if (typeof jobTitle !== 'string') return '';
  return jobTitle.replace(/[\r\n\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').slice(0, 100).trim();
}

/**
 * Renders a selection email for a candidate.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} [params.jobTitle]
 * @param {string} [params.companyName]
 * @returns {{ subject: string, text: string, html: string }}
 */
export function renderSelectionEmail({ name, jobTitle, companyName } = {}) {
  const safeName = sanitizeName(name);
  const company = resolveCompanyName(companyName);
  const title = resolveJobTitle(jobTitle);

  const subject = title
    ? `Congratulations: you have been selected for ${title}`
    : 'Congratulations: you have been selected';

  let positionPhrase;
  if (title) {
    positionPhrase = company
      ? `the ${title} position at ${company}`
      : `the ${title} position`;
  } else {
    positionPhrase = company
      ? `a position at ${company}`
      : 'a position';
  }

  const signOff = company || 'The hiring team';

  const text = [
    `Dear ${safeName},`,
    '',
    `Congratulations! We are pleased to inform you that you have been selected for ${positionPhrase}.`,
    '',
    'Our team was impressed by your skills and experience throughout the recruitment process. We will be in touch shortly regarding the next steps.',
    '',
    'Best regards,',
    signOff
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <div style="background-color: #2563EB; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">${escapeHtml(signOff)}</h1>
      </div>
      <div style="padding: 40px; line-height: 1.6; color: #111827; font-size: 16px;">
        <p style="margin: 0 0 16px 0;">Dear ${escapeHtml(safeName)},</p>
        <p style="margin: 0 0 16px 0;">Congratulations! We are pleased to inform you that you have been selected for ${escapeHtml(positionPhrase)}.</p>
        <p style="margin: 0 0 16px 0;">Our team was impressed by your skills and experience throughout the recruitment process. We will be in touch shortly regarding the next steps.</p>
        <p style="margin: 0;">Best regards,<br>${escapeHtml(signOff)}</p>
      </div>
      <div style="background-color: #f9fafb; color: #6b7280; padding: 25px; text-align: center; font-size: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0;">This is an automated message from ${escapeHtml(signOff)}.</p>
        &copy; PreciseHire. All rights reserved.
      </div>
    </div>
  `.trim();

  return { subject, text, html };
}

/**
 * Renders a rejection / application update email for a candidate.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} [params.jobTitle]
 * @param {string} [params.companyName]
 * @returns {{ subject: string, text: string, html: string }}
 */
export function renderRejectionEmail({ name, jobTitle, companyName } = {}) {
  const safeName = sanitizeName(name);
  const company = resolveCompanyName(companyName);
  const title = resolveJobTitle(jobTitle);

  let subject;
  if (title) {
    subject = company
      ? `Your application for ${title} at ${company}`
      : `Your application for ${title}`;
  } else {
    subject = 'Your application update';
  }

  let positionPhrase;
  if (title) {
    positionPhrase = company
      ? `the ${title} position at ${company}`
      : `the ${title} position`;
  } else {
    positionPhrase = company
      ? `a position at ${company}`
      : 'a position';
  }

  const signOff = company || 'The hiring team';

  const text = [
    `Dear ${safeName},`,
    '',
    `Thank you for your interest in ${positionPhrase}.`,
    '',
    'After careful review of your profile, we have decided not to move forward with your application at this time. We appreciate the time you invested in this process and wish you the best in your career search.',
    '',
    'Best regards,',
    signOff
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <div style="background-color: #2563EB; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">${escapeHtml(signOff)}</h1>
      </div>
      <div style="padding: 40px; line-height: 1.6; color: #111827; font-size: 16px;">
        <p style="margin: 0 0 16px 0;">Dear ${escapeHtml(safeName)},</p>
        <p style="margin: 0 0 16px 0;">Thank you for your interest in ${escapeHtml(positionPhrase)}.</p>
        <p style="margin: 0 0 16px 0;">After careful review of your profile, we have decided not to move forward with your application at this time. We appreciate the time you invested in this process and wish you the best in your career search.</p>
        <p style="margin: 0;">Best regards,<br>${escapeHtml(signOff)}</p>
      </div>
      <div style="background-color: #f9fafb; color: #6b7280; padding: 25px; text-align: center; font-size: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0;">This is an automated message from ${escapeHtml(signOff)}.</p>
        &copy; PreciseHire. All rights reserved.
      </div>
    </div>
  `.trim();

  return { subject, text, html };
}
