import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BookableCalendar from "@/components/bookable-calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, CheckCircle, MessageSquare, ArrowLeft, Calendar } from "lucide-react";
import { ServiceProvider } from "@shared/schema";

export default function ProfilePage() {
  const { id } = useParams();

  const { data: provider, isLoading, error } = useQuery<ServiceProvider & {
    isStudent?: boolean;
    university?: string;
    expectedGraduation?: string;
    hskLevel?: string;
    availability?: any;
    description?: string;
  }>({
    queryKey: [`/api/service-providers/${id}`],
    enabled: !!id,
    queryFn: async () => {
      // Try to fetch from service providers first
      try {
        const response = await fetch(`/api/service-providers/${id}`);
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.log('Not found in service providers, trying student applications...');
      }
      
      // If not found in service providers, try student applications
      const studentResponse = await fetch(`/api/applications/verified`);
      if (!studentResponse.ok) throw new Error('Failed to fetch student data');
      
      const students = await studentResponse.json();
      const student = students.find((s: any) => s.id === id);
      
      if (!student) throw new Error('Provider not found');
      
      // Transform student to provider format
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        whatsapp: student.whatsapp,
        city: student.city,
        services: student.services || [],
        experience: student.experience || "0",
        pricePerDay: student.pricePerDay || "500000",
        rating: "4.5",
        reviewCount: "New",
        description: student.motivation || "Motivated student translator ready to help with your translation needs.",
        profileImage: student.profileImage || "",
        isVerified: true,
        languages: student.languages || [],
        availability: student.availability || null,
        isStudent: true,
        university: student.university,
        expectedGraduation: student.expectedGraduation,
        hskLevel: student.hskLevel
      };
    }
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
                    {provider.rating} {provider.isStudent ? '(New Student)' : `(${provider.reviewCount} ulasan)`}
                  </span>
                </div>
                <div className="space-y-2">
                  {provider.isVerified && (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit mx-auto">
                      <CheckCircle className="w-3 h-3" />
                      Terverifikasi
                    </Badge>
                  )}
                  
                  <div className="text-2xl font-bold text-navy-600">Rp {provider.pricePerDay}/hari</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Student-specific information */}
              {provider.isStudent && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-navy-800 mb-3">Academic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {provider.university && (
                        <div>
                          <div className="text-sm text-gray-600">University</div>
                          <div className="font-medium">{provider.university}</div>
                        </div>
                      )}
                      {provider.expectedGraduation && (
                        <div>
                          <div className="text-sm text-gray-600">Expected Graduation</div>
                          <div className="font-medium">{provider.expectedGraduation}</div>
                        </div>
                      )}
                      {provider.hskLevel && (
                        <div>
                          <div className="text-sm text-gray-600">HSK Level</div>
                          <div className="font-medium">{provider.hskLevel}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-gray-600">Experience</div>
                        <div className="font-medium">{provider.experience} years</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-navy-800 mb-3">Diskripsi Student</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {typeof provider.description === 'string' ? provider.description : "No description available"}
                  </p>
                </CardContent>
              </Card>

              {/* Availability Calendar */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-navy-800 mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {provider.isStudent ? "Student's Availability" : "Availability"}
                  </h2>
                  {provider.availability ? (
                    <BookableCalendar
                      userId={provider.id}
                      providerName={provider.name}
                      initialAvailability={provider.availability}
                      pricePerDay={provider.pricePerDay}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No availability information set</p>
                    </div>
                  )}
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
                  {provider.isStudent ? 'Book Student' : 'Kirim Pesan'}
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
