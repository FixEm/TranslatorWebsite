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
              font-family: "Roboto", Arial, Helvetica, sans-serif; /* Modern font */
              line-height: 1.8; /* Increased line spacing */
              color: #333;
              margin: 0;
              padding: 0;
              background: linear-gradient(
                135deg,
                #f9f9f9,
                #e6e6e6
              ); /* Subtle gradient */
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff; /* Clean white background */
              padding: 40px; /* Increased padding */
              border-radius: 12px;
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); /* Softer shadow */
              border: 1px solid #dcdcdc; /* Neutral border */
              text-align: center;
            }
            .header {
              background: #e2e2e3;
              color: black;
              padding: 40px 30px;
              text-align: center;
              border-radius: 12px 12px 0 0; /* Rounded top corners */
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header .icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #2d3748;
              font-weight: 500;
            }
            .message {
              font-size: 16px;
              line-height: 1.7;
              color: #555;
              margin-bottom: 30px;
            }
            .verify-button {
              display: inline-block;
              background: #d32f2f; /* Solid red button */
              color: #ffffff;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              text-align: center;
              transition: background 0.3s ease, transform 0.2s ease;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Button shadow */
              margin: 20px 0;
            }
            .verify-button:hover {
              background: #b71c1c; /* Darker red on hover */
              transform: translateY(-2px); /* Subtle lift effect */
            }
            .verification-code {
              background: #f7fafc;
              border: 2px dashed #cbd5e0;
              padding: 16px;
              border-radius: 8px;
              font-family: "Courier New", monospace;
              font-size: 14px;
              color: #2d3748;
              margin: 20px 0;
              word-break: break-all;
            }
            .footer {
              background: #f7fafc;
              padding: 30px;
              text-align: center;
              color: #718096;
              font-size: 14px;
              border-top: 1px solid #e2e8f0;
              border-radius: 0 0 12px 12px; /* Rounded bottom corners */
            }
            .warning {
              background: #fef5e7;
              border-left: 4px solid #f6ad55;
              padding: 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-text {
              color: #c05621;
              font-size: 14px;
              margin: 0;
            }
            .steps {
              background: #f0fff4;
              border-left: 4px solid #48bb78;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
              text-align: left; /* Left-aligned content */
            }
            .steps h3 {
              color: #2f855a;
              margin: 0 0 16px 0;
              font-size: 16px;
              font-weight: bold;
            }
            .steps ol {
              margin: 0;
              padding-left: 20px;
              color: #2d3748;
            }
            .steps li {
              margin-bottom: 8px;
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
                Thank you for applying to become a verified translator! We need to
                verify your student email address to ensure you're a legitimate
                student from an Indonesian or Chinese university.
              </div>

              <div class="steps">
                <h3>📋 Next Steps:</h3>
                <ol>
                  <li>Click the verification button below</li>
                  <li>Your email will be marked as verified</li>
                  <li>Upload your student ID and HSK certificate</li>
                  <li>Record your introduction video</li>
                  <li>Wait for admin approval</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0">
                <a href="${verificationUrl}" class="verify-button">
                  ✅ Verify My Student Email
                </a>
              </div>

              <div class="warning">
                <p class="warning-text">
                  <strong>⚠️ Important:</strong> This verification link will expire in
                  24 hours. If you don't verify within this time, you'll need to
                  request a new verification email.
                </p>
              </div>

              <div class="message">
                If the button doesn't work, you can copy and paste this link into your
                browser:
              </div>

              <div class="verification-code">${verificationUrl}</div>

              <div class="message">
                <strong>Why do we verify student emails?</strong><br />
                We only accept applications from verified students with emails ending
                in:
                <ul>
                  <li><code>@student.ac.id</code> (Indonesian universities)</li>
                  <li><code>@edu.cn</code> (Chinese universities)</li>
                  <li>Other recognized university domains</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p>
                This email was sent to <strong>${email}</strong> because you applied
                to become a verified translator.
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
          <meta charset="utf-8" />
          <title>Welcome to Translator Network!</title>
          <style>
            body {
              font-family: "Roboto", Arial, sans-serif;
              line-height: 1.8;
              color: #2d3748;
              margin: 0;
              padding: 20px;
              background-color: #edf2f7;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #aa2626, #ae2727);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              font-size: 20px;
              color: #742a2a;
              margin-bottom: 20px;
            }
            .content p {
              font-size: 16px;
              line-height: 1.6;
              color: #4a5568;
              margin-bottom: 20px;
            }
            .content ul {
              margin: 0;
              padding-left: 20px;
              color: #4a5568;
            }
            .content ul li {
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              background: #ae2727;
              color: white;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              text-align: center;
              transition: background 0.3s ease, transform 0.2s ease;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }
            .button:hover {
              background: #ae2727;
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to the Translator Network!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${name}!</h2>
              <p>
                Your translator application has been approved! You're now a verified
                translator in our network.
              </p>
              <p>You can now:</p>
              <div
                style="
                  background: #f0fff4;
                  border-left: 4px solid #38a169;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                "
              >
                <ul style="list-style: none; padding: 0; margin: 0">
                  <li style="display: flex; align-items: center; margin-bottom: 10px">
                    <span style="color: #38a169; margin-right: 10px">✔️</span>
                    <span>Receive translation requests from clients</span>
                  </li>
                  <li style="display: flex; align-items: center; margin-bottom: 10px">
                    <span style="color: #38a169; margin-right: 10px">✔️</span>
                    <span>Update your profile and services</span>
                  </li>
                  <li style="display: flex; align-items: center; margin-bottom: 10px">
                    <span style="color: #38a169; margin-right: 10px">✔️</span>
                    <span>Manage your availability</span>
                  </li>
                  <li style="display: flex; align-items: center">
                    <span style="color: #38a169; margin-right: 10px">✔️</span>
                    <span>Build your reputation through reviews</span>
                  </li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0">
                <a
                  href="${
										process.env.BASE_URL || "http://localhost:5000"
									}/login"
                  class="button"
                >
                  Access Your Profile
                </a>
              </div>
              <p>
                Thank you for joining our community of verified student translators!
              </p>
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
