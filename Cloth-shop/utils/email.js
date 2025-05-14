const nodemailer = require('nodemailer');
const AppError = require('./appError');

const sendEmail = async (options) => {
  try {
    // 1) Create transporter using .env settings
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for 587
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // 2) Verify connection
    await transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP Connection Error:', error);
        throw new AppError('Failed to connect to email server', 500);
      } else {
        console.log('✅ SMTP server is ready to send messages');
      }
    });

    // 3) Define email options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Support'}" <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`
    };

    // 4) Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Message sent to ${options.email} | ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('❌ Email sending error:', err);
    throw new AppError('There was an error sending the email. Try again later!', 500);
  }
};

module.exports = sendEmail;
