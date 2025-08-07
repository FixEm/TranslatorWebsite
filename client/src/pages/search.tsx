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
import { Search } from "lucide-react";
import { ServiceProvider } from "@shared/schema";

export default function SearchPage() {
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    service: "",
    availability: ""
  });

  const { data: providers, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers", filters.city, filters.service],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.service) params.append('services', filters.service);
      
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-navy-800 mb-4">Cari Penerjemah & Tour Guide</h1>
          <p className="text-xl text-silver-600 max-w-2xl mx-auto">
            Gunakan filter canggih untuk menemukan profesional yang sesuai dengan kebutuhan Anda
          </p>
        </div>

        {/* Search Filters */}
        <Card className="mb-8 shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kota</label>
                <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kota</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Layanan</label>
                <Select value={filters.service} onValueChange={(value) => setFilters({...filters, service: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Layanan</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.value} value={service.value}>{service.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ketersediaan</label>
                <Input 
                  type="date" 
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full bg-navy-600 hover:bg-navy-700 text-white">
                  <Search className="mr-2 h-4 w-4" />
                  Cari
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {isLoading ? "Mencari..." : `Ditemukan ${providers?.length || 0} penerjemah`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-96"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers?.map((provider) => (
                <div key={provider.id} onClick={() => openProfileModal(provider)}>
                  <ServiceProviderCard provider={provider} />
                </div>
              ))}
            </div>

            {providers?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Tidak ada penerjemah ditemukan dengan kriteria tersebut</p>
                <Button 
                  onClick={() => setFilters({ city: "", service: "", availability: "" })}
                  variant="outline"
                  className="mt-4"
                >
                  Reset Filter
                </Button>
              </div>
            )}

            {providers && providers.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" className="border-2 border-navy-600 text-navy-600 hover:bg-navy-600 hover:text-white">
                  Lihat Lebih Banyak
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
