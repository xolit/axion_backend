require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Verify SMTP connection on server startup
transporter
  .verify()
  .then(() => console.log("✅ Email server is ready"))
  .catch((err) => console.error("❌ Email server error:", err.message));

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to
 * @param {string} [options.subject]
 * @param {string} [options.text]
 * @param {string} [options.html]
 */
async function sendEmail({ to, subject = "No Subject", text = "", html = "" }) {
  try {
    const info = await transporter.sendMail({
      from: "Axion Team",
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error("❌ Email failed:", err.message);

    throw new Error(`Failed to send email: ${err.message}`);
  }
}

module.exports = sendEmail;
