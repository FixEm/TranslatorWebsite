import React, { useState, useEffect } from 'react';
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
  cvDocument?: string;
  introVideo?: string;
  verificationSteps: {
    emailVerified: boolean;
    studentIdUploaded: boolean;
    hskUploaded: boolean;
    cvUploaded: boolean;
    introVideoUploaded: boolean;
    adminApproved: boolean;
  };
  completenessScore: number;
  status: string;
  createdAt: any; // Firebase Timestamp
  adminNotes?: string;
  questionnaireData?: any;
  availability?: any;
}

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifiedUsers, setVerifiedUsers] = useState<Application[]>([]);
  const [showVerified, setShowVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingApplications();
    fetchVerifiedUsers();
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

  const fetchVerifiedUsers = async () => {
    try {
      const response = await fetch('/api/admin/applications/verified');
      if (!response.ok) throw new Error('Failed to fetch verified users');
      const data = await response.json();
      setVerifiedUsers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch verified users",
        variant: "destructive",
      });
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

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Recruitment Pipeline</h2>
        <div>
          <label htmlFor="verifiedDropdown" className="mr-2 font-medium">Verified Users</label>
          <select
            id="verifiedDropdown"
            className="border rounded px-2 py-1"
            value={showVerified ? "show" : "hide"}
            onChange={e => setShowVerified(e.target.value === "show")}
          >
            <option value="hide">Hide</option>
            <option value="show">Show</option>
          </select>
        </div>
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
                    <FileText className={`h-4 w-4 ${application.verificationSteps.cvUploaded ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="text-sm">CV</span>
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
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="info">Basic Info</TabsTrigger>
                          <TabsTrigger value="documents">Documents</TabsTrigger>
                          <TabsTrigger value="video">Video</TabsTrigger>
                          <TabsTrigger value="schedule">Schedule</TabsTrigger>
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
                          {selectedApplication.cvDocument && (
                            <div>
                              <Label>CV/Resume</Label>
                              <div className="mt-2">
                                {selectedApplication.cvDocument.toLowerCase().includes('.pdf') ? (
                                  <div className="border rounded p-4 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <FileText className="h-5 w-5 text-red-600" />
                                        <span className="text-sm font-medium">CV Document (PDF)</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => window.open(selectedApplication.cvDocument, '_blank')}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <img 
                                    src={selectedApplication.cvDocument} 
                                    alt="CV Document" 
                                    className="max-w-full h-auto border rounded max-h-96"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {!selectedApplication.studentIdDocument && !selectedApplication.hskCertificate && !selectedApplication.cvDocument && (
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

                        <TabsContent value="schedule" className="space-y-4">
                          {selectedApplication.availability && selectedApplication.availability.schedule ? (
                            <div>
                              <Label>Availability Schedule</Label>
                              <div className="mt-4 space-y-4">
                                {/* Summary */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-medium text-blue-900 mb-2">Schedule Overview</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-blue-700">Total Days Available:</span>
                                      <span className="font-medium ml-2">
                                        {selectedApplication.availability.schedule.length} days
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">Last Updated:</span>
                                      <span className="font-medium ml-2">
                                        {selectedApplication.availability.lastUpdated ? 
                                          new Date(selectedApplication.availability.lastUpdated).toLocaleDateString('id-ID') : 
                                          'Not set'
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Schedule Grid */}
                                <div className="border rounded-lg overflow-hidden">
                                  <div className="bg-gray-50 p-3 border-b">
                                    <h4 className="font-medium">Weekly Schedule</h4>
                                  </div>
                                  <div className="p-4">
                                    {(() => {
                                      // Get all unique dates from the schedule and sort them
                                      const allDates = selectedApplication.availability.schedule
                                        .map((s: any) => s.date)
                                        .sort();
                                      
                                      // Get the date range to display (first and last dates)
                                      const startDate = allDates[0];
                                      const endDate = allDates[allDates.length - 1];
                                      
                                      // Create array of dates for the week
                                      const weekDates: string[] = [];
                                      if (startDate && endDate) {
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        
                                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                                          weekDates.push(d.toISOString().split('T')[0]);
                                        }
                                      }
                                      
                                      return (
                                        <div className="space-y-4">
                                          {weekDates.length > 0 && (
                                            <div className="text-sm text-gray-600 text-center">
                                              Schedule for {new Date(startDate).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric' 
                                              })} - {new Date(endDate).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                year: 'numeric'
                                              })}
                                            </div>
                                          )}
                                          
                                          <div className="grid grid-cols-8 gap-1 text-xs">
                                            <div className="font-medium p-2">Time</div>
                                            {weekDates.map(dateStr => {
                                              const date = new Date(dateStr);
                                              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                              const dayName = dayNames[date.getDay()];
                                              return (
                                                <div key={dateStr} className="font-medium p-2 text-center">
                                                  <div>{dayName}</div>
                                                  <div className="text-xs text-gray-500">{date.getDate()}</div>
                                                </div>
                                              );
                                            })}
                                            
                                            {/* Time slots from 8 AM to 8 PM */}
                                            {Array.from({ length: 13 }, (_, i) => {
                                              const hour = 8 + i;
                                              const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                                              
                                              return (
                                                <React.Fragment key={timeSlot}>
                                                  <div className="p-2 text-right">{timeSlot}</div>
                                                  {weekDates.map(dateStr => {
                                                    const daySchedule = selectedApplication.availability.schedule.find(
                                                      (s: any) => s.date === dateStr
                                                    );
                                                    
                                                    const timeSlotData = daySchedule?.timeSlots.find(
                                                      (slot: any) => slot.startTime === timeSlot
                                                    );
                                                    
                                                    return (
                                                      <div 
                                                        key={`${dateStr}-${timeSlot}`}
                                                        className={`p-1 text-center text-xs border ${
                                                          timeSlotData?.isAvailable 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                      >
                                                        {timeSlotData?.isAvailable ? '✓' : ''}
                                                      </div>
                                                    );
                                                  })}
                                                </React.Fragment>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Recurring Patterns */}
                                {selectedApplication.availability.recurringPatterns && 
                                 selectedApplication.availability.recurringPatterns.length > 0 && (
                                  <div className="border rounded-lg">
                                    <div className="bg-gray-50 p-3 border-b">
                                      <h4 className="font-medium">Recurring Patterns</h4>
                                    </div>
                                    <div className="p-4 space-y-2">
                                      {selectedApplication.availability.recurringPatterns.map((pattern: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                          <span className="text-sm">
                                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern.dayOfWeek]}
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            {pattern.timeSlots.map((slot: any) => 
                                              `${slot.startTime}-${slot.endTime}`
                                            ).join(', ')}
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
                                {selectedApplication.availability.unavailablePeriods && 
                                 selectedApplication.availability.unavailablePeriods.length > 0 && (
                                  <div className="border rounded-lg">
                                    <div className="bg-gray-50 p-3 border-b">
                                      <h4 className="font-medium">Unavailable Periods</h4>
                                    </div>
                                    <div className="p-4 space-y-2">
                                      {selectedApplication.availability.unavailablePeriods.map((period: any, index: number) => (
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

        {/* Verified Users Table */}
        {showVerified && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Verified Users</h2>
            <Card>
              <CardContent>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verifiedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">No verified users yet</td>
                      </tr>
                    ) : (
                      verifiedUsers.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{user.city}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getServiceBadge(user.intent)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-green-500">Verified</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
