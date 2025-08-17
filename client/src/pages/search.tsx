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
import { Search, Filter, MapPin, Calendar, Users } from "lucide-react";
import { ServiceProvider } from "@shared/schema";

export default function SearchPage() {
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    city: "all",
    service: "all",
    availability: ""
  });

  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: providers, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers", searchTrigger, filters.city, filters.service, filters.availability],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city && filters.city !== "all") params.append('city', filters.city);
      if (filters.service && filters.service !== "all") params.append('services', filters.service);
      
      // Fetch both service providers and verified student translators
      const [providersResponse, studentsResponse] = await Promise.all([
        fetch(`/api/service-providers?${params}`),
        fetch(`/api/applications/verified?${params}`)
      ]);
      
      if (!providersResponse.ok) throw new Error('Failed to fetch providers');
      if (!studentsResponse.ok) throw new Error('Failed to fetch students');
      
      const [providers, students] = await Promise.all([
        providersResponse.json(),
        studentsResponse.json()
      ]);
      
      // Transform student applications to service provider format
      const transformedStudents = students.map((student: any) => {
        // Extract fluent languages from questionnaire data if available
        let languages: Array<{ language: string; level: string }> = [];
        if (student.questionnaireData && student.questionnaireData.fluentLanguages && Array.isArray(student.questionnaireData.fluentLanguages)) {
          // Transform fluentLanguages array to the expected format
          languages = student.questionnaireData.fluentLanguages.map((lang: string) => ({
            language: lang,
            level: "Fluent" // Since these are fluent languages
          }));
        } else if (student.languages && Array.isArray(student.languages)) {
          // Fallback to languages array if fluentLanguages not available
          languages = student.languages;
        }
        
        // Debug: Log the student data to see what's available
        console.log('Student data for transformation:', {
          id: student.id,
          name: student.name,
          city: student.city,
          intent: student.intent,
          services: student.services
        });
        
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          whatsapp: student.whatsapp,
          city: student.city || student.location || student.currentCity || "City not specified",
          services: student.services || [],
          intent: student.intent || 'translator', // Use intent from database
          experience: student.experience || "0",
          pricePerDay: student.pricePerDay || "500000",
          rating: "4.5", // Default rating for students
          reviewCount: "New", // Indicate this is a new student
          description: student.description || student.motivation || "Motivated student translator ready to help with your translation needs.",
          profileImage: student.profileImage || "",
          isVerified: true,
          languages: languages,
          availability: student.availability || null,
          isStudent: true, // Flag to identify student translators
          university: student.university,
          expectedGraduation: student.expectedGraduation,
          hskLevel: student.hskLevel
        };
      });
      
      // Combine all results
      let allProviders = [...providers, ...transformedStudents];
      
      // Apply client-side filtering for better control
      if (filters.city && filters.city !== "all") {
        allProviders = allProviders.filter(provider => 
          provider.city && provider.city.toLowerCase().includes(filters.city.toLowerCase())
        );
      }
      
      if (filters.service && filters.service !== "all") {
        allProviders = allProviders.filter(provider => {
          // Use intent field if available, fallback to services array
          if (provider.intent) {
            return provider.intent === filters.service;
          }
          // Fallback to services array for backward compatibility
          return provider.services && Array.isArray(provider.services) && 
                 provider.services.some((service: string) => service === filters.service);
        });
      }
      
      if (filters.availability) {
        const requestedDate = new Date(filters.availability);
        const requestedStr = `${requestedDate.getFullYear()}-${String(requestedDate.getMonth() + 1).padStart(2, '0')}-${String(requestedDate.getDate()).padStart(2, '0')}`;

        const isAvailableBySchedule = (availability: any, dateStr: string) => {
          if (!availability) return false; // restrict to user-declared schedule scope
          // Unavailable periods take precedence (block if within)
          if (Array.isArray(availability.unavailablePeriods)) {
            const inBlocked = availability.unavailablePeriods.some((p: any) => {
              if (!p || (!p.start && !p.end)) return false;
              const s = p.start ? new Date(p.start) : undefined;
              const e = p.end ? new Date(p.end) : undefined;
              const d = new Date(dateStr);
              if (s && e) return d >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && d <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
              if (s && !e) return d >= new Date(s.getFullYear(), s.getMonth(), s.getDate());
              if (!s && e) return d <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
              return false;
            });
            if (inBlocked) return false;
          }
          // Explicit daily schedule (strict)
          if (!Array.isArray(availability.schedule) || availability.schedule.length === 0) {
            return false; // no schedule means not available
          }
          const entry = availability.schedule.find((day: any) => {
            if (!day) return false;
            if (typeof day.date === 'string') {
              return day.date === dateStr; // direct match on YYYY-MM-DD
            }
            try {
              const a = new Date(day.date);
              const [y, m, d] = dateStr.split('-').map(Number);
              const b = new Date(y, m - 1, d);
              return a.toDateString() === b.toDateString();
            } catch { return false; }
          });
          if (!entry) return false; // only dates explicitly in schedule

          // If timeSlots exist, require at least one slot with isAvailable
          if (Array.isArray(entry.timeSlots) && entry.timeSlots.length > 0) {
            return entry.timeSlots.some((slot: any) => slot?.isAvailable);
          }
          return !!entry.isAvailable;
        };

        const availabilityChecks = await Promise.all(
          allProviders.map(async (provider: any) => {
            // 1) Calendar cache check (booked days)
            try {
              const resp = await fetch(`/api/provider-calendars/${provider.id}`);
              if (resp.ok) {
                const calendar = await resp.json();
                const unavailable: string[] = Array.isArray(calendar?.unavailableDates) ? calendar.unavailableDates : [];
                if (unavailable.includes(requestedStr)) {
                  return { provider, available: false };
                }
              }
            } catch {}

            // 2) Schedule check (provider availability)
            let availability: any = provider.availability;
            if (!availability) {
              try {
                if ((provider as any).isStudent) {
                  const a = await fetch(`/api/applications/${provider.id}/availability`);
                  if (a.ok) availability = await a.json();
                } else {
                  const p = await fetch(`/api/service-providers/${provider.id}`);
                  if (p.ok) {
                    const full = await p.json();
                    availability = full?.availability;
                  }
                }
              } catch {}
            }

            const available = isAvailableBySchedule(availability, requestedStr);
            return { provider, available };
          })
        );

        allProviders = availabilityChecks
          .filter(item => item.available)
          .map(item => item.provider);
      }
      
      console.log('Filtered results:', {
        filters,
        totalResults: allProviders.length,
        results: allProviders.map(p => ({ name: p.name, city: p.city, services: p.services }))
      });
      
      return allProviders;
    }
  });

  const cities = [
    "Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Suzhou", "Hangzhou",
    "Nanjing", "Wuhan", "Chengdu", "Xi'an", "Tianjin", "Qingdao",
    "Chongqing", "Kunming", "Xiamen", "Dalian", "Jinan", "Harbin",
    "Changsha", "Zhengzhou", "Fuzhou", "Nanchang", "Hefei", "Shijiazhuang"
  ];

  const services = [
    { value: "translator", label: "Translator" },
    { value: "tour_guide", label: "Tour Guide" }
  ];

  const handleSearch = () => {
    // Trigger refetch by updating search trigger
    setSearchTrigger(prev => prev + 1);
  };

  const openProfileModal = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-red-100 text-red-700 font-semibold text-sm mb-8 border border-red-200">
            <Search className="w-5 h-5 mr-2" />
            Pencarian Profesional
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
            Cari Translator & Tour Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Gunakan filter canggih untuk menemukan profesional terverifikasi yang sesuai dengan kebutuhan Anda
          </p>
        </div>

        {/* Search Filters */}
        <Card className="mb-12 shadow-lg border-0 rounded-2xl bg-white">
          <CardContent className="p-8">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center mr-4">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Filter Pencarian</h3>
                <p className="text-gray-600">Temukan translator yang tepat untuk kebutuhan Anda</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-600" />
                  Kota
                </label>
                <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
                  <SelectTrigger className="border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl h-14 bg-gray-50 hover:bg-white transition-colors">
                    <SelectValue placeholder="Pilih Kota" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="all" className="rounded-lg hover:bg-red-50">Semua Kota</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city} className="rounded-lg hover:bg-red-50">{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-red-600" />
                  Jenis Layanan
                </label>
                <Select value={filters.service} onValueChange={(value) => setFilters({...filters, service: value})}>
                  <SelectTrigger className="border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl h-14 bg-gray-50 hover:bg-white transition-colors">
                    <SelectValue placeholder="Semua Layanan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="all" className="rounded-lg hover:bg-red-50">Semua Layanan</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.value} value={service.value} className="rounded-lg hover:bg-red-50">{service.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-red-600" />
                  Ketersediaan
                </label>
                <Input 
                  type="date" 
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                  className="border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl h-14 bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-14 text-lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Cari
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

     

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && providers && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {providers.map((provider) => (
                <div 
                  key={provider.id} 
                  onClick={() => openProfileModal(provider)}
                  className="cursor-pointer transform transition-all duration-300 hover:scale-105 group"
                >
                  <ServiceProviderCard provider={provider} />
                </div>
              ))}
            </div>

            {/* Empty State */}
            {providers.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tidak ada translator ditemukan</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  Coba ubah kriteria pencarian atau filter untuk hasil yang lebih luas
                </p>
                <Button 
                  onClick={() => setFilters({ city: "all", service: "all", availability: "" })}
                  variant="outline"
                  className="border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  Reset Filter
                </Button>
              </div>
            )}

            {/* Load More Button */}
            {providers.length > 0 && (
              <div className="text-center mt-16">
                <Button 
                  variant="outline" 
                  className="border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  Lihat Lebih Banyak Translator
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
