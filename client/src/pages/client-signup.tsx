import { useState } from "react";
// Progress bar component for signup steps
function SignupProgressBar({ step }: { step: number }) {
	const stepValues = [25, 50, 75, 100];
	return (
		<div className="text-center space-y-2 mb-8">
			<Progress value={stepValues[step - 1]} className="w-full h-2" />
			<p className="text-sm text-gray-600">Langkah {step} dari 4</p>
		</div>
	);
}
import { useLocation } from "wouter";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import RoleSelectionClient from "@/components/role-selection-client";
import RoleQuestionnaireClient from "@/components/role-questionnaire-client";

interface VerificationStep {
	emailVerified: boolean;
	adminApproved: boolean;
}

interface ClientApplication {
	id?: string;
	name: string;
	email: string;
	password?: string;
	confirmPassword?: string;
	whatsapp: string;
	company?: string;
	role: "travel_agency" | "individu";
	// motivation: string;
	// customMotivation?: string;
	verificationSteps?: VerificationStep;
	questionnaireData?: any;
}

export default function ClientSignup() {
	const [currentStep, setCurrentStep] = useState(1);
	const [, setLocation] = useLocation();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [selectedRole, setSelectedRole] = useState<
		"travel_agency" | "individu" | null
	>(null);
	const [questionnaireData, setQuestionnaireData] = useState<any>(null);
	const [application, setApplication] = useState<ClientApplication>({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		whatsapp: "",
		// company: "",
		role: "individu",
		// motivation: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();

	const handleRoleSelect = (role: "travel_agency" | "individu") => {
		setSelectedRole(role);
		setApplication((prev) => ({ ...prev, role }));
		setCurrentStep(2);
	};

	const handleQuestionnaireComplete = (data: any) => {
		setQuestionnaireData(data);
		setCurrentStep(3);
	};

	const handleBasicInfoSubmit = async () => {
		try {
			setIsSubmitting(true);
			if (application.password !== application.confirmPassword) {
				toast({
					title: "Error",
					description: "Password dan konfirmasi password tidak cocok.",
					variant: "destructive",
				});
				return;
			}
			// Validate password length
			if (application.password && application.password.length < 6) {
				toast({
					title: "Error",
					description: "Password harus memiliki minimal 6 karakter.",
					variant: "destructive",
				});
				return;
			}
			const applicationData = {
				...application,
				intent: "individu", // Updated to match expected values
				// motivation:
				// 	application.motivation === "Others"
				// 		? application.customMotivation
				// 		: application.motivation,
				questionnaireData: questionnaireData,
			};
			const response = await fetch("/api/applications/client", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(applicationData),
			});
			if (!response.ok) {
				throw new Error("Failed to create application");
			}
			const result = await response.json();
			setCurrentStep(4);
			setTimeout(() => {
				setLocation("/login");
			}, 2000);
			toast({
				title: "Aplikasi Dibuat",
				description:
					result.message ||
					"Aplikasi Anda telah berhasil dibuat! Silakan login untuk melanjutkan.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Gagal membuat aplikasi. Silakan coba lagi.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Step 1: Role Selection
	if (currentStep === 1) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="container mx-auto px-4 py-12">
					<div className="max-w-2xl mx-auto">
						<SignupProgressBar step={1} />
						<RoleSelectionClient onRoleSelect={handleRoleSelect} />
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// Step 2: Questionnaire
	if (currentStep === 2 && selectedRole) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="container mx-auto px-4 py-12">
					<div className="max-w-4xl mx-auto">
						<SignupProgressBar step={2} />
						<div className="mb-6">
							<Button
								variant="outline"
								onClick={() => setCurrentStep(1)}
								className="mb-4"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Kembali ke Pilihan Peran
							</Button>
						</div>
						<RoleQuestionnaireClient
							selectedRole={selectedRole}
							onComplete={handleQuestionnaireComplete}
							onBack={() => setCurrentStep(1)}
						/>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// Step 3: Registration Form
	if (currentStep === 3) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="container mx-auto px-4 py-12">
					<div className="max-w-2xl mx-auto">
						<SignupProgressBar step={3} />
						<div className="mb-6">
							<Button
								variant="outline"
								onClick={() => setCurrentStep(2)}
								className="mb-4"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Kembali ke Kuesioner
							</Button>
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Informasi Akun dan Profil</CardTitle>
								<CardDescription>
									Buat akun Anda dan lengkapi informasi dasar profil
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="name">Nama Lengkap</Label>
										<Input
											id="name"
											value={application.name}
											onChange={(e) =>
												setApplication((prev) => ({
													...prev,
													name: e.target.value,
												}))
											}
											placeholder="John Doe"
											required
										/>
									</div>
									<div>
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											value={application.email}
											onChange={(e) =>
												setApplication((prev) => ({
													...prev,
													email: e.target.value,
												}))
											}
											placeholder="your.email@company.com"
											required
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="password">Password</Label>
										<div className="relative">
											<Input
												id="password"
												type={showPassword ? "text" : "password"}
												value={application.password}
												onChange={(e) =>
													setApplication((prev) => ({
														...prev,
														password: e.target.value,
													}))
												}
												placeholder="Masukkan password"
												required
											/>
											<button
												type="button"
												className="absolute inset-y-0 right-0 pr-3 flex items-center"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4 text-gray-400" />
												) : (
													<Eye className="h-4 w-4 text-gray-400" />
												)}
											</button>
										</div>
									</div>
									<div>
										<Label htmlFor="confirmPassword">Konfirmasi Password</Label>
										<div className="relative">
											<Input
												id="confirmPassword"
												type={showConfirmPassword ? "text" : "password"}
												value={application.confirmPassword}
												onChange={(e) =>
													setApplication((prev) => ({
														...prev,
														confirmPassword: e.target.value,
													}))
												}
												placeholder="Konfirmasi password"
												required
											/>
											<button
												type="button"
												className="absolute inset-y-0 right-0 pr-3 flex items-center"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												{showConfirmPassword ? (
													<EyeOff className="h-4 w-4 text-gray-400" />
												) : (
													<Eye className="h-4 w-4 text-gray-400" />
												)}
											</button>
										</div>
									</div>
								</div>
								<div>
									<Label htmlFor="whatsapp">Nomor WhatsApp</Label>
									<Input
										id="whatsapp"
										value={application.whatsapp}
										onChange={(e) =>
											setApplication((prev) => ({
												...prev,
												whatsapp: e.target.value,
											}))
										}
										placeholder="+62 123 4567 8901"
										required
									/>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button variant="outline" onClick={() => setCurrentStep(2)}>
									Kembali
								</Button>
								<Button
									onClick={() => {
										if (application.password !== application.confirmPassword) {
											toast({
												title: "Error",
												description:
													"Password dan konfirmasi password tidak cocok.",
												variant: "destructive",
											});
											return;
										}
										handleBasicInfoSubmit();
									}}
									disabled={
										isSubmitting || !application.name || !application.email
									}
								>
									{isSubmitting ? "Membuat..." : "Buat Akun"}
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// Step 4: Success
	if (currentStep === 4) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="container mx-auto px-4 py-12">
					<div className="max-w-md mx-auto">
						<SignupProgressBar step={4} />
						<Card className="shadow-lg border border-gray-200">
							<CardHeader className="text-center">
								<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
									<CheckCircle className="h-8 w-8 text-green-500" />
								</div>
								<CardTitle className="text-2xl font-bold text-navy-800">
									Pendaftaran Berhasil!
								</CardTitle>
								<CardDescription>
									Akun Anda telah dibuat. Anda akan diarahkan ke halaman login
									untuk masuk.
								</CardDescription>
							</CardHeader>
							<CardContent className="text-center">
								<div className="space-y-4">
									<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
										<p className="text-blue-800 text-sm">
											Silakan verifikasi email Anda.
										</p>
									</div>
									<div className="text-sm text-gray-600">
										Anda akan diarahkan ke halaman login dalam beberapa detik...
									</div>
									<Button
										onClick={() => setLocation("/login")}
										className="w-full"
									>
										Lanjut ke Login
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	return null;
}
