import { sesClient } from '../config/awsConfig.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { generateEmailBody } from './nvidiaService.js';

export async function sendEmail(to, subject, bodyText) {
  const params = {
    Destination: { ToAddresses: [to] },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #2563EB; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">PreciseHire</h1>
              </div>
              <div style="padding: 30px; line-height: 1.6; color: #374151;">
                ${bodyText.replace(/\n/g, '<br>')}
              </div>
              <div style="background-color: #f9fafb; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
                &copy; 2024 PreciseHire. All rights reserved.
              </div>
            </div>
          `
        }
      },
      Subject: { Charset: 'UTF-8', Data: subject }
    },
    Source: process.env.AWS_SES_SENDER
  };

  try {
    console.log(`Attempting to send email to: ${to} from: ${process.env.AWS_SES_SENDER}`);
    const result = await sesClient.send(new SendEmailCommand(params));
    console.log(`SES Send Success: ${result.MessageId}`);
    return { success: true };
  } catch (error) {
    console.error('SES sendEmail error details:', {
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
      to,
      source: process.env.AWS_SES_SENDER
    });
    return { success: false, error: error.message };
  }
}

export async function sendInterviewInvites(candidates, details) {
  const results = { sent: 0, failed: 0, errors: [] };
  for (const candidate of candidates) {
    try {
      console.log(`Generating interview email for ${candidate.name}...`);
      const body = await generateEmailBody('interview', {
        candidateName: candidate.name,
        jobTitle: details.jobTitle,
        date: details.date,
        time: details.time,
        meetLink: details.meetLink
      });
      console.log(`Email body generated for ${candidate.name}. Sending...`);
      const res = await sendEmail(candidate.email, `Interview Invitation - ${details.jobTitle}`, body);
      if (res.success) {
        results.sent++;
      } else {
        console.error(`Failed to send email to ${candidate.email}: ${res.error}`);
        throw new Error(res.error);
      }
    } catch (e) {
      results.failed++;
      results.errors.push({ candidate: candidate.email, error: e.message });
      console.error(`Error in sendInterviewInvites for ${candidate.email}:`, e.message);
    }
  }
  return results;
}

export async function sendAssessmentLinks(candidates, details) {
  const results = { sent: 0, failed: 0, errors: [] };
  for (const candidate of candidates) {
    try {
      const body = await generateEmailBody('assessment', {
        candidateName: candidate.name,
        jobTitle: details.jobTitle,
        assessmentUrl: details.assessmentUrl,
        deadline: details.deadline
      });
      const res = await sendEmail(candidate.email, `Assessment - ${details.jobTitle}`, body);
      if (res.success) results.sent++;
      else throw new Error(res.error);
    } catch (e) {
      results.failed++;
      results.errors.push({ candidate: candidate.email, error: e.message });
    }
  }
  return results;
}

export async function sendOfferLetters(candidates, details) {
  const results = { sent: 0, failed: 0, errors: [] };
  for (const candidate of candidates) {
    try {
      const body = await generateEmailBody('offer', {
        candidateName: candidate.name,
        jobTitle: details.jobTitle,
        joiningDate: details.joiningDate
      });
      const res = await sendEmail(candidate.email, `Job Offer - ${details.jobTitle}`, body);
      if (res.success) results.sent++;
      else throw new Error(res.error);
    } catch (e) {
      results.failed++;
      results.errors.push({ candidate: candidate.email, error: e.message });
    }
  }
  return results;
}
