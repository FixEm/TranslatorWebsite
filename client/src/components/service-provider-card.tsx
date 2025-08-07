import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, CheckCircle } from "lucide-react";
import { ServiceProvider } from "@shared/schema";
import { Link } from "wouter";

interface ServiceProviderCardProps {
  provider: ServiceProvider;
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

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={provider.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"} 
          alt={`${provider.name} profile`} 
          className="w-full h-48 object-cover"
        />
        {provider.isVerified && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-500 text-white flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Terverifikasi
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-navy-800 mb-2">{provider.name}</h3>
        
        <div className="flex items-center mb-3">
          <MapPin className="w-4 h-4 text-silver-500 mr-2" />
          <span className="text-silver-600">{provider.city}, China</span>
        </div>
        
        <div className="flex items-center mb-3">
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
        
        <p className="text-gray-700 mb-4 text-sm line-clamp-3">
          {provider.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-1">
            {(provider.services as string[]).slice(0, 2).map((service) => (
              <Badge 
                key={service} 
                variant="secondary" 
                className={`text-xs ${getServiceColor(service)}`}
              >
                {getServiceLabel(service)}
              </Badge>
            ))}
            {(provider.services as string[]).length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{(provider.services as string[]).length - 2}
              </Badge>
            )}
          </div>
          <span className="text-lg font-bold text-navy-600">¥{provider.pricePerDay}/hari</span>
        </div>
        
        <Link href={`/profile/${provider.id}`}>
          <Button className="w-full bg-navy-600 hover:bg-navy-700 text-white">
            Lihat Profil Lengkap
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
