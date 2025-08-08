import 'dotenv/config';
import nodemailer from 'nodemailer';

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection
export async function verifyEmailService(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP server connection failed:', error);
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
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/verify-email?token=${verificationToken}&applicationId=${applicationId}`;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Student Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
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
        }
        .message {
          font-size: 16px;
          line-height: 1.7;
          color: #4a5568;
          margin-bottom: 30px;
        }
        .verify-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          transition: all 0.3s ease;
          margin: 20px 0;
        }
        .verify-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        .verification-code {
          background: #f7fafc;
          border: 2px dashed #cbd5e0;
          padding: 16px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
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
        }
        .steps h3 {
          color: #2f855a;
          margin: 0 0 16px 0;
          font-size: 16px;
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
          <div class="greeting">
            Hello ${name}! 👋
          </div>
          
          <div class="message">
            Thank you for applying to become a verified translator! We need to verify your student email address to ensure you're a legitimate student from an Indonesian or Chinese university.
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
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="verify-button">
              ✅ Verify My Student Email
            </a>
          </div>
          
          <div class="warning">
            <p class="warning-text">
              <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. 
              If you don't verify within this time, you'll need to request a new verification email.
            </p>
          </div>
          
          <div class="message">
            If the button doesn't work, you can copy and paste this link into your browser:
          </div>
          
          <div class="verification-code">
            ${verificationUrl}
          </div>
          
          <div class="message">
            <strong>Why do we verify student emails?</strong><br>
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
          <p>
            If you didn't apply for this service, please ignore this email.
          </p>
          <p>
            <strong>Translator Verification System</strong><br>
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
      from: `"${process.env.FROM_NAME || 'Translator Verification'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: '🎓 Verify Your Student Email - Translator Application',
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return false;
  }
}

// Send welcome email after approval
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
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
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" class="button">
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
      from: `"${process.env.FROM_NAME || 'Translator Network'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: '🎉 Welcome! Your Translator Application Approved',
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}
