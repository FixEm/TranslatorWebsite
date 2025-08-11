import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, CheckCircle, MessageSquare, ArrowLeft } from "lucide-react";
import { ServiceProvider } from "@shared/schema";

export default function ProfilePage() {
  const { id } = useParams();

  const { data: provider, isLoading, error } = useQuery<ServiceProvider>({
    queryKey: [`/api/service-providers/${id}`],
    enabled: !!id,
  });

  const getServiceLabel = (service: string) => {
    const labels: { [key: string]: string } = {
      translator: "Penerjemah Bisnis",
      tour_guide: "Tour Guide",
      business_interpreter: "Interpretasi",
      document_translation: "Terjemahan Dokumen",
      medical_companion: "Pendamping Medis",
      education_consultant: "Konsultan Pendidikan"
    };
    return labels[service] || service;
  };

  const getLanguageLevel = (level: string) => {
    const levels: { [key: string]: { color: string; label: string } } = {
      Native: { color: "bg-green-500", label: "Native" },
      Fluent: { color: "bg-green-500", label: "Fluent" },
      Advanced: { color: "bg-yellow-500", label: "Advanced" },
      Intermediate: { color: "bg-yellow-500", label: "Intermediate" },
      Beginner: { color: "bg-red-500", label: "Beginner" }
    };
    return levels[level] || { color: "bg-gray-500", label: level };
  };

  const handleWhatsAppContact = () => {
    if (!provider) return;
    const message = encodeURIComponent(`Halo ${provider.name}, saya tertarik dengan layanan Anda melalui PenerjemahChina.`);
    window.open(`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Penerjemah tidak ditemukan</h1>
            <Link href="/search">
              <Button>Kembali ke Pencarian</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/search">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Pencarian
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <img 
                  src={provider.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"} 
                  alt={provider.name} 
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-navy-200"
                />
                <h1 className="text-2xl font-bold text-navy-800 mb-2">{provider.name}</h1>
                <div className="flex items-center justify-center mb-3">
                  <MapPin className="w-4 h-4 text-silver-500 mr-2" />
                  <span className="text-silver-600">{provider.city}, China</span>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="flex text-yellow-400 mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(parseFloat(provider.rating || "0")) ? "fill-current" : ""}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-silver-600">
                    {provider.rating} ({provider.reviewCount} ulasan)
                  </span>
                </div>
                <div className="space-y-2">
                  {provider.isVerified && (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit mx-auto">
                      <CheckCircle className="w-3 h-3" />
                      Terverifikasi
                    </Badge>
                  )}
                  <div className="text-2xl font-bold text-navy-600">¥{provider.pricePerDay}/hari</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Services */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-navy-800 mb-3">Layanan yang Ditawarkan</h2>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(provider.services) ? (provider.services as string[]).map((service: string) => (
                      <Badge key={service} variant="secondary" className="bg-navy-100 text-navy-800">
                        {getServiceLabel(service)}
                      </Badge>
                    )) : []}
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              {provider.languages && Array.isArray(provider.languages) && provider.languages.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-navy-800 mb-3">Bahasa yang Dikuasai</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {(provider.languages as any[]).map((lang, index) => {
                        const levelInfo = getLanguageLevel(lang.level);
                        return (
                          <div key={index} className="flex items-center">
                            <span className={`w-3 h-3 ${levelInfo.color} rounded-full mr-2`}></span>
                            {lang.language} ({levelInfo.label})
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-navy-800 mb-3">Pengalaman & Keahlian</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {provider.description}
                  </p>
                </CardContent>
              </Card>

              {/* Pricing Details */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-navy-800 mb-3">Detail Harga</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Tarif Dasar (per hari)</div>
                      <div className="text-lg font-semibold text-navy-600">¥{provider.pricePerDay}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Pengalaman</div>
                      <div className="text-lg font-semibold text-navy-600">{provider.experience} tahun</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleWhatsAppContact}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Hubungi via WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-navy-600 text-navy-600 hover:bg-navy-600 hover:text-white"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Kirim Pesan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
