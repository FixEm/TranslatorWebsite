import { useState } from "react";
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

interface ClientQuestionnaireAnswers {
	company?: string;
	contactPerson?: string;
	namaIndividu?: string;
	// whatsapp?: string;
	// instagram?: string;
	// needs: string[];
	// motivation: string;
	// customMotivation?: string;
	city?: string; // Added field for city
	frequency?: string; // Added field for frequency
	purpose?: string; // Added field for purpose
	firstTime?: string; // Added field for first-time usage
}

interface RoleQuestionnaireClientProps {
	selectedRole: "travel_agency" | "individu" | null;
	onComplete: (answers: ClientQuestionnaireAnswers) => void;
	onBack: () => void;
}

const topTouristCities = [
	"Beijing",
	"Shanghai",
	"Guangzhou",
	"Shenzhen",
	"Chengdu",
	"Xi'an",
	"Hangzhou",
	"Nanjing",
	"Suzhou",
	"Tianjin",
	"Chongqing",
	"Wuhan",
	"Qingdao",
	"Dalian",
	"Zhengzhou",
];

const translatorFrequencies = [
	"Multiple times a month",
	"Once every couple months",
	"Once a year",
	"One-time translator",
];

const translatorPurposes = [
	"Tour guide",
	"Business translation",
	"Exhibition fairs",
];

export default function RoleQuestionnaireClient({
	selectedRole,
	onComplete,
	onBack,
}: RoleQuestionnaireClientProps) {
	const [city, setCity] = useState("");
	const [frequency, setFrequency] = useState("");
	const [purpose, setPurpose] = useState("");
	const [firstTime, setFirstTime] = useState("");

	const handleSubmit = () => {
		if (!city || !frequency || !purpose || !firstTime) {
			alert("Please fill out all fields.");
			return;
		}
		onComplete({
			city,
			frequency,
			purpose,
			firstTime,
			// needs: [], // Placeholder for required field
			// motivation: "", // Placeholder for required field
		});
	};

	return (
		<div className="space-y-8 p-8 bg-gray-50 rounded-lg">
			<div className=" p-6 rounded-lg shadow-xl">
				<h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
					Kuesioner Pra-Pendaftaran
				</h2>
				<p className="text-gray-700 text-center mb-8">
					Isi kuesioner ini untuk membantu kami memahami kebutuhan Anda dengan
					lebih baik.
				</p>

				<div className="grid grid-cols-2 gap-6">
					<div>
						<Label htmlFor="city" className="text-lg font-medium text-gray-800">
							Mencari Layanan Translator di Kota
						</Label>
						<Select value={city} onValueChange={(value) => setCity(value)}>
							<SelectTrigger className="w-full mt-2 border-gray-300 rounded-md shadow-sm">
								<SelectValue placeholder="Pilih kota" />
							</SelectTrigger>
							<SelectContent>
								{topTouristCities.map((city) => (
									<SelectItem key={city} value={city}>
										{city}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label
							htmlFor="frequency"
							className="text-lg font-medium text-gray-800"
						>
							Keseringan Kebutuhan Translator
						</Label>
						<Select
							value={frequency}
							onValueChange={(value) => setFrequency(value)}
						>
							<SelectTrigger className="w-full mt-2 border-gray-300 rounded-md shadow-sm">
								<SelectValue placeholder="Pilih frekuensi" />
							</SelectTrigger>
							<SelectContent>
								{translatorFrequencies.map((freq) => (
									<SelectItem key={freq} value={freq}>
										{freq}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label
							htmlFor="purpose"
							className="text-lg font-medium text-gray-800"
						>
							Tujuan Kebutuhan Translator
						</Label>
						<Select
							value={purpose}
							onValueChange={(value) => setPurpose(value)}
						>
							<SelectTrigger className="w-full mt-2 border-gray-300 rounded-md shadow-sm">
								<SelectValue placeholder="Pilih tujuan" />
							</SelectTrigger>
							<SelectContent>
								{translatorPurposes.map((purpose) => (
									<SelectItem key={purpose} value={purpose}>
										{purpose}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label
							htmlFor="firstTime"
							className="text-lg font-medium text-gray-800"
						>
							Pertama Kali Mencari Jasa Translator
						</Label>
						<Select
							value={firstTime}
							onValueChange={(value) => setFirstTime(value)}
						>
							<SelectTrigger className="w-full mt-2 border-gray-300 rounded-md shadow-sm">
								<SelectValue placeholder="Pilih jawaban" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="yes">Yes</SelectItem>
								<SelectItem value="no">No</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<div className="flex justify-between mt-8">
				<Button
					variant="outline"
					onClick={onBack}
					className="px-6 py-2 border-gray-300 hover:bg-gray-100"
				>
					Kembali
				</Button>
				<Button
					onClick={handleSubmit}
					className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
				>
					Lanjut
				</Button>
			</div>
		</div>
	);
}