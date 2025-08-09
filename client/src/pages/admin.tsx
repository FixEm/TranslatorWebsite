import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  Handshake, 
  UserCheck, 
  MessageSquare, 
  Settings, 
  Menu,
  Search,
  Download,
  FileText,
  CreditCard,
  Eye,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
import { Application } from "@shared/schema";

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "recruitment", label: "Recruitment", icon: Handshake },
  { key: "student-pool", label: "Student Pool", icon: Users },
];

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentTypeFilter, setStudentTypeFilter] = useState("all");  // New state for student type filtering	// Fetch dashboard stats
	const { data: stats } = useQuery<{
		totalTranslators: number;
		verifiedTranslators: number;
		pendingApplications: number;
		totalTransactions: number;
	}>({
		queryKey: ["/api/stats"],
		queryFn: async () => {
			const response = await fetch("/api/stats");
			if (!response.ok) throw new Error("Failed to fetch stats");
			return response.json();
		},
	});

	// Fetch all applications (for both pending and approved students)
	const { data: allApplications, isLoading: loadingApplications } = useQuery<Application[]>({
		queryKey: ["/api/applications"],
		queryFn: async () => {
			const response = await fetch("/api/applications");
			if (!response.ok) throw new Error("Failed to fetch applications");
			return response.json();
		},
	});

	// Filter applications by status
	const pendingApplications = allApplications?.filter(app => app.status === 'pending') || [];
	const approvedApplications = allApplications?.filter(app => app.status === 'approved') || [];

	// Update application status mutation
	const updateStatusMutation = useMutation({
		mutationFn: async ({ id, status }: { id: string; status: string }) => {
			return apiRequest("PATCH", `/api/applications/${id}/status`, { status });
		},
		onSuccess: (_, { status }) => {
			toast({
				title: "Status Updated",
				description: `Application ${status === "approved" ? "approved" : "rejected"} successfully.`,
			});
			queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
			queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to update application status.",
				variant: "destructive",
			});
		},
	});

	const handleApprove = (id: string) => {
		updateStatusMutation.mutate({ id, status: "approved" });
	};

	const handleReject = (id: string) => {
		updateStatusMutation.mutate({ id, status: "rejected" });
	};

	// Document verification mutation
	const updateDocumentMutation = useMutation({
		mutationFn: async ({ studentId, documentType, status, adminNotes }: { 
			studentId: string; 
			documentType: string; 
			status: string; 
			adminNotes?: string;
		}) => {
			console.log('📡 API Request:', { studentId, documentType, status });
			const response = await apiRequest("PATCH", `/api/applications/${studentId}/documents/${documentType}/status`, { 
				status, 
				adminNotes 
			});
			console.log('✅ API Response:', response);
			return response;
		},
		onSuccess: (data, { studentId, documentType, status }) => {
			console.log('🎉 Update successful:', { studentId, documentType, status });
			toast({
				title: "Document Status Updated",
				description: `${documentType} document marked as ${status}`,
			});
			
			// Refresh all application data
			queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
			
			// Update the selected student in the UI immediately
			if (selectedStudent && selectedStudent.id === studentId) {
				const updatedStudent = { ...selectedStudent };
				if (documentType === 'hsk') {
					updatedStudent.hskCertificate.status = status;
				} else if (documentType === 'studentId') {
					updatedStudent.studentIdCard.status = status;
				}
				
				// Recalculate verification progress
				const emailVerified = true; // Assuming email is always verified at this point
				const hskApproved = updatedStudent.hskCertificate.status === 'approved';
				const studentIdApproved = updatedStudent.studentIdCard.status === 'approved';
				
				let completedSteps = 0;
				if (emailVerified) completedSteps++;
				if (hskApproved) completedSteps++;
				if (studentIdApproved) completedSteps++;
				
				updatedStudent.verificationProgress = Math.round((completedSteps / 3) * 100);
				
				setSelectedStudent(updatedStudent);
			}
		},
		onError: (error) => {
			console.error('❌ Update failed:', error);
			toast({
				title: "Error",
				description: "Failed to update document status.",
				variant: "destructive",
			});
		},
	});

	const formatDate = (date: Date | string | number | null | undefined) => {
		if (!date) return "-";
		
		try {
			let dateObj: Date;
			
			if (date instanceof Date) {
				dateObj = date;
			} else if (typeof date === 'string') {
				dateObj = new Date(date);
			} else if (typeof date === 'number') {
				// Handle Unix timestamp (seconds or milliseconds)
				dateObj = new Date(date > 1000000000000 ? date : date * 1000);
			} else {
				return "-";
			}
			
			if (isNaN(dateObj.getTime())) return "-";
			
			return new Intl.DateTimeFormat("id-ID", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(dateObj);
		} catch (error) {
			console.error('Date formatting error:', error, 'Input:', date);
			return "-";
		}
	};

  // Helper function to safely display progress values
  const safeProgress = (progress: number | undefined | null): number => {
    if (progress === undefined || progress === null || isNaN(Number(progress))) {
      return 0;
    }
    return Number(progress);
  };

  const getServiceLabel = (service: string) => {
    const labels: { [key: string]: string } = {
      translator: "Penerjemah",
      tour_guide: "Tour Guide",
      business_interpreter: "Interpretasi Bisnis",
      document_translation: "Terjemahan Dokumen",
      medical_companion: "Pendamping Medis",
      education_consultant: "Konsultan Pendidikan"
    };
    return labels[service] || service;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'needs_changes':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Needs Changes</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'needs_changes':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDocumentAvailability = (url: string | null, uploaded: boolean = false) => {
    if (url || uploaded) {
      return <CheckCircle className="h-3 w-3 text-green-600 mr-1" />;
    }
    return <XCircle className="h-3 w-3 text-red-600 mr-1" />;
  };

  // Transform applications data for student pool display
  const transformApplicationToStudent = (app: Application) => {
    console.log('🔍 Transforming application data:', app);
    const questionnaireData = (app as any).questionnaireData || {};
    const verificationSteps = (app as any).verificationSteps || {};
    
    return {
      id: app.id,
      name: app.name,
      email: app.email,
      studentId: (app as any).studentId || 'N/A',
      university: (app as any).university || 'Not specified',
      phone: app.whatsapp,
      city: app.city,
      pricePerDay: app.pricePerDay,
      languages: questionnaireData.fluentLanguages || (app as any).fluentLanguages || (app as any).languages || [],
      availability: questionnaireData.availability || (app as any).availability || 'Not specified',
      specializations: questionnaireData.specializations || (app as any).specializations || [],
      status: app.status,
      submittedAt: formatDate((app as any).createdAt || (app as any).submittedAt || new Date()),
      hskCertificate: { 
        status: verificationSteps.hskStatus || "pending", 
        url: (app as any).hskCertificate || null 
      },
      studentIdCard: { 
        status: verificationSteps.studentIdStatus || "pending", 
        url: (app as any).studentIdDocument || null 
      },
      verificationProgress: (() => {
        const completenessScore = (app as any).completenessScore;
        // If completenessScore exists and is a valid number, use it
        if (completenessScore !== undefined && completenessScore !== null && !isNaN(Number(completenessScore))) {
          return Number(completenessScore);
        }
        
        // Otherwise calculate based on status
        if (app.status === 'approved') return 100;
        if (app.status === 'rejected') return 0;
        
        // Calculate based on verification steps
        const steps = verificationSteps || {};
        let completedSteps = 0;
        if (steps.emailVerified) completedSteps++;
        if (steps.studentIdUploaded || (app as any).studentIdDocument) completedSteps++;
        if (steps.hskUploaded || (app as any).hskCertificate) completedSteps++;
        
        return Math.round((completedSteps / 3) * 100);
      })(),
      // Add additional fields for debugging
      experience: questionnaireData.experience || app.experience,
      motivation: questionnaireData.motivation || (app as any).motivation || 'Not provided',
      expectedGraduation: (app as any).expectedGraduation || 'Not provided',
      intent: (app as any).intent || 'translator' // Add intent field for filtering
    };
  };

  // Transform approved applications for recruitment pipeline
  const transformApplicationToCandidate = (app: Application) => {
    const questionnaireData = (app as any).questionnaireData || {};
    return {
      id: app.id,
      name: app.name,
      email: app.email,
      studentId: (app as any).studentId || 'N/A',
      university: (app as any).university || 'Not specified',
      phone: app.whatsapp,
      hskLevel: "HSK 6", // Default - should be in app data
      specializations: questionnaireData.specializations || Array.isArray(app.services) ? app.services : [app.intent || 'translator'],
      experience: questionnaireData.experience || app.experience,
      rating: 4.5, // Default rating
      completedProjects: 0, // Default
      recruitmentStatus: "pending_interview",
      approvedAt: formatDate((app as any).createdAt || new Date()),
      interviewScheduled: null,
      finalStatus: "pending"
    };
  };

  // Get transformed data
  const studentsData = allApplications?.map(transformApplicationToStudent) || [];
  const recruitmentCandidates = approvedApplications?.map(transformApplicationToCandidate) || [];

  const getRecruitmentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_interview':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Menunggu Wawancara</Badge>;
      case 'interviewed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Sudah Wawancara</Badge>;
      case 'final_approval':
        return <Badge className="bg-green-100 text-green-800">Persetujuan Akhir</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFinalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Menunggu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const updateDocumentStatus = (studentId: string, document: string, status: string) => {
    // Map document names to API types
    const documentTypeMap: { [key: string]: string } = {
      'HSK Certificate': 'hsk',
      'Student ID Card': 'studentId'
    };

    const documentType = documentTypeMap[document];
    if (!documentType) {
      toast({
        title: "Error",
        description: "Invalid document type",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Updating document status:', { studentId, documentType, status });
    updateDocumentMutation.mutate({ studentId, documentType, status });
  };

  const updateStudentStatus = (studentId: string, status: string) => {
    updateStatusMutation.mutate({ id: studentId, status });
  };

  const updateRecruitmentStatus = (candidateId: string, status: string) => {
    toast({
      title: "Recruitment Status Updated",
      description: `Candidate status updated to ${status}`,
    });
  };

  const scheduleInterview = (candidateId: string, date: string) => {
    toast({
      title: "Interview Scheduled",
      description: `Interview scheduled for ${date}`,
    });
  };

  const finalApproval = (candidateId: string, approved: boolean) => {
    toast({
      title: approved ? "Candidate Approved" : "Candidate Rejected",
      description: approved ? "Candidate has been approved for recruitment" : "Candidate has been rejected",
    });
  };

  const viewDocument = (url: string | null, documentType: string) => {
    if (!url) {
      toast({
        title: "Document Not Available",
        description: `${documentType} has not been uploaded yet.`,
        variant: "destructive",
      });
      return;
    }
    
    // Open document in new tab
    window.open(url, '_blank');
  };	return (
		<div className="min-h-screen bg-gray-50 flex">
			{/* Sidebar */}
			<aside
				className={`bg-white border-r border-gray-200 w-64 flex-shrink-0 flex flex-col transition-all duration-200 ${
					sidebarOpen ? "" : "hidden md:flex"
				}`}
			>
				<div className="flex items-center justify-between px-6 py-4 border-b">
					<span className="font-bold text-navy-800 text-lg">Admin Panel</span>
					<button className="md:hidden" onClick={() => setSidebarOpen(false)}>
						<Menu className="h-5 w-5 text-gray-500" />
					</button>
				</div>
				<nav className="flex-1 py-6">
					{SIDEBAR_ITEMS.map((item) => (
						<button
							key={item.key}
							className={`w-full flex items-center gap-3 px-6 py-3 rounded-lg mb-2 font-medium transition-all duration-150 text-left hover:bg-navy-50 ${
								activeTab === item.key ? "bg-navy-100 text-navy-800" : "text-gray-700"
							}`}
							onClick={() => setActiveTab(item.key)}
						>
							<item.icon className="h-5 w-5" />
							{item.label}
						</button>
					))}
				</nav>
			</aside>
			{/* Main Content */}
			<main className="flex-1 px-4 sm:px-8 py-8">
				{/* Mobile sidebar toggle */}
				<div className="md:hidden mb-4">
					<Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)}>
						<Menu className="h-5 w-5 mr-2" /> Menu
					</Button>
				</div>
				        {activeTab === "recruitment" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-navy-800">Recruitment Dashboard</h1>
                <p className="text-gray-600">Manage approved students for final recruitment</p>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Candidates
              </Button>
            </div>

            {/* Recruitment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Candidates</p>
                      <p className="text-2xl font-bold text-navy-800">{recruitmentCandidates.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Pending Interviews</p>
                      <p className="text-2xl font-bold text-navy-800">
                        {recruitmentCandidates.filter((c: any) => c.recruitmentStatus === 'pending_interview').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Final Approved</p>
                      <p className="text-2xl font-bold text-navy-800">
                        {recruitmentCandidates.filter((c: any) => c.finalStatus === 'approved').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Awaiting Decision</p>
                      <p className="text-2xl font-bold text-navy-800">
                        {recruitmentCandidates.filter((c: any) => c.finalStatus === 'pending').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recruitment Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Recruitment Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="all">All Candidates</TabsTrigger>
                    <TabsTrigger value="pending_interview">Pending Interview</TabsTrigger>
                    <TabsTrigger value="interviewed">Interviewed</TabsTrigger>
                    <TabsTrigger value="final_approval">Final Approval</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4">
                    {recruitmentCandidates.map((candidate: any) => (
                      <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center">
                                <Users className="h-8 w-8 text-navy-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-navy-800 text-lg">{candidate.name}</h3>
                                <p className="text-sm text-gray-600">{candidate.email}</p>
                                <p className="text-sm text-gray-500">{candidate.university} • {candidate.studentId}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm font-medium text-blue-600">{candidate.hskLevel}</span>
                                  <span className="text-sm text-gray-500">{candidate.experience} experience</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-yellow-600">★ {candidate.rating}</span>
                                    <span className="text-sm text-gray-500">({candidate.completedProjects} projects)</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right space-y-2">
                              <div className="flex items-center gap-2">
                                {getRecruitmentStatusBadge(candidate.recruitmentStatus)}
                                {getFinalStatusBadge(candidate.finalStatus)}
                              </div>
                              <div className="flex gap-2">
                                {candidate.recruitmentStatus === 'pending_interview' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => scheduleInterview(candidate.id, '2025-01-25')}
                                  >
                                    Schedule Interview
                                  </Button>
                                )}
                                {candidate.recruitmentStatus === 'interviewed' && candidate.finalStatus === 'pending' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => finalApproval(candidate.id, true)}
                                    >
                                      Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => finalApproval(candidate.id, false)}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {candidate.recruitmentStatus === 'final_approval' && (
                                  <Button size="sm" variant="outline">
                                    View Profile
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm font-medium text-gray-600">Specializations:</span>
                              {candidate.specializations.map((spec: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                            {candidate.interviewScheduled && (
                              <p className="text-sm text-gray-600 mt-2">
                                Interview: {candidate.interviewScheduled}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="pending_interview" className="space-y-4">
                    {recruitmentCandidates
                      .filter((c: any) => c.recruitmentStatus === 'pending_interview')
                      .map((candidate: any) => (
                        <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                  <MessageSquare className="h-8 w-8 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-navy-800">{candidate.name}</h3>
                                  <p className="text-sm text-gray-600">{candidate.university}</p>
                                  <p className="text-sm text-blue-600">{candidate.hskLevel} • {candidate.experience}</p>
                                </div>
                              </div>
                              <Button 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => scheduleInterview(candidate.id, '2025-01-25')}
                              >
                                Schedule Interview
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="interviewed" className="space-y-4">
                    {recruitmentCandidates
                      .filter((c: any) => c.recruitmentStatus === 'interviewed')
                      .map((candidate: any) => (
                        <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-8 w-8 text-purple-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-navy-800">{candidate.name}</h3>
                                  <p className="text-sm text-gray-600">Interviewed on {candidate.interviewScheduled}</p>
                                  <p className="text-sm text-purple-600">Rating: ★ {candidate.rating}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => finalApproval(candidate.id, true)}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => finalApproval(candidate.id, false)}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="final_approval" className="space-y-4">
                    {recruitmentCandidates
                      .filter((c: any) => c.recruitmentStatus === 'final_approval')
                      .map((candidate: any) => (
                        <Card key={candidate.id} className="hover:shadow-lg transition-shadow border-green-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                  <Handshake className="h-8 w-8 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-navy-800">{candidate.name}</h3>
                                  <p className="text-sm text-gray-600">{candidate.university}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-green-100 text-green-800">Ready for Recruitment</Badge>
                                    <span className="text-sm text-green-600">★ {candidate.rating}</span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="outline">
                                View Full Profile
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "student-pool" && (
          <>
            {selectedStudent ? (
              // Student Detail View
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Student List
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                  <h1 className="text-2xl font-bold text-navy-800">Detail Kandidat</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Info */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-navy-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-navy-800">{selectedStudent.name}</h3>
                            <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">University</label>
                            <p className="text-sm text-navy-800">{selectedStudent.university}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Expected Graduation</label>
                            <p className="text-sm text-navy-800">{selectedStudent.expectedGraduation}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Phone</label>
                            <p className="text-sm text-navy-800">{selectedStudent.phone}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">City</label>
                            <p className="text-sm text-navy-800">{selectedStudent.city}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Expected Price/Day</label>
                            <p className="text-sm text-navy-800">¥{selectedStudent.pricePerDay}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Experience</label>
                            <p className="text-sm text-navy-800">{selectedStudent.experience}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Fluent Languages</label>
                            <div className="mt-1">
                              {selectedStudent.languages && selectedStudent.languages.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {selectedStudent.languages.map((lang: any, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {lang}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Not specified</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Specializations</label>
                            <div className="mt-1">
                              {selectedStudent.specializations && selectedStudent.specializations.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {selectedStudent.specializations.map((spec: any, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {spec}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Not specified</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Availability</label>
                            <p className="text-sm text-navy-800">{selectedStudent.availability}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Submitted</label>
                            <p className="text-sm text-navy-800">{selectedStudent.submittedAt}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <div className="mt-1">
                              {getStatusBadge(selectedStudent.status || 'pending')}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Motivation</label>
                            <p className="text-sm text-navy-800 bg-gray-50 p-3 rounded mt-1 max-h-32 overflow-y-auto">{selectedStudent.motivation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Document Details */}
                  <div className="lg:col-span-2">
                    <Tabs defaultValue="documents" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="documents">General Details</TabsTrigger>
                        <TabsTrigger value="activation">Activation</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="documents" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              Document Verification
                              <Badge 
                                variant={safeProgress(selectedStudent.verificationProgress) === 100 ? "default" : "secondary"}
                                className={safeProgress(selectedStudent.verificationProgress) === 100 ? "bg-green-100 text-green-800" : ""}
                              >
                                {safeProgress(selectedStudent.verificationProgress)}% Complete
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* HSK Certificate */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                  <h4 className="font-medium">HSK Certificate</h4>
                                  <div className="flex items-center text-sm text-gray-600">
                                    {getDocumentAvailability(selectedStudent.hskCertificate.url)}
                                    <span>Language proficiency certification</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getDocumentStatus(selectedStudent.hskCertificate.status)}
                                <Select
                                  value={selectedStudent.hskCertificate.status}
                                  onValueChange={(value) => updateDocumentStatus(selectedStudent.id, 'HSK Certificate', value)}
                                  disabled={updateDocumentMutation.isPending}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="needs_changes">Needs Changes</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => viewDocument(selectedStudent.hskCertificate.url, 'HSK Certificate')}
                                  disabled={!selectedStudent.hskCertificate.url}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>

                            {/* Student ID Card */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-8 w-8 text-green-600" />
                                <div>
                                  <h4 className="font-medium">Student ID Card</h4>
                                  <div className="flex items-center text-sm text-gray-600">
                                    {getDocumentAvailability(selectedStudent.studentIdCard.url)}
                                    <span>University identification card</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getDocumentStatus(selectedStudent.studentIdCard.status)}
                                <Select
                                  value={selectedStudent.studentIdCard.status}
                                  onValueChange={(value) => updateDocumentStatus(selectedStudent.id, 'Student ID Card', value)}
                                  disabled={updateDocumentMutation.isPending}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="needs_changes">Needs Changes</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => viewDocument(selectedStudent.studentIdCard.url, 'Student ID Card')}
                                  disabled={!selectedStudent.studentIdCard.url}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="activation" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Student Status Management</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Overall Verification Status */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h5 className="font-medium mb-3">Overall Verification Status</h5>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center justify-between">
                                  <span>Email Verified:</span>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Student ID:</span>
                                  {selectedStudent.studentIdCard.url ? 
                                    getDocumentStatus(selectedStudent.studentIdCard.status) : 
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  }
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>HSK Certificate:</span>
                                  {selectedStudent.hskCertificate.url ? 
                                    getDocumentStatus(selectedStudent.hskCertificate.status) : 
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  }
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Overall Progress:</span>
                                  <span className="font-medium">{safeProgress(selectedStudent.verificationProgress)}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateStudentStatus(selectedStudent.id, 'approved')}
                                disabled={safeProgress(selectedStudent.verificationProgress) < 100 || updateStatusMutation.isPending || selectedStudent.status === 'approved'}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {selectedStudent.status === 'approved' ? 'Already Approved' : updateStatusMutation.isPending ? 'Updating...' : 'Approve Student'}
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => updateStudentStatus(selectedStudent.id, 'rejected')}
                                disabled={updateStatusMutation.isPending || selectedStudent.status === 'rejected'}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {selectedStudent.status === 'rejected' ? 'Already Rejected' : updateStatusMutation.isPending ? 'Updating...' : 'Reject Student'}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => updateStudentStatus(selectedStudent.id, 'needs_changes')}
                                disabled={updateStatusMutation.isPending || selectedStudent.status === 'needs_changes'}
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {selectedStudent.status === 'needs_changes' ? 'Changes Requested' : updateStatusMutation.isPending ? 'Updating...' : 'Request Changes'}
                              </Button>
                            </div>
                            
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                              <h5 className="font-medium mb-2">Verification Progress</h5>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${safeProgress(selectedStudent.verificationProgress)}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{safeProgress(selectedStudent.verificationProgress)}% Complete</p>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            ) : (
              // Student List View
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-navy-800">Student Pool</h1>
                    <p className="text-gray-600">Manage student interpreter verification</p>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                </div>

                {/* Student Type Tabs */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setStudentTypeFilter("all")}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                          studentTypeFilter === "all"
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        All Students
                      </button>
                      <button
                        onClick={() => setStudentTypeFilter("translator")}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                          studentTypeFilter === "translator"
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Translator
                      </button>
                      <button
                        onClick={() => setStudentTypeFilter("tour_guide")}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                          studentTypeFilter === "tour_guide"
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Tour Guide
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Filters and Search */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="needs_changes">Needs Changes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Student List */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentsData
                            .filter(student => 
                              (statusFilter === 'all' || student.status === statusFilter) &&
                              (studentTypeFilter === 'all' || student.intent === studentTypeFilter) &&
                              (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               student.email.toLowerCase().includes(searchQuery.toLowerCase()))
                            )
                            .map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-navy-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-sm text-gray-500">{student.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{student.university}</div>
                                <div className="text-sm text-gray-500">EG: {student.expectedGraduation} • {student.city}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 capitalize">
                                  {student.intent === 'tour_guide' ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      🗺️ Tour Guide
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                      🔤 Translator
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{student.experience || 'Not specified'}</div>
                                <div className="text-sm text-gray-500">
                                  {student.specializations && student.specializations.length > 0 
                                    ? student.specializations.slice(0, 2).join(', ') + (student.specializations.length > 2 ? '...' : '')
                                    : 'No specializations'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">€{student.pricePerDay || 'N/A'}/day</div>
                                <div className="text-sm text-gray-500">{student.availability}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(student.status || 'pending')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${safeProgress(student.verificationProgress)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {safeProgress(student.verificationProgress)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {student.submittedAt}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedStudent(student)}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {activeTab === "dashboard" && (
					<>
						<h1 className="text-3xl font-bold text-navy-800 mb-2">Dashboard Admin</h1>
						<p className="text-silver-600 mb-8">Panel manajemen untuk administrator platform</p>
						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center">
										<div className="p-2 bg-blue-100 rounded-lg">
											<Users className="h-6 w-6 text-blue-600" />
										</div>
										<div className="ml-4">
											<p className="text-sm text-gray-600">Total Penerjemah</p>
											<p className="text-2xl font-bold text-navy-800">{stats?.totalTranslators || 0}</p>
										</div>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center">
										<div className="p-2 bg-green-100 rounded-lg">
											<CheckCircle className="h-6 w-6 text-green-600" />
										</div>
										<div className="ml-4">
											<p className="text-sm text-gray-600">Terverifikasi</p>
											<p className="text-2xl font-bold text-navy-800">{stats?.verifiedTranslators || 0}</p>
										</div>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center">
										<div className="p-2 bg-yellow-100 rounded-lg">
											<Clock className="h-6 w-6 text-yellow-600" />
										</div>
										<div className="ml-4">
											<p className="text-sm text-gray-600">Menunggu Verifikasi</p>
											<p className="text-2xl font-bold text-navy-800">{stats?.pendingApplications || 0}</p>
										</div>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center">
										<div className="p-2 bg-purple-100 rounded-lg">
											<Handshake className="h-6 w-6 text-purple-600" />
										</div>
										<div className="ml-4">
											<p className="text-sm text-gray-600">Total Kontak</p>
											<p className="text-2xl font-bold text-navy-800">{stats?.totalTransactions || 0}</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
						{/* Recent Activity */}
						<Card>
							<CardHeader>
								<CardTitle>Aktivitas Terbaru</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div>
											<p className="font-medium">Pendaftaran Baru</p>
											<p className="text-sm text-gray-600">3 penerjemah baru mendaftar hari ini</p>
										</div>
										<Badge variant="secondary">Baru</Badge>
									</div>
									<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div>
											<p className="font-medium">Verifikasi Selesai</p>
											<p className="text-sm text-gray-600">2 penerjemah telah diverifikasi</p>
										</div>
										<Badge className="bg-green-100 text-green-800">Selesai</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					</>
				)}
			</main>
		</div>
	);
}
