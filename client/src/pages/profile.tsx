import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BookableCalendar from "@/components/bookable-calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Star,
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  Calendar,
  GraduationCap,
  Clock,
} from "lucide-react";
import { ServiceProvider } from "@shared/schema";
import { chatAPI } from "@/lib/firebase-client";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: provider,
    isLoading,
    error,
  } = useQuery<
    ServiceProvider & {
      isStudent?: boolean;
      university?: string;
      expectedGraduation?: string;
      hskLevel?: string;
      availability?: any;
      description?: string;
    }
  >({
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
        console.log(
          "Not found in service providers, trying student applications..."
        );
      }

      // If not found in service providers, try student applications
      const studentResponse = await fetch(`/api/applications/verified`);
      if (!studentResponse.ok) throw new Error("Failed to fetch student data");

      const students = await studentResponse.json();
      const student = students.find((s: any) => s.id === id);

      if (!student) throw new Error("Provider not found");

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
        description:
          student.description ||
          student.motivation ||
          "Motivated student translator ready to help with your translation needs.",
        profileImage: student.profileImage || "",
        isVerified: true,
        languages: student.questionnaireData?.fluentLanguages
          ? student.questionnaireData.fluentLanguages.map((lang: string) => ({
              language: lang,
              level: "Fluent",
            }))
          : student.languages || [],
        availability: student.availability || null,
        isStudent: true,
        university: student.university,
        expectedGraduation: student.expectedGraduation,
        hskLevel: student.hskLevel,
      };
    },
  });

  // Start chat with student
  const startChat = async () => {
    if (!user?.uid) {
      // Redirect to login page
      window.location.href = "/login";
      return;
    }

    if (!provider) {
      toast({
        title: "Error",
        description: "Unable to load student information",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if conversation already exists
      const existingConversation = await chatAPI.findExistingConversation([
        user.uid,
        provider.id,
      ]);

      let conversation;
      if (existingConversation) {
        conversation = existingConversation;
        toast({
          title: "Chat Found",
          description: "Opening existing conversation...",
        });
      } else {
        // Create a new conversation between the current user and the student
        conversation = await chatAPI.createConversation([
          user.uid,
          provider.id,
        ]);
        toast({
          title: "Chat Started",
          description: "Opening new conversation...",
        });
      }

      // Navigate to the client dashboard with chat tab and conversation
      window.location.href = `/client/dashboard?tab=chat&conversation=${conversation.id}`;
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getServiceLabel = (service: string) => {
    const labels: { [key: string]: string } = {
      translator: "Penerjemah Bisnis",
      tour_guide: "Tour Guide",
      business_interpreter: "Interpretasi",
      document_translation: "Terjemahan Dokumen",
      medical_companion: "Pendamping Medis",
      education_consultant: "Konsultan Pendidikan",
    };
    return labels[service] || service;
  };

  const getLanguageLevel = (level: string) => {
    const levels: { [key: string]: { color: string; label: string } } = {
      Native: { color: "bg-green-500", label: "Native" },
      Fluent: { color: "bg-green-500", label: "Fluent" },
      Advanced: { color: "bg-yellow-500", label: "Advanced" },
      Intermediate: { color: "bg-yellow-500", label: "Intermediate" },
      Beginner: { color: "bg-red-500", label: "Beginner" },
    };
    return levels[level] || { color: "bg-gray-500", label: level };
  };

  const handleWhatsAppContact = () => {
    if (!provider) return;
    const message = encodeURIComponent(
      `Halo ${provider.name}, saya tertarik dengan layanan Anda melalui PenerjemahChina.`
    );
    window.open(
      `https://wa.me/${provider.whatsapp.replace(/\D/g, "")}?text=${message}`,
      "_blank"
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="h-48 w-48 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
              <div className="lg:col-span-2 space-y-8">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Penerjemah tidak ditemukan
            </h1>
            <Link href="/search">
              <Button className="bg-red-700 hover:bg-red-800">
                Kembali ke Pencarian
              </Button>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link href="/search">
          <Button
            variant="ghost"
            className="mb-8 text-gray-600 hover:text-red-700 hover:bg-red-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Pencarian
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="relative inline-block mb-6">
                  <img
                    src={
                      provider.profileImage ||
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"
                    }
                    alt={provider.name}
                    className="w-48 h-48 rounded-full object-cover border-4 border-red-100 shadow-xl"
                  />
                  {provider.isVerified && (
                    <div className="absolute -top-2 -right-2 bg-green-500 flex items-center gap-2 text-white rounded-full p-2 shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-white text-xs">Terverifikasi</span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {provider.name}
                </h1>
                <div className="flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-gray-600 font-medium">
                    {provider.city}, China
                  </span>
                </div>
                <div className="flex items-center justify-center mb-6">
                  <div className="flex text-yellow-400 mr-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(parseFloat(provider.rating || "0"))
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {provider.rating}{" "}
                    {provider.isStudent
                      ? "(New Student)"
                      : `(${provider.reviewCount} ulasan)`}
                  </span>
                </div>

                <div className="text-3xl font-bold mb-4">
                  Rp {provider.pricePerDay}/hari
                </div>

                {/* Services */}
                {(provider.services as string[]) &&
                  Array.isArray(provider.services) &&
                  (provider.services as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(provider.services as string[])
                        .slice(0, 3)
                        .map((service) => (
                          <Badge
                            key={service}
                            variant="secondary"
                            className="bg-red-100 text-red-800 border-0 text-xs font-medium px-3 py-1 rounded-full"
                          >
                            {getServiceLabel(service)}
                          </Badge>
                        ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Student-specific information */}
              {provider.isStudent && (
                <Card className="shadow-lg border-0 rounded-2xl">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="w-2 h-10 bg-red-600 rounded-full mr-4"></div>
                      Academic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {provider.university && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <GraduationCap className="w-5 h-5 text-red-600 mr-3" />
                          <div>
                            <div className="text-sm text-gray-600 font-medium">
                              University
                            </div>
                            <div className="font-semibold text-gray-900">
                              {provider.university}
                            </div>
                          </div>
                        </div>
                      )}
                      {provider.expectedGraduation && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <Clock className="w-5 h-5 text-red-600 mr-3" />
                          <div>
                            <div className="text-sm text-gray-600 font-medium">
                              Expected Graduation
                            </div>
                            <div className="font-semibold text-gray-900">
                              {provider.expectedGraduation}
                            </div>
                          </div>
                        </div>
                      )}
                      {provider.hskLevel && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <div className="w-5 h-5 bg-red-500 rounded-full mr-3"></div>
                          <div>
                            <div className="text-sm text-gray-600 font-medium">
                              HSK Level
                            </div>
                            <div className="font-semibold text-gray-900">
                              {provider.hskLevel}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div className="w-5 h-5 bg-blue-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm text-gray-600 font-medium">
                            Experience
                          </div>
                          <div className="font-semibold text-gray-900">
                            {provider.experience} years
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card className="shadow-lg border-0 rounded-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-2 h-10 bg-red-600 rounded-full mr-4"></div>
                    Deskripsi Student
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {(provider as any).description ||
                        "No description available"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card className="shadow-lg border-0 rounded-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-2 h-10 bg-red-600 rounded-full mr-4"></div>
                    Bahasa yang Dikuasai
                  </h2>
                  {(provider.languages as any[]) &&
                  Array.isArray(provider.languages) &&
                  (provider.languages as any[]).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(provider.languages as any[]).map(
                        (lang: any, index: number) => {
                          const levelInfo = getLanguageLevel(lang.level);
                          return (
                            <div
                              key={index}
                              className="flex items-center p-4 bg-gray-50 rounded-xl"
                            >
                              <span
                                className={`w-4 h-4 ${levelInfo.color} rounded-full mr-3`}
                              ></span>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {lang.language}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {levelInfo.label}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg">
                        No language information available
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Contact the student to learn about their language skills
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Availability Calendar */}
              <Card className="shadow-lg border-0 rounded-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-2 h-10 bg-red-600 rounded-full mr-4"></div>
                    <Calendar className="h-6 w-6 mr-3 text-red-600" />
                    {provider.isStudent
                      ? "Student's Availability"
                      : "Availability"}
                  </h2>
                  {provider.availability ? (
                    <BookableCalendar
                      userId={provider.id}
                      providerName={provider.name}
                      initialAvailability={provider.availability}
                      pricePerDay={provider.pricePerDay}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No availability information set</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Buttons */}
              <div className="flex flex-col sm:flex-row gap-6">
                <Button
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  onClick={
                    provider?.isStudent ? startChat : handleWhatsAppContact
                  }
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  {provider?.isStudent ? "Chat" : "Kirim Pesan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
