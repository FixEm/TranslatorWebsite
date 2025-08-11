import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Mail, 
  Upload, 
  FileText, 
  Star,
  Calendar,
  Video,
  ExternalLink
} from "lucide-react";

interface VerificationStep {
  emailVerified: boolean;
  studentIdUploaded: boolean;
  hskUploaded: boolean;
  cvUploaded: boolean;
  introVideoUploaded: boolean;
  availabilitySet: boolean;
  adminApproved: boolean;
}

interface VerificationStatusProps {
  userId?: string;
  applicationData?: any;
  onUpdate?: () => void;
}

export default function VerificationStatus({ userId, applicationData, onUpdate }: VerificationStatusProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep>({
    emailVerified: false,
    studentIdUploaded: false,
    hskUploaded: false,
    cvUploaded: false,
    introVideoUploaded: false,
    availabilitySet: false,
    adminApproved: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideoInput, setShowVideoInput] = useState(false);

  // Calculate completeness score with safe handling
  const completenessScore = (() => {
    try {
      const points = {
        emailVerified: 20,
        studentIdUploaded: 15,
        hskUploaded: 20,
        cvUploaded: 20,
        introVideoUploaded: 15,
        availabilitySet: 10,
        adminApproved: 0  // Admin approval required for activation but doesn't add points
      };
      
      // Ensure verificationSteps is a valid object
      const steps = verificationSteps || {
        emailVerified: false,
        studentIdUploaded: false,
        hskUploaded: false,
        cvUploaded: false,
        introVideoUploaded: false,
        availabilitySet: false,
        adminApproved: false,
      };
      
      const score = Object.entries(steps).reduce((acc, [key, value]) => {
        const stepPoints = points[key as keyof typeof points];
        if (typeof stepPoints === 'number' && typeof value === 'boolean' && value) {
          return acc + stepPoints;
        }
        return acc;
      }, 0);
      
      // Ensure we return a valid number
      return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating completeness score:', error);
      return 0;
    }
  })();

  // Check if account is activated (only when admin approves)
  const isAccountActivated = verificationSteps.adminApproved;
  
  // Check if ready for admin review
  const isReadyForReview = completenessScore == 100 && !verificationSteps.adminApproved;

  // Check if application is rejected and locked
  const isRejectedAndLocked = () => {
    if (!applicationData) return false;
    
    const appData = applicationData as any;
    if (appData.recruitmentStatus !== 'rejected' && appData.status !== 'rejected') return false;
    
    // Check if 3 months have passed since rejection
    const rejectionDate = appData.rejectedAt || appData.updatedAt;
    if (!rejectionDate) return true; // If no date, assume locked
    
    const rejectedAt = new Date(rejectionDate);
    const threeMonthsLater = new Date(rejectedAt);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    
    return new Date() < threeMonthsLater;
  };

  useEffect(() => {
    console.log('🔍 VerificationStatus: Processing applicationData:', applicationData);
    
    if (applicationData?.verificationSteps) {
      console.log('🔍 VerificationStatus: Found verificationSteps:', applicationData.verificationSteps);
      console.log('🔍 VerificationStatus: recruitmentStatus:', applicationData.recruitmentStatus);
      
      const steps = {
        emailVerified: Boolean(user?.emailVerified ?? applicationData.verificationSteps.emailVerified),
        studentIdUploaded: Boolean(applicationData.verificationSteps.studentIdUploaded && 
          applicationData.verificationSteps.studentIdStatus !== 'changes_requested'),
        hskUploaded: Boolean(applicationData.verificationSteps.hskUploaded && 
          applicationData.verificationSteps.hskStatus !== 'changes_requested'),
        cvUploaded: Boolean(applicationData.verificationSteps.cvUploaded && 
          applicationData.verificationSteps.cvStatus !== 'changes_requested'),
        introVideoUploaded: Boolean(applicationData.verificationSteps.introVideoUploaded),
        availabilitySet: Boolean(applicationData.availability && 
          applicationData.availability.schedule && 
          applicationData.availability.schedule.length > 0),
        // Check both adminApproved in verificationSteps AND recruitmentStatus === 'approved'
        adminApproved: Boolean(applicationData.verificationSteps.adminApproved || applicationData.recruitmentStatus === 'approved'),
      };
      
      console.log('🔍 VerificationStatus: Setting steps:', steps);
      setVerificationSteps(steps);
    } else if (user) {
      console.log('🔍 VerificationStatus: No verificationSteps in applicationData, using user data:', user);
      // If no application data, at least set email verification from auth context
      setVerificationSteps(prev => ({
        ...prev,
        emailVerified: Boolean(user.emailVerified)
      }));
    } else {
      console.log('🔍 VerificationStatus: No applicationData or user, using defaults');
    }
  }, [applicationData, user]);

  // Periodically check email verification status
  useEffect(() => {
    // Only poll if email is not verified yet and we have an email
    if (!user?.emailVerified && !verificationSteps.emailVerified && user?.email) {
      const checkEmailVerification = async () => {
        try {
          const response = await fetch(`/api/auth/verify-status?email=${user.email}`);
          if (response.ok) {
            const data = await response.json();
            if (data.emailVerified && !verificationSteps.emailVerified) {
              // Email has been verified, update the state
              setVerificationSteps(prev => ({
                ...prev,
                emailVerified: true
              }));
              
              toast({
                title: "Email Terverifikasi!",
                description: "Email Anda telah berhasil diverifikasi.",
              });

              // Force a refresh of the user session to update auth context
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Error checking email verification:', error);
        }
      };

      // Check immediately and then every 30 seconds (reduced frequency)
      checkEmailVerification();
      const interval = setInterval(checkEmailVerification, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.emailVerified, user?.email, verificationSteps.emailVerified, toast]);

  const handleVideoUpload = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Silakan masukkan link Google Drive untuk video perkenalan.",
        variant: "destructive",
      });
      return;
    }

    if (!applicationData?.id) {
      toast({
        title: "Error",
        description: "Tidak dapat menemukan data aplikasi. Silakan refresh halaman atau logout dan login kembali.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationData.id}/upload/intro-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: videoUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Update verification status
      setVerificationSteps(prev => ({
        ...prev,
        introVideoUploaded: true
      }));

      setVideoUrl("");
      setShowVideoInput(false);

      toast({
        title: "Upload Berhasil!",
        description: "Link video perkenalan berhasil disimpan.",
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Upload Gagal",
        description: error.message || "Terjadi kesalahan saat menyimpan link video.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    if (!applicationData?.id) {
      toast({
        title: "Error",
        description: "Tidak dapat menemukan data aplikasi. Silakan refresh halaman atau logout dan login kembali.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Use the correct field names based on the type
      if (type === 'student-id') {
        formData.append('studentId', file);
      } else if (type === 'hsk') {
        formData.append('hskCertificate', file);
      } else if (type === 'cv') {
        formData.append('cvDocument', file);
      }

      const response = await fetch(`/api/applications/${applicationData.id}/upload/${type}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Update verification status
      setVerificationSteps(prev => ({
        ...prev,
        [type === 'student-id' ? 'studentIdUploaded' : 'hskUploaded']: true
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
      const response = await fetch(`/api/applications/${applicationData?.id}/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend verification email');
      }

      const result = await response.json();
      toast({
        title: "Email Terkirim!",
        description: result.message || "Email verifikasi telah dikirim ulang. Silakan periksa inbox Anda.",
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
      case 'cvUploaded':
        return <FileText className="h-5 w-5 text-gray-400" />;
      case 'introVideoUploaded':
        return <Video className="h-5 w-5 text-gray-400" />;
      case 'availabilitySet':
        return <Calendar className="h-5 w-5 text-gray-400" />;
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
              Isikan semua data yang diperlukan untuk review admin. Akun akan diaktivasi setelah persetujuan admin.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Requests Section */}
      {applicationData?.changeRequests?.requests && applicationData.changeRequests.requests.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Permintaan Perubahan Dokumen
            </CardTitle>
            <CardDescription className="text-orange-700">
              Admin meminta Anda untuk mengunggah ulang dokumen berikut
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {applicationData.changeRequests.requests.map((request: any, index: number) => (
              <div key={index} className="p-3 bg-white border border-orange-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900">
                      {request.type === 'hsk' ? 'Sertifikat HSK' : 'Kartu Mahasiswa'}
                    </h4>
                    <p className="text-sm text-orange-700 mt-1">{request.message}</p>
                    <p className="text-xs text-orange-600 mt-2">
                      Diminta pada: {new Date(request.requestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-orange-300 text-orange-800">
                    {request.status === 'pending' ? 'Menunggu' : request.status}
                  </Badge>
                </div>
              </div>
            ))}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tips:</strong> Pastikan dokumen yang Anda unggah ulang memenuhi persyaratan yang diminta admin. 
                Setelah mengunggah ulang, dokumen akan ditinjau kembali oleh tim admin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Steps */}
      <Card className="relative">
        <CardHeader>
          <CardTitle>Langkah Verifikasi</CardTitle>
          <CardDescription>
            {isRejectedAndLocked() 
              ? "Langkah verifikasi dikunci karena pendaftaran ditolak. Tunggu periode reaplikasi." 
              : "Selesaikan semua langkah berikut untuk verifikasi lengkap"
            }
          </CardDescription>
        </CardHeader>
        
        {/* Rejection Overlay */}
        {isRejectedAndLocked() && (
          <div className="absolute inset-0 bg-gray-900/20 rounded-lg flex items-center justify-center z-10">
            <div className="bg-white p-4 rounded-lg shadow-lg border border-red-200 max-w-sm text-center">
              <div className="text-red-500 text-2xl mb-2">🔒</div>
              <h4 className="font-medium text-red-800 mb-1">Verifikasi Dikunci</h4>
              <p className="text-sm text-red-700">
                Pendaftaran ditolak. Anda dapat mengajukan ulang setelah 3 bulan.
              </p>
            </div>
          </div>
        )}
        
        <CardContent className={`space-y-4 ${isRejectedAndLocked() ? 'opacity-30' : ''}`}>
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
                  disabled={isLoading || isRejectedAndLocked()}
                >
                  Kirim Ulang
                </Button>
              )}
              <Badge variant={verificationSteps.emailVerified ? "default" : "outline"}>
                20 poin
              </Badge>
            </div>
          </div>

          {/* Student ID Upload */}
          <div className={`flex items-center justify-between p-4 border rounded-lg ${
            applicationData?.verificationSteps?.studentIdStatus === 'changes_requested' ? 'border-orange-300 bg-orange-50' : ''
          }`}>
            <div className="flex items-center space-x-3">
              {getStepIcon('studentIdUploaded', verificationSteps.studentIdUploaded)}
              <div>
                <h3 className="font-medium">Dokumen Kartu Mahasiswa</h3>
                <p className="text-sm text-gray-600">Upload kartu mahasiswa</p>
                {applicationData?.verificationSteps?.studentIdStatus === 'changes_requested' && (
                  <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded">
                    <p className="text-xs text-orange-800 font-medium">
                      ⚠️ Perubahan diperlukan - mohon unggah ulang dokumen kartu mahasiswa
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={verificationSteps.studentIdUploaded ? "default" : "outline"}>
                15 poin
              </Badge>
              {(!verificationSteps.studentIdUploaded || applicationData?.verificationSteps?.studentIdStatus === 'changes_requested') && (
                <Button
                  size="sm"
                  variant={applicationData?.verificationSteps?.studentIdStatus === 'changes_requested' ? "destructive" : "default"}
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
                  disabled={isLoading || isRejectedAndLocked()}
                >
                  <Upload className="h-4 w-4" />
                  {applicationData?.verificationSteps?.studentIdStatus === 'changes_requested' ? 'Unggah Ulang' : ''}
                </Button>
              )}
            </div>
          </div>

          {/* HSK Certificate */}
          <div className={`flex items-center justify-between p-4 border rounded-lg ${
            applicationData?.verificationSteps?.hskStatus === 'changes_requested' ? 'border-orange-300 bg-orange-50' : ''
          }`}>
            <div className="flex items-center space-x-3">
              {getStepIcon('hskUploaded', verificationSteps.hskUploaded)}
              <div>
                <h3 className="font-medium">Sertifikat HSK</h3>
                <p className="text-sm text-gray-600">Upload sertifikat kemampuan bahasa Mandarin Anda</p>
                {applicationData?.verificationSteps?.hskStatus === 'changes_requested' && (
                  <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded">
                    <p className="text-xs text-orange-800 font-medium">
                      ⚠️ Perubahan diperlukan - mohon unggah ulang sertifikat HSK
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={verificationSteps.hskUploaded ? "default" : "outline"}>
                20 poin
              </Badge>
              {(!verificationSteps.hskUploaded || applicationData?.verificationSteps?.hskStatus === 'changes_requested') && (
                <Button
                  size="sm"
                  variant={applicationData?.verificationSteps?.hskStatus === 'changes_requested' ? "destructive" : "outline"}
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
                  disabled={isLoading || isRejectedAndLocked()}
                >
                  <FileText className="h-4 w-4" />
                  {applicationData?.verificationSteps?.hskStatus === 'changes_requested' ? 'Unggah Ulang' : ''}
                </Button>
              )}
            </div>
          </div>

          {/* CV Document */}
          <div className={`flex items-center justify-between p-4 border rounded-lg ${
            applicationData?.verificationSteps?.cvStatus === 'changes_requested' ? 'border-orange-300 bg-orange-50' : ''
          }`}>
            <div className="flex items-center space-x-3">
              {getStepIcon('cvUploaded', verificationSteps.cvUploaded)}
              <div>
                <h3 className="font-medium">Curriculum Vitae (CV)</h3>
                <p className="text-sm text-gray-600">Upload CV atau resume Anda dalam format PDF</p>
                {applicationData?.verificationSteps?.cvStatus === 'changes_requested' && (
                  <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded">
                    <p className="text-xs text-orange-800 font-medium">
                      ⚠️ Perubahan diperlukan - mohon unggah ulang CV Anda
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={verificationSteps.cvUploaded ? "default" : "outline"}>
                20 poin
              </Badge>
              {(!verificationSteps.cvUploaded || applicationData?.verificationSteps?.cvStatus === 'changes_requested') && (
                <Button
                  size="sm"
                  variant={applicationData?.verificationSteps?.cvStatus === 'changes_requested' ? "destructive" : "outline"}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.doc,.docx';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload('cv', file);
                    };
                    input.click();
                  }}
                  disabled={isLoading || isRejectedAndLocked()}
                >
                  <FileText className="h-4 w-4" />
                  {applicationData?.verificationSteps?.cvStatus === 'changes_requested' ? 'Unggah Ulang' : 'Upload CV'}
                </Button>
              )}
            </div>
          </div>

          {/* Video Introduction */}
          <div className="flex flex-col p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStepIcon('introVideoUploaded', verificationSteps.introVideoUploaded)}
                <div>
                  <h3 className="font-medium">Video Perkenalan</h3>
                  <p className="text-sm text-gray-600">Upload link Google Drive video perkenalan Anda</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={verificationSteps.introVideoUploaded ? "default" : "outline"}>
                  15 poin
                </Badge>
                {!verificationSteps.introVideoUploaded && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowVideoInput(!showVideoInput)}
                    disabled={isLoading || isRejectedAndLocked()}
                  >
                    <Video className="h-4 w-4" />
                    Upload Video
                  </Button>
                )}
              </div>
            </div>
            
            {/* Video Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2">📋 Persyaratan Video Perkenalan:</h4>
              
              {/* Technical Requirements */}
              <div className="mb-3">
                <h5 className="font-medium text-blue-900 mb-1">Spesifikasi Teknis:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Mengenakan pakaian formal atau kemeja yang rapi</li>
                  <li>• Posisi berdiri dengan postur tegak (frame setengah badan)</li>
                  <li>• Artikulasi suara yang jelas dan tegas</li>
                  <li>• Durasi video maksimal 30 detik</li>
                  <li>• Jarak optimal dari kamera sekitar 1 meter</li>
                </ul>
              </div>

              {/* Content Requirements */}
              <div className="mb-3">
                <h5 className="font-medium text-blue-900 mb-1">Konten Perkenalan (Dalam Bahasa Mandarin):</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Nama lengkap</li>
                  <li>• Usia</li>
                  <li>• Asal daerah</li>
                  <li>• Latar belakang pendidikan terakhir</li>
                  <li>• Pengalaman kerja yang relevan</li>
                  <li>• Kemampuan bahasa yang dikuasai</li>
                  <li>• Kemampuan literasi Mandarin (membaca dan menulis), jika ada</li>
                </ul>
              </div>

              <p className="text-xs text-blue-700 mt-2">
                💡 <strong>Petunjuk:</strong> Unggah video ke Google Drive, atur izin akses menjadi "Siapa saja dengan tautan dapat melihat", kemudian salin tautannya.
              </p>
            </div>

            {/* Video URL Input */}
            {showVideoInput && !verificationSteps.introVideoUploaded && (
              <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <Label htmlFor="video-url">Link Google Drive Video</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="video-url"
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={isLoading || isRejectedAndLocked()}
                    />
                    <Button
                      onClick={handleVideoUpload}
                      disabled={isLoading || !videoUrl.trim() || isRejectedAndLocked()}
                      size="sm"
                    >
                      {isLoading ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Pastikan video dapat diakses oleh siapa saja dengan link ini
                  </p>
                </div>
              </div>
            )}

            {/* Show video link if uploaded */}
            {verificationSteps.introVideoUploaded && applicationData?.introVideo && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800">✅ Video perkenalan telah diupload</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(applicationData.introVideo, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Lihat Video
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Availability Setup */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon('availabilitySet', verificationSteps.availabilitySet)}
              <div>
                <h3 className="font-medium">Jadwal Ketersediaan</h3>
                <p className="text-sm text-gray-600">Atur jadwal ketersediaan Anda untuk menerima pesanan</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={verificationSteps.availabilitySet ? "default" : "outline"}>
                10 poin
              </Badge>
              {!verificationSteps.availabilitySet && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    // Navigate to availability tab using correct route
                    setLocation('/translator/dashboard?tab=availability');
                  }}
                  disabled={isLoading || isRejectedAndLocked()}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Atur Jadwal
                </Button>
              )}
            </div>
          </div>

          {/* Admin Approval */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon('adminApproved', verificationSteps.adminApproved)}
              <div>
                <h3 className="font-medium">
                  {verificationSteps.adminApproved ? "Terverifikasi" : "Review Admin"}
                </h3>
                <p className="text-sm text-gray-600">
                  {verificationSteps.adminApproved 
                    ? "Akun Anda telah diverifikasi oleh admin" 
                    : "Menunggu persetujuan admin"
                  }
                </p>
              </div>
            </div>
            <Badge variant={verificationSteps.adminApproved ? "default" : "outline"}>
              {verificationSteps.adminApproved ? "Terverifikasi" : "Persetujuan Admin"}
            </Badge>
          </div>

          {/* Show different messages based on verification status */}
          {isAccountActivated && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-800 font-medium">
                   Selamat! Akun Anda telah diaktivasi oleh admin dan siap digunakan.
                </p>
              </div>
            </div>
          )}

          {isReadyForReview && !isAccountActivated && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <p className="text-blue-800 font-medium">
                  📋 Profil Anda siap untuk review admin. Tunggu persetujuan untuk aktivasi akun.
                </p>
              </div>
            </div>
          )}

          
        </CardContent>
      </Card>
    </div>
  );
}
