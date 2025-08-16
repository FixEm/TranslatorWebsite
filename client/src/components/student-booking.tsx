import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, addHours, differenceInHours } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Star, 
  Phone, 
  MessageSquare,
  User,
  CheckCircle,
  DollarSign,
  Briefcase,
  Languages
} from "lucide-react";

interface StudentBookingProps {
  jobId?: string;
  onBookingComplete?: () => void;
}

interface BookingFormData {
  translatorId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  serviceType: 'translator' | 'tour_guide' | 'both';
  location: string;
  specialRequests: string;
}

// Helper function to get current date in UTC+7
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

// Helper function to parse date string and convert to UTC+7
const parseDateUTC7 = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in local timezone to avoid offset issues
  return new Date(year, month - 1, day); // month is 0-indexed
};

export default function StudentBooking({ jobId, onBookingComplete }: StudentBookingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    translatorId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    serviceType: 'translator',
    location: '',
    specialRequests: ''
  });

  // Fetch available student showcases/jobs
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch student showcases');
      return response.json();
    }
  });

  // Transform job data to student format for display
  const verifiedStudents = jobsData ? jobsData.map((job: any) => ({
    id: job.id,
    userId: job.userId,
    name: job.translatorName,
    city: job.translatorCity,
    hskLevel: job.translatorHskLevel,
    experience: job.translatorExperience,
    services: job.translatorServices || [],
    profileImage: job.profileImage || '',
    pricePerDay: job.budget,
    availability: job.availability,
    description: job.description,
    title: job.title,
    category: job.category,
    skills: job.skills || [],
    deadline: job.deadline
  })) : [];

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created!",
        description: "Your booking request has been submitted. Our admin will confirm it shortly.",
      });
      setIsBookingModalOpen(false);
      setSelectedStudent(null);
      setSelectedTimeSlot(null);
      setBookingForm({
        translatorId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        serviceType: 'translator',
        location: '',
        specialRequests: ''
      });
      onBookingComplete?.();
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  });

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

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'translator': return 'Translator';
      case 'tour_guide': return 'Tour Guide';
      case 'both': return 'Translator & Tour Guide';
      default: return 'Not specified';
    }
  };

  const handleTimeSlotSelect = (student: any, day: any, timeSlot: any) => {
    setSelectedStudent(student);
    setSelectedTimeSlot({ day, timeSlot });
    setBookingForm(prev => ({
      ...prev,
      translatorId: student.id,
      bookingDate: day.date,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime
    }));
    setIsBookingModalOpen(true);
  };

  const handleFormChange = (field: string, value: string) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitBooking = () => {
    // Validation
    if (!bookingForm.clientName || !bookingForm.clientEmail || !bookingForm.clientPhone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Calculate total hours and amount
    const startDateTime = parseISO(`${bookingForm.bookingDate}T${bookingForm.startTime}:00`);
    const endDateTime = parseISO(`${bookingForm.bookingDate}T${bookingForm.endTime}:00`);
    const totalHours = differenceInHours(endDateTime, startDateTime);
    const hourlyRate = Math.round((selectedStudent?.pricePerDay || 500000) / 8); // Assume 8 hours per day
    const totalAmount = totalHours * hourlyRate;

    const bookingData = {
      ...bookingForm,
      jobId: jobId || `showcase-${selectedStudent.id}`,
      totalHours,
      hourlyRate,
      totalAmount,
      timezone: 'Asia/Shanghai'
    };

    createBookingMutation.mutate(bookingData);
  };

  const getStudentAvailability = (student: any) => {
    const availability = student.availability;
    if (!availability || !availability.schedule) return [];
    
    // Filter for future dates only using UTC+7
    const today = getCurrentDateUTC7();
    today.setHours(0, 0, 0, 0);
    
    return availability.schedule.filter((day: any) => {
      const dayDate = parseISO(day.date);
      return dayDate >= today;
    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available students...</p>
      </div>
    );
  }

  if (!verifiedStudents || verifiedStudents.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Students Available</h3>
        <p className="text-gray-500">Currently no verified students are available for booking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-navy-800 mb-2">Available Students</h2>
        <p className="text-gray-600">Choose from our verified students and book your preferred time slot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {verifiedStudents.map((student: any) => {
          const availability = getStudentAvailability(student);
          const hasAvailability = availability.length > 0;
          
          return (
            <Card key={student.id} className="overflow-hidden hover:shadow-lg transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={student.profileImage} />
                    <AvatarFallback className="text-lg font-semibold">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-navy-800">{student.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="h-3 w-3" />
                      {student.city}
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <GraduationCap className="h-3 w-3" />
                      <span>HSK Level</span>
                    </div>
                    <div className="font-medium">{student.hskLevel || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Briefcase className="h-3 w-3" />
                      <span>Experience</span>
                    </div>
                    <div className="font-medium">{student.experience} years</div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Services</div>
                  <div className="flex flex-wrap gap-1">
                    {(student.services || []).slice(0, 2).map((service: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {getServiceLabel(service)}
                      </Badge>
                    ))}
                    {(student.services || []).length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{(student.services || []).length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rate */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span className="text-lg font-bold text-navy-600">
                      Rp {student.pricePerDay || 500000}/day
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ≈ Rp {Math.round((student.pricePerDay || 500000) / 8)}/hour
                  </div>
                </div>

                {/* Description */}
                {student.description && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">About</div>
                    <p className="text-sm text-gray-800 line-clamp-3">
                      {student.description}
                    </p>
                  </div>
                )}

                {/* Availability Calendar */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Student's Availability</span>
                  </div>
                  
                  {hasAvailability ? (
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {/* Mini Calendar View */}
                      <div className="grid grid-cols-7 gap-1 mb-3">
                        {/* Days of week header */}
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <div key={index} className="text-center text-xs font-semibold text-gray-500 p-1">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days for next 2 weeks */}
                        {(() => {
                          const today = getCurrentDateUTC7();
                          const days = [];
                          const startOfWeek = new Date(today);
                          startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
                          
                          // Generate 14 days (2 weeks)
                          for (let i = 0; i < 14; i++) {
                            const date = new Date(startOfWeek);
                            date.setDate(startOfWeek.getDate() + i);
                            const dateStr = formatDateUTC7(date);
                            const dayAvailability = availability.find((d: any) => d.date === dateStr);
                            const isToday = formatDateUTC7(date) === formatDateUTC7(today);
                            const isPast = date < today;
                            
                            days.push(
                              <button
                                key={i}
                                className={`
                                  aspect-square text-xs p-1 rounded border transition-all
                                  ${isPast 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : dayAvailability && dayAvailability.timeSlots?.length > 0
                                      ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer'
                                      : 'bg-white border-gray-200 text-gray-400'
                                  }
                                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                                `}
                                disabled={isPast || !dayAvailability || !dayAvailability.timeSlots?.length}
                                onClick={() => {
                                  if (dayAvailability && dayAvailability.timeSlots?.length > 0) {
                                    // Show time slots for this day
                                    const firstTimeSlot = dayAvailability.timeSlots[0];
                                    handleTimeSlotSelect(student, dayAvailability, firstTimeSlot);
                                  }
                                }}
                                title={
                                  isPast 
                                    ? 'Past date' 
                                    : dayAvailability && dayAvailability.timeSlots?.length > 0
                                      ? `Available (${dayAvailability.timeSlots.length} slots)`
                                      : 'Not available'
                                }
                              >
                                {date.getDate()}
                              </button>
                            );
                          }
                          return days;
                        })()}
                      </div>
                      
                      {/* Available dates summary */}
                      <div className="text-xs text-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                          <span>Available days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-white border-2 border-blue-400 rounded"></div>
                          <span>Today</span>
                        </div>
                      </div>
                      
                      {/* Quick access to upcoming slots */}
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="text-xs font-medium text-gray-700 mb-2">Next Available Times:</div>
                        <div className="space-y-1">
                          {availability.slice(0, 3).map((day: any, dayIndex: number) => (
                            <div key={dayIndex} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {(() => {
                                  // Parse date using UTC+7
                                  const parsedDate = parseDateUTC7(day.date);
                                  return parsedDate.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: 'Asia/Jakarta'
                                  });
                                })()}
                              </span>
                              <div className="flex gap-1">
                                {(day.timeSlots || []).slice(0, 2).map((timeSlot: any, slotIndex: number) => (
                                  <Button
                                    key={slotIndex}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6 px-2 hover:bg-navy-50"
                                    onClick={() => handleTimeSlotSelect(student, day, timeSlot)}
                                  >
                                    {timeSlot.startTime}
                                  </Button>
                                ))}
                                {(!day.timeSlots || day.timeSlots.length === 0) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6 px-2"
                                    onClick={() => handleTimeSlotSelect(student, day, { startTime: '09:00', endTime: '17:00' })}
                                  >
                                    All day
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No specific times set</p>
                      <p className="text-xs">Contact student to arrange schedule</p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    <Phone className="h-3 w-3 inline mr-1" />
                    {student.whatsapp || 'Not provided'}
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              Complete the booking form to reserve your time slot
            </DialogDescription>
          </DialogHeader>

          {selectedTimeSlot && (
            <div className="space-y-4">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Booking Details</h4>
                <div className="text-sm space-y-1">
                  <div>Date: {(() => {
                    // Parse date using UTC+7
                    const parsedDate = parseDateUTC7(selectedTimeSlot.day.date);
                    return parsedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'Asia/Jakarta'
                    });
                  })()}</div>
                  <div>Time: {selectedTimeSlot.timeSlot.startTime} - {selectedTimeSlot.timeSlot.endTime}</div>
                  <div>
                    Duration: {differenceInHours(
                      parseISO(`${selectedTimeSlot.day.date}T${selectedTimeSlot.timeSlot.endTime}:00`),
                      parseISO(`${selectedTimeSlot.day.date}T${selectedTimeSlot.timeSlot.startTime}:00`)
                    )} hours
                  </div>
                  <div className="font-medium text-navy-600">
                    Total: ¥{
                      differenceInHours(
                        parseISO(`${selectedTimeSlot.day.date}T${selectedTimeSlot.timeSlot.endTime}:00`),
                        parseISO(`${selectedTimeSlot.day.date}T${selectedTimeSlot.timeSlot.startTime}:00`)
                      ) * Math.round((selectedStudent?.pricePerDay || 500000) / 8)
                    }
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Your Name *</Label>
                  <Input
                    id="clientName"
                    value={bookingForm.clientName}
                    onChange={(e) => handleFormChange('clientName', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={bookingForm.clientEmail}
                    onChange={(e) => handleFormChange('clientEmail', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="clientPhone">Phone Number *</Label>
                  <Input
                    id="clientPhone"
                    value={bookingForm.clientPhone}
                    onChange={(e) => handleFormChange('clientPhone', e.target.value)}
                    placeholder="+86 xxx xxxx xxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select
                    value={bookingForm.serviceType}
                    onValueChange={(value) => handleFormChange('serviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="translator">Translation Services</SelectItem>
                      <SelectItem value="tour_guide">Tour Guide</SelectItem>
                      <SelectItem value="both">Both Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={bookingForm.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="Meeting location or address"
                  />
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={bookingForm.specialRequests}
                    onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                    placeholder="Any special requirements or notes..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitBooking}
                  disabled={createBookingMutation.isPending}
                  className="flex-1"
                >
                  {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
