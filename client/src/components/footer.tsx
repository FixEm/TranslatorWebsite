import {
	Languages,
	Facebook,
	Twitter,
	Instagram,
	Linkedin,
} from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
	return (
		<footer className="bg-gradient-to-br from-red-700 to-red-800 text-white py-16 relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0">
				<div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
				<div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
			</div>

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div className="md:col-span-2">
						<div className="flex items-center mb-6">
							<Languages className="text-red-200 text-3xl mr-3" />
							<span className="text-2xl font-black text-white">AyoCabut</span>
						</div>
						<p className="text-red-100 mb-8 max-w-md text-lg leading-relaxed">
							Platform terpercaya untuk menghubungkan Anda dengan penerjemah dan
							tour guide Indonesia profesional di seluruh China.
						</p>
						<div className="flex space-x-4">
							<a
								href="#"
								className="text-red-200 hover:text-white transition-all duration-300 hover:scale-110 transform"
							>
								<Facebook className="text-xl" />
							</a>
							<a
								href="#"
								className="text-red-200 hover:text-white transition-all duration-300 hover:scale-110 transform"
							>
								<Twitter className="text-xl" />
							</a>
							<a
								href="#"
								className="text-red-200 hover:text-white transition-all duration-300 hover:scale-110 transform"
							>
								<Instagram className="text-xl" />
							</a>
							<a
								href="#"
								className="text-red-200 hover:text-white transition-all duration-300 hover:scale-110 transform"
							>
								<Linkedin className="text-xl" />
							</a>
						</div>
					</div>

					<div>
						<h3 className="text-lg font-bold mb-6 text-white">Layanan</h3>
						<ul className="space-y-3 text-red-100">
							<li>
								<Link
									href="/search"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Cari Penerjemah
								</Link>
							</li>
							<li>
								<a
									href="#"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Tour Guide
								</a>
							</li>
							<li>
								<a
									href="#"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Terjemahan Dokumen
								</a>
							</li>
							<li>
								<a
									href="#"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Interpretasi Bisnis
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-lg font-bold mb-6 text-white">Perusahaan</h3>
						<ul className="space-y-3 text-red-100">
							<li>
								<a
									href="#"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Tentang Kami
								</a>
							</li>
							<li>
								<a
									href="#"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Cara Kerja
								</a>
							</li>
							<li>
								<a
									href="#"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Karir
								</a>
							</li>
							<li>
								<a
									href="#"
									className="hover:text-white transition-all duration-300 hover:translate-x-1 transform inline-block"
								>
									Kontak
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-red-500/30 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
					<p className="text-red-200 text-sm">
						© 2025 AyoCabut. Semua hak dilindungi undang-undang.
					</p>
					<div className="flex space-x-6 mt-4 md:mt-0">
						<a
							href="#"
							className="text-red-200 hover:text-white text-sm transition-all duration-300"
						>
							Kebijakan Privasi
						</a>
						<a
							href="#"
							className="text-red-200 hover:text-white text-sm transition-all duration-300"
						>
							Syarat Ketentuan
						</a>
						<a
							href="#"
							className="text-red-200 hover:text-white text-sm transition-all duration-300"
						>
							FAQ
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
