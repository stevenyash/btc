import nodemailer from 'nodemailer';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface SendMailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

interface Mailer {
  sendMail: (recEmail: string, subject: string, msg: string) => Promise<SendMailResult>;
}

const mailer: Mailer = {
  sendMail: async function (recEmail: string, subject: string, msg: string): Promise<SendMailResult> {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || '',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USERNAME || '',
        pass: process.env.MAIL_PASSWORD || ''
      }
    });

    const sender = `"${process.env.MAIL_SENDER_NAME || 'Sender'}" <${process.env.MAIL_SENDER_EMAIL || ''}>`;

    const mailOptions: MailOptions = {
      from: sender,
      to: recEmail,
      subject: subject,
      html: msg
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  }
};

export default mailer;