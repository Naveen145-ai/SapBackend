const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html });
}

module.exports = { sendEmail }; 