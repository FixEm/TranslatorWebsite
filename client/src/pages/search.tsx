import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ServiceProviderCard from "@/components/service-provider-card";
import ProfileModal from "@/components/profile-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { ServiceProvider } from "@shared/schema";

export default function SearchPage() {
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    city: "all",
    service: "all",
    availability: ""
  });

  const { data: providers, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers", filters.city, filters.service],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city && filters.city !== "all") params.append('city', filters.city);
      if (filters.service && filters.service !== "all") params.append('services', filters.service);
      
      const response = await fetch(`/api/service-providers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      return response.json();
    }
  });

  const cities = [
    "Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Suzhou", "Hangzhou",
    "Nanjing", "Wuhan", "Chengdu", "Xi'an", "Tianjin", "Qingdao"
  ];

  const services = [
    { value: "translator", label: "Penerjemah" },
    { value: "tour_guide", label: "Tour Guide" },
    { value: "business_interpreter", label: "Interpretasi Bisnis" },
    { value: "document_translation", label: "Terjemahan Dokumen" },
    { value: "medical_companion", label: "Pendamping Medis" },
    { value: "education_consultant", label: "Konsultan Pendidikan" }
  ];

  const handleSearch = () => {
    // Trigger refetch by updating query key
  };

  const openProfileModal = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-elegant">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-premium-light text-accent font-semibold text-sm mb-6">
            <Search className="w-4 h-4 mr-2" />
            Pencarian Profesional
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-premium mb-6 tracking-tight">
            Cari Penerjemah & Tour Guide
          </h1>
          <p className="text-xl text-muted max-w-3xl mx-auto leading-relaxed">
            Gunakan filter canggih untuk menemukan profesional terverifikasi yang sesuai dengan kebutuhan Anda
          </p>
        </div>

        {/* Premium Search Filters */}
        <Card className="card-gradient mb-10 shadow-elegant border-0 rounded-2xl">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Filter className="w-6 h-6 text-accent mr-3" />
              <h3 className="text-xl font-bold text-premium">Filter Pencarian</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-elegant mb-3">Kota</label>
                <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
                  <SelectTrigger className="border-elegant focus:border-premium focus:ring-premium rounded-xl h-12">
                    <SelectValue placeholder="Pilih Kota" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-elegant">
                    <SelectItem value="all" className="rounded-lg">Semua Kota</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city} className="rounded-lg">{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-elegant mb-3">Jenis Layanan</label>
                <Select value={filters.service} onValueChange={(value) => setFilters({...filters, service: value})}>
                  <SelectTrigger className="border-elegant focus:border-premium focus:ring-premium rounded-xl h-12">
                    <SelectValue placeholder="Semua Layanan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-elegant">
                    <SelectItem value="all" className="rounded-lg">Semua Layanan</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.value} value={service.value} className="rounded-lg">{service.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-elegant mb-3">Ketersediaan</label>
                <Input 
                  type="date" 
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                  className="border-elegant focus:border-premium focus:ring-premium rounded-xl h-12"
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full bg-premium hover:bg-premium text-white font-semibold py-3 rounded-xl shadow-elegant hover:shadow-luxury transition-all duration-300 transform hover:scale-105">
                  <Search className="mr-2 h-4 w-4" />
                  Cari
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">{providers?.length || 0}</span>
              </div>
              <p className="text-elegant font-semibold text-lg">
                {isLoading ? "Mencari profesional..." : `Ditemukan ${providers?.length || 0} penerjemah profesional`}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-96 shadow-elegant"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {providers?.map((provider) => (
                <div 
                  key={provider.id} 
                  onClick={() => openProfileModal(provider)}
                  className="cursor-pointer transform transition-all duration-300 hover:scale-105"
                >
                  <ServiceProviderCard provider={provider} />
                </div>
              ))}
            </div>

            {providers?.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-premium-light rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-premium mb-4">Tidak ada penerjemah ditemukan</h3>
                <p className="text-muted text-lg mb-8 max-w-md mx-auto">
                  Coba ubah kriteria pencarian atau filter untuk hasil yang lebih luas
                </p>
                <Button 
                  onClick={() => setFilters({ city: "all", service: "all", availability: "" })}
                  variant="outline"
                  className="border-2 border-accent text-accent hover:bg-accent hover:text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-elegant hover:shadow-luxury transition-all duration-300 transform hover:scale-105"
                >
                  Reset Filter
                </Button>
              </div>
            )}

            {providers && providers.length > 0 && (
              <div className="text-center mt-16">
                <Button 
                  variant="outline" 
                  className="border-2 border-accent text-accent hover:bg-accent hover:text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-elegant hover:shadow-luxury transition-all duration-300 transform hover:scale-105"
                >
                  Lihat Lebih Banyak Penerjemah
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ProfileModal 
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
