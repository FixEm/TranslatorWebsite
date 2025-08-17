import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Clock, 
  CheckCircle, 
  Search,
  Filter,
  Briefcase
} from 'lucide-react';

interface ConfirmedJob {
  id: string;
  date: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: string;
  pricePerDay: number;
  createdAt: string;
  translatorId: string;
  translatorName: string;
  translatorCity: string;
  translatorHskLevel?: string;
  translatorExperience: string;
  translatorServices: string[];
  translatorProfileImage?: string;
  specialRequests?: string;
  location?: string;
}

// Sample data for confirmed jobs
const sampleConfirmedJobs: ConfirmedJob[] = [
  {
    id: '1',
    date: '2025-08-17',
    status: 'confirmed',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.johnson@email.com',
    clientPhone: '+62 812 3456 7890',
    serviceType: 'translation',
    pricePerDay: 800000,
    createdAt: '2025-08-15T10:30:00Z',
    translatorId: 'translator-1',
    translatorName: 'Darren Clay Liem',
    translatorCity: 'Shenzhen',
    translatorHskLevel: 'HSK 6',
    translatorExperience: '3',
    translatorServices: ['translation', 'business_interpreter'],
    translatorProfileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
    specialRequests: 'Need help with business meeting translation',
    location: 'Jakarta Business Center'
  },
  {
    id: '2',
    date: '2025-08-20',
    status: 'confirmed',
    clientName: 'Michael Chen',
    clientEmail: 'michael.chen@company.com',
    clientPhone: '+62 813 9876 5432',
    serviceType: 'tour_guide',
    pricePerDay: 750000,
    createdAt: '2025-08-16T14:15:00Z',
    translatorId: 'translator-2',
    translatorName: 'Li Wei',
    translatorCity: 'Beijing',
    translatorHskLevel: 'HSK 5',
    translatorExperience: '2',
    translatorServices: ['tour_guide', 'translation'],
    translatorProfileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
    specialRequests: 'Tour guide for business delegation visit',
    location: 'Bandung City Tour'
  },
  {
    id: '3',
    date: '2025-08-21',
    status: 'confirmed',
    clientName: 'Emily Rodriguez',
    clientEmail: 'emily.rodriguez@consulting.com',
    clientPhone: '+62 811 2345 6789',
    serviceType: 'business_interpreter',
    pricePerDay: 900000,
    createdAt: '2025-08-17T09:45:00Z',
    translatorId: 'translator-3',
    translatorName: 'Zhang Ming',
    translatorCity: 'Shanghai',
    translatorHskLevel: 'HSK 6',
    translatorExperience: '4',
    translatorServices: ['business_interpreter', 'document_translation'],
    translatorProfileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
    specialRequests: 'Business negotiation support',
    location: 'Surabaya Business District'
  }
];

export default function ConfirmedJobsManagement() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<ConfirmedJob[]>(sampleConfirmedJobs);
  const [filteredJobs, setFilteredJobs] = useState<ConfirmedJob[]>(sampleConfirmedJobs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(job => 
        job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.translatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(job => job.serviceType === serviceTypeFilter);
    }

    // City filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(job => job.translatorCity === cityFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchQuery, statusFilter, serviceTypeFilter, cityFilter]);

  // Get unique cities for filter
  const uniqueCities = Array.from(new Set(jobs.map(job => job.translatorCity)));

  // Get service type label
  const getServiceTypeLabel = (serviceType: string) => {
    const labels: { [key: string]: string } = {
      translation: "Translation",
      tour_guide: "Tour Guide",
      business_interpreter: "Business Interpreter",
      document_translation: "Document Translation",
      medical_companion: "Medical Companion"
    };
    return labels[serviceType] || serviceType;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  // Update job status
  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      // In a real app, this would make an API call
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus as any } : job
      ));

      toast({
        title: "Status Updated",
        description: `Job status updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-800">Confirmed Jobs Management</h2>
          <p className="text-gray-600">Monitor and manage all confirmed translation jobs</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {filteredJobs.length} confirmed job{filteredJobs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="translation">Translation</SelectItem>
                  <SelectItem value="tour_guide">Tour Guide</SelectItem>
                  <SelectItem value="business_interpreter">Business Interpreter</SelectItem>
                  <SelectItem value="document_translation">Document Translation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-navy-800">Client Information</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Name</div>
                        <div className="font-medium">{job.clientName}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{job.clientEmail}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium">{job.clientPhone}</div>
                      </div>
                      
                      {job.location && (
                        <div>
                          <div className="text-sm text-gray-600">Location</div>
                          <div className="font-medium">{job.location}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Translator Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-navy-800">Translator Information</h3>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={job.translatorProfileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"} 
                        alt={job.translatorName} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{job.translatorName}</div>
                        <div className="text-sm text-gray-600">{job.translatorCity}, China</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">HSK Level</div>
                        <div className="font-medium">{job.translatorHskLevel || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Experience</div>
                        <div className="font-medium">{job.translatorExperience} years</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Services</div>
                      <div className="flex flex-wrap gap-1">
                        {job.translatorServices.map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {getServiceTypeLabel(service)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-navy-800">Job Details</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Date</div>
                        <div className="font-medium">{formatDate(job.date)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Service Type</div>
                        <div className="font-medium">{getServiceTypeLabel(job.serviceType)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Price</div>
                        <div className="font-medium text-navy-600">{formatCurrency(job.pricePerDay)}/day</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="mt-1">{getStatusBadge(job.status)}</div>
                      </div>
                      
                      {job.specialRequests && (
                        <div>
                          <div className="text-sm text-gray-600">Special Requests</div>
                          <div className="text-sm bg-gray-50 p-2 rounded">{job.specialRequests}</div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      {job.status === 'confirmed' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateJobStatus(job.id, 'completed')}
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateJobStatus(job.id, 'cancelled')}
                            className="w-full"
                          >
                            Cancel Job
                          </Button>
                        </>
                      )}
                      
                      {job.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-800 w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Job Completed
                        </Badge>
                      )}
                      
                      {job.status === 'cancelled' && (
                        <Badge variant="destructive" className="w-fit">
                          Job Cancelled
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Jobs Found</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' || serviceTypeFilter !== 'all' || cityFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'No confirmed jobs available at the moment.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

