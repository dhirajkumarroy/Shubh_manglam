import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import logger from '../../config/logger';
import { emailQueue } from '../../queues/email.queue';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Standard utility function to queue email jobs.
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  logger.info(`Queueing email to ${options.to} with subject: ${options.subject}`);
  await emailQueue.add('send_email', options);
};

/**
 * Actual execution of SMTP sending. Invoked by the background worker.
 */
export const sendEmailDirect = async (options: SendEmailOptions): Promise<void> => {
  const { to, subject, text, html } = options;

  // Check if SMTP configuration contains default placeholders
  if (
    !env.SMTP_HOST ||
    !env.SMTP_USER ||
    env.SMTP_USER === 'your-smtp-username' ||
    env.SMTP_PASS === 'your-smtp-password'
  ) {
    logger.warn(
      `[MOCK EMAIL SERVICE] SMTP credentials not fully configured. Email simulated instead of sent.`
    );
    logger.warn(`To:      ${to}`);
    logger.warn(`Subject: ${subject}`);
    logger.warn(`Body:    ${text}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // True for port 465, false otherwise
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};
