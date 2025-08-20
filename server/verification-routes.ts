import express from "express";
import { storage } from "./firebase-storage";
import {
	auth,
	db,
	isIndonesianStudentEmail,
	isChineseUniversityEmail,
	isStudentEmail,
	getUserByEmail,
	createUserAndSendVerification,
	isEmailVerified,
	markEmailAsVerified,
	verifyEmailToken,
} from "./auth";
import multer from "multer";
import { storage as firebaseStorage } from "./firebase";
// Import Firebase initialization to ensure it's initialized
import "./firebase";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Google Sign-In endpoint
router.post("/auth/google", async (req, res) => {
	try {
		const { idToken } = req.body;

		// Verify the Google ID token
		const decodedToken = await auth.verifyIdToken(idToken);
		const { uid, email, name, picture } = decodedToken;

		// Check if email is from Indonesian student or Chinese university
		const isStudentEmailType = email ? isStudentEmail(email) : false;
		const emailType = email
			? isIndonesianStudentEmail(email)
				? "indonesian_student"
				: isChineseUniversityEmail(email)
				? "chinese_university"
				: "other"
			: "other";

		// Create or update user in Firebase
		let user;
		try {
			user = await auth.getUser(uid);
		} catch (error) {
			// User doesn't exist, create new one
			user = await auth.createUser({
				uid,
				email,
				displayName: name,
				photoURL: picture,
			});
		}

		// Store additional user data in Firestore
		await storage.createUser({
			username: email || uid,
			password: "", // Not needed for Google Sign-In
			googleId: uid,
			email,
			profileImage: picture,
			role: "translator",
		});

		res.json({
			success: true,
			user: {
				id: uid,
				email,
				name,
				picture,
				isStudentEmail: isStudentEmailType,
				emailType,
			},
		});
	} catch (error) {
		console.error("Google Sign-In error:", error);
		res.status(400).json({ error: "Invalid token" });
	}
});

// Create new translator application
router.post("/applications/translator", async (req, res) => {
	try {
		const applicationData = req.body;

		// Validate required fields
		if (
			!applicationData.name ||
			!applicationData.email ||
			!applicationData.intent
		) {
			return res
				.status(400)
				.json({ error: "Data yang diperlukan tidak lengkap" });
		}

		// Check if email is already registered
		const existingProviders = await storage.getServiceProviders({
			email: applicationData.email,
		});
		if (existingProviders.length > 0) {
			return res.status(400).json({ error: "Email sudah terdaftar" });
		}

		// Create application first
		const application = await storage.createApplication(applicationData);

		// Create Firebase user and send verification email
		try {
			const { uid, emailSent } = await createUserAndSendVerification(
				applicationData.email,
				applicationData.name,
				application.id
			);

			// Update application with Firebase UID
			await storage.updateApplicationEmailVerification(application.id, uid);

			console.log(
				`📧 Email verifikasi Firebase ${
					emailSent ? "terkirim" : "dicoba kirim"
				} ke ${applicationData.email}`
			);

			res.json({
				...application,
				emailVerificationSent: emailSent,
				message: emailSent
					? "Silakan cek email Anda untuk verifikasi akun"
					: "Akun berhasil dibuat",
			});
		} catch (userError: any) {
			console.error(
				"Gagal membuat pengguna Firebase atau mengirim verifikasi:",
				userError
			);
			res.status(400).json({
				error: userError.message || "Gagal mengirim email verifikasi",
				application: application,
			});
		}
	} catch (error) {
		console.error("Error creating translator application:", error);
		res.status(500).json({ error: "Gagal membuat aplikasi" });
	}
});

// Email verification endpoint (handles token verification)
router.get("/verify-email", async (req, res) => {
	try {
		const { token, applicationId } = req.query;

		if (!token || !applicationId) {
			return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verifikasi Gagal</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Verifikasi Gagal</h1>
            <p>Link verifikasi tidak valid. Token atau ID Aplikasi tidak ditemukan.</p>
          </div>
        </body>
        </html>
      `);
		}

		// Verify the token
		const result = await verifyEmailToken(
			token as string,
			applicationId as string
		);

		if (!result.success) {
			return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verifikasi Gagal</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ ${result.message}</h1>
            <p>Silakan coba minta email verifikasi baru.</p>
          </div>
        </body>
        </html>
      `);
		}

		// Update application verification status (this should match the Firebase UID)
		if (result.uid) {
			await storage.updateApplicationEmailVerification(
				applicationId as string,
				result.uid
			);
			console.log(
				`✅ Application ${applicationId} updated with verified Firebase UID: ${result.uid}`
			);
		}

		// Return success page
		res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Berhasil Diverifikasi</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 0; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 500px; 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
          }
          .success { color: #059669; font-size: 24px; margin-bottom: 20px; font-weight: 600; }
          .celebration { font-size: 64px; margin-bottom: 20px; }
          .message { color: #64748b; line-height: 1.6; margin-bottom: 30px; }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 600; 
            transition: all 0.3s ease;
          }
          .button:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="celebration">🎉</div>
          <h1 class="success">✅ Email Berhasil Diverifikasi!</h1>
          <p class="message">
            Selamat! Email mahasiswa Anda telah berhasil diverifikasi. 
            Sekarang Anda dapat melanjutkan proses pendaftaran dengan mengunggah dokumen dan video perkenalan Anda.
          </p>
          <a href="${
						process.env.FRONTEND_URL || "http://localhost:5173"
					}/translator/signup?step=2&applicationId=${applicationId}" class="button">
            Lanjutkan Pendaftaran
          </a>
        </div>
      </body>
      </html>
    `);
	} catch (error) {
		console.error("Error processing email verification:", error);
		res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Verifikasi</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Error Verifikasi</h1>
          <p>Terjadi kesalahan saat memproses verifikasi email Anda.</p>
        </div>
      </body>
      </html>
    `);
	}
});

// Email verification success callback
router.get("/verify-success", async (req, res) => {
	try {
		const { applicationId } = req.query;

		if (!applicationId) {
			return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verifikasi Gagal</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Verifikasi Gagal</h1>
            <p>ID Aplikasi tidak ditemukan.</p>
          </div>
        </body>
        </html>
      `);
		}

		// Get application details
		const application = await storage.getApplication(applicationId as string);
		if (!application) {
			return res.status(404).send("Application not found");
		}

		// Type assertion to access firebaseUid
		const firebaseApp = application as any;

		// Check if Firebase user is verified
		if (firebaseApp.firebaseUid) {
			const verified = await isEmailVerified(firebaseApp.firebaseUid);

			if (verified) {
				// Mark email as verified in our system
				await markEmailAsVerified(firebaseApp.firebaseUid);
				await storage.updateApplicationEmailVerification(
					applicationId as string
				);
			}
		}

		// Return success page
		res.send(`
      <!DOCTYPE html>
        <html>
          <head>
            <title>Email Berhasil Diverifikasi</title>
            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                padding: 0;
                margin: 0;
                background: #f8f9fa; /* Subtle light gray background */
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #333; /* Neutral text color */
              }
              .container {
                max-width: 480px;
                background: #ffffff; /* Clean white background */
                padding: 32px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Softer shadow */
                text-align: center;
              }
              .celebration {
                font-size: 48px;
                margin-bottom: 16px;
              }
              .success {
                color: #d32f2f; /* Professional red tone */
                font-size: 20px;
                margin-bottom: 16px;
                font-weight: bold;
              }
              .message {
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 24px;
                color: #555; /* Softer text color */
              }
              .button {
                display: inline-block;
                background: #d32f2f; /* Solid red button */
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                transition: background 0.3s ease;
              }
              .button:hover {
                background: #b71c1c; /* Darker red on hover */
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="celebration">🎉</div>
              <h1 class="success">Email Berhasil Diverifikasi!</h1>
              <p class="message">
                Selamat! Email Anda telah berhasil diverifikasi menggunakan Firebase
                Authentication. Kami di <strong>AyoCabut</strong> sangat antusias untuk
                berkolaborasi dengan Anda. Silakan lanjutkan proses pendaftaran dengan
                mengunggah dokumen dan video perkenalan Anda.
              </p>
              <a
                href="${
									process.env.FRONTEND_URL || "http://localhost:5173"
								}/translator/signup?step=2&applicationId=${applicationId}"
                class="button"
              >
                Lanjutkan Pendaftaran
              </a>
            </div>
          </body>
        </html>

    `);
	} catch (error) {
		console.error("Error processing email verification:", error);
		res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Verifikasi</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Error Verifikasi</h1>
          <p>Terjadi kesalahan saat memproses verifikasi email Anda.</p>
        </div>
      </body>
      </html>
    `);
	}
});

// Resend verification email (updated)
router.post("/applications/:id/resend-verification", async (req, res) => {
	try {
		const { id } = req.params;
		const application = await storage.getApplication(id);

		if (!application) {
			return res.status(404).json({ error: "Aplikasi tidak ditemukan" });
		}

		// Type assertion to access firebaseUid
		const firebaseApp = application as any;

		// Check if already verified
		if (
			firebaseApp.firebaseUid &&
			(await isEmailVerified(firebaseApp.firebaseUid))
		) {
			return res.status(400).json({ error: "Email sudah diverifikasi" });
		}

		// Resend verification email
		try {
			const { uid, emailSent } = await createUserAndSendVerification(
				application.email,
				application.name,
				id
			);

			// Update application with Firebase UID if not exists
			if (!firebaseApp.firebaseUid) {
				await storage.updateApplicationEmailVerification(id, uid);
			}

			if (emailSent) {
				res.json({
					success: true,
					message: "Email verifikasi berhasil dikirim",
				});
			} else {
				res.status(500).json({ error: "Gagal mengirim email verifikasi" });
			}
		} catch (error: any) {
			console.error("Error resending verification email:", error);
			res
				.status(500)
				.json({ error: error.message || "Gagal mengirim email verifikasi" });
		}
	} catch (error) {
		console.error("Error resending verification email:", error);
		res.status(500).json({ error: "Gagal mengirim ulang email verifikasi" });
	}
});

// Upload student ID document
router.post(
	"/applications/:id/upload/student-id",
	upload.single("studentId"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const file = req.file;

			if (!file) {
				return res.status(400).json({ error: "Tidak ada file yang diunggah" });
			}

			// Upload to Firebase Storage using Admin SDK
			console.log("📄 Starting student ID upload for application:", id);
			const fileName = `student-ids/${id}-${Date.now()}-${file.originalname}`;

			let downloadURL: string;
			try {
				const bucket = firebaseStorage.bucket();
				console.log("✅ Firebase bucket acquired:", bucket.name);

				const fileRef = bucket.file(fileName);

				await fileRef.save(file.buffer, {
					metadata: {
						contentType: file.mimetype,
					},
				});
				console.log("✅ File saved to storage");

				// Make the file publicly accessible
				await fileRef.makePublic();
				console.log("✅ File made public");

				downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
				console.log("✅ Download URL generated:", downloadURL);
			} catch (storageError) {
				console.error("❌ Firebase Storage error:", storageError);
				throw storageError;
			}

			// Update application with student ID document using the proper method
			await storage.updateStudentDocument(id, downloadURL);

			res.json({
				success: true,
				message: "Dokumen kartu mahasiswa berhasil diunggah",
				documentUrl: downloadURL,
			});
		} catch (error) {
			console.error("Error uploading student ID:", error);
			res.status(500).json({ error: "Gagal mengunggah dokumen" });
		}
	}
);

// Upload KTP document for clients
router.post(
	"/applications/:id/upload/ktp",
	upload.single("ktp"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const file = req.file;

			if (!file) {
				return res.status(400).json({ error: "Tidak ada file yang diunggah" });
			}

			// Upload to Firebase Storage using Admin SDK
			console.log("📄 Starting KTP upload for application:", id);
			const fileName = `ktp-documents/${id}-${Date.now()}-${file.originalname}`;

			let downloadURL: string;
			try {
				const bucket = firebaseStorage.bucket();
				console.log("✅ Firebase bucket acquired:", bucket.name);

				const fileRef = bucket.file(fileName);

				await fileRef.save(file.buffer, {
					metadata: {
						contentType: file.mimetype,
					},
				});
				console.log("✅ KTP file saved to storage");

				// Make the file publicly accessible
				await fileRef.makePublic();
				console.log("✅ KTP file made public");

				downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
				console.log("✅ KTP download URL generated:", downloadURL);
			} catch (storageError) {
				console.error("❌ Firebase Storage error for KTP:", storageError);
				throw storageError;
			}

			// Update application with KTP document using the proper method
			await storage.updateKtpDocument(id, downloadURL);

			res.json({
				success: true,
				message: "Dokumen KTP berhasil diunggah",
				documentUrl: downloadURL,
			});
		} catch (error) {
			console.error("Error uploading KTP:", error);
			res.status(500).json({ error: "Gagal mengunggah dokumen KTP" });
		}
	}
);

// Upload HSK certificate
router.post(
	"/applications/:id/upload/hsk",
	upload.single("hskCertificate"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const file = req.file;

			if (!file) {
				return res.status(400).json({ error: "Tidak ada file yang diunggah" });
			}

			console.log("📄 Starting HSK certificate upload for application:", id);
			const fileName = `hsk-certificates/${id}-${Date.now()}-${
				file.originalname
			}`;

			let downloadURL: string;
			try {
				const bucket = firebaseStorage.bucket();
				console.log("✅ Firebase bucket acquired:", bucket.name);

				const fileRef = bucket.file(fileName);

				await fileRef.save(file.buffer, {
					metadata: {
						contentType: file.mimetype,
					},
				});
				console.log("✅ HSK certificate saved to storage");

				// Make the file publicly accessible
				await fileRef.makePublic();
				console.log("✅ HSK certificate made public");

				downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
				console.log("✅ HSK certificate download URL generated:", downloadURL);
			} catch (storageError) {
				console.error("❌ Firebase Storage error for HSK:", storageError);
				throw storageError;
			}

			// Update application with HSK certificate using the proper method
			await storage.updateHskCertificate(id, downloadURL);

			res.json({
				success: true,
				message: "Sertifikat HSK berhasil diunggah",
				certificateUrl: downloadURL,
			});
		} catch (error) {
			console.error("Error uploading HSK certificate:", error);
			res.status(500).json({ error: "Gagal mengunggah sertifikat" });
		}
	}
);

// Upload CV document
router.post(
	"/applications/:id/upload/cv",
	upload.single("cvDocument"),
	async (req, res) => {
		try {
			const { id } = req.params;

			if (!req.file) {
				return res
					.status(400)
					.json({ error: "Tidak ada file CV yang diunggah" });
			}

			// Upload to Firebase Storage using Admin SDK
			console.log("📄 Starting CV upload for application:", id);

			const fileName = `${id}-${Date.now()}-${req.file.originalname}`;
			const fileRef = firebaseStorage.bucket().file(`cvs/${fileName}`);

			const metadata = {
				metadata: {
					applicationId: id,
					uploadedAt: new Date().toISOString(),
					originalName: req.file.originalname,
					mimeType: req.file.mimetype,
				},
			};

			// Upload the file
			await fileRef.save(req.file.buffer, {
				metadata: metadata,
				resumable: false,
			});

			// Make the file publicly accessible
			await fileRef.makePublic();

			// Generate public download URL - include the full path with 'cvs/' folder
			const downloadURL = `https://storage.googleapis.com/${
				firebaseStorage.bucket().name
			}/cvs/${fileName}`;

			console.log("✅ CV uploaded successfully:", downloadURL);

			// Update the application in Firestore using the proper method
			await storage.updateCvDocument(id, downloadURL);

			res.json({
				success: true,
				message: "CV berhasil diunggah",
				cvUrl: downloadURL,
			});
		} catch (error) {
			console.error("Error uploading CV:", error);
			res.status(500).json({ error: "Gagal mengunggah CV" });
		}
	}
);

// Upload intro video (Google Drive link)
router.post("/applications/:id/upload/intro-video", async (req, res) => {
	try {
		const { id } = req.params;
		const { videoUrl } = req.body;

		if (!videoUrl || typeof videoUrl !== "string") {
			return res.status(400).json({ error: "Link video tidak valid" });
		}

		// Basic URL validation for Google Drive links
		if (!videoUrl.includes("drive.google.com")) {
			return res
				.status(400)
				.json({ error: "Harap gunakan link Google Drive yang valid" });
		}

		console.log(`📹 Uploading intro video for application ${id}:`, {
			videoUrl,
		});

		// Update the application with video URL using the proper method
		await storage.updateIntroVideo(id, videoUrl);

		console.log("✅ Intro video URL saved successfully");

		res.json({
			success: true,
			message: "Link video perkenalan berhasil disimpan",
			videoUrl,
		});
	} catch (error) {
		console.error("Error saving intro video URL:", error);
		res.status(500).json({ error: "Gagal menyimpan link video perkenalan" });
	}
});

// Verify email
router.post("/applications/:id/verify-email", async (req, res) => {
	try {
		const { id } = req.params;

		// Update verification steps to mark email as verified
		await storage.updateApplicationField(
			id,
			"verificationSteps.emailVerified",
			true
		);

		// Get updated application
		const updatedApplication = await storage.getApplication(id);

		res.json({
			success: true,
			provider: updatedApplication,
		});
	} catch (error) {
		console.error("Error verifying email:", error);
		res.status(500).json({ error: "Gagal memverifikasi email" });
	}
});

// Get application status
router.get("/applications/:id/status", async (req, res) => {
	try {
		const { id } = req.params;
		const application = await storage.getApplication(id);

		if (!application) {
			return res.status(404).json({ error: "Aplikasi tidak ditemukan" });
		}

		res.json(application);
	} catch (error) {
		console.error("Error getting application status:", error);
		res.status(500).json({ error: "Gagal mendapatkan status aplikasi" });
	}
});

// Admin routes for review
router.get("/admin/applications/pending", async (req, res) => {
	try {
		const applications = await storage.getApplications("pending");
		res.json(applications);
	} catch (error) {
		console.error("Error getting pending applications:", error);
		res.status(500).json({ error: "Gagal mendapatkan aplikasi" });
	}
});

// Admin approve application
router.post("/admin/applications/:id/approve", async (req, res) => {
	try {
		const { id } = req.params;
		const { adminNotes } = req.body;

		// Update application status to approved using the proper method
		await storage.approveApplication(id, adminNotes);

		res.json({
			success: true,
			message: "Aplikasi berhasil disetujui",
		});
	} catch (error) {
		console.error("Error approving application:", error);
		res.status(500).json({ error: "Gagal menyetujui aplikasi" });
	}
});

// Admin reject application
router.post("/admin/applications/:id/reject", async (req, res) => {
	try {
		const { id } = req.params;
		const { adminNotes } = req.body;

		// Update application status to rejected using the proper method
		await storage.rejectApplication(id, adminNotes);

		res.json({
			success: true,
			message: "Aplikasi ditolak",
		});
	} catch (error) {
		console.error("Error rejecting application:", error);
		res.status(500).json({ error: "Gagal menolak aplikasi" });
	}
});

// Manual email verification for testing/debugging - ONLY FOR STUDENTS
router.post("/debug/verify-email/:email", async (req, res) => {
	try {
		const { email } = req.params;

		// Check if email is a student email FIRST
		if (!isStudentEmail(email)) {
			return res.status(403).json({
				error:
					"Verifikasi manual hanya diperbolehkan untuk email mahasiswa (@student.ac.id atau @edu.cn)",
				emailType: "bukan_mahasiswa",
				providedEmail: email,
			});
		}

		// Get user from Firebase
		const userRecord = await auth.getUserByEmail(email);
		console.log(
			`🔍 Before verification - User: ${userRecord.uid}, emailVerified: ${userRecord.emailVerified}`
		);

		if (userRecord.emailVerified) {
			return res.json({
				message: "Email sudah diverifikasi",
				user: {
					uid: userRecord.uid,
					email: userRecord.email,
					emailVerified: userRecord.emailVerified,
				},
			});
		}

		// Manually mark as verified with detailed logging
		console.log(`🔧 Starting manual verification for UID: ${userRecord.uid}`);

		try {
			// Direct Firebase Auth update
			await auth.updateUser(userRecord.uid, {
				emailVerified: true,
			});
			console.log(
				`✅ Firebase Auth emailVerified updated for ${userRecord.uid}`
			);

			// Update Firestore verification record
			await db.collection("email_verifications").doc(userRecord.uid).update({
				verified: true,
				verifiedAt: new Date(),
			});
			console.log(
				`✅ Firestore verification record updated for ${userRecord.uid}`
			);
		} catch (updateError) {
			console.error("❌ Error during verification update:", updateError);
			throw updateError;
		}

		// Get updated user record
		const updatedUser = await auth.getUserByEmail(email);
		console.log(
			`🔍 After verification - User: ${updatedUser.uid}, emailVerified: ${updatedUser.emailVerified}`
		);

		res.json({
			message: "Verifikasi email berhasil diperbarui secara manual",
			before: {
				emailVerified: userRecord.emailVerified,
			},
			after: {
				uid: updatedUser.uid,
				email: updatedUser.email,
				emailVerified: updatedUser.emailVerified,
			},
			debug: {
				uid: userRecord.uid,
				updateSuccessful: updatedUser.emailVerified,
			},
		});
	} catch (error: any) {
		console.error("Manual verification error:", error);
		res.status(404).json({
			error:
				error.code === "auth/user-not-found"
					? "Pengguna tidak ditemukan"
					: error.message,
			details: error.message,
		});
	}
});

// Debug endpoint to check Firebase user status
router.get("/debug/user/:email", async (req, res) => {
	try {
		const { email } = req.params;

		// Get user from Firebase
		const userRecord = await auth.getUserByEmail(email);

		// Get verification record from Firestore
		const verificationDoc = await db
			.collection("email_verifications")
			.doc(userRecord.uid)
			.get();
		const verificationData = verificationDoc.exists
			? verificationDoc.data()
			: null;

		res.json({
			firebase: {
				uid: userRecord.uid,
				email: userRecord.email,
				emailVerified: userRecord.emailVerified,
				displayName: userRecord.displayName,
				creationTime: userRecord.metadata.creationTime,
				lastSignInTime: userRecord.metadata.lastSignInTime,
			},
			verification: verificationData,
			timestamp: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error("Debug error:", error);
		res.status(404).json({
			error:
				error.code === "auth/user-not-found"
					? "Pengguna tidak ditemukan"
					: error.message,
		});
	}
});

export default router;
