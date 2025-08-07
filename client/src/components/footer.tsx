import { Languages, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <Languages className="text-blue-400 text-2xl mr-3" />
              <span className="text-xl font-bold">PenerjemahChina</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Platform terpercaya untuk menghubungkan Anda dengan penerjemah dan tour guide Indonesia profesional di seluruh China.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="text-xl" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Layanan</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/search" className="hover:text-white transition-colors">Cari Penerjemah</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Tour Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terjemahan Dokumen</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Interpretasi Bisnis</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Perusahaan</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cara Kerja</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            © 2024 PenerjemahChina. Semua hak dilindungi undang-undang.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Kebijakan Privasi</a>
            <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Syarat Ketentuan</a>
            <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">FAQ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
