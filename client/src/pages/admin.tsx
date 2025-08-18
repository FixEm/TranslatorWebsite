import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StudentShowcaseForm from "@/components/student-showcase-form";
import BookingsManagement from "@/components/bookings-management";
import ConfirmedJobsManagement from "@/components/confirmed-jobs-management";
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
  Calendar,
  Video,
  Briefcase
} from "lucide-react";
import { Application } from "@shared/schema";

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "student-pool", label: "Student Pool", icon: Users },
  { key: "recruitment", label: "Recruitment", icon: Handshake },
  { key: "verified-users", label: "Verified Users", icon: UserCheck },
  { key: "job-management", label: "Student Showcase", icon: Briefcase },
  { key: "clients", label: "Clients", icon: Users }
];

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientStatusFilter, setClientStatusFilter] = useState("all");
  const [studentTypeFilter, setStudentTypeFilter] = useState("all");  // New state for student type filtering
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [showVerifiedUsers, setShowVerifiedUsers] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [requestChangesModalOpen, setRequestChangesModalOpen] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [changeMessage, setChangeMessage] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

	// Fetch dashboard stats
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

	// Fetch recent activities
	const { data: recentActivities } = useQuery<Array<{
		id: string;
		type: string;
		message: string;
		timestamp: string;
		status: string;
	}>>({
		queryKey: ["/api/recent-activities"],
		queryFn: async () => {
			const response = await fetch("/api/recent-activities");
			if (!response.ok) throw new Error("Failed to fetch recent activities");
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

	// Helper function to format dates
	const formatDate = (date: Date | string | number | null | undefined | any) => {
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
			} else if (typeof date === 'object' && date._seconds) {
				// Handle Firestore timestamp object
				dateObj = new Date(date._seconds * 1000);
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

  // Transform applications data for client display
  const transformApplicationToClient = (app: Application) => {
    console.log('🔍 Transforming client application data:', app);
    const verificationSteps = (app as any).verificationSteps || {};
    
    return {
      id: app.id,
      name: app.name,
      email: app.email,
      phone: app.whatsapp,
      city: app.city,
      intent: (app as any).intent || 'individu',
      status: app.status,
      submittedAt: formatDate((app as any).createdAt || (app as any).submittedAt || new Date()),
      ktpDocument: { 
        status: verificationSteps.ktpStatus || "pending", 
        url: (app as any).ktpDocument?.url || null 
      },
      availability: (app as any).availability || null,
      verificationProgress: (() => {
        if (app.status === 'rejected') return 0;
        
        // Calculate based on verification steps (50% for email, 50% for KTP)
        const steps = verificationSteps || {};
        
        let score = 0;
        if (steps.emailVerified) score += 50;
        if (steps.ktpUploaded && steps.ktpStatus === 'approved') score += 50;
        
        // Account is only "complete" (100%) when admin approves
        if (steps.adminApproved && app.status === 'approved') {
          return 100;
        }
        
        return Math.min(score, 99); // Cap at 99% until admin approval
      })(),
      // Add additional fields for debugging
      motivation: (app as any).motivation || 'Not provided'
    };
  };

  // Derived lists with transformation
  const clientList = (allApplications || []).filter((app: any) => app.intent === 'individu' || app.intent === 'travel_agency').map(transformApplicationToClient);
  const studentList = (allApplications || []).filter((app: any) => app.intent !== 'individu' && app.intent !== 'travel_agency');

	// Filter applications by status
	const pendingApplications = allApplications?.filter(app => app.status === 'pending') || [];
	const approvedApplications = allApplications?.filter(app => app.status === 'approved') || [];
	
	// Filter for verified applications (approved + admin approved)
	const verifiedApplications = allApplications?.filter(app => {
		const verificationSteps = (app as any).verificationSteps || {};
		return app.status === 'approved' && verificationSteps.adminApproved === true;
	}) || [];

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

	// Reuse update status for clients list
	const updateApplicationStatus = (id: string, status: 'approved' | 'rejected' | 'pending') => {
		updateStatusMutation.mutate({ id, status });
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
				} else if (documentType === 'cv') {
					// Ensure cvDocument exists before updating its status
					if (!updatedStudent.cvDocument) {
						updatedStudent.cvDocument = { status: 'pending', url: null };
					}
					updatedStudent.cvDocument.status = status;
				}
				
				// Recalculate verification progress
				const emailVerified = true; // Assuming email is always verified at this point
				const hskApproved = updatedStudent.hskCertificate.status === 'approved';
				const studentIdApproved = updatedStudent.studentIdCard.status === 'approved';
				const cvApproved = updatedStudent.cvDocument?.status === 'approved';
				
				let completedSteps = 0;
				if (emailVerified) completedSteps++;
				if (hskApproved) completedSteps++;
				if (studentIdApproved) completedSteps++;
				if (cvApproved) completedSteps++;
				
				updatedStudent.verificationProgress = Math.round((completedSteps / 4) * 100);
				
				setSelectedStudent(updatedStudent);
			}

			// Update the selected client in the UI immediately
			if (selectedClient && selectedClient.id === studentId) {
				const updatedClient = { ...selectedClient };
				if (documentType === 'ktp') {
					// Ensure ktpDocument exists before updating its status
					if (!updatedClient.ktpDocument) {
						updatedClient.ktpDocument = { status: 'pending', url: null };
					}
					updatedClient.ktpDocument.status = status;
				}
				
				// Recalculate verification progress for clients
				const emailVerified = true; // Assuming email is always verified at this point
				const ktpApproved = updatedClient.ktpDocument?.status === 'approved';
				
				let completedSteps = 0;
				if (emailVerified) completedSteps++;
				if (ktpApproved) completedSteps++;
				
				updatedClient.verificationProgress = Math.round((completedSteps / 2) * 100);
				
				setSelectedClient(updatedClient);
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

	// Request changes mutation
	const requestChangesMutation = useMutation({
		mutationFn: async ({ studentId, changes, message }: { 
			studentId: string; 
			changes: string[]; 
			message?: string;
		}) => {
			console.log('📡 Requesting changes:', { studentId, changes, message });
			const response = await apiRequest("PATCH", `/api/applications/${studentId}/request-changes`, { 
				changes, 
				message 
			});
			console.log('✅ Changes requested:', response);
			return response;
		},
		onSuccess: (data, { studentId, changes }) => {
			console.log('🎉 Changes requested successfully:', { studentId, changes });
			toast({
				title: "Changes Requested",
				description: `Requested changes for ${changes.join(' and ')}`,
			});
			
			// Close modal and reset form
			setRequestChangesModalOpen(false);
			setSelectedChanges([]);
			setChangeMessage("");
			
			// Refresh all application data
			queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
		},
		onError: (error) => {
			console.error('❌ Request changes failed:', error);
			toast({
				title: "Error",
				description: "Failed to request changes.",
				variant: "destructive",
			});
		},
	});

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
      availabilityText: questionnaireData.availability || 'Not specified',
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
      cvDocument: { 
        status: verificationSteps.cvStatus || "pending", 
        url: (app as any).cvDocument || null 
      },
      availability: (app as any).availability || null,
      verificationProgress: (() => {
        const completenessScore = (app as any).completenessScore;
        // If completenessScore exists and is a valid number, use it
        if (completenessScore !== undefined && completenessScore !== null && !isNaN(Number(completenessScore))) {
          return Number(completenessScore);
        }
        
        // Calculate based on new point system (admin approval required for 100%)
        if (app.status === 'rejected') return 0;
        
        // Calculate based on verification steps using new point system
        const steps = verificationSteps || {};
        
        const points = {
          emailVerified: 25,
          studentIdUploaded: 20,
          hskUploaded: 25,
          cvUploaded: 20,
          introVideoUploaded: 10,
        };
        
        let score = 0;
        if (steps.emailVerified) score += points.emailVerified;
        if (steps.studentIdUploaded || (app as any).studentIdDocument) score += points.studentIdUploaded;
        if (steps.hskUploaded || (app as any).hskCertificate) score += points.hskUploaded;
        if (steps.cvUploaded || (app as any).cvDocument) score += points.cvUploaded;
        if ((app as any).introVideo) score += points.introVideoUploaded;
        
        // Account is only "complete" (100%) when admin approves
        if (steps.adminApproved && app.status === 'approved') {
          return 100;
        }
        
        return Math.min(score, 99); // Cap at 99% until admin approval
      })(),
      // Add additional fields for debugging
      experience: questionnaireData.experience || app.experience,
      motivation: questionnaireData.motivation || (app as any).motivation || 'Not provided',
      expectedGraduation: (app as any).expectedGraduation || 'Not provided',
      intent: (app as any).intent || 'translator', // Add intent field for filtering
      introVideo: (app as any).introVideo || null // Add introVideo field for video viewing
    };
  };

  // Transform approved applications for recruitment pipeline
  const transformApplicationToCandidate = (app: Application) => {
    const questionnaireData = (app as any).questionnaireData || {};
    
    // Debug logging to see what data we're getting
    console.log("🔍 Transforming candidate:", app.name, {
      originalFinalStatus: (app as any).finalStatus,
      originalRecruitmentStatus: (app as any).recruitmentStatus,
      hasData: !!(app as any).finalStatus && !!(app as any).recruitmentStatus
    });
    
    return {
      id: app.id,
      name: app.name,
      email: app.email,
      studentId: (app as any).studentId || 'N/A',
      university: (app as any).university || 'Not specified',
      phone: app.whatsapp,
      hskLevel: (app as any).hskLevel || 'Not set', // Get from application object
      specializations: questionnaireData.specializations || Array.isArray(app.services) ? app.services : [app.intent || 'translator'],
      experience: questionnaireData.experience || app.experience,
      rating: 0, // Default rating
      completedProjects: 0, // Default
      recruitmentStatus: (app as any).recruitmentStatus || "pending",
      approvedAt: formatDate((app as any).createdAt || new Date()),
      interviewScheduled: null,
      finalStatus: (app as any).finalStatus || "pending",
      introVideo: (app as any).introVideo || null, // Add introVideo field for video viewing
      intent: (app as any).intent || 'translator' // Add intent field for candidate type
    };
  };

  // Get transformed data (exclude clients from student pool)
  const studentsData = (allApplications || [])
    .filter((app: any) => app.intent !== 'individu' && app.intent !== 'travel_agency')
    .map(transformApplicationToStudent);
  const recruitmentCandidates = approvedApplications?.map(transformApplicationToCandidate) || [];

  const getRecruitmentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Menunggu Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Diterima</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Helper functions for recent activities
  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'registration':
        return 'Pendaftaran Baru';
      case 'email_verified':
        return 'Email Diverifikasi';
      case 'verification':
        return 'Verifikasi Selesai';
      case 'approval':
        return 'Disetujui & Diverifikasi';
      case 'rejection':
        return 'Ditolak';
      default:
        return 'Aktivitas';
    }
  };

  const getActivityBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="secondary">Baru</Badge>;
      case 'progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Progress</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Terverifikasi</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFinalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
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
      'Student ID Card': 'studentId',
      'CV/Resume': 'cv',
      'KTP Document': 'ktp'
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

  const updateHskLevel = async (studentId: string, hskLevel: string) => {
    try {
      const response = await fetch(`/api/applications/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hskLevel }),
      });

      if (!response.ok) throw new Error('Failed to update HSK level');

      // Update local state
      setSelectedStudent((prev: any) => ({
        ...prev,
        hskLevel: hskLevel
      }));

      toast({
        title: "HSK Level Updated", 
        description: `HSK level set to ${hskLevel}`,
      });

      // Refresh the student data
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/verified"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update HSK level",
        variant: "destructive",
      });
    }
  };

  const updateStudentStatus = (studentId: string, status: string) => {
    updateStatusMutation.mutate({ id: studentId, status });
  };

  const updateRecruitmentStatus = async (candidateId: string, status: string) => {
    console.log("🔥 updateRecruitmentStatus called:", { candidateId, status });
    try {
      const response = await fetch(`/api/applications/${candidateId}/recruitment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recruitmentStatus: status }),
      });

      console.log("🔥 Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔥 Response error:", errorText);
        throw new Error('Failed to update recruitment status');
      }

      const result = await response.json();
      console.log("🔥 Update successful:", result);

      // If approved, also update the main application status for verified users
      if (status === 'approved') {
        console.log("🔥 Updating main application status to approved...");
        await fetch(`/api/applications/${candidateId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'approved' }),
        });
      }

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });

      toast({
        title: status === 'approved' ? "Candidate Accepted" : "Candidate Rejected",
        description: status === 'approved' 
          ? "Candidate has been accepted and added to verified users." 
          : "Candidate has been rejected.",
        variant: status === 'approved' ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error("🔥 Error updating recruitment status:", error);
      toast({
        title: "Error",
        description: "Failed to update recruitment status: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    }
  };

  const scheduleInterview = (candidateId: string, date: string) => {
    toast({
      title: "Interview Scheduled",
      description: `Interview scheduled for ${date}`,
    });
  };

  // Fetch verified users
  // Get verified users from recruitment candidates who are approved
  const verifiedUsers = recruitmentCandidates.filter((candidate: any) => 
    candidate.recruitmentStatus === 'approved'
  ).map((candidate: any) => ({
    ...candidate,
    // Ensure all needed fields are present for the verified users table
    whatsapp: candidate.phone,
    rating: candidate.rating || 0
  }));

  // Revoke verification for a user
  const revokeVerification = async (userId: string, userName: string) => {
    try {
      const response = await fetch(`/api/applications/${userId}/revoke-verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to revoke verification');

      
      // User verification revoked - they will automatically be removed from verified users      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/verified"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Verification Revoked",
        description: `${userName}'s verification has been revoked successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke verification",
        variant: "destructive",
      });
    }
  };

  // Verified users are automatically computed from approved recruitment candidates
  useEffect(() => {
    // No need to fetch verified users separately - they're computed from recruitment data
  }, [activeTab]);

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
  };

  const viewUserProfile = (user: any) => {
    // Find the full application data for this user
    const fullApplication = allApplications?.find(app => app.id === user.id);
    
    if (fullApplication) {
      // Transform the application to student format
      const studentData = transformApplicationToStudent(fullApplication);
      
      // Set the selected student and switch to student pool tab
      setSelectedStudent(studentData);
      setActiveTab("student-pool");
    } else {
      // If not found in applications, try to create student data from available user data
      const studentData = {
        ...user,
        // Ensure we have all the required fields for the student detail view
        hskCertificate: { 
          status: "approved", // Since they're verified
          url: user.hskCertificate || null 
        },
        studentIdCard: { 
          status: "approved", // Since they're verified
          url: user.studentIdDocument || null 
        },
        verificationProgress: 100, // Since they're verified
        submittedAt: formatDate(user.createdAt || user.approvedAt || new Date()),
        languages: user.questionnaireData?.fluentLanguages || [],
        specializations: user.questionnaireData?.specializations || [],
        availability: user.questionnaireData?.availability || 'Not specified',
        motivation: user.questionnaireData?.motivation || user.motivation || 'Not provided',
        expectedGraduation: user.expectedGraduation || 'Not provided',
        intent: user.intent || 'translator'
      };
      
      setSelectedStudent(studentData);
      setActiveTab("student-pool");
    }
  };

  // Helper function to get current date in UTC+7 (same as other calendar components)
  const getCurrentDateUTC7 = () => {
    const now = new Date();
    // If we're already in UTC+7 timezone, just return the current date
    // If we need to convert from a different timezone, we should use proper timezone conversion
    // For now, let's use the local date to avoid the offset issue
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  // Helper function to format date to YYYY-MM-DD in UTC+7
  const formatDateUTC7 = (date: Date) => {
    // Use local date formatting to avoid timezone offset issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

	return (
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
                      <p className="text-sm text-gray-600">Pending Reviews</p>
                      <p className="text-2xl font-bold text-navy-800">
                        {recruitmentCandidates.filter((c: any) => c.recruitmentStatus === 'pending').length}
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
                      <p className="text-sm text-gray-600">Approved</p>
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
                    <TabsTrigger value="pending">Pending Review</TabsTrigger>
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recruitmentCandidates.map((candidate: any) => (
                            <tr key={candidate.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-navy-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                    <div className="text-xs text-gray-500">{candidate.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{candidate.university}</div>
                                <div className="text-xs text-gray-500">{candidate.hskLevel}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {candidate.intent === 'tour_guide' ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    🗺️ Tour Guide
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    🔤 Translator
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getRecruitmentStatusBadge(candidate.recruitmentStatus)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {candidate.recruitmentStatus !== 'pending' ? (
                                  candidate.approvedAt || 'Unknown'
                                ) : (
                                  <span className="text-gray-400">Not reviewed</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {candidate.introVideo ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(candidate.introVideo, '_blank')}
                                  >
                                    <Video className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">No video</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pending" className="space-y-4">
                    {recruitmentCandidates
                      .filter((c: any) => c.recruitmentStatus === 'pending')
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
                              <div className="flex items-center space-x-2">
                                {candidate.introVideo ? (
                                  <>
                                    <Button 
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => window.open(candidate.introVideo, '_blank')}
                                    >
                                      <Video className="h-4 w-4 mr-2" />
                                      View Video
                                    </Button>
                                    <Button 
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => updateRecruitmentStatus(candidate.id, 'approved')}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Accept
                                    </Button>
                                    <Button 
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => updateRecruitmentStatus(candidate.id, 'rejected')}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    variant="outline"
                                    disabled
                                  >
                                    No Video
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="accepted" className="space-y-4">
                    {recruitmentCandidates
                      .filter((c: any) => c.recruitmentStatus === 'approved')
                      .map((candidate: any) => (
                        <Card key={candidate.id} className="hover:shadow-lg transition-shadow border-green-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-navy-800">{candidate.name}</h3>
                                  <p className="text-sm text-gray-600">{candidate.university}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-green-100 text-green-800">Accepted & Verified</Badge>
                                    <span className="text-sm text-green-600">{candidate.hskLevel}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => viewUserProfile(candidate)}
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  View Profile
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="rejected" className="space-y-4">
                    {recruitmentCandidates
                      .filter((c: any) => c.recruitmentStatus === 'rejected')
                      .map((candidate: any) => (
                        <Card key={candidate.id} className="hover:shadow-lg transition-shadow border-red-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                  <XCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-navy-800">{candidate.name}</h3>
                                  <p className="text-sm text-gray-600">{candidate.university}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="destructive">Rejected</Badge>
                                    <span className="text-sm text-gray-500">HSK {candidate.hskLevel}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => viewUserProfile(candidate)}
                                  className="bg-red-50 text-red-700 border-red-200"
                                >
                                  View Profile
                                </Button>
                              </div>
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

        {activeTab === "verified-users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-navy-800">Verified Users</h1>
                <p className="text-gray-600">Manage verified and approved translators/tour guides</p>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Users
              </Button>
            </div>

            {/* Verified Users Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Verified</p>
                      <p className="text-2xl font-bold text-gray-900">{verifiedUsers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Translators</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {verifiedUsers.filter((user: any) => user.intent === 'translator').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Handshake className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tour Guides</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {verifiedUsers.filter((user: any) => user.intent === 'tour_guide').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Verified Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Verified Users</CardTitle>
              </CardHeader>
              <CardContent>
                {verifiedUsers.length === 0 ? (
                  <div className="py-12 text-center">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Verified Users Yet</h3>
                    <p className="text-gray-500">Users will appear here after final approval in recruitment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSK Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {verifiedUsers.map((user: any) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <UserCheck className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-xs text-gray-500">ID: {user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                              <div className="text-xs text-gray-500">{user.whatsapp}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.university}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.intent === 'tour_guide' ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  🗺️ Tour Guide
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  🔤 Translator
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.hskLevel ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {user.hskLevel}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">Not set</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <span className="text-yellow-400">★</span>
                                <span className="ml-1">{user.rating || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className="bg-green-500">Verified</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewUserProfile(user)}
                              >
                                View Profile
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => revokeVerification(user.id, user.name)}
                              >
                                Revoke
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                            <label className="text-sm font-medium text-gray-600">City of Residence</label>
                            <p className="text-sm text-navy-800">{selectedStudent.city}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Expected rate (daily)</label>
                            <p className="text-sm text-navy-800">Rp{selectedStudent.pricePerDay}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Experience and Specializations</label>
                            <p className="text-sm text-navy-800">{selectedStudent.experience}</p>
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
                        <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        <TabsTrigger value="activation">Activation</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="documents" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              Document Verification
                              <Badge 
                                variant={
                                  safeProgress(selectedStudent.verificationProgress) === 100 ? "default" : 
                                  safeProgress(selectedStudent.verificationProgress) >= 80 ? "secondary" : "outline"
                                }
                                className={
                                  safeProgress(selectedStudent.verificationProgress) === 100 
                                    ? "bg-green-100 text-green-800" 
                                    : safeProgress(selectedStudent.verificationProgress) >= 80 
                                    ? "bg-blue-100 text-blue-800" 
                                    : ""
                                }
                              >
                                {safeProgress(selectedStudent.verificationProgress) === 100 
                                  ? "✅ Activated by Admin" 
                                  : safeProgress(selectedStudent.verificationProgress) >= 80 
                                  ? "📋 Ready for Review" 
                                  : `${safeProgress(selectedStudent.verificationProgress)}% Complete`
                                }
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* HSK Certificate */}
                            <div className="space-y-4 p-4 border rounded-lg">
                              <div className="flex items-center justify-between">
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
                              
                              {/* HSK Level Selection */}
                              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                <div>
                                  <h5 className="font-medium text-sm">HSK Level</h5>
                                  <p className="text-xs text-gray-600">Select HSK level after reviewing certificate</p>
                                </div>
                                <Select
                                  value={selectedStudent.hskLevel || ""}
                                  onValueChange={(value) => updateHskLevel(selectedStudent.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="HSK Level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="HSK1">HSK 1</SelectItem>
                                    <SelectItem value="HSK2">HSK 2</SelectItem>
                                    <SelectItem value="HSK3">HSK 3</SelectItem>
                                    <SelectItem value="HSK4">HSK 4</SelectItem>
                                    <SelectItem value="HSK5">HSK 5</SelectItem>
                                    <SelectItem value="HSK6">HSK 6</SelectItem>
                                    <SelectItem value="HSK7">HSK 7</SelectItem>
                                    <SelectItem value="HSK8">HSK 8</SelectItem>
                                    <SelectItem value="HSK9">HSK 9</SelectItem>
                                  </SelectContent>
                                </Select>
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

                            {/* CV/Resume */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-purple-600" />
                                <div>
                                  <h4 className="font-medium">CV/Resume</h4>
                                  <div className="flex items-center text-sm text-gray-600">
                                    {getDocumentAvailability(selectedStudent.cvDocument?.url)}
                                    <span>Curriculum vitae or resume</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getDocumentStatus(selectedStudent.cvDocument?.status || 'pending')}
                                <Select
                                  value={selectedStudent.cvDocument?.status || 'pending'}
                                  onValueChange={(value) => updateDocumentStatus(selectedStudent.id, 'CV/Resume', value)}
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
                                  onClick={() => viewDocument(selectedStudent.cvDocument?.url, 'CV/Resume')}
                                  disabled={!selectedStudent.cvDocument?.url}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="schedule" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Availability Schedule
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedStudent.availability && selectedStudent.availability.schedule ? (
                              <div className="space-y-4">
                                {/* Summary */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-medium text-blue-900 mb-2">Schedule Overview</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-blue-700">Total Available Days:</span>
                                      <span className="font-medium ml-2">
                                        {(() => {
                                          try {
                                            const avail = (selectedStudent.availability.schedule || [])
                                              .filter((s: any) => s.isAvailable)
                                              .map((s: any) => s.date);
                                            const booked = new Set(bookedDates || []);
                                            const net = avail.filter((d: string) => !booked.has(d)).length;
                                            return `${net} days`;
                                          } catch {
                                            return `${selectedStudent.availability.schedule.filter((s: any) => s.isAvailable).length} days`;
                                          }
                                        })()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">Last Updated:</span>
                                      <span className="font-medium ml-2">
                                        {(() => {
                                          try {
                                            const lastUpdated = selectedStudent.availability.lastUpdated;
                                            
                                            if (!lastUpdated) {
                                              return 'Not set';
                                            }
                                            
                                            // If it's already a Date object
                                            if (lastUpdated instanceof Date) {
                                              return lastUpdated.toLocaleDateString('id-ID');
                                            }
                                            
                                            // If it's a Firestore timestamp object with _seconds
                                            if (typeof lastUpdated === 'object' && (lastUpdated as any)._seconds) {
                                              const date = new Date((lastUpdated as any)._seconds * 1000);
                                              return date.toLocaleDateString('id-ID');
                                            }
                                            
                                            // If it's a string, try to parse it
                                            if (typeof lastUpdated === 'string') {
                                              const date = new Date(lastUpdated);
                                              return isNaN(date.getTime()) ? 'Invalid format' : date.toLocaleDateString('id-ID');
                                            }
                                            
                                            // If it's a number (timestamp)
                                            if (typeof lastUpdated === 'number') {
                                              const date = new Date(lastUpdated);
                                              return date.toLocaleDateString('id-ID');
                                            }
                                            
                                            return 'Unknown format';
                                          } catch (error) {
                                            console.error('Error formatting lastUpdated in admin:', error);
                                            return 'Error formatting date';
                                          }
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Calendar View */}
                                <div className="border rounded-lg overflow-hidden">
                                  <div className="bg-gray-50 p-3 border-b">
                                    <h4 className="font-medium">Availability Calendar</h4>
                                    <div className="text-xs text-gray-500">Booked days are highlighted in red</div>
                                  </div>
                                  <div className="p-4">
                                    {(() => {
                                      // Get all available dates from the schedule
                                      const availableDates = selectedStudent.availability.schedule
                                        .filter((s: any) => s.isAvailable)
                                        .map((s: any) => s.date);
                                      
                                      if (availableDates.length === 0) {
                                        return (
                                          <div className="text-center py-8 text-gray-500">
                                            No available dates set yet
                                          </div>
                                        );
                                      }

                                      // Generate calendar for current month and next month
                                      const today = getCurrentDateUTC7();
                                      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                                      
                                      const generateCalendarMonth = (monthStart: Date) => {
                                        const dates = [];
                                        const year = monthStart.getFullYear();
                                        const month = monthStart.getMonth();
                                        
                                        // Get first day of month and its day of week
                                        const firstDay = new Date(year, month, 1);
                                        const startDate = new Date(firstDay);
                                        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
                                        
                                        // Generate 6 weeks (42 days) to fill the calendar grid
                                        for (let i = 0; i < 42; i++) {
                                          const date = new Date(startDate);
                                          date.setDate(startDate.getDate() + i);
                                          const dateStr = formatDateUTC7(date);
                                          dates.push({
                                            date,
                                            isCurrentMonth: date.getMonth() === month,
                                            isToday: date.toDateString() === today.toDateString(),
                                            isAvailable: availableDates.includes(dateStr),
                                            isBooked: bookedDates.includes(dateStr)
                                          });
                                        }
                                        
                                        return dates;
                                      };

                                      const currentMonthDates = generateCalendarMonth(currentMonth);
                                      const nextMonthDates = generateCalendarMonth(nextMonth);
                                      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                      
                                      return (
                                        <div className="space-y-6">
                                          <div className="text-sm text-gray-600 text-center">
                                            {availableDates.length} available dates configured
                                          </div>
                                          
                                          {/* Two Month Calendar Grid */}
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Current Month */}
                                            <div>
                                              <h3 className="text-lg font-semibold mb-4 text-center">
                                                {currentMonth.toLocaleDateString('id-ID', { 
                                                  year: 'numeric', 
                                                  month: 'long'
                                                })}
                                              </h3>
                                              <div className="grid grid-cols-7 gap-1 text-sm">
                                                {/* Header - Days of week */}
                                                {dayNames.map((day) => (
                                                  <div key={day} className="font-semibold p-2 text-center text-gray-600">
                                                    {day}
                                                  </div>
                                                ))}

                                                {/* Calendar Dates */}
                                                {currentMonthDates.map(({ date, isCurrentMonth, isToday, isAvailable, isBooked }, index) => (
                                                  <div
                                                    key={index}
                                                    className={`
                                                      p-2 text-center min-h-[40px] flex items-center justify-center transition-all duration-200
                                                      ${!isCurrentMonth 
                                                        ? 'text-gray-300' 
                                                        : isBooked
                                                          ? 'bg-red-100 border border-red-300 text-red-800 rounded'
                                                          : isAvailable 
                                                            ? 'bg-green-100 border border-green-300 text-green-800 rounded' 
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                      }
                                                      ${isToday ? 'ring-2 ring-blue-400 rounded' : ''}
                                                    `}
                                                  >
                                                    <div className="text-center">
                                                      <div className={`${isToday ? 'font-bold' : ''}`}>
                                                        {date.getDate()}
                                                      </div>
                                                      {isAvailable && isCurrentMonth && !isBooked && (
                                                        <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1"></div>
                                                      )}
                                                      {isBooked && isCurrentMonth && (
                                                        <div className="w-1 h-1 bg-red-500 rounded-full mx-auto mt-1"></div>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>

                                            {/* Next Month */}
                                            <div>
                                              <h3 className="text-lg font-semibold mb-4 text-center">
                                                {nextMonth.toLocaleDateString('id-ID', { 
                                                  year: 'numeric', 
                                                  month: 'long'
                                                })}
                                              </h3>
                                              <div className="grid grid-cols-7 gap-1 text-sm">
                                                {/* Header - Days of week */}
                                                {dayNames.map((day) => (
                                                  <div key={day} className="font-semibold p-2 text-center text-gray-600">
                                                    {day}
                                                  </div>
                                                ))}

                                                {/* Calendar Dates */}
                                                {nextMonthDates.map(({ date, isCurrentMonth, isToday, isAvailable, isBooked }, index) => (
                                                  <div
                                                    key={index}
                                                    className={`
                                                      p-2 text-center min-h-[40px] flex items-center justify-center transition-all duration-200
                                                      ${!isCurrentMonth 
                                                        ? 'text-gray-300' 
                                                        : isBooked
                                                          ? 'bg-red-100 border border-red-300 text-red-800 rounded'
                                                          : isAvailable 
                                                            ? 'bg-green-100 border border-green-300 text-green-800 rounded' 
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                      }
                                                      ${isToday ? 'ring-2 ring-blue-400 rounded' : ''}
                                                    `}
                                                  >
                                                    <div className="text-center">
                                                      <div className={`${isToday ? 'font-bold' : ''}`}>
                                                        {date.getDate()}
                                                      </div>
                                                      {isAvailable && isCurrentMonth && !isBooked && (
                                                        <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1"></div>
                                                      )}
                                                      {isBooked && isCurrentMonth && (
                                                        <div className="w-1 h-1 bg-red-500 rounded-full mx-auto mt-1"></div>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Legend */}
                                          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t justify-center">
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                                              <span className="text-sm text-gray-600">Available</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                                              <span className="text-sm text-gray-600">Booked</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                                              <span className="text-sm text-gray-600">Not available</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded"></div>
                                              <span className="text-sm text-gray-600">Today</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Recurring Patterns */}
                                {selectedStudent.availability.recurringPatterns && 
                                 selectedStudent.availability.recurringPatterns.length > 0 && (
                                  <div className="border rounded-lg">
                                    <div className="bg-gray-50 p-3 border-b">
                                      <h4 className="font-medium">Recurring Patterns</h4>
                                    </div>
                                    <div className="p-4 space-y-2">
                                      {selectedStudent.availability.recurringPatterns.map((pattern: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                          <span className="text-sm">
                                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern.dayOfWeek]}
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            Always available on {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern.dayOfWeek]}s
                                          </span>
                                          <Badge variant={pattern.isActive ? "default" : "secondary"}>
                                            {pattern.isActive ? 'Active' : 'Inactive'}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Unavailable Periods */}
                                {selectedStudent.availability.unavailablePeriods && 
                                 selectedStudent.availability.unavailablePeriods.length > 0 && (
                                  <div className="border rounded-lg">
                                    <div className="bg-gray-50 p-3 border-b">
                                      <h4 className="font-medium">Unavailable Periods</h4>
                                    </div>
                                    <div className="p-4 space-y-2">
                                      {selectedStudent.availability.unavailablePeriods.map((period: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                                          <span className="text-sm">
                                            {new Date(period.startDate).toLocaleDateString('id-ID')} - {new Date(period.endDate).toLocaleDateString('id-ID')}
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            {period.reason || 'No reason provided'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No availability schedule set</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  User hasn't configured their availability yet
                                </p>
                              </div>
                            )}
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
                                  <span>CV/Resume:</span>
                                  {selectedStudent.cvDocument?.url ? 
                                    getDocumentStatus(selectedStudent.cvDocument?.status || 'pending') : 
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
                                disabled={
                                  updateStatusMutation.isPending || 
                                  selectedStudent.status === 'rejected' ||
                                  selectedStudent.recruitmentStatus === 'accepted' ||
                                  selectedStudent.finalStatus === 'approved'
                                }
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {selectedStudent.status === 'rejected' ? 'Already Rejected' : 
                                 (selectedStudent.recruitmentStatus === 'accepted' || selectedStudent.finalStatus === 'approved') ? 'Student Accepted' :
                                 updateStatusMutation.isPending ? 'Updating...' : 'Reject Student'}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCandidate(selectedStudent);
                                  setRequestChangesModalOpen(true);
                                }}
                                disabled={
                                  updateStatusMutation.isPending ||
                                  selectedStudent.recruitmentStatus === 'accepted' ||
                                  selectedStudent.finalStatus === 'approved'
                                }
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {(selectedStudent.recruitmentStatus === 'accepted' || selectedStudent.finalStatus === 'approved') ? 'Student Accepted' : 'Request Changes'}
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
                                <div className="text-sm text-gray-900">Rp {student.pricePerDay || 'N/A'} /day</div>
                                <div className="text-sm text-gray-500">
                                  {student.availabilityText === 'Will be set up in dashboard' || 
                                   (Array.isArray(student.availabilityText) && student.availabilityText.includes('Will be set up in dashboard'))
                                    ? (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {(student as any).availability && 
                                         (student as any).availability.schedule && 
                                         (student as any).availability.schedule.length > 0 
                                          ? '✅ Calendar Set' 
                                          : '⏳ Calendar Pending'
                                        }
                                      </div>
                                    ) : student.availabilityText || 'Not specified'
                                  }
                                </div>
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

        {activeTab === "clients" && (
          <>
            {!selectedClient ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-navy-800">Client Pool</h1>
                  <p className="text-gray-600">Manage client onboarding verification</p>
                </div>

                {/* Type tabs: All / Individu / Travel Agency */}
                <Card>
                  <CardContent className="p-4">
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setClientTypeFilter("all")}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                          clientTypeFilter === "all" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        All Clients
                      </button>
                      <button
                        onClick={() => setClientTypeFilter("individu")}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                          clientTypeFilter === "individu" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Individu
                      </button>
                      <button
                        onClick={() => setClientTypeFilter("travel_agency")}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                          clientTypeFilter === "travel_agency" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Travel Agency
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
                          placeholder="Search clients..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={clientStatusFilter} onValueChange={setClientStatusFilter}>
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

                {/* Clients Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {clientList
                            .filter(c => (clientTypeFilter === 'all' || c.intent === clientTypeFilter))
                            .filter(c => (clientStatusFilter === 'all' || c.status === clientStatusFilter))
                            .filter(c => (c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) || c.email?.toLowerCase().includes(clientSearchQuery.toLowerCase())))
                            .map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="font-medium text-gray-900">{c.name}</div>
                                    <div className="text-xs text-gray-500">{c.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="secondary" className="capitalize">{c.intent}</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className="capitalize">{c.status}</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate((c as any).createdAt || new Date())}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setSelectedClient(c)}>View Details</Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Menu className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => updateApplicationStatus(c.id, 'approved')}>Approve</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateApplicationStatus(c.id, 'rejected')}>Reject</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateApplicationStatus(c.id, 'pending')}>Pending</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedCandidate(c);
                                        setRequestChangesModalOpen(true);
                                      }}>Request Changes</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" onClick={() => setSelectedClient(null)} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Clients
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                  <h1 className="text-2xl font-bold text-navy-800">Detail Klien</h1>
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
                            <h3 className="font-semibold text-navy-800">{selectedClient.name}</h3>
                            <p className="text-sm text-gray-600">{selectedClient.email}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Client Type</label>
                            <p className="text-sm text-navy-800 capitalize">{selectedClient.intent}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Phone</label>
                            <p className="text-sm text-navy-800">{selectedClient.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">City</label>
                            <p className="text-sm text-navy-800">{selectedClient.city || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Submitted</label>
                            <p className="text-sm text-navy-800">{selectedClient.submittedAt || 'Not available'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <div className="mt-1">
                              {getStatusBadge(selectedClient.status || 'pending')}
                            </div>
                          </div>
                          {selectedClient.motivation && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Motivation</label>
                              <p className="text-sm text-navy-800 bg-gray-50 p-3 rounded mt-1 max-h-32 overflow-y-auto">{selectedClient.motivation}</p>
                            </div>
                          )}
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
                                variant={
                                  safeProgress(selectedClient.verificationProgress) === 100 ? "default" : 
                                  safeProgress(selectedClient.verificationProgress) >= 80 ? "secondary" : "outline"
                                }
                                className={
                                  safeProgress(selectedClient.verificationProgress) === 100 
                                    ? "bg-green-100 text-green-800" 
                                    : safeProgress(selectedClient.verificationProgress) >= 80 
                                    ? "bg-blue-100 text-blue-800" 
                                    : ""
                                }
                              >
                                {safeProgress(selectedClient.verificationProgress) === 100 
                                  ? "✅ Activated by Admin" 
                                  : safeProgress(selectedClient.verificationProgress) >= 80 
                                  ? "📋 Ready for Review" 
                                  : `${safeProgress(selectedClient.verificationProgress)}% Complete`
                                }
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* KTP Document */}
                            <div className="space-y-4 p-4 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <CreditCard className="h-8 w-8 text-green-600" />
                                  <div>
                                    <h4 className="font-medium">Kartu Tanda Penduduk (KTP)</h4>
                                    <div className="flex items-center text-sm text-gray-600">
                                      {getDocumentAvailability(selectedClient.ktpDocument?.url)}
                                      <span>Indonesian identity card</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {getDocumentStatus(selectedClient.ktpDocument?.status || 'pending')}
                                  <Select
                                    value={selectedClient.ktpDocument?.status || 'pending'}
                                    onValueChange={(value) => updateDocumentStatus(selectedClient.id, 'KTP Document', value)}
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
                                    onClick={() => viewDocument(selectedClient.ktpDocument?.url, 'KTP Document')}
                                    disabled={!selectedClient.ktpDocument?.url}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="activation" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5" />
                              Account Activation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-medium text-blue-900 mb-2">Activation Overview</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-700">Verification Progress:</span>
                                  <span className="font-medium ml-2">{safeProgress(selectedClient.verificationProgress)}%</span>
                                </div>
                                <div>
                                  <span className="text-blue-700">Status:</span>
                                  <span className="font-medium ml-2 capitalize">{selectedClient.status}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Document Verification Status */}
                            <div className="p-4 border rounded-lg">
                              <h5 className="font-medium mb-3">Document Verification Status</h5>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Email Verified:</span>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">KTP Document:</span>
                                  <div className="flex items-center gap-3">
                                    {selectedClient.ktpDocument?.url ? 
                                      getDocumentStatus(selectedClient.ktpDocument.status) : 
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    }
                                   
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Verification Progress Bar */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h5 className="font-medium mb-2">Verification Progress</h5>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${safeProgress(selectedClient.verificationProgress)}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{safeProgress(selectedClient.verificationProgress)}% Complete</p>
                            </div>
                            
                            <div className="flex gap-3">
                              <Button 
                                onClick={() => updateStatusMutation.mutate({ id: selectedClient.id, status: 'approved' })}
                                disabled={updateStatusMutation.isPending || selectedClient.status === 'approved'}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Client
                              </Button>
                              <Button 
                                onClick={() => updateStatusMutation.mutate({ id: selectedClient.id, status: 'rejected' })}
                                disabled={updateStatusMutation.isPending || selectedClient.status === 'rejected'}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Client
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCandidate(selectedClient);
                                  setRequestChangesModalOpen(true);
                                }}
                                disabled={updateStatusMutation.isPending}
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Request Changes
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "job-management" && (
          <>
            <h1 className="text-3xl font-bold text-navy-800 mb-2">Job Management</h1>
            <p className="text-silver-600 mb-8">Create and manage translation job postings</p>
            
            <Tabs defaultValue="create-job" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="create-job">Create New Job</TabsTrigger>
                <TabsTrigger value="manage-jobs">Manage Jobs</TabsTrigger>
                <TabsTrigger value="bookings">All Bookings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="create-job" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Student Showcase</CardTitle>
                    <p className="text-gray-600">Create a client-facing showcase for verified student translators</p>
                  </CardHeader>
                  <CardContent>
                    <StudentShowcaseForm 
                      verifiedTranslators={verifiedApplications} // Pass list of verified translators
                      onJobCreated={(job: any) => {
                        toast({
                          title: "Student Showcase Created!",
                          description: `Job "${job.title}" has been created and is now visible in the marketplace.`,
                        });
                        // Refresh any job list if needed
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="manage-jobs" className="space-y-6">
                <ConfirmedJobsManagement />
              </TabsContent>
              
              <TabsContent value="bookings" className="space-y-6">
                <BookingsManagement />
              </TabsContent>
            </Tabs>
          </>
        )}

        {activeTab === "bookings" && (
          <>
            <h1 className="text-3xl font-bold text-navy-800 mb-2">Bookings Management</h1>
            <p className="text-silver-600 mb-8">Manage all student translator bookings</p>
            
            <BookingsManagement />
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
									{recentActivities && recentActivities.length > 0 ? (
										recentActivities.map((activity) => (
											<div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
												<div>
													<p className="font-medium">{getActivityTitle(activity.type)}</p>
													<p className="text-sm text-gray-600">{activity.message}</p>
													<p className="text-xs text-gray-400 mt-1">
														{new Date(activity.timestamp).toLocaleDateString('id-ID', {
															day: 'numeric',
															month: 'short',
															hour: '2-digit',
															minute: '2-digit'
														})}
													</p>
												</div>
												{getActivityBadge(activity.status)}
											</div>
										))
									) : (
										<div className="text-center text-gray-500 py-8">
											<p>Belum ada aktivitas terbaru</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</>
				)}
			</main>

			{/* Request Changes Modal */}
			<Dialog open={requestChangesModalOpen} onOpenChange={setRequestChangesModalOpen}>
				<DialogContent className="sm:max-w-md">
									<DialogHeader>
					<DialogTitle>Request Document Changes</DialogTitle>
					<DialogDescription>
						Select which documents need to be resubmitted by {selectedCandidate?.name} ({selectedCandidate?.intent === 'individu' || selectedCandidate?.intent === 'travel_agency' ? 'Client' : 'Student'})
					</DialogDescription>
				</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-3">
							<Label className="text-sm font-medium">Documents requiring changes:</Label>
							<div className="space-y-2">
								{/* Show student-specific documents only for students */}
								{selectedCandidate && selectedCandidate.intent !== 'individu' && selectedCandidate.intent !== 'travel_agency' && (
									<>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="hsk"
												checked={selectedChanges.includes('hsk')}
												onCheckedChange={(checked: boolean) => {
													if (checked) {
														setSelectedChanges(prev => [...prev, 'hsk']);
													} else {
														setSelectedChanges(prev => prev.filter(item => item !== 'hsk'));
													}
												}}
											/>
											<Label htmlFor="hsk" className="text-sm">HSK Certificate</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="studentId"
												checked={selectedChanges.includes('studentId')}
												onCheckedChange={(checked: boolean) => {
													if (checked) {
														setSelectedChanges(prev => [...prev, 'studentId']);
													} else {
														setSelectedChanges(prev => prev.filter(item => item !== 'studentId'));
													}
												}}
											/>
											<Label htmlFor="studentId" className="text-sm">Student ID Document</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="cv"
												checked={selectedChanges.includes('cv')}
												onCheckedChange={(checked: boolean) => {
													if (checked) {
														setSelectedChanges(prev => [...prev, 'cv']);
													} else {
														setSelectedChanges(prev => prev.filter(item => item !== 'cv'));
													}
												}}
											/>
											<Label htmlFor="cv" className="text-sm">Curriculum Vitae (CV)</Label>
										</div>
									</>
								)}
								
								{/* Show KTP document for both students and clients */}
								<div className="flex items-center space-x-2">
									<Checkbox
										id="ktp"
										checked={selectedChanges.includes('ktp')}
										onCheckedChange={(checked: boolean) => {
											if (checked) {
												setSelectedChanges(prev => [...prev, 'ktp']);
											} else {
												setSelectedChanges(prev => prev.filter(item => item !== 'ktp'));
											}
										}}
									/>
									<Label htmlFor="ktp" className="text-sm">KTP Document</Label>
								</div>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="message" className="text-sm font-medium">Additional Message (Optional)</Label>
							<Textarea
								id="message"
								placeholder="Provide specific feedback about what needs to be changed..."
								value={changeMessage}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChangeMessage(e.target.value)}
								className="min-h-[80px]"
							/>
						</div>
					</div>
					<DialogFooter className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => {
								setRequestChangesModalOpen(false);
								setSelectedChanges([]);
								setChangeMessage("");
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (selectedCandidate && selectedChanges.length > 0) {
									requestChangesMutation.mutate({
										studentId: selectedCandidate.id,
										changes: selectedChanges,
										message: changeMessage
									});
								}
							}}
							disabled={selectedChanges.length === 0 || requestChangesMutation.isPending}
						>
							{requestChangesMutation.isPending ? 'Sending...' : 'Send Request'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
