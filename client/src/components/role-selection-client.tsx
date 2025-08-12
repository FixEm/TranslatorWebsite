import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Languages,
	MapPin,
	Users,
	User,
	ArrowRight,
	Check,
	Globe,
	BookOpen,
} from "lucide-react";

interface RoleSelectionProps {
	onRoleSelect: (role: "travel_agency" | "individu") => void;
}

export default function RoleSelectionClient({
	onRoleSelect,
}: RoleSelectionProps) {
	const [selectedRole, setSelectedRole] = useState<
		"travel_agency" | "individu" | null
	>(null);

	const roles = [
		{
			id: "travel_agency" as const,
			title: "Saya adalah Travel Agency",
			icon: Users,
			description:
				"Pilih opsi ini jika Anda mewakili perusahaan travel, biro perjalanan, atau organisasi yang ingin mencari jasa translator untuk klien Anda.",
			features: [
				"Untuk perusahaan dan grup",
				"Mendapatkan translator profesional",
				"Layanan khusus untuk klien bisnis",
				"Pendampingan perjalanan grup",
			],
			requirements: [
				"Mewakili perusahaan atau organisasi",
				"Kebutuhan translator untuk klien",
				"Informasi perusahaan yang valid",
			],
			color: "blue",
		},
		{
			id: "individu" as const,
			title: "Saya adalah Individu",
			icon: User,
			description:
				"Pilih opsi ini jika Anda adalah perorangan yang ingin mencari jasa translator untuk kebutuhan pribadi, perjalanan, studi, atau bisnis Anda sendiri.",
			features: [
				"Untuk kebutuhan pribadi",
				"Mudah dan fleksibel",
				"Pendampingan perjalanan individu",
				"Layanan sesuai kebutuhan Anda",
			],
			requirements: [
				"Kebutuhan translator untuk diri sendiri",
				"Informasi pribadi yang valid",
				"Tujuan penggunaan jasa translator jelas",
			],
			color: "green",
		},
	];

	const getColorClasses = (color: string, selected: boolean) => {
		const baseClasses = {
			blue: selected
				? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
				: "border-gray-200 hover:border-blue-300 hover:bg-blue-50",
			green: selected
				? "border-green-500 bg-green-50 shadow-lg shadow-green-100"
				: "border-gray-200 hover:border-green-300 hover:bg-green-50",
		};
		return baseClasses[color as keyof typeof baseClasses];
	};

	const getIconColor = (color: string) => {
		const colors = {
			blue: "text-blue-500",
			green: "text-green-500",
		};
		return colors[color as keyof typeof colors];
	};

	const getBadgeVariant = (color: string) => {
		const variants = {
			blue: "bg-blue-100 text-blue-800",
			green: "bg-green-100 text-green-800",
		};
		return variants[color as keyof typeof variants];
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6 min-h-screen">
			<div className="text-center space-y-4">
				<h1 className="text-3xl font-bold text-navy-800">
					Pilih Tipe Pencari Jasa Translator
				</h1>
				<p className="text-gray-600 max-w-2xl mx-auto">
					Silakan pilih apakah Anda mendaftar sebagai{" "}
					<span className="font-semibold text-blue-700">Travel Agency</span>{" "}
					atau <span className="font-semibold text-green-700">Individu</span>.
				</p>
				<div className="mt-2 text-sm text-gray-500">
					<p>
						<span className="font-bold text-blue-700">Travel Agency:</span>{" "}
						Untuk perusahaan travel, biro perjalanan, atau organisasi yang ingin
						mencari jasa translator untuk klien Anda.
					</p>
					<p className="mt-1">
						<span className="font-bold text-green-700">Individu:</span> Untuk
						perorangan yang ingin mencari jasa translator untuk kebutuhan
						pribadi, perjalanan, studi, atau bisnis Anda sendiri.
					</p>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
				{roles.map((role) => {
					const Icon = role.icon;
					const isSelected = selectedRole === role.id;

					return (
						<Card
							key={role.id}
							className={`relative cursor-pointer transition-all duration-200 ${getColorClasses(
								role.color,
								isSelected
							)}`}
							onClick={() => setSelectedRole(role.id)}
						>
							{isSelected && (
								<div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
									<Check className="h-4 w-4 text-green-500" />
								</div>
							)}

							<CardHeader className="pb-4">
								<div className="flex items-center justify-between">
									<Icon className={`h-8 w-8 ${getIconColor(role.color)}`} />
								</div>
								<CardTitle className="text-xl">{role.title}</CardTitle>
								<CardDescription className="text-sm leading-relaxed">
									{role.description}
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-4">
								<div>
									<h4 className="font-medium text-sm mb-2 flex items-center">
										<Globe className="h-4 w-4 mr-1" />
										Fitur utama:
									</h4>
									<ul className="space-y-1">
										{role.features.map((feature, index) => (
											<li
												key={index}
												className="text-sm text-gray-600 flex items-start"
											>
												<span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
												{feature}
											</li>
										))}
									</ul>
								</div>

								<div>
									<h4 className="font-medium text-sm mb-2 flex items-center">
										<BookOpen className="h-4 w-4 mr-1" />
										Persyaratan dasar:
									</h4>
									<ul className="space-y-1">
										{role.requirements.map((req, index) => (
											<li
												key={index}
												className="text-sm text-gray-600 flex items-start"
											>
												<span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
												{req}
											</li>
										))}
									</ul>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{selectedRole && (
				<div className="flex justify-center pt-6">
					<Button
						size="lg"
						onClick={() => onRoleSelect(selectedRole)}
						className="px-8"
					>
						Lanjutkan sebagai {roles.find((r) => r.id === selectedRole)?.title}
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</div>
			)}
		</div>
	);
}
