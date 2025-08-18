import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Shield, Briefcase, Users, MessageSquare, Bell, Wallet, User, LogOut, Calendar, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import ClientVerificationStatus from "@/components/client-verification-status";
import { useQuery } from "@tanstack/react-query";

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('verification');
  const [, setLocation] = useLocation();

  // Fetch client application data
  const { data: applicationData, refetch: refetchApplication } = useQuery({
    queryKey: ['/api/applications/client', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const response = await fetch(`/api/applications/client/${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch application');
      return response.json();
    },
    enabled: !!user?.uid,
  });

  const sidebarItems = [
    { title: 'Verifikasi', icon: Shield, key: 'verification' },
    { title: 'Kelola Booking', icon: Briefcase, key: 'bookings' },
    { title: 'Translator', icon: Users, key: 'translators' },
    { title: 'Chat', icon: MessageSquare, key: 'chat' },
    { title: 'Notifikasi', icon: Bell, key: 'notifications' },
    { title: 'Dompet', icon: Wallet, key: 'wallet' },
  ];

  const handleTabChange = (key: string) => setActiveTab(key);

  const renderContent = () => {
    switch (activeTab) {
      case 'verification':
        return <ClientVerificationStatus applicationData={applicationData} onUpdate={refetchApplication} />;
      case 'bookings':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-navy-800">Kelola Booking</h2>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Buat Booking
              </Button>
            </div>
            <Card>
              <CardContent className="p-6 text-gray-600">Belum ada booking. Cari translator untuk mulai.</CardContent>
            </Card>
          </div>
        );
      case 'translators':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-navy-800">Translator</h2>
            <Card>
              <CardContent className="p-6 text-gray-600">Gunakan halaman Pencarian untuk menemukan translator.</CardContent>
            </Card>
          </div>
        );
      case 'chat':
        return (
          <div className="text-center py-12 text-gray-600">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            Belum ada percakapan.
          </div>
        );
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">Tidak ada notifikasi baru.</CardContent>
          </Card>
        );
      case 'wallet':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Dompet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy-800 mb-4">Rp 0</div>
              <Button variant="outline">Riwayat Transaksi</Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="p-4">
            <Button variant="secondary" onClick={() => setLocation('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full justify-start bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
            <Separator />
            <div className="mt-3 text-sm">
              <div className="font-medium">Halo,</div>
              <div className="text-gray-600">{user?.name}</div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={activeTab === item.key}
                        onClick={() => handleTabChange(item.key)}
                        className={`${activeTab === item.key ? 'relative bg-red-50 text-red-700' : ''} group hover:!bg-red-50 hover:!text-red-700`}
                      >
                        <item.icon className={`${activeTab === item.key ? 'h-4 w-4 text-red-600' : 'h-4 w-4'}`} />
                        <span>{item.title}</span>
                        {activeTab === item.key && (
                          <span className="absolute left-0 top-0 h-full w-1 bg-red-600 rounded-r" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <Button variant="outline" size="sm" onClick={() => setLocation('/edit-profile')} className="w-full mb-2">
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" onClick={logout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-4 bg-white/70 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold text-navy-800">Dashboard Klien</h1>
          </header>
          <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}


