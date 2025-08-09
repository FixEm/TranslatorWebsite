import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, FileText, Video, Image, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  services: string[];
  experience: string;
  pricePerDay: string;
  university: string;
  expectedGraduation: string;
  motivation: string;
  intent: 'translator' | 'tour_guide';
  yearsInChina?: number;
  studentEmail?: string;
  studentIdDocument?: string;
  hskCertificate?: string;
  introVideo?: string;
  verificationSteps: {
    emailVerified: boolean;
    studentIdUploaded: boolean;
    hskUploaded: boolean;
    introVideoUploaded: boolean;
    adminApproved: boolean;
  };
  completenessScore: number;
  status: string;
  createdAt: any; // Firebase Timestamp
  adminNotes?: string;
  questionnaireData?: any;
}

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const fetchPendingApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications/pending');
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes }),
      });

      if (!response.ok) throw new Error('Failed to approve application');

      toast({
        title: "Application Approved",
        description: "The translator has been approved and added to the marketplace",
      });

      // Remove from pending list
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      setSelectedApplication(null);
      setAdminNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes }),
      });

      if (!response.ok) throw new Error('Failed to reject application');

      toast({
        title: "Application Rejected",
        description: "The application has been rejected",
      });

      // Remove from pending list
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      setSelectedApplication(null);
      setAdminNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCompletionBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Ready for Review</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">In Progress</Badge>;
    return <Badge className="bg-red-500">Incomplete</Badge>;
  };

  const getServiceBadge = (service: string) => {
    const colors = {
      translator: "bg-blue-500",
      tour_guide: "bg-green-500",
      both: "bg-purple-500"
    };
    return <Badge className={colors[service as keyof typeof colors] || "bg-gray-500"}>{service}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Review and approve translator applications</p>
      </div>

      <div className="grid gap-6">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">No pending applications</h3>
              <p className="text-gray-600">All applications have been reviewed</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{application.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {application.email} • {application.city} • {application.whatsapp}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getCompletionBadge(application.completenessScore)}
                    {getServiceBadge(application.intent)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-medium">{application.experience} years</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Price/Day</p>
                    <p className="font-medium">¥{application.pricePerDay}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Completion</p>
                    <p className="font-medium">{application.completenessScore}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Applied</p>
                    <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Motivation</h4>
                  <p className="text-sm text-gray-700 line-clamp-3">{application.motivation}</p>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className={`h-4 w-4 ${application.verificationSteps.emailVerified ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="text-sm">Email</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className={`h-4 w-4 ${application.verificationSteps.studentIdUploaded ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="text-sm">Student ID</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Image className={`h-4 w-4 ${application.verificationSteps.hskUploaded ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="text-sm">HSK</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Video className={`h-4 w-4 ${application.verificationSteps.introVideoUploaded ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="text-sm">Video</span>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedApplication(application)}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Review Application: {application.name}</DialogTitle>
                      <DialogDescription>
                        Review all documents and information before making a decision
                      </DialogDescription>
                    </DialogHeader>

                    {selectedApplication && (
                      <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="info">Basic Info</TabsTrigger>
                          <TabsTrigger value="documents">Documents</TabsTrigger>
                          <TabsTrigger value="video">Video</TabsTrigger>
                          <TabsTrigger value="review">Review</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Name</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.name}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.email}</p>
                            </div>
                            <div>
                              <Label>WhatsApp</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.whatsapp}</p>
                            </div>
                            <div>
                              <Label>City</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.city}</p>
                            </div>
                            <div>
                              <Label>University</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.university || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label>Expected Graduation</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.expectedGraduation || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label>Service Intent</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.intent}</p>
                            </div>
                            <div>
                              <Label>Experience</Label>
                              <p className="mt-1 p-2 border rounded">{selectedApplication.experience}</p>
                            </div>
                          </div>
                          <div>
                            <Label>Motivation for Joining AyoCabut</Label>
                            <p className="mt-1 p-4 border rounded min-h-[100px]">{selectedApplication.motivation}</p>
                          </div>
                          {selectedApplication.questionnaireData && (
                            <div>
                              <Label>Questionnaire Data</Label>
                              <div className="mt-1 p-4 border rounded min-h-[100px] bg-gray-50">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {JSON.stringify(selectedApplication.questionnaireData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-4">
                          {selectedApplication.studentIdDocument && (
                            <div>
                              <Label>Student ID Document</Label>
                              <div className="mt-2">
                                <img 
                                  src={selectedApplication.studentIdDocument} 
                                  alt="Student ID" 
                                  className="max-w-full h-auto border rounded max-h-96"
                                />
                              </div>
                            </div>
                          )}
                          {selectedApplication.hskCertificate && (
                            <div>
                              <Label>HSK Certificate</Label>
                              <div className="mt-2">
                                <img 
                                  src={selectedApplication.hskCertificate} 
                                  alt="HSK Certificate" 
                                  className="max-w-full h-auto border rounded max-h-96"
                                />
                              </div>
                            </div>
                          )}
                          {!selectedApplication.studentIdDocument && !selectedApplication.hskCertificate && (
                            <p className="text-gray-500 text-center py-8">No documents uploaded</p>
                          )}
                        </TabsContent>

                        <TabsContent value="video" className="space-y-4">
                          {selectedApplication.introVideo ? (
                            <div>
                              <Label>Introduction Video</Label>
                              <div className="mt-2">
                                <video 
                                  controls 
                                  className="w-full max-h-96 border rounded"
                                  src={selectedApplication.introVideo}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-8">No introduction video uploaded</p>
                          )}
                        </TabsContent>

                        <TabsContent value="review" className="space-y-4">
                          <div>
                            <Label htmlFor="adminNotes">Admin Notes</Label>
                            <Textarea
                              id="adminNotes"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes about your review decision..."
                              className="min-h-[100px]"
                            />
                          </div>
                          
                          <div className="flex space-x-4">
                            <Button
                              onClick={() => selectedApplication && handleApprove(selectedApplication.id)}
                              disabled={isProcessing}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {isProcessing ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => selectedApplication && handleReject(selectedApplication.id)}
                              disabled={isProcessing}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {isProcessing ? "Processing..." : "Reject"}
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
