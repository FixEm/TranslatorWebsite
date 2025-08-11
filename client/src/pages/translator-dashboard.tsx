import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationStatus from "@/components/verification-status";
import AvailabilityCalendar from "@/components/availability-calendar";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { 
  Briefcase, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  User, 
  Settings, 
  LogOut, 
  FileText, 
  MessageSquare, 
  Bell,
  Calendar,
  BarChart3,
  Wallet,
  Heart,
  Eye,
  ChevronDown,
  Shield,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Custom hook to track URL search parameter changes
function useSearchParams() {
  const [searchParams, setSearchParams] = useState(() => new URLSearchParams(window.location.search));
  
  useEffect(() => {
    const updateSearchParams = () => {
      const newParams = new URLSearchParams(window.location.search);
      setSearchParams(newParams);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', updateSearchParams);
    
    // Check for URL changes periodically but less frequently
    const interval = setInterval(updateSearchParams, 1000); // Every 1 second instead of 100ms

    return () => {
      window.removeEventListener('popstate', updateSearchParams);
      clearInterval(interval);
    };
  }, []);

  return searchParams;
}

interface Job {
  id: string;
  title: string;
  client: string;
  description: string;
  budget: number;
  deadline: string;
  status: 'active' | 'in-progress' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  skills: string[];
  applications: number;
  rating?: number;
  isBookmarked?: boolean;
}

interface Profile {
  name: string;
  email: string;
  avatar: string;
  rating: number;
  completedJobs: number;
  balance: number;
  status: 'verified' | 'pending' | 'unverified';
  specializations: string[];
}

export default function TranslatorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = useSearchParams(); // Use our custom hook
  const [activeTab, setActiveTab] = useState('verification'); // Start with verification tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [applicationData, setApplicationData] = useState(null);

  // Handle URL query parameters for tab navigation - now reactive to search params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    console.log('🔍 Search params changed, tab parameter:', tabParam);
    
    if (tabParam) {
      // Map URL tab parameter to internal tab keys
      const tabMapping: { [key: string]: string } = {
        'profile': 'profile',
        'workspace': 'workspace',
        'verification': 'verification',
        'availability': 'availability',
        'chat': 'chat',
        'notifications': 'notifications',
        'statistics': 'statistics',
        'wallet': 'wallet'
      };
      
      const mappedTab = tabMapping[tabParam];
      if (mappedTab) {
        console.log('✅ Setting active tab to:', mappedTab);
        setActiveTab(mappedTab);
      } else {
        console.log('❌ No mapping found for tab:', tabParam);
      }
    }
  }, [searchParams]); // Now depends on searchParams instead of location

  // Mock data - replace with real API calls
  const [profile] = useState<Profile>({
    name: user?.name || "Penerjemah",
    email: user?.email || "",
    avatar: "", // Will be implemented later with file upload
    rating: 4.8,
    completedJobs: 47,
    balance: 2450000,
    status: 'unverified', // Will be determined from applicationData
    specializations: ['Bahasa Mandarin', 'Teknis', 'Bisnis']
  });

  const [jobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Terjemahan Dokumen Kontrak Bisnis',
      client: 'PT Global Solutions',
      description: 'Membutuhkan penerjemahan dokumen kontrak dari bahasa Mandarin ke Indonesia. Dokumen bersifat legal dan teknis.',
      budget: 1500000,
      deadline: '2025-08-15',
      status: 'active',
      difficulty: 'hard',
      category: 'Legal',
      skills: ['Bahasa Mandarin', 'Legal', 'Bisnis'],
      applications: 3,
      rating: 4.9,
      isBookmarked: false
    },
    {
      id: '2',
      title: 'Subtitle Video Marketing',
      client: 'Creative Digital Agency',
      description: 'Terjemahan subtitle untuk video marketing dari bahasa Mandarin ke Indonesia. Total durasi 30 menit.',
      budget: 800000,
      deadline: '2025-08-12',
      status: 'active',
      difficulty: 'medium',
      category: 'Media',
      skills: ['Bahasa Mandarin', 'Media', 'Marketing'],
      applications: 7,
      rating: 4.7,
      isBookmarked: true
    },
    {
      id: '3',
      title: 'Terjemahan Website E-commerce',
      client: 'TechnoMart Indonesia',
      description: 'Menerjemahkan konten website e-commerce dari bahasa Mandarin ke Indonesia. Sekitar 50 halaman.',
      budget: 2200000,
      deadline: '2025-08-20',
      status: 'in-progress',
      difficulty: 'medium',
      category: 'Teknologi',
      skills: ['Bahasa Mandarin', 'E-commerce', 'Teknologi'],
      applications: 1,
      rating: 5.0
    }
  ]);

  // Fetch application data for verification
  useEffect(() => {
    const fetchApplicationData = async () => {
      if (user?.email) {
        try {
          console.log('🔍 Fetching application data for email:', user.email);
          const response = await fetch(`/api/applications/translator?email=${user.email}`);
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Application data fetched:', data);
            setApplicationData(data);
          } else {
            console.error('❌ Failed to fetch application data:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
          }
        } catch (error) {
          console.error('❌ Failed to fetch application data:', error);
        }
      }
    };

    fetchApplicationData();
  }, [user?.email]); // Only depend on user.email, not the entire user object

  // Function to handle tab changes with URL updates
  const handleTabChange = (tabKey: string) => {
    console.log('🔄 Changing tab to:', tabKey);
    setActiveTab(tabKey);
    
    // Update URL with new tab parameter
    const newUrl = `/translator/dashboard?tab=${tabKey}`;
    console.log('🔄 Updating URL to:', newUrl);
    
    // Use history.pushState to update URL without reloading
    window.history.pushState({}, '', newUrl);
    
    // Also update the location for wouter
    setLocation(newUrl);
  };

  const sidebarItems = [
    {
      title: "Verifikasi",
      icon: Shield,
      key: "verification",
      isActive: activeTab === 'verification'
    },
    {
      title: "Ketersediaan",
      icon: Calendar,
      key: "availability",
      isActive: activeTab === 'availability'
    },
    {
      title: "Workspace",
      icon: Briefcase,
      key: "workspace",
      isActive: activeTab === 'workspace'
    },
    {
      title: "Chat",
      icon: MessageSquare,
      key: "chat",
      isActive: activeTab === 'chat'
    },
    {
      title: "Notifikasi",
      icon: Bell,
      key: "notifications",
      isActive: activeTab === 'notifications'
    },
    {
      title: "Statistik",
      icon: BarChart3,
      key: "statistics",
      isActive: activeTab === 'statistics'
    },
    {
      title: "Dompet",
      icon: Wallet,
      key: "wallet",
      isActive: activeTab === 'wallet'
    },
    {
      title: "Profil",
      icon: User,
      key: "profile",
      isActive: activeTab === 'profile'
    }
  ];

  const profileItems = [
    {
      title: "List Favorit",
      icon: Heart,
      key: "favorites"
    },
    {
      title: "Edit Profil",
      icon: User,
      key: "edit-profile"
    },
    {
      title: "Ubah Password",
      icon: Settings,
      key: "change-password"
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil keluar dari akun.",
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Logout Gagal",
        description: error.message || "Terjadi kesalahan saat logout.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to determine verification status from application data
  const getVerificationStatus = () => {
    if (!applicationData) return 'unverified';
    
    const appData = applicationData as any;
    
    // Check if application has been rejected
    if (appData.recruitmentStatus === 'rejected' || appData.status === 'rejected') {
      return 'rejected';
    }
    
    // Check if admin has approved (check both adminApproved flag AND recruitmentStatus)
    if (appData.verificationSteps?.adminApproved || appData.recruitmentStatus === 'approved') {
      return 'verified';
    }
    
    // Check if application is complete and pending admin review
    if (appData.status === 'pending' || appData.status === 'under_review') {
      return 'pending';
    }
    
    return 'unverified';
  };

  // Function to check if user can reapply (3 months after rejection)
  const canReapply = () => {
    if (!applicationData) return false;
    
    const appData = applicationData as any;
    if (appData.recruitmentStatus !== 'rejected' && appData.status !== 'rejected') return true;
    
    // Check if 3 months have passed since rejection
    const rejectionDate = appData.rejectedAt || appData.updatedAt;
    if (!rejectionDate) return false;
    
    const rejectedAt = new Date(rejectionDate);
    const threeMonthsLater = new Date(rejectedAt);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    
    return new Date() >= threeMonthsLater;
  };

  // Function to get time until reapplication is allowed
  const getReapplicationDate = () => {
    if (!applicationData) return null;
    
    const appData = applicationData as any;
    const rejectionDate = appData.rejectedAt || appData.updatedAt;
    if (!rejectionDate) return null;
    
    const rejectedAt = new Date(rejectionDate);
    const threeMonthsLater = new Date(rejectedAt);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    
    return threeMonthsLater;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderWorkspace = () => (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari student translator Indonesia terbaik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Semua Status
          </Button>
          <Button variant="outline" size="sm">
            Semua Tanggal
          </Button>
          <Button variant="outline" size="sm">
            Semua Jenis Pekerjaan
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-navy-800 mb-2">
              Cari student translator Indonesia Terbaik, Dengan Sekali Klik
            </h2>
            <p className="text-gray-600">
              Temukan student translator dari berbagai kota di China.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="hover:bg-premium text-white px-6">
              Cari Klien
            </Button>
          </div>
        </div>
      </div>

      {/* Available Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-navy-800">Pekerjaan Tersedia</h3>
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-navy-800">{job.title}</h4>
                    {job.isBookmarked && <Heart className="h-4 w-4 text-red-500 fill-current" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">oleh {job.client}</p>
                  <p className="text-gray-700 mb-3">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{formatCurrency(job.budget)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {new Date(job.deadline).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{job.applications} aplikasi</span>
                    </div>
                    {job.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{job.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 ml-4">
                  <Badge className={getStatusColor(job.status)}>
                    {job.status === 'active' && 'Aktif'}
                    {job.status === 'in-progress' && 'Berlangsung'}
                    {job.status === 'completed' && 'Selesai'}
                  </Badge>
                  <Badge variant="outline" className={getDifficultyColor(job.difficulty)}>
                    {job.difficulty === 'easy' && 'Mudah'}
                    {job.difficulty === 'medium' && 'Sedang'}
                    {job.difficulty === 'hard' && 'Sulit'}
                  </Badge>
                  <Button size="sm" className="mt-2">
                    {job.status === 'active' ? 'Lamar' : 'Lihat Detail'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="mb-2">
                {getVerificationStatus() === 'verified' && 'Terverifikasi'}
                {getVerificationStatus() === 'pending' && 'Menunggu Verifikasi'}
                {getVerificationStatus() === 'unverified' && 'Belum Terverifikasi'}
                {getVerificationStatus() === 'rejected' && 'Ditolak'}
              </Badge>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-navy-800 mb-2">{profile.name}</h2>
              <p className="text-gray-600 mb-4">{profile.email}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center md:text-left">
                  <div className="text-2xl font-bold text-navy-800">{profile.rating}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                  <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-2xl font-bold text-navy-800">{profile.completedJobs}</div>
                  <div className="text-sm text-gray-600">Proyek Selesai</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-2xl font-bold text-navy-800">{formatCurrency(profile.balance)}</div>
                  <div className="text-sm text-gray-600">Total Penghasilan</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {profile.specializations.map((spec, index) => (
                  <Badge key={index} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-3">
                <Button>
                  <User className="h-4 w-4 mr-2" />
                  Edit Profil
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Pengaturan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profileItems.map((item) => (
          <Card key={item.key} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">
                {item.key === 'favorites' && 'Kelola daftar jasa favorit Anda'}
                {item.key === 'edit-profile' && 'Perbarui informasi profil Anda'}
                {item.key === 'change-password' && 'Ubah kata sandi akun Anda'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'verification':
        return (
          <div>
            {applicationData ? (
              <div className="space-y-6">
                {/* Rejection Banner */}
                {getVerificationStatus() === 'rejected' && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className="text-red-500 text-2xl">❌</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-red-800 mb-2">
                            Pendaftaran Ditolak
                          </h3>
                          <p className="text-red-700 mb-4">
                            Mohon maaf, setelah meninjau aplikasi Anda, kami memutuskan untuk tidak melanjutkan proses pendaftaran Anda sebagai penerjemah/pemandu wisata.
                          </p>
                          
                          {/* Rejection reason if available */}
                          {(applicationData as any)?.rejectionReason && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                              <h4 className="font-medium text-red-800 mb-1">Alasan Penolakan:</h4>
                              <p className="text-sm text-red-700">{(applicationData as any).rejectionReason}</p>
                            </div>
                          )}
                          
                          {/* Reapplication policy */}
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <h4 className="font-medium text-orange-800 mb-1">Kebijakan Pendaftaran Ulang:</h4>
                            {canReapply() ? (
                              <p className="text-sm text-orange-700">
                                ✅ Anda sudah dapat mengajukan pendaftaran ulang. Silakan hubungi admin untuk memulai proses baru.
                              </p>
                            ) : (
                              <p className="text-sm text-orange-700">
                                🕒 Anda dapat mengajukan pendaftaran ulang setelah{' '}
                                <strong>
                                  {getReapplicationDate()?.toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </strong>
                                {' '}(3 bulan setelah penolakan).
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Verification Status Component - disabled if rejected and can't reapply */}
                <div className={getVerificationStatus() === 'rejected' && !canReapply() ? 'opacity-50 pointer-events-none' : ''}>
                  <VerificationStatus 
                    userId={user?.uid}
                    applicationData={applicationData}
                    onUpdate={() => {
                      // Refresh application data when verification updates
                      if (user?.email) {
                        fetch(`/api/applications/translator?email=${user.email}`)
                          .then(res => res.json())
                          .then(data => setApplicationData(data))
                          .catch(console.error);
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data verifikasi...</p>
              </div>
            )}
          </div>
        );
      case 'availability':
        return (
          <div>
            {applicationData ? (
              <AvailabilityCalendar 
                userId={(applicationData as any).id || user?.uid}
                initialAvailability={(applicationData as any).availability}
                onUpdate={(availability) => {
                  setApplicationData(prev => prev ? ({
                    ...(prev as any),
                    availability
                  }) : null);
                }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data ketersediaan...</p>
              </div>
            )}
          </div>
        );
      case 'workspace':
        return renderWorkspace();
      case 'profile':
        return renderProfile();
      case 'chat':
        return (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Pesan</h3>
            <p className="text-gray-500">Percakapan dengan klien akan muncul di sini.</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-navy-800">Notifikasi</h2>
            
            {/* Change Requests Notifications */}
            {(applicationData as any)?.changeRequests?.requests && (applicationData as any).changeRequests.requests.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Bell className="h-5 w-5" />
                    Permintaan Perubahan Dokumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(applicationData as any).changeRequests.requests.map((request: any, index: number) => (
                    <div key={index} className="p-4 bg-white border border-orange-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900">
                            📄 {request.type === 'hsk' ? 'Sertifikat HSK' : 'Kartu Mahasiswa'}
                          </h4>
                          <p className="text-sm text-orange-700 mt-1">{request.message}</p>
                          <p className="text-xs text-orange-600 mt-2">
                            🕒 {new Date(request.requestedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-orange-300 text-orange-800">
                          {request.status === 'pending' ? 'Perlu Ditindaklanjuti' : request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 text-lg">💡</div>
                      <div>
                        <h5 className="font-medium text-blue-800 mb-1">Langkah Selanjutnya:</h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Buka tab "Verifikasi" untuk mengunggah ulang dokumen</li>
                          <li>• Pastikan dokumen memenuhi persyaratan yang diminta</li>
                          <li>• File lama telah dihapus, Anda perlu mengunggah file baru</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* General System Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifikasi Sistem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Verification Status Notification */}
                  {((applicationData as any)?.verificationSteps?.adminApproved || (applicationData as any)?.recruitmentStatus === 'approved') && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="text-green-600">✅</div>
                        <div>
                          <h5 className="font-medium text-green-800">Akun Telah Diverifikasi</h5>
                          <p className="text-sm text-green-700">Selamat! Akun Anda telah disetujui dan dapat menerima proyek.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Verification Notification */}
                  {!user?.emailVerified && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="text-yellow-600">⚠️</div>
                        <div>
                          <h5 className="font-medium text-yellow-800">Verifikasi Email Diperlukan</h5>
                          <p className="text-sm text-yellow-700">Silakan periksa email Anda dan klik link verifikasi.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Completion Notification */}
                  {(applicationData as any)?.completenessScore && (applicationData as any).completenessScore < 80 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="text-blue-600">📋</div>
                        <div>
                          <h5 className="font-medium text-blue-800">Lengkapi Profil Anda</h5>
                          <p className="text-sm text-blue-700">
                            Profil Anda {(applicationData as any).completenessScore}% lengkap. 
                            Minimum 80% diperlukan untuk aktivasi.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No notifications message */}
                  {(!(applicationData as any)?.changeRequests?.requests || (applicationData as any).changeRequests.requests.length === 0) &&
                   ((applicationData as any)?.verificationSteps?.adminApproved || (applicationData as any)?.recruitmentStatus === 'approved') &&
                   user?.emailVerified &&
                   (applicationData as any)?.completenessScore >= 80 && (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">Semua Notifikasi Telah Dibaca</h3>
                      <p className="text-gray-500">Tidak ada notifikasi baru saat ini.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'statistics':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Proyek Selesai</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy-800">{profile.completedJobs}</div>
                <p className="text-xs text-gray-600">+12% dari bulan lalu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Rating Rata-rata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy-800">{profile.rating}/5.0</div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Penghasilan Bulan Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy-800">{formatCurrency(profile.balance)}</div>
                <p className="text-xs text-gray-600">+8% dari bulan lalu</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'wallet':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saldo Dompet</CardTitle>
                <CardDescription>Kelola penghasilan Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-navy-800 mb-4">{formatCurrency(profile.balance)}</div>
                <div className="flex gap-3">
                  <Button>Tarik Dana</Button>
                  <Button variant="outline">Riwayat Transaksi</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return renderWorkspace();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        {/* Sidebar */}
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="p-4">
            {/* Back Button */}
            <Button 
              variant="secondary" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full justify-start bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
            
            <Separator />
            
            {/* User Info */}
            <div className="flex items-center gap-3 ml-1 mt-3">
              <div>
                <div className="text-sm font-medium">Halo,</div>
                <div className="text-xs text-gray-600">{profile.name}</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={item.isActive}
                        onClick={() => handleTabChange(item.key)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.key === 'notifications' && 
                         (applicationData as any)?.changeRequests?.requests && 
                         (applicationData as any).changeRequests.requests.length > 0 && (
                          <Badge variant="destructive" className="ml-auto text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                            {(applicationData as any).changeRequests.requests.length}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="mx-4" />

            <SidebarGroup>
              <SidebarGroupLabel>Profil Saya</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {profileItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium">{profile.name}</div>
                <Badge variant="secondary" className="text-xs">
                  {getVerificationStatus() === 'verified' && 'Terverifikasi'}
                  {getVerificationStatus() === 'pending' && 'Menunggu'}
                  {getVerificationStatus() === 'unverified' && 'Belum Terverifikasi'}
                  {getVerificationStatus() === 'rejected' && 'Ditolak'}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold text-navy-800">
              {sidebarItems.find(item => item.key === activeTab)?.title || 'Dashboard'}
            </h1>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
