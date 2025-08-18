import "dotenv/config";
import nodemailer from "nodemailer";

// Configure nodemailer transporter
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

// Send verification email for individu or travel_agency
export async function sendClientVerificationEmail(
	email: string,
	name: string,
	verificationToken: string,
	applicationId: string
): Promise<boolean> {
	try {
		// Resolve base verification URL from env without changing env itself
		const baseVerifyUrl =
			process.env.CLIENT_VERIFICATION_URL && process.env.CLIENT_VERIFICATION_URL.trim().length > 0
				? process.env.CLIENT_VERIFICATION_URL
				: `${
					process.env.BACKEND_URL?.trim() || process.env.BACKEND_PUBLIC_URL?.trim() || "http://localhost:5000"
				}/api/verify-email`;
		const joiner = baseVerifyUrl.includes("?") ? "&" : "?";
		const verificationLink = `${baseVerifyUrl}${joiner}token=${verificationToken}&applicationId=${applicationId}`;

		// Derive a valid From header: prefer SMTP_FROM, fallback to SMTP_USER
		const rawFrom = (process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
		if (!rawFrom || !rawFrom.includes("@")) {
			console.error("❌ SMTP_FROM/SMTP_USER not configured to a valid email address");
			return false;
		}
		const displayName = (process.env.SMTP_FROM_NAME || "Translator Platform").trim();
		const fromHeader = `${displayName} <${rawFrom}>`;

		const mailOptions = {
			sender: rawFrom,
			from: fromHeader, // Sender header
			envelope: { from: rawFrom, to: email }, // SMTP MAIL FROM/RCPT TO
			to: email, // Recipient address
			subject: "Verifikasi Akun Anda - Translator Platform",
			html: `
        <p>Halo ${name},</p>
        <p>Terima kasih telah mendaftar di platform kami. Silakan klik tautan di bawah ini untuk memverifikasi akun Anda:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Jika Anda tidak mendaftar di platform kami, abaikan email ini.</p>
        <p>Salam,</p>
        <p>Tim Translator Platform</p>
      `,
		};

		await transporter.sendMail(mailOptions);
		console.log(`📧 Verification email sent to ${email}`);
		return true;
	} catch (error) {
		console.error("❌ Error sending client verification email:", error);
		return false;
	}
}