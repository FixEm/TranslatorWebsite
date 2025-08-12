import "dotenv/config";
import nodemailer from "nodemailer";

// Create SMTP transporter for Zoho
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.zoho.com",
	port: parseInt(process.env.SMTP_PORT || "465"),
	secure: parseInt(process.env.SMTP_PORT || "465") === 465, // true for 465, false for other ports
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

// Verify SMTP connection with detailed logging
export async function verifyEmailService(): Promise<boolean> {
	try {
		console.log("🔄 Testing SMTP connection with settings:");
		console.log(`  Host: ${process.env.SMTP_HOST}`);
		console.log(`  Port: ${process.env.SMTP_PORT}`);
		console.log(`  User: ${process.env.SMTP_USER}`);
		console.log(`  From: ${process.env.FROM_EMAIL}`);

		await transporter.verify();
		console.log("✅ SMTP server connection verified successfully");
		return true;
	} catch (error) {
		console.error("❌ SMTP server connection failed:");
		console.error("Error details:", error);

		// Provide helpful troubleshooting tips
		console.log("\n🔧 Troubleshooting tips:");
		console.log(
			"1. Make sure you're using an App Password, not your regular password"
		);
		console.log("2. Check if 2-Factor Authentication is enabled in Zoho");
		console.log("3. Verify your email address is correct");
		console.log("4. Try using port 465 with SSL instead of 587 with STARTTLS");

		return false;
	}
}

// Send email verification email
export async function sendVerificationEmail(
	email: string,
	name: string,
	verificationToken: string,
	applicationId: string
): Promise<boolean> {
	try {
		const verificationUrl = `${
			process.env.BASE_URL || "http://localhost:5000"
		}/api/verify-email?token=${verificationToken}&applicationId=${applicationId}`;

		const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verify Your Student Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          line-height: 1.6;
          color: #222;
          margin: 0;
          padding: 0;
          background-color: #fff;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .header {
          background: #f7f7f7;
          color: #222;
          padding: 40px 30px 20px 30px;
          text-align: center;
          border-bottom: 2px solid #e2e8f0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #222;
        }
        .header .icon {
          font-size: 48px;
          margin-bottom: 16px;
          color: #1976d2;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1976d2;
          font-weight: 600;
        }
        .message {
          font-size: 16px;
          line-height: 1.7;
          color: #444;
          margin-bottom: 30px;
        }
        .verify-button {
          display: inline-block;
          background: #1976d2;
          color: #fff;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          transition: all 0.3s ease;
          margin: 20px 0;
          border: none;
          box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
        }
        .verify-button:hover {
          background: #1565c0;
          box-shadow: 0 8px 25px rgba(25, 118, 210, 0.15);
        }
        .verification-code {
          background: #f7f7f7;
          border: 2px dashed #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          font-family: "Courier New", monospace;
          font-size: 14px;
          color: #222;
          margin: 20px 0;
          word-break: break-all;
        }
        .footer {
          background: #f7f7f7;
          padding: 30px;
          text-align: center;
          color: #888;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        .warning {
          background: #fff5f5;
          border-left: 4px solid #d32f2f;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-text {
          color: #d32f2f;
          font-size: 14px;
          margin: 0;
          font-weight: 600;
        }
        .steps {
          background: #f7f7f7;
          border-left: 4px solid #e2e8f0;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .steps h3 {
          color: #1976d2;
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 700;
        }
        .steps ol {
          margin: 0;
          padding-left: 20px;
          color: #444;
        }
        .steps li {
          margin-bottom: 8px;
        }
        ul {
          color: #444;
          font-weight: 400;
        }
        code {
          background: #f7f7f7;
          color: #222;
          padding: 2px 6px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🎓</div>
          <h1>Student Email Verification</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name}! 👋</div>
          <div class="message">
            Welcome to <strong>AyoCabut</strong>! We're excited to have you join our community as an interpreter.
            As an AyoCabut interpreter, you'll help bridge language and cultural gaps for students and travelers, making their experience smoother and more enjoyable.
          </div>
          <div class="message">
            Thank you for applying to become a verified translator for <strong>AyoCabut</strong>!
            We need to verify your student email address to ensure you're a legitimate student from an Indonesian or Chinese university.
          </div>
          <div class="steps">
            <h3>📋 Next Steps:</h3>
            <ol>
              <li>Your email will be marked as verified</li>
              <li>Upload your student ID and HSK certificate</li>
              <li>Record your introduction video</li>
            </ol>
            <p style="margin-top:16px; color:#1976d2; font-weight:600;">
              This message was sent by <strong>AyoCabut</strong> (<a href="https://ayocabut.com" style="color:#1976d2; text-decoration:underline;">ayocabut.com</a>)
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0">
            <a href="${verificationUrl}" class="verify-button">
              ✅ Verify My Student Email
            </a>
          </div>
          <div class="warning">
            <p class="warning-text">
              <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you don't verify within this time, you'll need to request a new verification email.
            </p>
          </div>
          <div class="message">
            If the button doesn't work, you can copy and paste this link into your browser:
          </div>
          <div class="verification-code">${verificationUrl}</div>
          <div class="message">
            <strong>Why do we verify student emails?</strong><br />
            We only accept applications from verified students with emails ending in:
            <ul>
              <li><code>@student.ac.id</code> (Indonesian universities)</li>
              <li><code>@edu.cn</code> (Chinese universities)</li>
              <li>Other recognized university domains</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>
            This email was sent to <strong>${email}</strong> because you applied to become a verified translator.
          </p>
          <p>If you didn't apply for this service, please ignore this email.</p>
          <p>
            <strong>Translator Verification System</strong><br />
            Building trust between students and clients worldwide 🌍
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

		const textContent = `
    Hello ${name}!

    Thank you for applying to become a verified translator! We need to verify your student email address.

    Please click this link to verify your email:
    ${verificationUrl}

    This link will expire in 24 hours.

    Why do we verify student emails?
    We only accept applications from verified students with emails ending in @student.ac.id (Indonesian universities) or @edu.cn (Chinese universities).

    Next steps after verification:
    1. Upload your student ID and HSK certificate
    2. Record your introduction video
    3. Wait for admin approval

    If you didn't apply for this service, please ignore this email.

    Translator Verification System
    Building trust between students and clients worldwide
    `;

		const mailOptions = {
			from: `"${process.env.FROM_NAME || "Translator Verification"}" <${
				process.env.FROM_EMAIL || process.env.SMTP_USER
			}>`,
			to: email,
			subject: "🎓 Verify Your Student Email - Translator Application",
			text: textContent,
			html: htmlContent,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log(`📧 Verification email sent to ${email}: ${info.messageId}`);
		return true;
	} catch (error) {
		console.error("❌ Failed to send verification email:", error);
		return false;
	}
}

// Send welcome email after approval
export async function sendWelcomeEmail(
	email: string,
	name: string
): Promise<boolean> {
	try {
		const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Translator Network!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #48bb78; color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to the Translator Network!</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${name}!</h2>
          <p>Your translator application has been approved! You're now a verified translator in our network.</p>
          <p>You can now:</p>
          <ul>
            <li>Receive translation requests from clients</li>
            <li>Update your profile and services</li>
            <li>Manage your availability</li>
            <li>Build your reputation through reviews</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
							process.env.BASE_URL || "http://localhost:5000"
						}/login" class="button">
              Access Your Profile
            </a>
          </div>
          <p>Thank you for joining our community of verified student translators!</p>
        </div>
      </div>
    </body>
    </html>
    `;

		const mailOptions = {
			from: `"${process.env.FROM_NAME || "Translator Network"}" <${
				process.env.FROM_EMAIL || process.env.SMTP_USER
			}>`,
			to: email,
			subject: "🎉 Welcome! Your Translator Application Approved",
			html: htmlContent,
		};

		await transporter.sendMail(mailOptions);
		console.log(`📧 Welcome email sent to ${email}`);
		return true;
	} catch (error) {
		console.error("❌ Failed to send welcome email:", error);
		return false;
	}
}
