/**
 * Email Service using Nodemailer
 * Sends notification emails for key events
 */
const nodemailer = require('nodemailer');

// Create transporter (configured from env vars)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, html) => {
  try {
    // Skip sending in development if SMTP is not configured
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
      console.log(`📧 [DEV] Email would be sent to ${to}: ${subject}`);
      return { success: true, dev: true };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.STORE_NAME || 'JZ Waters'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('📧 Email failed:', err.message);
    return { success: false, error: err.message };
  }
};

// Email templates
const emailTemplates = {
  passwordReset: (name, resetLink) => ({
    subject: 'Password Reset - JZ Waters',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>💧 JZ Waters</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi ${name},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          </div>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  orderConfirmation: (name, orderId, total) => ({
    subject: `Order #${orderId} Confirmed - JZ Waters`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>💧 JZ Waters</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi ${name},</p>
          <p>Your order <strong>#${orderId}</strong> has been placed successfully!</p>
          <p>Total: <strong>₱${Number(total).toFixed(2)}</strong></p>
          <p>We'll notify you when your order is out for delivery.</p>
        </div>
      </div>
    `,
  }),

  orderStatusUpdate: (name, orderId, status) => ({
    subject: `Order #${orderId} Update - JZ Waters`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>💧 JZ Waters</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi ${name},</p>
          <p>Your order <strong>#${orderId}</strong> status has been updated to: <strong>${status}</strong></p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
