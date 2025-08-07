import { Link, useLocation } from "wouter";
import { Languages } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="glass-effect shadow-elegant sticky top-0 z-50 border-b border-elegant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="p-2 bg-premium rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
                <Languages className="text-white h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-slate-800 ml-4 tracking-tight">PenerjemahChina</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`font-semibold transition-all duration-200 hover:scale-105 ${
                isActive("/") ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Beranda
            </Link>
            <Link 
              href="/search" 
              className={`font-semibold transition-all duration-200 hover:scale-105 ${
                isActive("/search") ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Cari Penerjemah
            </Link>
            <a 
              href="#cara-kerja" 
              className="text-slate-700 hover:text-blue-600 font-semibold transition-all duration-200 hover:scale-105"
            >
              Cara Kerja
            </a>
            <a 
              href="#tentang" 
              className="text-slate-700 hover:text-blue-600 font-semibold transition-all duration-200 hover:scale-105"
            >
              Tentang
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="text-blue-600 hover:text-slate-800 font-semibold transition-all duration-200 hover:scale-105">
              Masuk
            </button>
            <Link href="/register">
              <button className="bg-premium text-white px-6 py-3 rounded-xl hover:bg-premium shadow-elegant hover:shadow-luxury transition-all duration-300 font-semibold tracking-wide hover:scale-105 transform">
                Daftar Sebagai Penerjemah
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
