import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Mail, 
  Upload, 
  FileText, 
  Video, 
  Star 
} from "lucide-react";

interface VerificationStep {
  emailVerified: boolean;
  studentIdUploaded: boolean;
  hskUploaded: boolean;
  introVideoUploaded: boolean;
  adminApproved: boolean;
}

interface VerificationStatusProps {
  userId?: string;
  applicationData?: any;
  onUpdate?: () => void;
}

export default function VerificationStatus({ userId, applicationData, onUpdate }: VerificationStatusProps) {
  const { toast } = useToast();
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep>({
    emailVerified: false,
    studentIdUploaded: false,
    hskUploaded: false,
    introVideoUploaded: false,
    adminApproved: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Calculate completeness score
  const completenessScore = Object.entries(verificationSteps).reduce((score, [key, value]) => {
    const points = {
      emailVerified: 30,
      studentIdUploaded: 20,
      hskUploaded: 15,
      introVideoUploaded: 20,
      adminApproved: 15
    };
    return score + (value ? points[key as keyof typeof points] : 0);
  }, 0);

  useEffect(() => {
    if (applicationData?.verificationSteps) {
      setVerificationSteps(applicationData.verificationSteps);
    }
  }, [applicationData]);

  const handleFileUpload = async (type: string, file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('applicationId', applicationData?.id || '');

      const response = await fetch('/api/verification/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Update verification status
      setVerificationSteps(prev => ({
        ...prev,
        [type === 'student-id' ? 'studentIdUploaded' : 
         type === 'hsk' ? 'hskUploaded' : 'introVideoUploaded']: true
      }));

      toast({
        title: "Upload Berhasil!",
        description: `${file.name} berhasil diupload.`,
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Upload Gagal",
        description: error.message || "Terjadi kesalahan saat upload file.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/verification/resend-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: applicationData?.email,
          applicationId: applicationData?.id 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend verification email');
      }

      toast({
        title: "Email Terkirim!",
        description: "Email verifikasi telah dikirim ulang. Silakan periksa inbox Anda.",
      });
    } catch (error: any) {
      toast({
        title: "Gagal Mengirim Email",
        description: error.message || "Terjadi kesalahan saat mengirim email verifikasi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (step: keyof VerificationStep, completed: boolean) => {
    if (completed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    switch (step) {
      case 'emailVerified':
        return <Mail className="h-5 w-5 text-gray-400" />;
      case 'studentIdUploaded':
        return <Upload className="h-5 w-5 text-gray-400" />;
      case 'hskUploaded':
        return <FileText className="h-5 w-5 text-gray-400" />;
      case 'introVideoUploaded':
        return <Video className="h-5 w-5 text-gray-400" />;
      case 'adminApproved':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Status Verifikasi Akun
          </CardTitle>
          <CardDescription>
            Lengkapi semua langkah verifikasi untuk mengaktifkan akun penerjemah Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Kelengkapan Profil</span>
              <span className={`text-sm font-bold ${getStatusColor(completenessScore)}`}>
                {completenessScore}/100 poin
              </span>
            </div>
            <Progress value={completenessScore} className="h-2" />
            <p className="text-xs text-gray-600">
              Minimal 80 poin diperlukan untuk aktivasi akun
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Langkah Verifikasi</CardTitle>
          <CardDescription>
            Selesaikan semua langkah berikut untuk verifikasi lengkap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Verification */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon('emailVerified', verificationSteps.emailVerified)}
              <div>
                <h3 className="font-medium">Verifikasi Email</h3>
                <p className="text-sm text-gray-600">
                  Konfirmasi alamat email Anda
                </p>
                {!verificationSteps.emailVerified && (
                  <p className="text-xs text-orange-600 mt-1">
                    Silakan periksa email Anda dan klik link verifikasi
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!verificationSteps.emailVerified && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                >
                  Kirim Ulang
                </Button>
              )}
              <Badge variant={verificationSteps.emailVerified ? "default" : "outline"}>
                30 poin
              </Badge>
            </div>
          </div>

          {/* Student ID Upload */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon('studentIdUploaded', verificationSteps.studentIdUploaded)}
              <div>
                <h3 className="font-medium">Dokumen Kartu Mahasiswa</h3>
                <p className="text-sm text-gray-600">Upload kartu mahasiswa atau sertifikat HSK Anda</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={verificationSteps.studentIdUploaded ? "default" : "outline"}>
                20 poin
              </Badge>
              {!verificationSteps.studentIdUploaded && (
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
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* HSK Certificate */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon('hskUploaded', verificationSteps.hskUploaded)}
              <div>
                <h3 className="font-medium">Sertifikat HSK (Opsional)</h3>
                <p className="text-sm text-gray-600">Upload sertifikat kemampuan bahasa Mandarin Anda</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={verificationSteps.hskUploaded ? "default" : "outline"}>
                15 poin
              </Badge>
              {!verificationSteps.hskUploaded && (
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
                  disabled={isLoading}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Intro Video */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon('introVideoUploaded', verificationSteps.introVideoUploaded)}
              <div>
                <h3 className="font-medium">Video Perkenalan</h3>
                <p className="text-sm text-gray-600">Rekam diri Anda berbicara dalam bahasa Indonesia dan Mandarin</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={verificationSteps.introVideoUploaded ? "default" : "outline"}>
                20 poin
              </Badge>
              {!verificationSteps.introVideoUploaded && (
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
                  disabled={isLoading}
                >
                  <Video className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Admin Approval */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon('adminApproved', verificationSteps.adminApproved)}
              <div>
                <h3 className="font-medium">Review Admin</h3>
                <p className="text-sm text-gray-600">Menunggu persetujuan admin</p>
              </div>
            </div>
            <Badge variant={verificationSteps.adminApproved ? "default" : "outline"}>
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
