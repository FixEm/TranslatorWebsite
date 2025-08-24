import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { chatAPI } from "../lib/firebase-client";
import {
  Calendar,
  User,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Booking {
  id: string;
  date?: string;
  dateRange?: string[];
  clientUserId?: string;
  providerId: string;
  providerName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  message: string;
  serviceType: string;
  pricePerDay: number;
  totalPrice?: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: any;
  adminNotes?: string;
}

interface ClientBookingsManagementProps {
  userId: string;
  onNavigateToChat?: (conversationId: string) => void;
}

// Helper function to parse date string safely without timezone issues
const parseDateUTC7 = (dateStr?: string) => {
  if (!dateStr || typeof dateStr !== "string") return new Date("Invalid");
  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date("Invalid");
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return new Date("Invalid");
  return new Date(year, month - 1, day, 12, 0, 0);
};

export default function ClientBookingsManagement({
  userId,
  onNavigateToChat,
}: ClientBookingsManagementProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Start chat with provider
  const startChat = async (booking: Booking) => {
    try {
      // Check if conversation already exists
      const existingConversation = await chatAPI.findExistingConversation([
        userId, // Current client user ID
        booking.providerId, // Provider user ID
      ]);

      let conversation;
      if (existingConversation) {
        conversation = existingConversation;
        toast({
          title: "Chat Found",
          description: "Opening existing conversation...",
        });
      } else {
        // Create or get existing conversation using actual user IDs
        conversation = await chatAPI.createConversationFromBooking(
          booking.id,
          userId, // Current client user ID
          booking.providerId // Provider user ID
        );
        toast({
          title: "Chat Started",
          description: "Opening new conversation...",
        });
      }

      // Navigate to chat if callback provided
      if (onNavigateToChat) {
        onNavigateToChat(conversation.id);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch bookings for this client
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/bookings?clientUserId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          console.error("Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Menunggu Konfirmasi
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800">Dikonfirmasi</Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Selesai</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: { [key: string]: string } = {
      translation: "Terjemahan",
      tour_guide: "Tour Guide",
      business_interpreter: "Interpretasi Bisnis",
      document_translation: "Terjemahan Dokumen",
      medical_companion: "Pendamping Medis",
    };
    return labels[serviceType] || serviceType;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-800">Booking Saya</h2>
          <p className="text-gray-600">Kelola dan pantau status booking Anda</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(booking.status)}
                        <h3 className="text-lg font-semibold text-navy-800">
                          {(() => {
                            if (
                              booking.dateRange &&
                              Array.isArray(booking.dateRange) &&
                              booking.dateRange.length > 0
                            ) {
                              const start = parseDateUTC7(booking.dateRange[0]);
                              const end = parseDateUTC7(
                                booking.dateRange[booking.dateRange.length - 1]
                              );
                              if (
                                !isNaN(start.getTime()) &&
                                !isNaN(end.getTime())
                              ) {
                                const startStr = start.toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                );
                                const endStr = end.toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                });
                                return `${startStr} → ${endStr}`;
                              }
                            }
                            const parsedDate = parseDateUTC7(booking.date);
                            return isNaN(parsedDate.getTime())
                              ? "Tanggal tidak valid"
                              : parsedDate.toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                });
                          })()}
                        </h3>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{booking.providerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MessageSquare className="h-4 w-4" />
                        <span>{getServiceTypeLabel(booking.serviceType)}</span>
                      </div>
                    </div>

                    {booking.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Pesan Anda:
                        </h4>
                        <p className="text-sm text-gray-600">
                          {booking.message}
                        </p>
                      </div>
                    )}

                    {booking.adminNotes && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                          Catatan dari Translator:
                        </h4>
                        <p className="text-sm text-blue-700">
                          {booking.adminNotes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-navy-600">
                        {(() => {
                          const days =
                            Array.isArray(booking.dateRange) &&
                            booking.dateRange.length > 0
                              ? booking.dateRange.length
                              : 1;
                          const total =
                            typeof booking.totalPrice === "number"
                              ? booking.totalPrice
                              : (booking.pricePerDay || 0) * days;
                          return `${formatCurrency(total)}${
                            days > 1 ? ` (${days} hari)` : ""
                          }`;
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Dipesan:{" "}
                        {new Date(booking.createdAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {booking.status === "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startChat(booking)}
                        className="hover:bg-red-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Belum Ada Booking
          </h3>
          <p className="text-gray-500">
            Cari translator dan buat booking pertama Anda.
          </p>
        </div>
      )}
    </div>
  );
}
