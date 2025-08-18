import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  MessageSquare,
  Search
} from "lucide-react";

interface Booking {
  id: string;
  date?: string;
  dateRange?: string[];
  providerId: string;
  providerName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: string;
  message: string;
  pricePerDay: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: any;
  adminNotes?: string;
}

export default function BookingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch all bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update booking status');
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Status Updated",
        description: `Booking ${status} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setShowBookingModal(false);
      setSelectedBooking(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    },
  });

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchQuery || 
      booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceLabel = (service: string) => {
    const labels: { [key: string]: string } = {
      translation: "Translation",
      tour_guide: "Tour Guide",
      business_interpreter: "Business Interpreter",
      document_translation: "Document Translation",
      medical_companion: "Medical Companion"
    };
    return labels[service] || service;
  };

  const formatDate = (date: any) => {
    try {
      if (Array.isArray(date)) {
        const start = date[0];
        const end = date[date.length - 1] || date[0];
        const s = new Date(start);
        const e = new Date(end);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
          return `${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} → ${e.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        }
      }
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (typeof date === 'object' && date._seconds) {
        dateObj = new Date(date._seconds * 1000);
      } else {
        return 'Invalid Date';
      }
      
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return dateObj.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (date: any) => {
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (typeof date === 'object' && date._seconds) {
        dateObj = new Date(date._seconds * 1000);
      } else {
        return 'Invalid Date';
      }
      
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return dateObj.toLocaleString('id-ID');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.adminNotes || "");
    setShowBookingModal(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedBooking) return;
    
    updateStatusMutation.mutate({
      id: selectedBooking.id,
      status,
      adminNotes: adminNotes.trim() || undefined
    });
  };

  // Stats calculations
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by client name, provider name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bookings Found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria." 
                  : "No bookings have been made yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-left p-3 font-medium">Provider</th>
                    <th className="text-left p-3 font-medium">Service</th>
                    <th className="text-left p-3 font-medium">Price</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate((booking as any).dateRange || booking.date)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{booking.clientName}</div>
                          <div className="text-sm text-gray-500">{booking.clientEmail}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{booking.providerName}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{getServiceLabel(booking.serviceType)}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          {(() => {
                            const days = Array.isArray((booking as any).dateRange) && (booking as any).dateRange.length > 0
                              ? (booking as any).dateRange.length
                              : 1;
                            const total = (booking as any).totalPrice ?? (booking.pricePerDay || 0) * days;
                            return `Rp ${Number(total).toLocaleString()}`;
                          })()}
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-500">
                          {formatDateTime(booking.createdAt)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBooking(booking)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
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

      {/* Booking Detail Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              Manage and update booking information
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Booking Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{formatDate((selectedBooking as any).dateRange || selectedBooking.date)}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Service Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{getServiceLabel(selectedBooking.serviceType)}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Price per Day</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Rp {selectedBooking.pricePerDay?.toLocaleString() || 0}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Client Information</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedBooking.clientName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedBooking.clientEmail}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedBooking.clientPhone}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Provider</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedBooking.providerName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedBooking.message && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Client Message</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{selectedBooking.message}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-600">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this booking..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button 
                      onClick={() => handleUpdateStatus('confirmed')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleUpdateStatus('cancelled')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </>
                )}
                
                {selectedBooking.status === 'confirmed' && (
                  <>
                    <Button 
                      onClick={() => handleUpdateStatus('completed')}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Completed
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleUpdateStatus('cancelled')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </>
                )}

                {(selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled') && (
                  <div className="text-sm text-gray-500 p-2">
                    This booking has been {selectedBooking.status}. No further actions available.
                  </div>
                )}

                <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
