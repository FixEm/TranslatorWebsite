import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ServiceProviderCard from "@/components/service-provider-card";
import ProfileModal from "@/components/profile-modal";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle } from "lucide-react";
import { ServiceProvider } from "@shared/schema";

export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: featuredProviders, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers"],
  });

  const openProfileModal = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-elegant">
      <Header />
      
      {/* Hero Section */}
      <section className="relative hero-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1545893835-abaa50cbe628?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-80 h-80 bg-slate-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
              Temukan Penerjemah & Tour Guide<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300">
                Indonesia Terpercaya di China
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-gray-200 max-w-4xl mx-auto leading-relaxed font-light">
              Platform premium yang menghubungkan Anda dengan penerjemah dan tour guide Indonesia bersertifikat di seluruh China
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/search">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-10 py-5 text-lg font-semibold rounded-xl shadow-luxury hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <Search className="mr-3 h-6 w-6" />
                  Cari Penerjemah Sekarang
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="border-2 border-white/80 text-slate-900 hover:bg-white hover:text-slate-900 hover:border-white px-10 py-5 text-lg font-semibold rounded-xl shadow-elegant hover:shadow-luxury transition-all duration-300 transform hover:scale-105 backdrop-blur-sm">
                  Bergabung Sebagai Penerjemah
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Premium trust indicators */}
        <div className="relative bg-slate-800/90 border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400">500+</div>
                <div className="text-sm text-white font-medium">Penerjemah Terdaftar</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">15</div>
                <div className="text-sm text-white font-medium">Kota di China</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">98%</div>
                <div className="text-sm text-white font-medium">Tingkat Kepuasan</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-400">24/7</div>
                <div className="text-sm text-white font-medium">Dukungan Pelanggan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-premium-light text-accent font-semibold text-sm mb-6">
              <CheckCircle className="w-4 h-4 mr-2" />
              Terverifikasi & Terpercaya
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 tracking-tight">
              Penerjemah Premium Pilihan
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Temui para profesional terbaik kami yang telah melalui proses verifikasi ketat dan memiliki rekam jejak yang luar biasa
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-96 shadow-elegant"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProviders?.slice(0, 3).map((provider) => (
                <div 
                  key={provider.id} 
                  onClick={() => openProfileModal(provider)}
                  className="cursor-pointer transform transition-all duration-300 hover:scale-105"
                >
                  <ServiceProviderCard provider={provider} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link href="/search">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-accent text-accent hover:bg-accent hover:text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-elegant hover:shadow-luxury transition-all duration-300 transform hover:scale-105"
              >
                Lihat Semua Penerjemah
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className="py-20 bg-elegant relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-40 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>
          <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-premium-light text-accent font-semibold text-sm mb-6">
              Proses Mudah & Cepat
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 tracking-tight">
              Cara Kerja Platform
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Proses sederhana dalam 3 langkah untuk mendapatkan layanan penerjemah profesional berkualitas tinggi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto shadow-luxury group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  1
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Cari & Filter</h3>
              <p className="text-slate-600 leading-relaxed">Gunakan filter canggih untuk menemukan penerjemah sesuai lokasi, keahlian, dan anggaran Anda dengan mudah</p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto shadow-luxury group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  2
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Hubungi Langsung</h3>
              <p className="text-slate-600 leading-relaxed">Lihat profil lengkap dan hubungi penerjemah pilihan Anda melalui WhatsApp atau sistem pesan internal</p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto shadow-luxury group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  3
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Dapatkan Layanan</h3>
              <p className="text-slate-600 leading-relaxed">Nikmati layanan penerjemah profesional dengan jaminan kualitas dan kepuasan pelanggan terbaik</p>
            </div>
          </div>
        </div>
      </section>

      <ProfileModal 
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
