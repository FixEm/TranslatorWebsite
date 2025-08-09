import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, user } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const userData = await login(data.email, data.password);
      
      toast({
        title: "Login Berhasil!",
        description: "Anda berhasil masuk ke akun Anda.",
      });
      
      // Redirect based on user role after successful login
      if (userData?.role === 'translator') {
        setLocation('/translator/dashboard');
      } else if (userData?.role === 'admin') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: "Login Gagal",
        description: error.message || "Terjadi kesalahan saat login. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Login Card */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-navy-800">
                Masuk ke Akun Anda
              </CardTitle>
              <CardDescription>
                Masukkan email dan password untuk mengakses akun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="nama@email.com"
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Masukkan password"
                              {...field}
                              className="h-12 pr-10"
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <a
                        href="#"
                        className="font-medium text-navy-600 hover:text-navy-500"
                      >
                        Lupa password?
                      </a>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white h-12 text-lg font-semibold hover:bg-premium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Masuk..."
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Masuk
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Atau</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link href="/translator/signup">
                    <Button variant="outline" className="w-full h-12">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Daftar Sebagai Penerjemah
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600">
            <p>
              Belum punya akun?{" "}
              <Link href="/translator/signup" className="font-medium text-navy-600 hover:text-navy-500">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
