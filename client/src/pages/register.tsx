import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  whatsapp: z.string().min(1, "Nomor WhatsApp wajib diisi"),
  city: z.string().min(1, "Kota wajib dipilih"),
  services: z.array(z.string()).min(1, "Pilih minimal satu layanan"),
  experience: z.string().min(1, "Pengalaman wajib dipilih"),
  pricePerDay: z.string().min(1, "Tarif per hari wajib diisi"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  termsAccepted: z.boolean().refine(val => val === true, "Anda harus menyetujui syarat dan ketentuan"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const [profileImageFiles, setProfileImageFiles] = useState<File[]>([]);
  const [identityFiles, setIdentityFiles] = useState<File[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      whatsapp: "",
      city: "",
      services: [],
      experience: "",
      pricePerDay: "",
      description: "",
      termsAccepted: false,
    },
  });

  const cities = [
    "Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Suzhou", "Hangzhou",
    "Nanjing", "Wuhan", "Chengdu", "Xi'an", "Tianjin", "Qingdao"
  ];

  const services = [
    { id: "translator", label: "Penerjemah Lisan" },
    { id: "document_translation", label: "Terjemahan Dokumen" },
    { id: "tour_guide", label: "Tour Guide" },
    { id: "business_interpreter", label: "Interpretasi Bisnis" },
    { id: "medical_companion", label: "Pendamping Medis" },
    { id: "education_consultant", label: "Konsultan Pendidikan" }
  ];

  const experienceOptions = [
    { value: "0-1", label: "0-1 tahun" },
    { value: "2-3", label: "2-3 tahun" },
    { value: "4-5", label: "4-5 tahun" },
    { value: "6-10", label: "6-10 tahun" },
    { value: "10+", label: "Lebih dari 10 tahun" }
  ];

  const createApplicationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'services') {
          formData.append(key, JSON.stringify(value));
        } else if (key !== 'termsAccepted') {
          formData.append(key, value as string);
        }
      });

      // Add files
      if (profileImageFiles[0]) {
        formData.append('profileImage', profileImageFiles[0]);
      }
      if (identityFiles[0]) {
        formData.append('identityDocument', identityFiles[0]);
      }
      certificateFiles.forEach(file => {
        formData.append('certificates', file);
      });

      return apiRequest('POST', '/api/applications', formData);
    },
    onSuccess: () => {
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Aplikasi Anda telah diterima dan akan diproses dalam 1-2 hari kerja.",
      });
      form.reset();
      setProfileImageFiles([]);
      setIdentityFiles([]);
      setCertificateFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error) => {
      toast({
        title: "Pendaftaran Gagal",
        description: "Terjadi kesalahan saat mengirim aplikasi. Silakan coba lagi.",
        variant: "destructive",
      });
      console.error('Registration error:', error);
    },
  });

  const onSubmit = (data: FormData) => {
    createApplicationMutation.mutate(data);
  };

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    const currentServices = form.getValues('services');
    if (checked) {
      form.setValue('services', [...currentServices, serviceId]);
    } else {
      form.setValue('services', currentServices.filter((s: string) => s !== serviceId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-navy-800 mb-4">Bergabung Sebagai Penerjemah</h1>
          <p className="text-xl text-silver-600 max-w-2xl mx-auto">
            Daftarkan diri Anda sebagai penerjemah profesional dan dapatkan akses ke klien potensial
          </p>
        </div>

        <Card className="shadow-lg border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Formulir Pendaftaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-navy-800 mb-4">Informasi Pribadi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap *</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan nama lengkap" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="nama@email.com" {...field} />
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
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Masukkan password"
                                {...field}
                                className="pr-10"
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

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Konfirmasi Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Konfirmasi password"
                                {...field}
                                className="pr-10"
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor WhatsApp *</FormLabel>
                          <FormControl>
                            <Input placeholder="+86 xxx xxxx xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kota di China *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Kota" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-navy-800 mb-4">Informasi Profesional</h3>
                  
                  {/* Services */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Layanan yang Ditawarkan *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {services.map((service) => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={service.id}
                            checked={form.watch('services').includes(service.id)}
                            onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                          />
                          <label htmlFor={service.id} className="text-sm cursor-pointer">
                            {service.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.services && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.services.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pengalaman *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Pengalaman" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {experienceOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pricePerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarif per Hari (¥) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="300" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>Deskripsi Diri & Keahlian *</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={4} 
                            placeholder="Ceritakan tentang pengalaman, keahlian, dan spesialisasi Anda..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Document Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-navy-800 mb-4">Dokumen Verifikasi</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUpload
                      label="Foto Profil *"
                      accept="image/*"
                      files={profileImageFiles}
                      onFilesChange={setProfileImageFiles}
                      maxFiles={1}
                    />

                    <FileUpload
                      label="Dokumen Identitas *"
                      accept="image/*,.pdf"
                      files={identityFiles}
                      onFilesChange={setIdentityFiles}
                      maxFiles={1}
                    />
                  </div>

                  <div className="mt-6">
                    <FileUpload
                      label="Sertifikat/Portfolio )"
                      accept="image/*,.pdf,.doc,.docx"
                      multiple
                      maxFiles={5}
                      files={certificateFiles}
                      onFilesChange={setCertificateFiles}
                    />
                  </div>
                </div>

                {/* Terms */}
                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          Saya menyetujui{" "}
                          <a href="#" className="text-navy-600 hover:text-navy-800 underline">
                            Syarat dan Ketentuan
                          </a>{" "}
                          serta{" "}
                          <a href="#" className="text-navy-600 hover:text-navy-800 underline">
                            Kebijakan Privasi
                          </a>{" "}
                          PenerjemahChina
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-navy-600 hover:bg-navy-700 text-white py-4 text-lg font-semibold"
                  disabled={createApplicationMutation.isPending}
                >
                  {createApplicationMutation.isPending ? (
                    "Mengirim..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Daftar Sebagai Penerjemah
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
