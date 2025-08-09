import { useState } from 'react';
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Video, CheckCircle, Clock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface VerificationStep {
  emailVerified: boolean;
  studentIdUploaded: boolean;
  hskUploaded: boolean;
  introVideoUploaded: boolean;
  adminApproved: boolean;
}

interface TranslatorApplication {
  id?: string;
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  whatsapp: string;
  city: string;
  services: string[];
  experience: string;
  pricePerDay: string;
  description: string;
  intent: 'translator' | 'tour_guide' | 'both';
  yearsInChina?: number;
  studentEmail?: string;
  verificationSteps?: VerificationStep;
  completenessScore?: number;
}

const cities = ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an", "Hangzhou", "Nanjing"];

export default function TranslatorSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [application, setApplication] = useState<TranslatorApplication>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    city: '',
    services: [],
    experience: '',
    pricePerDay: '',
    description: '',
    intent: 'translator'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const { toast } = useToast();



  const handleBasicInfoSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate password match
      if (application.password !== application.confirmPassword) {
        toast({
          title: "Error",
          description: "Password dan konfirmasi password tidak cocok.",
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch('/api/applications/translator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(application),
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      const result = await response.json();
      console.log('Registration response:', result);
      
      // Set the application ID and data
      const applicationData = result.application;
      setApplicationId(applicationData.id);
      
      // Initialize verification steps if not present
      const verificationSteps = applicationData.verificationSteps || {
        emailVerified: false,
        studentIdUploaded: false,
        hskUploaded: false,
        introVideoUploaded: false,
        adminApproved: false
      };
      
      const completenessScore = applicationData.completenessScore || 0;
      
      setApplication(prev => ({ 
        ...prev, 
        ...applicationData,
        verificationSteps,
        completenessScore
      }));
      
      setCurrentStep(3); // Go to verification step
      
      // Redirect to dashboard verification page after successful signup
      setTimeout(() => {
        setLocation('/translator/dashboard');
      }, 2000);

      toast({
        title: "Aplikasi Dibuat",
        description: result.message || "Aplikasi Anda telah berhasil dibuat! Silakan periksa email untuk verifikasi.",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Gagal membuat aplikasi. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (type: 'student-id' | 'hsk' | 'intro-video', file: File) => {
    if (!applicationId) return;

    try {
      const formData = new FormData();
      formData.append(type === 'student-id' ? 'studentId' : type === 'hsk' ? 'hskCertificate' : 'introVideo', file);

      const response = await fetch(`/api/applications/${applicationId}/upload/${type}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${type}`);
      }

      const result = await response.json();
      setApplication(prev => ({ ...prev, ...result.provider }));

      toast({
        title: "Upload Berhasil",
        description: `${type} Anda telah berhasil diupload!`,
      });
    } catch (error) {
      toast({
        title: "Upload Gagal",
        description: `Gagal mengupload ${type}. Silakan coba lagi.`,
        variant: "destructive",
      });
    }
  };

  const getStepIcon = (step: keyof VerificationStep, completed: boolean) => {
    if (completed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const getCompletionColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md w-full space-y-8">
            {/* Signup Card */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-navy-800">
                  Bergabung Sebagai Penerjemah
                </CardTitle>
                <CardDescription>
                  Bantu menghubungkan mahasiswa Indonesia dengan layanan terjemahan dan tur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full text-white h-12 text-lg font-semibold"
                >
                  Mulai Pendaftaran
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  Gunakan email @student.ac.id atau @edu.cn untuk verifikasi otomatis
                </div>
              </CardContent>
            </Card>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-600">
              <p>
                Sudah punya akun?{" "}
                <a href="/login" className="font-medium text-navy-600 hover:text-navy-500">
                  Masuk di sini
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Profil Dasar</CardTitle>
            <CardDescription>
              Ceritakan tentang diri Anda dan layanan terjemahan/guide yang Anda tawarkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={application.name}
                  onChange={(e) => setApplication(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama lengkap Anda"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={application.email}
                  onChange={(e) => setApplication(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@student.ac.id atau @edu.cn"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={application.password || ''}
                    onChange={(e) => setApplication(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Masukkan password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={application.confirmPassword || ''}
                    onChange={(e) => setApplication(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Konfirmasi password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={application.whatsapp}
                  onChange={(e) => setApplication(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="+86 138 0000 0000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Kota di China</Label>
                <Select value={application.city} onValueChange={(value) => setApplication(prev => ({ ...prev, city: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kota" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="intent">Jenis Layanan</Label>
                <Select value={application.intent} onValueChange={(value: any) => setApplication(prev => ({ ...prev, intent: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="translator">Penerjemah</SelectItem>
                    <SelectItem value="tour_guide">Tour Guide</SelectItem>
                    <SelectItem value="both">Keduanya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experience">Pengalaman</Label>
                <Select value={application.experience} onValueChange={(value) => setApplication(prev => ({ ...prev, experience: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tahun pengalaman" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 tahun</SelectItem>
                    <SelectItem value="2-3">2-3 tahun</SelectItem>
                    <SelectItem value="4-5">4-5 tahun</SelectItem>
                    <SelectItem value="6-10">6-10 tahun</SelectItem>
                    <SelectItem value="10+">10+ tahun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="pricePerDay">Tarif per Hari (¥)</Label>
              <Input
                id="pricePerDay"
                value={application.pricePerDay}
                onChange={(e) => setApplication(prev => ({ ...prev, pricePerDay: e.target.value }))}
                placeholder="300"
                type="number"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Tentang Anda</Label>
              <Textarea
                id="description"
                value={application.description}
                onChange={(e) => setApplication(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsikan pengalaman, spesialisasi, dan apa yang membuat Anda penerjemah/guide yang hebat..."
                className="min-h-[100px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Kembali
            </Button>
            <Button 
              onClick={handleBasicInfoSubmit}
              disabled={isSubmitting || !application.name || !application.email}
            >
              {isSubmitting ? "Membuat..." : "Lanjutkan"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md w-full space-y-8">
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-navy-800">
                  Pendaftaran Berhasil!
                </CardTitle>
                <CardDescription>
                  Akun Anda telah dibuat. Anda akan diarahkan ke dashboard untuk melengkapi verifikasi.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      Silakan lengkapi proses verifikasi di dashboard untuk mengaktifkan akun penerjemah Anda.
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Anda akan diarahkan ke dashboard dalam beberapa detik...
                  </div>
                  <Button 
                    onClick={() => setLocation('/translator/dashboard')}
                    className="w-full"
                  >
                    Lanjut ke Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return null;
}
