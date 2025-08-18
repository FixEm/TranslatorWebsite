import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Mail, Upload, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface ClientVerificationStatusProps {
  applicationData?: any;
  onUpdate?: () => void;
}

export default function ClientVerificationStatus({ applicationData, onUpdate }: ClientVerificationStatusProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState({
    emailVerified: false,
    ktpUploaded: false,
    adminApproved: false,
  });

  const progress = (steps.emailVerified ? 50 : 0) + (steps.ktpUploaded ? 50 : 0);

  useEffect(() => {
    if (applicationData?.verificationSteps) {
      const v = applicationData.verificationSteps as any;
      setSteps({
        emailVerified: Boolean(user?.emailVerified ?? v.emailVerified),
        ktpUploaded: Boolean(v.ktpUploaded && v.ktpStatus !== 'changes_requested'),
        adminApproved: Boolean(v.adminApproved || applicationData.status === 'approved'),
      });
    } else if (user) {
      setSteps(prev => ({ ...prev, emailVerified: Boolean(user.emailVerified) }));
    }
  }, [applicationData, user]);

  const resendVerification = async () => {
    if (!applicationData?.id) return;
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/applications/${applicationData.id}/resend-verification`, { method: 'POST' });
      if (!resp.ok) throw new Error('Failed to send');
      toast({ title: 'Email terkirim', description: 'Silakan cek email Anda.' });
    } catch (e: any) {
      toast({ title: 'Gagal kirim email', description: e.message || 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadKtp = async () => {
    if (!applicationData?.id) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setIsLoading(true);
      try {
        const fd = new FormData();
        fd.append('ktp', file); // Use ktp field for KTP uploads
        const resp = await fetch(`/api/applications/${applicationData.id}/upload/ktp`, { method: 'POST', body: fd });
        if (!resp.ok) throw new Error('Upload gagal');
        setSteps(prev => ({ ...prev, ktpUploaded: true }));
        toast({ title: 'Upload berhasil', description: `${file.name} terunggah.` });
        onUpdate?.();
      } catch (e: any) {
        toast({ title: 'Upload gagal', description: e.message || 'Terjadi kesalahan', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status Verifikasi Akun</CardTitle>
          <CardDescription>Lengkapi verifikasi email dan upload KTP. Akun akan diaktifkan setelah review admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Kelengkapan Profil</span>
              <span className="text-sm font-bold">{progress}/100 poin</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Langkah Verifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {steps.emailVerified ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Mail className="h-5 w-5 text-gray-400" />}
              <div>
                <div className="font-medium">Verifikasi Email</div>
                <div className="text-sm text-gray-600">Konfirmasi alamat email Anda</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!steps.emailVerified && (
                <Button size="sm" variant="outline" onClick={resendVerification} disabled={isLoading}>Kirim Ulang</Button>
              )}
              <Badge variant={steps.emailVerified ? 'default' : 'outline'}>50 poin</Badge>
            </div>
          </div>

          {/* KTP */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {steps.ktpUploaded ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Upload className="h-5 w-5 text-gray-400" />}
              <div>
                <div className="font-medium">Kartu Tanda Penduduk (KTP)</div>
                <div className="text-sm text-gray-600">Upload KTP Anda</div>
                {/* Show change request if exists */}
                {applicationData?.verificationSteps?.ktpStatus === 'changes_requested' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <strong>Perubahan Diminta:</strong> {applicationData?.changeRequests?.requests?.find((r: any) => r.type === 'ktp')?.message || 'Admin meminta perubahan pada KTP Anda'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!steps.ktpUploaded && (
                <Button size="sm" onClick={uploadKtp} disabled={isLoading}>
                  <Upload className="h-4 w-4 mr-2" /> Upload
                </Button>
              )}
              <Badge variant={steps.ktpUploaded ? 'default' : 'outline'}>50 poin</Badge>
            </div>
          </div>

          {/* Admin Review */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {steps.adminApproved ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-gray-400" />}
              <div>
                <div className="font-medium">Review Admin</div>
                <div className="text-sm text-gray-600">{steps.adminApproved ? 'Akun telah disetujui' : 'Menunggu persetujuan admin'}</div>
              </div>
            </div>
            <Badge variant={steps.adminApproved ? 'default' : 'outline'}>{steps.adminApproved ? 'Terverifikasi' : 'Pending'}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


