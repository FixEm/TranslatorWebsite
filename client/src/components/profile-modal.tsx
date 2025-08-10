import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, CheckCircle, MessageSquare } from "lucide-react";
import { ServiceProvider } from "@shared/schema";

interface ProfileModalProps {
  provider: ServiceProvider | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ provider, isOpen, onClose }: ProfileModalProps) {
  if (!provider) return null;

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
    const message = encodeURIComponent(`Halo ${provider.name}, saya tertarik dengan layanan Anda melalui PenerjemahChina.`);
    window.open(`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil Penerjemah</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="text-center">
              <img 
                src={provider.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"} 
                alt={provider.name} 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-navy-200"
              />
              <h3 className="text-2xl font-bold text-navy-800 mb-2">{provider.name}</h3>
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
            </div>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Services */}
              <div>
                <h4 className="text-lg font-semibold text-navy-800 mb-3">Layanan yang Ditawarkan</h4>
                <div className="flex flex-wrap gap-2">
                  {(provider.services as string[]).map((service) => (
                    <Badge
                      key={service}
                      variant="secondary"
                      className="bg-navy-100 text-navy-800"
                    >
                      {getServiceLabel(service)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Languages */}
              {provider.languages && Array.isArray(provider.languages) && provider.languages.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-navy-800 mb-3">Bahasa yang Dikuasai</h4>
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
                </div>
              )}

              {/* Experience */}
              <div>
                <h4 className="text-lg font-semibold text-navy-800 mb-3">Pengalaman & Keahlian</h4>
                <p className="text-gray-700 leading-relaxed">
                  {provider.description}
                </p>
              </div>

              {/* Pricing Details */}
              <div>
                <h4 className="text-lg font-semibold text-navy-800 mb-3">Detail Harga</h4>
                <Card>
                  <CardContent className="p-4">
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
              </div>

              {/* Contact Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={handleWhatsAppContact}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Hubungi via WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-navy-600 text-navy-600 hover:bg-navy-600 hover:text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Kirim Pesan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
