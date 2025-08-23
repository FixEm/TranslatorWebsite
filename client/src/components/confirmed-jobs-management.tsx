import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "../hooks/use-toast";
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
  Briefcase,
  Loader2,
} from "lucide-react";

interface ConfirmedJob {
  id: string;
  date?: string;
  dateRange?: string[];
  status: "pending" | "confirmed" | "cancelled" | "completed";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: string;
  pricePerDay: number;
  totalPrice?: number;
  createdAt: any;
  providerId: string;
  providerName: string;
  message: string;
  // Enriched translator data
  translatorName?: string;
  translatorCity?: string;
  translatorHskLevel?: string;
  translatorExperience?: string;
  translatorServices?: string[];
  translatorProfileImage?: string;
  specialRequests?: string;
  location?: string;
}

export default function ConfirmedJobsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  // Fetch all bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<
    ConfirmedJob[]
  >({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  // Fetch all applications to get translator information
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications");
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update booking status");
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Status Updated",
        description: `Booking status updated to ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Enrich bookings with translator information
  const enrichedBookings: ConfirmedJob[] = bookings.map((booking) => {
    // Find the translator application using providerId
    const translatorApp = applications.find(
      (app) => app.id === booking.providerId
    );

    return {
      ...booking,
      translatorName: translatorApp?.name || booking.providerName || "Unknown",
      translatorCity: translatorApp?.city || "Not specified",
      translatorHskLevel: translatorApp?.hskLevel || "Not specified",
      translatorExperience: translatorApp?.experience || "Not specified",
      translatorServices:
        translatorApp?.services || translatorApp?.specializations || [],
      translatorProfileImage: translatorApp?.profileImage || null,
      specialRequests: booking.message || "No special requests",
      location: translatorApp?.city || "Not specified",
    };
  });

  // Show all bookings by default (not just confirmed ones)
  const allBookings = enrichedBookings;

  // Filter jobs based on search and filters
  const filteredJobs = allBookings.filter((job: ConfirmedJob) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (
        !(
          job.clientName.toLowerCase().includes(searchLower) ||
          job.translatorName?.toLowerCase().includes(searchLower) ||
          job.clientEmail.toLowerCase().includes(searchLower) ||
          job.location?.toLowerCase().includes(searchLower)
        )
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }

    // Service type filter
    if (serviceTypeFilter !== "all" && job.serviceType !== serviceTypeFilter) {
      return false;
    }

    // City filter
    if (cityFilter !== "all" && job.translatorCity !== cityFilter) {
      return false;
    }

    return true;
  });

  // Get unique cities for filter
  const uniqueCities = Array.from(
    new Set(
      allBookings.map((job: ConfirmedJob) => job.translatorCity).filter(Boolean)
    )
  );

  // Get service type label
  const getServiceTypeLabel = (serviceType: string) => {
    const labels: { [key: string]: string } = {
      translation: "Translation",
      tour_guide: "Tour Guide",
      business_interpreter: "Business Interpreter",
      document_translation: "Document Translation",
      medical_companion: "Medical Companion",
    };
    return labels[serviceType] || serviceType;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jakarta",
    });
  };

  // Update job status
  const updateJobStatus = async (jobId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: jobId, status: newStatus });
  };

  if (bookingsLoading || applicationsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Total: {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Search
              </label>
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Service Type
              </label>
              <Select
                value={serviceTypeFilter}
                onValueChange={setServiceTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="translation">Translation</SelectItem>
                  <SelectItem value="tour_guide">Tour Guide</SelectItem>
                  <SelectItem value="business_interpreter">
                    Business Interpreter
                  </SelectItem>
                  <SelectItem value="document_translation">
                    Document Translation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                City
              </label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities
                    .filter(
                      (city): city is string =>
                        typeof city === "string" && city.length > 0
                    )
                    .map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
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
                      <h3 className="text-lg font-semibold text-navy-800">
                        Client Information
                      </h3>
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
                      <h3 className="text-lg font-semibold text-navy-800">
                        Translator Information
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{job.translatorName}</div>
                        <div className="text-sm text-gray-600">
                          {job.translatorCity}, China
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to translator profile in admin panel
                          // This will be handled by the parent component
                          if (typeof window !== "undefined") {
                            // Store the translator ID in sessionStorage for the admin panel to pick up
                            sessionStorage.setItem(
                              "viewTranslatorProfile",
                              job.providerId
                            );
                            // Trigger a custom event to notify the admin panel
                            window.dispatchEvent(
                              new CustomEvent("viewTranslatorProfile", {
                                detail: { translatorId: job.providerId },
                              })
                            );
                          }
                        }}
                        className="text-xs"
                      >
                        <User className="h-3 w-3 mr-1" />
                        View Profile
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">HSK Level</div>
                        <div className="font-medium">
                          {job.translatorHskLevel || "Not specified"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Experience</div>
                        <div className="font-medium">
                          {job.translatorExperience} years
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Services</div>
                      <div className="flex flex-wrap gap-1">
                        {job.translatorServices &&
                        job.translatorServices.length > 0 ? (
                          job.translatorServices.map(
                            (service: string, index: number) => (
                              <Badge
                                key={`${job.id}-service-${index}`}
                                variant="secondary"
                                className="text-xs"
                              >
                                {getServiceTypeLabel(service)}
                              </Badge>
                            )
                          )
                        ) : (
                          <span className="text-sm text-gray-500">
                            No services specified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-navy-800">
                        Job Details
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Date</div>
                        <div className="font-medium">
                          {job.date
                            ? formatDate(job.date)
                            : job.dateRange
                            ? `${formatDate(job.dateRange[0])} - ${formatDate(
                                job.dateRange[job.dateRange.length - 1]
                              )}`
                            : "Date not specified"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">
                          Service Type
                        </div>
                        <div className="font-medium">
                          {getServiceTypeLabel(job.serviceType)}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Price</div>
                        <div className="font-medium text-navy-600">
                          {formatCurrency(job.pricePerDay)}/day
                        </div>
                        {job.totalPrice &&
                          job.totalPrice !== job.pricePerDay && (
                            <div className="text-sm text-gray-500">
                              Total: {formatCurrency(job.totalPrice)}
                            </div>
                          )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="mt-1">{getStatusBadge(job.status)}</div>
                      </div>

                      {job.specialRequests && (
                        <div>
                          <div className="text-sm text-gray-600">
                            Special Requests
                          </div>
                          <div className="text-sm bg-gray-50 p-2 rounded">
                            {job.specialRequests}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      {job.status === "confirmed" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateJobStatus(job.id, "completed")}
                            className="w-full"
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {updateStatusMutation.isPending
                              ? "Updating..."
                              : "Mark as Completed"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateJobStatus(job.id, "cancelled")}
                            className="w-full"
                            disabled={updateStatusMutation.isPending}
                          >
                            Cancel Job
                          </Button>
                        </>
                      )}

                      {job.status === "completed" && (
                        <Badge className="bg-green-100 text-green-800 w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Job Completed
                        </Badge>
                      )}

                      {job.status === "cancelled" && (
                        <Badge variant="destructive" className="w-fit">
                          Job Cancelled
                        </Badge>
                      )}

                      {job.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateJobStatus(job.id, "confirmed")}
                            className="w-full"
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {updateStatusMutation.isPending
                              ? "Updating..."
                              : "Confirm Job"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateJobStatus(job.id, "cancelled")}
                            className="w-full"
                            disabled={updateStatusMutation.isPending}
                          >
                            Reject Job
                          </Button>
                        </>
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
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Jobs Found
          </h3>
          <p className="text-gray-500">
            {searchQuery ||
            statusFilter !== "all" ||
            serviceTypeFilter !== "all" ||
            cityFilter !== "all"
              ? "Try adjusting your filters or search terms."
              : "No jobs available at the moment."}
          </p>
        </div>
      )}
    </div>
  );
}
