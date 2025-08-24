import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { useToast } from "../hooks/use-toast";
import BookingCalendarView from "./booking-calendar-view";
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
import { chatAPI } from "../lib/firebase-client";

interface Booking {
  id: string;
  date?: string; // single-day
  dateRange?: string[]; // multi-day support
  clientUserId?: string; // User ID of the client who made the booking
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

interface StudentBookingsManagementProps {
  userId: string;
  providerName: string;
}

// Helper function to parse date string safely without timezone issues
const parseDateUTC7 = (dateStr?: string) => {
  if (!dateStr || typeof dateStr !== "string") return new Date("Invalid");
  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date("Invalid");
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return new Date("Invalid");
  // Create date at noon to avoid timezone shift issues
  return new Date(year, month - 1, day, 12, 0, 0);
};

export default function StudentBookingsManagement({
  userId,
  providerName,
}: StudentBookingsManagementProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const normalizePhone = (phone: string) =>
    (phone || "").replace(/[^0-9]/g, "");

  // Start chat with client
  const startChat = async (booking: Booking) => {
    try {
      // Check if conversation already exists
      const clientUserId = booking.clientUserId || booking.clientEmail; // Fallback to email for old bookings
      const existingConversation = await chatAPI.findExistingConversation([
        clientUserId,
        userId,
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
          clientUserId,
          userId
        );
        toast({
          title: "Chat Started",
          description: "Opening new conversation...",
        });
      }

      // Navigate to chat tab in the current dashboard
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "chat");
      url.searchParams.set("conversation", conversation.id);
      window.history.pushState({}, "", url.toString());

      // Trigger a custom event to notify the dashboard to switch tabs
      window.dispatchEvent(
        new CustomEvent("navigate-to-chat", {
          detail: { conversationId: conversation.id },
        })
      );
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openChat = (b: Booking) => {
    const digits = normalizePhone(b.clientPhone || "");
    const when = (() => {
      if (Array.isArray((b as any).dateRange) && (b as any).dateRange.length) {
        return `${(b as any).dateRange[0]} → ${
          (b as any).dateRange[(b as any).dateRange.length - 1]
        }`;
      }
      return b.date || "";
    })();
    const text = encodeURIComponent(
      `Halo ${b.clientName}, saya ${providerName}. Terkait booking Anda pada ${when}.`
    );
    if (digits) {
      window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
    } else if (b.clientEmail) {
      window.location.href = `mailto:${b.clientEmail}?subject=Booking&body=${text}`;
    }
  };

  // Fetch bookings for this student
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        // List: pending only
        const [pendingRes, allRes] = await Promise.all([
          fetch(`/api/bookings?status=pending&providerId=${userId}`),
          fetch(`/api/bookings?providerId=${userId}`),
        ]);
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setBookings(pendingData);
        } else {
          console.error("Failed to fetch bookings");
        }
        // Calendar: show both pending and confirmed
        if (allRes.ok) {
          const allData = await allRes.json();
          setCalendarBookings(allData);
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

  // Update booking status
  const updateBookingStatus = async (
    bookingId: string,
    status: string,
    notes?: string
  ) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes: notes,
        }),
      });

      if (response.ok) {
        const updatedBooking = await response.json();

        // Update local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId ? updatedBooking : booking
          )
        );

        toast({
          title: "Status Updated",
          description: `Booking ${
            status === "confirmed"
              ? "confirmed"
              : status === "cancelled"
              ? "cancelled"
              : "updated"
          } successfully.`,
        });

        setShowDetailsDialog(false);
        setResponseMessage("");
      } else {
        throw new Error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-navy-800">Kelola Booking</h2>
          <p className="text-gray-600">
            Lihat dan kelola permintaan booking dari klien
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Overview
          </h3>
          <BookingCalendarView bookings={calendarBookings} userId={userId} />
        </CardContent>
      </Card>

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
                                    timeZone: "Asia/Jakarta",
                                  }
                                );
                                const endStr = end.toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  timeZone: "Asia/Jakarta",
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
                                  timeZone: "Asia/Jakarta",
                                });
                          })()}
                        </h3>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{booking.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{booking.clientPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{booking.clientEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MessageSquare className="h-4 w-4" />
                        <span>{getServiceTypeLabel(booking.serviceType)}</span>
                      </div>
                    </div>

                    {booking.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Pesan dari klien:
                        </h4>
                        <p className="text-sm text-gray-600">
                          {booking.message}
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
                        {(() => {
                          try {
                            // Parse the createdAt timestamp properly (Date | string | Firestore Timestamp)
                            let createdAt: Date;
                            if (
                              booking.createdAt &&
                              typeof booking.createdAt === "object" &&
                              (booking.createdAt as any)._seconds
                            ) {
                              createdAt = new Date(
                                (booking.createdAt as any)._seconds * 1000
                              );
                            } else {
                              createdAt = new Date(booking.createdAt);
                            }

                            // Check if it's a valid date
                            if (isNaN(createdAt.getTime())) {
                              // If it's not a valid date, try to parse it as a string
                              const dateStr = String(booking.createdAt);
                              if (
                                dateStr.includes("T") ||
                                dateStr.includes("-")
                              ) {
                                const parsedDate = new Date(dateStr);
                                if (!isNaN(parsedDate.getTime())) {
                                  return parsedDate.toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone: "Asia/Jakarta",
                                    }
                                  );
                                }
                              }
                              return "Tanggal tidak valid";
                            }

                            // Format the valid date in UTC+7
                            return createdAt.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            });
                          } catch (error) {
                            console.error("Error parsing createdAt:", error);
                            return "Error format tanggal";
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startChat(booking)}
                      className="hover:bg-red-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openChat(booking)}
                      className="hover:bg-red-700"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>

                    {booking.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateBookingStatus(booking.id, "confirmed")
                          }
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Konfirmasi
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            updateBookingStatus(booking.id, "cancelled")
                          }
                          disabled={isUpdating}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Tolak
                        </Button>
                      </>
                    )}

                    {booking.status === "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateBookingStatus(booking.id, "completed")
                        }
                        disabled={isUpdating}
                      >
                        Tandai Selesai
                      </Button>
                    )}
                  </div>
                </div>

                {booking.adminNotes && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Catatan:
                    </h4>
                    <p className="text-sm text-blue-700">
                      {booking.adminNotes}
                    </p>
                  </div>
                )}
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
            Booking dari klien akan muncul di sini setelah mereka memilih
            tanggal yang tersedia.
          </p>
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detail Booking
            </DialogTitle>
            <DialogDescription>
              Kelola permintaan booking dari {selectedBooking?.clientName}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Tanggal
                  </label>
                  <p className="font-medium">
                    {(() => {
                      // Parse date string properly using UTC+7
                      const parsedDate = parseDateUTC7(selectedBooking.date);
                      return parsedDate.toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "Asia/Jakarta",
                      });
                    })()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Layanan
                  </label>
                  <p className="font-medium">
                    {getServiceTypeLabel(selectedBooking.serviceType)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Harga
                  </label>
                  <p className="font-medium text-navy-600">
                    {formatCurrency(selectedBooking.pricePerDay)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Informasi Klien</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Nama:</span>{" "}
                    {selectedBooking.clientName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedBooking.clientEmail}
                  </p>
                  <p>
                    <span className="font-medium">WhatsApp:</span>{" "}
                    {selectedBooking.clientPhone}
                  </p>
                </div>
              </div>

              {/* Client Message */}
              {selectedBooking.message && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">
                    Pesan dari Klien
                  </h4>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedBooking.message}
                  </div>
                </div>
              )}

              {/* Response Message for Actions */}
              {selectedBooking.status === "pending" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Pesan Respon (Opsional)
                  </label>
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Tambahkan pesan untuk klien..."
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedBooking.status === "pending" && (
                  <>
                    <Button
                      onClick={() =>
                        updateBookingStatus(
                          selectedBooking.id,
                          "confirmed",
                          responseMessage
                        )
                      }
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Konfirmasi Booking
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        updateBookingStatus(
                          selectedBooking.id,
                          "cancelled",
                          responseMessage
                        )
                      }
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Tolak Booking
                    </Button>
                  </>
                )}

                {selectedBooking.status === "confirmed" && (
                  <Button
                    onClick={() =>
                      updateBookingStatus(
                        selectedBooking.id,
                        "completed",
                        responseMessage
                      )
                    }
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Tandai Selesai
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                  disabled={isUpdating}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
