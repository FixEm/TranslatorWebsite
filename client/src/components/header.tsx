import { Link, useLocation } from "wouter";
import { Languages, User, LogOut, MessageSquare, Briefcase, FileText, CreditCard, Gift, UserPlus, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="glass-effect shadow-elegant sticky top-0 z-50 border-b border-elegant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="p-2 bg-premium rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
                <Languages className="text-white h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-slate-800 ml-4 tracking-tight">PenerjemahChina</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`font-semibold transition-all duration-200 hover:scale-105 ${
                isActive("/") ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Beranda
            </Link>
            <Link 
              href="/search" 
              className={`font-semibold transition-all duration-200 hover:scale-105 ${
                isActive("/search") ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Cari Penerjemah
            </Link>
            <a 
              href="#cara-kerja" 
              className="text-slate-700 hover:text-blue-600 font-semibold transition-all duration-200 hover:scale-105"
            >
              Cara Kerja
            </a>
            <a 
              href="#tentang" 
              className="text-slate-700 hover:text-blue-600 font-semibold transition-all duration-200 hover:scale-105"
            >
              Tentang
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            {user ? (
              // Logged in user navigation
              <div className="flex items-center space-x-6">
                <Link href="/translator/dashboard">
                  <span className={`font-semibold transition-all duration-200 hover:scale-105 ${
                    isActive("/translator/dashboard") ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
                  }`}>
                    Dashboard
                  </span>
                </Link>
                <Link href="/chat">
                  <span className={`font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-1 ${
                    isActive("/chat") ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
                  }`}>
                    <MessageSquare className="h-5 w-5" />
               
                  </span>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-1 ${
                      isActive("/profile") ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
                    }`}>
                      <User className="h-5 w-5" />
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{user.name?.charAt(0) || "U"}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/translator/dashboard" className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4" />
                        <span>Workspace</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/edit-profile" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    
                  
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
        
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Guest user buttons
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-blue-600 hover:text-slate-800 font-semibold">
                    Masuk
                  </Button>
                </Link>
                <Link href="/translator/signup">
                  <Button className="bg-premium text-white px-6 py-3 rounded-xl hover:bg-premium shadow-elegant hover:shadow-luxury transition-all duration-300 font-semibold tracking-wide hover:scale-105 transform">
                    Daftar Sebagai Penerjemah
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
