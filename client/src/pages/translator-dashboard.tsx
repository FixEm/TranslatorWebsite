import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationStatus from "@/components/verification-status";
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
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('verification'); // Start with verification tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [applicationData, setApplicationData] = useState(null);

  // Handle URL query parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      // Map URL tab parameter to internal tab keys
      const tabMapping: { [key: string]: string } = {
        'profile': 'profile',
        'workspace': 'workspace',
        'verification': 'verification',
        'projects': 'my-projects',
        'chat': 'chat',
        'notifications': 'notifications',
        'statistics': 'statistics',
        'wallet': 'wallet'
      };
      
      const mappedTab = tabMapping[tabParam];
      if (mappedTab) {
        setActiveTab(mappedTab);
      }
    }
  }, []);

  // Mock data - replace with real API calls
  const [profile] = useState<Profile>({
    name: user?.name || "Penerjemah",
    email: user?.email || "",
    avatar: "", // Will be implemented later with file upload
    rating: 4.8,
    completedJobs: 47,
    balance: 2450000,
    status: 'verified',
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
          const response = await fetch(`/api/applications/translator?email=${user.email}`);
          if (response.ok) {
            const data = await response.json();
            setApplicationData(data);
          }
        } catch (error) {
          console.error('Failed to fetch application data:', error);
        }
      }
    };

    fetchApplicationData();
  }, [user]);

  const sidebarItems = [
    {
      title: "Verifikasi",
      icon: Shield,
      key: "verification",
      isActive: activeTab === 'verification'
    },
    {
      title: "Workspace",
      icon: Briefcase,
      key: "workspace",
      isActive: activeTab === 'workspace'
    },
    {
      title: "Proyek Saya",
      icon: FileText,
      key: "my-projects",
      isActive: activeTab === 'my-projects'
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
                {profile.status === 'verified' && 'Terverifikasi'}
                {profile.status === 'pending' && 'Menunggu Verifikasi'}
                {profile.status === 'unverified' && 'Belum Verifikasi'}
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
        );
      case 'workspace':
        return renderWorkspace();
      case 'profile':
        return renderProfile();
      case 'my-projects':
        return (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Proyek</h3>
            <p className="text-gray-500">Proyek yang Anda kerjakan akan muncul di sini.</p>
          </div>
        );
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
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Notifikasi</h3>
            <p className="text-gray-500">Notifikasi terbaru akan muncul di sini.</p>
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
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full justify-start"
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
                        onClick={() => setActiveTab(item.key)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
                  {profile.status === 'verified' && 'Terverifikasi'}
                  {profile.status === 'pending' && 'Menunggu'}
                  {profile.status === 'unverified' && 'Belum Verifikasi'}
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
