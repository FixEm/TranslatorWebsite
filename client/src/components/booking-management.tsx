import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  FileText,
  MessageSquare,
  Eye,
  Filter
} from "lucide-react";

export default function BookingManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    }
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          adminNotes,
          confirmedBy: 'admin' // You can make this dynamic based on logged-in admin
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update booking status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setIsDetailModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    }
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      const response = await fetch(`/api/bookings/${id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Updated",
        description: "Payment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings?.filter((booking: any) => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSearch = !searchQuery || 
      booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.translatorId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const bookingStats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b: any) => b.status === 'pending').length || 0,
    confirmed: bookings?.filter((b: any) => b.status === 'confirmed').length || 0,
    completed: bookings?.filter((b: any) => b.status === 'completed').length || 0,
    totalRevenue: bookings?.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0) || 0
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleStatusUpdate = (status: string, adminNotes?: string) => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        id: selectedBooking.id,
        status,
        adminNotes
      });
    }
  };

  const handlePaymentUpdate = (paymentStatus: string) => {
    if (selectedBooking) {
      updatePaymentStatusMutation.mutate({
        id: selectedBooking.id,
        paymentStatus
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-800">Booking Management</h1>
          <p className="text-gray-600">Manage client bookings and appointments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-navy-800">{bookingStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-navy-800">{bookingStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-navy-800">{bookingStats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-navy-800">{bookingStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-navy-800">Rp {bookingStats.totalRevenue.toLocaleString()}</p>
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
              <Input
                placeholder="Search by client name, email, or translator ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
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

      {/* Bookings List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bookings Found</h3>
              <p className="text-gray-500">No bookings match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking: any) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                        <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        #{booking.id.slice(-6)}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-navy-800 mb-2">Client Information</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-gray-500" />
                            <span>{booking.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span>{booking.clientEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span>{booking.clientPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-navy-800 mb-2">Appointment Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span>{format(parseISO(booking.bookingDate), 'EEEE, MMM d, yyyy', { locale: localeId })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span>{booking.startTime} - {booking.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span>{booking.location || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-navy-800 mb-2">Service & Payment</h4>
                        <div className="space-y-1 text-sm">
                          <div>Service: {booking.serviceType.replace('_', ' ').toUpperCase()}</div>
                          <div>Duration: {booking.totalHours} hours</div>
                          <div className="font-semibold text-navy-600">
                            Total: Rp {booking.totalAmount?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {booking.specialRequests && (
                      <div>
                        <h4 className="font-semibold text-navy-800 mb-1">Special Requests</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {booking.specialRequests}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {booking.adminNotes && (
                      <div>
                        <h4 className="font-semibold text-navy-800 mb-1">Admin Notes</h4>
                        <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                          {booking.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Booking Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details - #{selectedBooking?.id?.slice(-6)}</DialogTitle>
            <DialogDescription>
              Manage booking status and payment information
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <div className="mt-1">
                    <Badge className={getPaymentStatusColor(selectedBooking.paymentStatus)}>
                      {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-4">
                <Label>Update Booking Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedBooking.status === 'confirmed' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate('confirmed')}
                    disabled={updateBookingStatusMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    variant={selectedBooking.status === 'cancelled' ? 'destructive' : 'outline'}
                    onClick={() => handleStatusUpdate('cancelled', 'Cancelled by admin')}
                    disabled={updateBookingStatusMutation.isPending}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
                {selectedBooking.status === 'confirmed' && (
                  <Button
                    variant={selectedBooking.status === 'completed' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updateBookingStatusMutation.isPending}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
              </div>

              {/* Payment Status Update */}
              <div className="space-y-4">
                <Label>Update Payment Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedBooking.paymentStatus === 'paid' ? 'default' : 'outline'}
                    onClick={() => handlePaymentUpdate('paid')}
                    disabled={updatePaymentStatusMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                  <Button
                    variant={selectedBooking.paymentStatus === 'refunded' ? 'destructive' : 'outline'}
                    onClick={() => handlePaymentUpdate('refunded')}
                    disabled={updatePaymentStatusMutation.isPending}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                </div>
              </div>

              {/* Booking Information Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Booking Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Client: {selectedBooking.clientName}</div>
                  <div>Translator ID: {selectedBooking.translatorId}</div>
                  <div>Date: {format(parseISO(selectedBooking.bookingDate), 'MMM d, yyyy')}</div>
                  <div>Time: {selectedBooking.startTime} - {selectedBooking.endTime}</div>
                  <div>Service: {selectedBooking.serviceType}</div>
                  <div>Total: Rp {selectedBooking.totalAmount?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
