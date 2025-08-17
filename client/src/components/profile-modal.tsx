import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, CheckCircle, GraduationCap, Clock, Calendar } from "lucide-react";
import { ServiceProvider } from "@shared/schema";
import { useLocation } from "wouter";

interface ProfileModalProps {
  provider: ServiceProvider | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ provider, isOpen, onClose }: ProfileModalProps) {
  const [, setLocation] = useLocation();
  
  if (!provider) return null;

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

  const handleBookNow = () => {
    // Close modal and navigate to their profile page
    onClose();
    setLocation(`/profile/${provider.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Profil Translator</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="text-center">
              {/* Profile Image Container with Verification Badge */}
              <div className="relative inline-block mb-6">
                <div className="relative">
                  <img 
                    src={provider.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"} 
                    alt={provider.name} 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                  />
                  {/* Verification Badge - Top Right */}
                  {provider.isVerified && (
                    <div className="absolute -top-2 -right-4 bg-green-500 text-white rounded-full p-2 shadow-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-white text-xs">Terverifikasi</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Basic Info */}
              <h3 className="text-3xl font-bold text-gray-900 mb-3">{provider.name}</h3>
              
              {/* Location */}
              <div className="flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-gray-700 text-lg">{provider.city}, China</span>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex text-yellow-400 mr-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(parseFloat(provider.rating || "0")) ? "fill-current" : ""}`} 
                    />
                  ))}
                </div>
                <span className="text-gray-700 font-semibold">
                  {provider.rating} ({provider.reviewCount} ulasan)
                </span>
              </div>

              {/* Additional Info for Students */}
              {(provider as any).isStudent && (
                <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4 mb-6">
                  {(provider as any).university && (
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm text-gray-700">{(provider as any).university}</span>
                    </div>
                  )}
                  {(provider as any).hskLevel && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-700">HSK Level: {(provider as any).hskLevel}</span>
                    </div>
                  )}
                  {(provider as any).expectedGraduation && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm text-gray-700">Graduation: {(provider as any).expectedGraduation}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Book Now Button */}
              <Button 
                onClick={handleBookNow}
                className="w-full bg-red-700 hover:bg-red-800 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Now
              </Button>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Languages */}
              {(provider as any).languages && Array.isArray((provider as any).languages) && (provider as any).languages.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
                    Bahasa yang Dikuasai
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {((provider as any).languages as any[]).map((lang: any, index: number) => {
                      const levelInfo = getLanguageLevel(lang.level);
                      return (
                        <div key={index} className="flex items-center bg-gray-50 rounded-lg p-3">
                          <span className="font-medium">{lang.language}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {levelInfo.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Experience & Description */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
                  Pengalaman & Keahlian
                </h4>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {(provider as any).description || "Tidak ada deskripsi yang tersedia."}
                  </p>
                </div>
              </div>

              {/* Pricing Details */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
                  Detail Harga
                </h4>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center p-4 bg-red-50 rounded-xl">
                        <div className="text-sm text-gray-600 mb-2">Tarif Dasar (per hari)</div>
                        <div className="text-2xl font-bold text-red-700">Rp{provider.pricePerDay}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-sm text-gray-600 mb-2">Pengalaman</div>
                        <div className="text-2xl font-bold text-gray-700">{provider.experience} tahun</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
