import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, GraduationCap, Calendar } from "lucide-react";
import { ServiceProvider } from "@shared/schema";
import { Link } from "wouter";

interface ServiceProviderCardProps {
  provider: ServiceProvider & {
    isStudent?: boolean;
    university?: string;
    expectedGraduation?: string;
    hskLevel?: string;
    availability?: any;
  };
}

export default function ServiceProviderCard({
  provider,
}: ServiceProviderCardProps) {
  const getServiceLabel = (service: string) => {
    const labels: { [key: string]: string } = {
      translator: "Translator",
      tour_guide: "Tour Guide",
      business_interpreter: "Business Interpreter",
      document_translation: "Document Translation",
      medical_companion: "Medical Companion",
      education_consultant: "Education Consultant",
    };
    return labels[service] || service;
  };

  const getServiceColor = (service: string) => {
    const colors: { [key: string]: string } = {
      translator: "bg-red-100 text-red-800",
      tour_guide: "bg-blue-100 text-blue-800",
      business_interpreter: "bg-purple-100 text-purple-800",
      document_translation: "bg-green-100 text-green-800",
      medical_companion: "bg-orange-100 text-orange-800",
      education_consultant: "bg-pink-100 text-pink-800",
    };
    return colors[service] || "bg-gray-100 text-gray-800";
  };

  const getAvailableDaysCount = () => {
    if (!provider.availability?.schedule) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return provider.availability.schedule.filter((day: any) => {
      const dayDate = new Date(day.date);
      return dayDate >= today && (day.timeSlots?.length > 0 || !day.timeSlots);
    }).length;
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl group bg-white">
      <div className="relative p-6 pb-0">
        {/* Profile Image Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img
              src={
                provider.profileImage ||
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"
              }
              alt={`${provider.name} profile`}
              className="w-40 h-40 rounded-full object-cover border-4 border-red-100 shadow-md"
            />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              {provider.name}
            </h3>
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1 text-red-600" />
              <span className="font-medium text-gray-800">
                {provider.city || "City not specified"}, China
              </span>
            </div>
            <div className="text-2xl font-bold">Rp {provider.pricePerDay}</div>
          </div>
        </div>

        {/* Student-specific information */}
        {provider.isStudent && (
          <div className="mb-6 space-y-3">
            {provider.university && (
              <div className="flex items-center text-sm text-gray-700">
                <GraduationCap className="w-4 h-4 mr-2 text-red-600" />
                <span className="font-medium">{provider.university}</span>
              </div>
            )}
            {provider.hskLevel && (
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="font-medium">
                  HSK Level: {provider.hskLevel}
                </span>
              </div>
            )}
            {provider.expectedGraduation && (
              <div className="flex items-center text-sm text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-red-600" />
                <span className="font-medium">
                  Graduation: {provider.expectedGraduation}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Rating Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex text-yellow-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(parseFloat(provider.rating || "0"))
                    ? "fill-current"
                    : "text-gray-300"
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

        {/* Availability indicator for students */}
        {provider.isStudent && provider.availability && (
          <div className="mb-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
              <Calendar className="w-4 h-4" />
              <span>Available {getAvailableDaysCount()} days this month</span>
            </div>
          </div>
        )}

        {/* Services */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Display service type based on intent */}
          {provider.intent && (
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-800 border-0 text-xs font-medium px-3 py-1 rounded-full"
            >
              {provider.intent === "translator"
                ? "Translator"
                : provider.intent === "tour_guide"
                ? "Tour Guide"
                : provider.intent === "both"
                ? "Translator & Tour Guide"
                : "Service Provider"}
            </Badge>
          )}

          {/* Also show individual services if available */}
          {(provider.services as string[]).slice(0, 2).map((service) => (
            <Badge
              key={service}
              variant="secondary"
              className={`text-xs font-medium px-3 py-1 rounded-full ${getServiceColor(
                service
              )} border-0`}
            >
              {getServiceLabel(service)}
            </Badge>
          ))}
          {(provider.services as string[]).length > 2 && (
            <Badge
              variant="outline"
              className="text-xs font-medium px-3 py-1 rounded-full border-gray-300 text-gray-600"
            >
              +{(provider.services as string[]).length - 2} lagi
            </Badge>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <Link href={`/profile/${provider.id}`}>
          <Button className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            {provider.isStudent
              ? "Lihat Profil & Chat"
              : "Lihat Profil Lengkap"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
