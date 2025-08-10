import { useState } from 'react';
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import RoleSelection from "@/components/role-selection";
import RoleQuestionnaire from "@/components/role-questionnaire";

interface VerificationStep {
  emailVerified: boolean;
  studentIdUploaded: boolean;
  hskUploaded: boolean;
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
  university: string;
  expectedGraduation: string;
  motivation: string;
  intent: 'translator' | 'tour_guide';
  yearsInChina?: number;
  studentEmail?: string;
  verificationSteps?: VerificationStep;
  completenessScore?: number;
  questionnaireData?: any;
}

const cities = ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an", "Hangzhou", "Nanjing"];

const graduationYears = [
  "2024", "2025", "2026", "2027", "2028", "2029", "2030"
];

export default function TranslatorSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'translator' | 'tour_guide' | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
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
    university: '',
    expectedGraduation: '',
    motivation: '',
    intent: 'translator'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRoleSelect = (role: 'translator' | 'tour_guide') => {
    setSelectedRole(role);
    setApplication(prev => ({ ...prev, intent: role }));
    setCurrentStep(2);
  };

  const handleQuestionnaireComplete = (data: any) => {
    setQuestionnaireData(data);
    setCurrentStep(3);
  };

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
      
      // Prepare application data with questionnaire responses
      const applicationData = {
        ...application,
        questionnaireData: questionnaireData
      };
      
      const response = await fetch('/api/applications/translator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      const result = await response.json();
      console.log('Registration response:', result);
      
      setCurrentStep(4); // Go to success step
      
      // Redirect to login page after successful signup
      setTimeout(() => {
        setLocation('/login');
      }, 2000);

      toast({
        title: "Aplikasi Dibuat",
        description: result.message || "Aplikasi Anda telah berhasil dibuat! Silakan login untuk melanjutkan.",
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

  // Step 1: Role Selection
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <RoleSelection onRoleSelect={handleRoleSelect} />
        </div>
        <Footer />
      </div>
    );
  }

  // Step 2: Questionnaire
  if (currentStep === 2 && selectedRole) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Pilihan Peran
              </Button>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-navy-800">Kuesioner Pra-Pendaftaran</h1>
                <p className="text-gray-600">
                  Isi kuesioner ini untuk membantu kami memahami profil dan pengalaman Anda
                </p>
              </div>
            </div>
            <RoleQuestionnaire 
              selectedRole={selectedRole}
              onComplete={handleQuestionnaireComplete}
              onBack={() => setCurrentStep(1)}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Step 3: Registration Form
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Kuesioner
              </Button>
              <div className="text-center space-y-2">
                <Progress value={75} className="w-full h-2" />
                <p className="text-sm text-gray-600">Langkah 3 dari 4</p>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Informasi Akun dan Profil</CardTitle>
                <CardDescription>
                  Buat akun Anda dan lengkapi informasi dasar profil
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
                    <Label htmlFor="university">Universitas</Label>
                    <Input
                      id="university"
                      value={application.university}
                      onChange={(e) => setApplication(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="Nama universitas Anda"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedGraduation">Perkiraan Kelulusan</Label>
                    <Select value={application.expectedGraduation} onValueChange={(value) => setApplication(prev => ({ ...prev, expectedGraduation: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {graduationYears.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="pricePerDay">Expektasi per hari(¥)</Label>
                    <Input
                      id="pricePerDay"
                      value={application.pricePerDay}
                      onChange={(e) => setApplication(prev => ({ ...prev, pricePerDay: e.target.value }))}
                      placeholder="300"
                      type="number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="motivation">Mengapa Anda ingin bergabung dengan AyoCabut? *</Label>
                  <Textarea
                    id="motivation"
                    value={application.motivation}
                    onChange={(e) => setApplication(prev => ({ ...prev, motivation: e.target.value }))}
                    placeholder="Ceritakan alasan Anda ingin bergabung dengan AyoCabut, seperti untuk mendapatkan penghasilan tambahan, meningkatkan kemampuan bahasa, mendapatkan koneksi, pengalaman pertukaran budaya, dll..."
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Kembali
                </Button>
                <Button 
                  onClick={handleBasicInfoSubmit}
                  disabled={isSubmitting || !application.name || !application.email}
                >
                  {isSubmitting ? "Membuat..." : "Buat Akun"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Step 4: Success
  if (currentStep === 4) {
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
                  Akun Anda telah dibuat. Anda akan diarahkan ke halaman login untuk masuk.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      Silakan verifikasi email Anda.
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Anda akan diarahkan ke halaman login dalam beberapa detik...
                  </div>
                  <Button 
                    onClick={() => setLocation('/login')}
                    className="w-full"
                  >
                    Lanjut ke Login
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
