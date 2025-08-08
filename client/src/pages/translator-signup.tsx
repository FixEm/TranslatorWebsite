import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Video, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [application, setApplication] = useState<TranslatorApplication>({
    name: '',
    email: '',
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

  const handleGoogleSignIn = async () => {
    try {
      // Initialize Google Sign-In (you'll need to implement this)
      toast({
        title: "Masuk dengan Google",
        description: "Integrasi Google Sign-In akan diimplementasikan di sini",
      });
    } catch (error) {
      toast({
        title: "Gagal Masuk",
        description: "Tidak dapat masuk dengan Google. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleBasicInfoSubmit = async () => {
    try {
      setIsSubmitting(true);
      
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
      setApplicationId(result.id);
      setApplication(prev => ({ ...prev, ...result }));
      setCurrentStep(3); // Skip to upload step

      toast({
        title: "Aplikasi Dibuat",
        description: "Aplikasi Anda telah berhasil dibuat!",
      });
    } catch (error) {
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
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bergabung Sebagai Penerjemah Mahasiswa</CardTitle>
            <CardDescription>
              Bantu menghubungkan mahasiswa Indonesia dengan layanan terjemahan dan tur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleSignIn}
              className="w-full"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              Gunakan email @student.ac.id atau @edu.cn untuk verifikasi instan
            </div>
            
            <Button 
              onClick={() => setCurrentStep(2)}
              className="w-full"
              variant="secondary"
            >
              Daftar manual
            </Button>
          </CardContent>
        </Card>
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

  if (currentStep === 3 && application.verificationSteps) {
    const completenessScore = application.completenessScore || 0;
    
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Progres Verifikasi
              <Badge variant={completenessScore >= 100 ? "default" : "secondary"}>
                {completenessScore}% Selesai
              </Badge>
            </CardTitle>
            <CardDescription>
              Lengkapi semua langkah untuk memverifikasi dan mencantumkan profil Anda
            </CardDescription>
            <Progress value={completenessScore} className="w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Verification */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStepIcon('emailVerified', application.verificationSteps.emailVerified)}
                <div>
                  <h3 className="font-medium">Verifikasi Email</h3>
                  <p className="text-sm text-gray-600">Verifikasi alamat email mahasiswa Anda</p>
                </div>
              </div>
              <Badge variant={application.verificationSteps.emailVerified ? "default" : "outline"}>
                30 poin
              </Badge>
            </div>

            {/* Student ID Upload */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStepIcon('studentIdUploaded', application.verificationSteps.studentIdUploaded)}
                <div>
                  <h3 className="font-medium">Dokumen Kartu Mahasiswa</h3>
                  <p className="text-sm text-gray-600">Upload kartu mahasiswa atau sertifikat HSK Anda</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={application.verificationSteps.studentIdUploaded ? "default" : "outline"}>
                  20 poin
                </Badge>
                {!application.verificationSteps.studentIdUploaded && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,.pdf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload('student-id', file);
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* HSK Certificate */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStepIcon('hskUploaded', application.verificationSteps.hskUploaded)}
                <div>
                  <h3 className="font-medium">Sertifikat HSK (Opsional)</h3>
                  <p className="text-sm text-gray-600">Upload sertifikat kemampuan bahasa Mandarin Anda</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={application.verificationSteps.hskUploaded ? "default" : "outline"}>
                  15 poin
                </Badge>
                {!application.verificationSteps.hskUploaded && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,.pdf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload('hsk', file);
                      };
                      input.click();
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Intro Video */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStepIcon('introVideoUploaded', application.verificationSteps.introVideoUploaded)}
                <div>
                  <h3 className="font-medium">Video Perkenalan</h3>
                  <p className="text-sm text-gray-600">Rekam diri Anda berbicara dalam bahasa Indonesia dan Mandarin</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={application.verificationSteps.introVideoUploaded ? "default" : "outline"}>
                  20 poin
                </Badge>
                {!application.verificationSteps.introVideoUploaded && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'video/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload('intro-video', file);
                      };
                      input.click();
                    }}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Admin Approval */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStepIcon('adminApproved', application.verificationSteps.adminApproved)}
                <div>
                  <h3 className="font-medium">Review Admin</h3>
                  <p className="text-sm text-gray-600">Menunggu persetujuan admin</p>
                </div>
              </div>
              <Badge variant={application.verificationSteps.adminApproved ? "default" : "outline"}>
                15 poin
              </Badge>
            </div>

            {completenessScore >= 80 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="text-green-800 font-medium">
                    Bagus! Profil Anda hampir lengkap dan siap untuk direview.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
