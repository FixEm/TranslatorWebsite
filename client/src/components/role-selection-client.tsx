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
	ArrowRight,
	Check,
	Globe,
	BookOpen,
} from "lucide-react";

interface RoleSelectionProps {
	onRoleSelect: (role: "individu" | "travel_agency") => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
	const [selectedRole, setSelectedRole] = useState<
		"individu" | "travel_agency" | null
	>(null);

	const roles = [
		{
			id: "individu" as const,
			title: "Individu",
			icon: Users,
			description:
				"Layanan personal untuk kebutuhan penerjemahan dan pendampingan.",
			features: [
				"Terjemahan dokumen pribadi",
				"Pendampingan wisata",
				"Interpretasi percakapan",
				"Konsultasi bahasa",
			],
			requirements: [
				"Kebutuhan spesifik yang jelas",
				"Komunikasi yang baik dengan penerjemah",
				"Ketersediaan waktu fleksibel",
			],
			color: "blue",
		},
		{
			id: "travel_agency" as const,
			title: "Travel Agency",
			icon: Globe,
			description: "Layanan untuk agen perjalanan dalam mendukung wisatawan.",
			features: [
				"Panduan wisata grup",
				"Terjemahan untuk turis",
				"Pendampingan acara budaya",
				"Koordinasi logistik perjalanan",
			],
			requirements: [
				"Rencana perjalanan yang terorganisir",
				"Komunikasi yang baik dengan klien",
				"Pengalaman dalam mengelola grup wisata",
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
				<h1 className="text-3xl font-bold text-navy-800">Pilih Peran Anda</h1>
				<p className="text-gray-600 max-w-2xl mx-auto">
					Pilih peran yang sesuai dengan kemampuan dan minat Anda. Anda dapat
					mendaftar sebagai penerjemah atau tour guide sesuai dengan keahlian
					Anda.
				</p>
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
										Layanan yang ditawarkan:
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
						Lanjutkan dengan {roles.find((r) => r.id === selectedRole)?.title}
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</div>
			)}
		</div>
	);
}