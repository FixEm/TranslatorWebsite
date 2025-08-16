import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ServiceProviderCard from "@/components/service-provider-card";
import ProfileModal from "@/components/profile-modal";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, Star, Users, MapPin, Clock, Shield, Award, Globe, MessageCircle } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with red accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-red-900/20"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1545893835-abaa50cbe628?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        
        {/* Animated background elements with red theme */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-red-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-80 h-80 bg-red-700/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="mb-8">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-red-100/10 backdrop-blur-sm border border-red-200/20 text-red-200 font-medium text-sm mb-8">
              <Star className="w-4 h-4 mr-2 text-red-400" />
              Platform Premium Terpercaya
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight text-white">
            Temukan Penerjemah & Tour Guide<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-300 to-red-200">
              Indonesia Terpercaya di China
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-gray-200 max-w-4xl mx-auto leading-relaxed font-light">
            Platform premium yang menghubungkan Anda dengan penerjemah dan tour guide Indonesia bersertifikat di seluruh China
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/search">
              <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-10 py-6 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105 border-0">
                <Search className="mr-3 h-6 w-6" />
                Cari Penerjemah Sekarang
              </Button>
            </Link>
            <Link href="/translator/signup">
              <Button variant="outline" size="lg" className="border-2 border-white/80 text-red-700 hover:text-red-700 hover:bg-white px-10 py-6 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm">
                Bergabung Sebagai Penerjemah
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Premium trust indicators with red accent */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-800/95 via-slate-800/90 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300 mb-2">500+</div>
                <div className="text-sm text-white font-medium">Penerjemah Terdaftar</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300 mb-2">15</div>
                <div className="text-sm text-white font-medium">Kota di China</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300 mb-2">98%</div>
                <div className="text-sm text-white font-medium">Tingkat Kepuasan</div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300 mb-2">24/7</div>
                <div className="text-sm text-white font-medium">Dukungan Pelanggan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-32 bg-gradient-to-br from-red-50 via-white to-red-50 relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-red-200/40 to-red-300/30 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-red-300/30 to-red-400/20 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-red-100/20 to-red-200/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-bold text-sm mb-10 border border-red-300 shadow-lg">
              <Shield className="w-6 h-6 mr-3" />
              Terverifikasi & Terpercaya
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-800 mb-10 tracking-tight leading-tight">
              Penerjemah Premium<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700">
                Pilihan
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
              Temui para profesional terbaik kami yang telah melalui proses verifikasi ketat dan memiliki rekam jejak yang luar biasa
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse rounded-3xl h-96 shadow-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredProviders?.slice(0, 3).map((provider) => (
                <div 
                  key={provider.id} 
                  onClick={() => openProfileModal(provider)}
                  className="cursor-pointer transform transition-all duration-500 hover:scale-105 group"
                >
                  <div className="relative">
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 via-red-600/5 to-red-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl scale-110"></div>
                    
                    {/* Enhanced card with red accents */}
                    <div className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-red-100 group-hover:border-red-200 overflow-hidden">
                      <ServiceProviderCard provider={provider} />
                      
                      {/* Red accent overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-red-600/0 via-transparent to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Professional badge */}
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Premium
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-24">
            <Link href="/search">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-12 py-6 text-xl font-black rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
              >
                <span className="mr-3">Lihat Semua Penerjemah</span>
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-white transition-colors duration-300">
                  <svg className="w-4 h-4 text-white group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Student Translator Program */}
      <section className="py-32 bg-gradient-to-br from-red-50 via-white to-slate-50 relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-red-200/40 to-red-300/30 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-red-300/30 to-red-400/20 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-red-100/20 to-red-200/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-bold text-sm mb-10 border border-red-300 shadow-lg">
              <Award className="w-6 h-6 mr-3" />
              Program Mahasiswa Terpercaya
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-800 mb-10 tracking-tight leading-tight">
              Bergabung Sebagai<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700">
                Student Translator
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-16 font-medium">
              Khusus untuk mahasiswa Indonesia di China dan mahasiswa China dengan email @student.ac.id atau @edu.cn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-white rounded-3xl p-12 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 transform hover:scale-105 border border-red-100 group-hover:border-red-200">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-6 leading-tight">Verifikasi Email</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Gunakan email universitas resmi (@student.ac.id atau @edu.cn) untuk verifikasi instan dan akses cepat ke platform</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-white rounded-3xl p-12 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 transform hover:scale-105 border border-red-100 group-hover:border-red-200">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-6 leading-tight">Upload Dokumen</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Upload kartu mahasiswa dan sertifikat HSK untuk meningkatkan kredibilitas dan kepercayaan</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-white rounded-3xl p-12 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 transform hover:scale-105 border border-red-100 group-hover:border-red-200">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-6 leading-tight">Video Introduction</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Rekam video perkenalan dalam bahasa Indonesia dan Mandarin untuk menunjukkan kemampuan bahasa</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/translator/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-12 py-6 text-xl font-black rounded-3xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105 border-0 group"
              >
                <span className="mr-3">Daftar Sebagai Student Translator</span>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className="py-32 bg-gradient-to-br from-slate-50 via-white to-red-50 relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-40 left-1/4 w-96 h-96 bg-gradient-to-br from-red-200/30 to-red-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-red-300/20 to-red-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-red-100/15 to-red-200/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-28">
            <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-bold text-sm mb-10 border border-red-300 shadow-lg">
              <MessageCircle className="w-6 h-6 mr-3" />
              Proses Mudah & Cepat
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-800 mb-10 tracking-tight leading-tight">
              Cara Kerja<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700">
                Platform
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
              Proses sederhana dalam 3 langkah untuk mendapatkan layanan penerjemah profesional berkualitas tinggi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 mb-20">
            <div className="text-center group relative">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-700/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
                <div className="relative bg-gradient-to-r from-red-600 to-red-700 text-white w-28 h-28 rounded-3xl flex items-center justify-center text-5xl font-black mx-auto shadow-2xl group-hover:shadow-red-500/25 transition-all duration-500 group-hover:scale-110 transform">
                  1
                </div>
               
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-8 leading-tight">Cari & Filter</h3>
              <p className="text-slate-600 leading-relaxed text-lg max-w-sm mx-auto">Gunakan filter canggih untuk menemukan penerjemah sesuai lokasi, keahlian, dan anggaran Anda dengan mudah dan cepat</p>
            </div>
            
            <div className="text-center group relative">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-700/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
                <div className="relative bg-gradient-to-r from-red-600 to-red-700 text-white w-28 h-28 rounded-3xl flex items-center justify-center text-5xl font-black mx-auto shadow-2xl group-hover:shadow-red-500/25 transition-all duration-500 group-hover:scale-110 transform">
                  2
                </div>
                
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-8 leading-tight">Hubungi Langsung</h3>
              <p className="text-slate-600 leading-relaxed text-lg max-w-sm mx-auto">Lihat profil lengkap dan hubungi penerjemah pilihan Anda melalui WhatsApp atau sistem pesan internal yang aman</p>
            </div>
            
            <div className="text-center group relative">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-700/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
                <div className="relative bg-gradient-to-r from-red-600 to-red-700 text-white w-28 h-28 rounded-3xl flex items-center justify-center text-5xl font-black mx-auto shadow-2xl group-hover:shadow-red-500/25 transition-all duration-500 group-hover:scale-110 transform">
                  3
                </div>
               
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-8 leading-tight">Dapatkan Layanan</h3>
              <p className="text-slate-600 leading-relaxed text-lg max-w-sm mx-auto">Nikmati layanan penerjemah profesional dengan jaminan kualitas dan kepuasan pelanggan terbaik yang terjamin</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-red-100 to-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-red-200 to-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-bold text-sm mb-8 border border-red-200 shadow-lg">
              <Star className="w-4 h-4 mr-2 text-red-600" />
              Mulai Perjalanan Anda
            </div>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-slate-800 mb-10 tracking-tight leading-tight">
            Siap Memulai<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700">
              Perjalanan?
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-16 font-medium">
            Bergabunglah dengan ribuan pengguna yang telah mempercayai platform kami untuk kebutuhan penerjemah dan tour guide terbaik
          </p>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <Link href="/search">
              <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-12 py-6 text-xl font-black rounded-3xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105 border-0 group">
                <Search className="mr-3 h-6 w-6" />
                <span>Cari Penerjemah</span>
                <div className="ml-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Button>
            </Link>
            <Link href="/translator/signup">
              <Button variant="outline" size="lg" className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-12 py-6 text-xl font-black rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                Daftar Sebagai Penerjemah
              </Button>
            </Link>
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
