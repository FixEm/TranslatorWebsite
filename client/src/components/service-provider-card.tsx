import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, CheckCircle, GraduationCap, Calendar } from "lucide-react";
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

export default function ServiceProviderCard({ provider }: ServiceProviderCardProps) {
  const getServiceLabel = (service: string) => {
    const labels: { [key: string]: string } = {
      translator: "Penerjemah",
      tour_guide: "Tour Guide",
      business_interpreter: "Interpretasi Bisnis",
      document_translation: "Terjemahan Dokumen",
      medical_companion: "Pendamping Medis",
      education_consultant: "Konsultan Pendidikan"
    };
    return labels[service] || service;
  };

  const getServiceColor = (service: string) => {
    const colors: { [key: string]: string } = {
      translator: "bg-navy-100 text-navy-800",
      tour_guide: "bg-blue-100 text-blue-800",
      business_interpreter: "bg-purple-100 text-purple-800",
      document_translation: "bg-green-100 text-green-800",
      medical_companion: "bg-orange-100 text-orange-800",
      education_consultant: "bg-pink-100 text-pink-800"
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
    <Card className="card-gradient overflow-hidden shadow-elegant hover:shadow-luxury transition-all duration-300 border-0 rounded-2xl group">
      <div className="relative">
        <div className="overflow-hidden rounded-t-2xl">
          <img 
            src={provider.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"} 
            alt={`${provider.name} profile`} 
            className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Verification and Student Badge */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {provider.isVerified && (
            <div className="glass-effect bg-green-500/90 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <CheckCircle className="w-3 h-3" />
              Terverifikasi
            </div>
          )}
          {provider.isStudent && (
            <div className="glass-effect bg-blue-500/90 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <GraduationCap className="w-3 h-3" />
              Student
            </div>
          )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-t-2xl"></div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">{provider.name}</h3>
          <span className="text-xl font-bold text-accent text-red-700">Rp {provider.pricePerDay}</span>
        </div>
        
        <div className="flex items-center mb-3">
          <MapPin className="w-4 h-4 text-slate-600 mr-2" />
          <span className="text-slate-600 font-medium">{provider.city}, China</span>
        </div>
        
        {/* Student-specific information */}
        {provider.isStudent && (
          <div className="mb-3 space-y-1">
            {provider.university && (
              <div className="flex items-center text-sm text-slate-600">
                <GraduationCap className="w-3 h-3 mr-1" />
                <span>{provider.university}</span>
              </div>
            )}
            {provider.hskLevel && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">HSK Level:</span> {provider.hskLevel}
              </div>
            )}
            {provider.expectedGraduation && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">Graduation:</span> {provider.expectedGraduation}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex text-yellow-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(parseFloat(provider.rating || "0")) ? "fill-current" : "text-gray-300"}`} 
              />
            ))}
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {provider.rating} {provider.isStudent ? '(New Student)' : `(${provider.reviewCount} ulasan)`}
          </span>
        </div>
        
        {/* Availability indicator for students */}
        {provider.isStudent && provider.availability && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Calendar className="w-3 h-3" />
              <span>Available {getAvailableDaysCount()} days this month</span>
            </div>
          </div>
        )}
        
        <p className="text-slate-700 mb-4 text-sm leading-relaxed line-clamp-3">
          {provider.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {(provider.services as string[]).slice(0, 3).map((service) => (
            <Badge 
              key={service} 
              variant="secondary" 
              className={`text-xs font-medium px-3 py-1 rounded-full ${getServiceColor(service)} border-0`}
            >
              {getServiceLabel(service)}
            </Badge>
          ))}
          {(provider.services as string[]).length > 3 && (
            <Badge variant="outline" className="text-xs font-medium px-3 py-1 rounded-full border-slate-300 text-slate-600">
              +{(provider.services as string[]).length - 3} lagi
            </Badge>
          )}
        </div>
        
        <Link href={`/profile/${provider.id}`}>
          <Button className="w-full bg-premium hover:bg-premium bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-xl shadow-elegant hover:shadow-luxury transition-all duration-300 transform group-hover:scale-105">
            {provider.isStudent ? 'Lihat Profil & Book Student' : 'Lihat Profil Lengkap'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
