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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative navy-gradient text-white">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1545893835-abaa50cbe628?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Temukan Penerjemah & Tour Guide<br />
              <span className="text-blue-300">Indonesia Terpercaya di China</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Platform profesional yang menghubungkan Anda dengan penerjemah dan tour guide Indonesia bersertifikat di seluruh China
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/search">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg font-semibold">
                  <Search className="mr-2 h-5 w-5" />
                  Cari Penerjemah Sekarang
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-navy-800 px-8 py-4 text-lg font-semibold">
                  Bergabung Sebagai Penerjemah
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Trust indicators */}
        <div className="relative bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-300">500+</div>
                <div className="text-sm text-gray-300">Penerjemah Terdaftar</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-300">15</div>
                <div className="text-sm text-gray-300">Kota di China</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-300">98%</div>
                <div className="text-sm text-gray-300">Tingkat Kepuasan</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-300">24/7</div>
                <div className="text-sm text-gray-300">Dukungan Pelanggan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-800 mb-4">Penerjemah Terpilih</h2>
            <p className="text-xl text-silver-600 max-w-2xl mx-auto">
              Temui beberapa penerjemah dan tour guide terbaik kami yang telah terverifikasi
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-96"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProviders?.slice(0, 3).map((provider) => (
                <div key={provider.id} onClick={() => openProfileModal(provider)}>
                  <ServiceProviderCard provider={provider} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/search">
              <Button variant="outline" size="lg" className="border-2 border-navy-600 text-navy-600 hover:bg-navy-600 hover:text-white">
                Lihat Semua Penerjemah
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-800 mb-4">Cara Kerja Platform</h2>
            <p className="text-xl text-silver-600 max-w-2xl mx-auto">
              Proses sederhana dalam 3 langkah untuk mendapatkan layanan penerjemah profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-navy-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold text-navy-800 mb-4">Cari & Filter</h3>
              <p className="text-silver-600">Gunakan filter canggih untuk menemukan penerjemah sesuai lokasi, keahlian, dan anggaran Anda</p>
            </div>
            <div className="text-center">
              <div className="bg-navy-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold text-navy-800 mb-4">Hubungi Langsung</h3>
              <p className="text-silver-600">Lihat profil lengkap dan hubungi penerjemah pilihan Anda melalui WhatsApp atau sistem pesan internal</p>
            </div>
            <div className="text-center">
              <div className="bg-navy-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold text-navy-800 mb-4">Dapatkan Layanan</h3>
              <p className="text-silver-600">Nikmati layanan penerjemah profesional dengan jaminan kualitas dan kepuasan pelanggan</p>
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
