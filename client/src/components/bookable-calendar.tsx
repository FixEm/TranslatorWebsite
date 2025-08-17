import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Calendar, Clock, User, DollarSign, CheckCircle } from 'lucide-react';

interface AvailableDate {
  date: string;
  isAvailable: boolean;
}

interface AvailabilityData {
  isAvailable: boolean;
  schedule: AvailableDate[];
  recurringPatterns?: any[];
  unavailablePeriods?: any[];
  lastUpdated: Date;
}

interface BookableCalendarProps {
  userId: string;
  providerName: string;
  initialAvailability?: AvailabilityData;
  pricePerDay: string;
}

interface BookingData {
  date: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  message: string;
  serviceType: string;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

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

export default function BookableCalendar({ 
  userId, 
  providerName,
  initialAvailability, 
  pricePerDay 
}: BookableCalendarProps) {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<AvailabilityData>({
    isAvailable: true,
    schedule: [],
    recurringPatterns: [],
    unavailablePeriods: [],
    lastUpdated: new Date()
  });

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const today = getCurrentDateUTC7();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [multiDayMode, setMultiDayMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingData>({
    date: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    message: '',
    serviceType: 'translation'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize availability from props
  useEffect(() => {
    if (initialAvailability) {
      console.log('BookableCalendar: Received initialAvailability:', initialAvailability);
      setAvailability(initialAvailability);
    }
  }, [initialAvailability]);

  // Generate calendar dates for the month
  const getMonthDates = (monthStart: Date) => {
    const dates = [];
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    
    // Get first day of month and its day of week
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday of the first week

    // Generate 6 weeks (42 days) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)); // Add days properly
      dates.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === getCurrentDateUTC7().toDateString()
      });
    }
    
    return dates;
  };

  // Generate dates for current month only
  const currentMonth = selectedMonth;
  const currentMonthDates = getMonthDates(currentMonth);

  // Check if date is available
  const isDateAvailable = (date: string) => {
    console.log('Checking availability for date:', date);
    console.log('Available dates:', availability.schedule);
    
    // Try to find the date in the schedule
    let availableDate = availability.schedule.find(d => d.date === date);
    
    // If not found, try to find by parsing the date differently
    if (!availableDate) {
      availableDate = availability.schedule.find(d => {
        const scheduleDate = new Date(d.date);
        const checkDate = new Date(date);
        return scheduleDate.toDateString() === checkDate.toDateString();
      });
    }
    
    const isAvailable = availableDate?.isAvailable || false;
    console.log('Date available:', isAvailable, 'Found date:', availableDate);
    return isAvailable;
  };

  // Check if date is booked
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  const isWithinRange = (dateStr: string) => {
    if (!multiDayMode || !rangeStart || !rangeEnd) return false;
    const d = new Date(dateStr);
    const s = new Date(rangeStart);
    const e = new Date(rangeEnd);
    return d >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
           d <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
  };

  const enumerateDates = (startStr: string, endStr: string): string[] => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const out: string[] = [];
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return out;
    for (
      let d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      d <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
      d.setDate(d.getDate() + 1)
    ) {
      out.push(formatDateUTC7(d));
    }
    return out;
  };
  
  // Fetch booked dates for this provider (uses provider calendar cache)
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const calRes = await fetch(`/api/provider-calendars/${userId}`);
        if (calRes.ok) {
          const calendar = await calRes.json();
          const unavailable = Array.isArray(calendar?.unavailableDates) ? calendar.unavailableDates : [];
          setBookedDates(unavailable);
          console.log('Fetched unavailable dates (cache):', unavailable);
          return;
        }
      } catch (err) {
        console.warn('Provider calendar fetch failed, falling back to bookings endpoint');
      }
      // Fallback: query bookings and derive booked dates
      try {
        const response = await fetch(`/api/bookings/provider/${userId}`);
        if (response.ok) {
          const bookings = await response.json();
          const dates: string[] = [];
          bookings.forEach((b: any) => {
            if (Array.isArray(b.dateRange)) {
              b.dateRange.forEach((d: string) => dates.push(d));
            } else if (b.date) {
              dates.push(b.date);
            }
          });
          const unique = Array.from(new Set(dates));
          setBookedDates(unique);
          console.log('Fetched booked dates (fallback):', unique);
        }
      } catch (error) {
        console.error('Error fetching booked dates:', error);
      }
    };

    fetchBookedDates();
  }, [userId]);

  const isDateBooked = (date: string) => {
    return bookedDates.includes(date);
  };

  // Handle date click for booking
  const handleDateClick = (dateStr: string) => {
    if (!isDateAvailable(dateStr) || isDateBooked(dateStr)) {
      return;
    }
    if (!multiDayMode) {
      setSelectedDate(dateStr);
      setBookingData(prev => ({ ...prev, date: dateStr }));
      setShowBookingDialog(true);
      return;
    }
    // Multi-day selection logic (range)
    if (!rangeStart || (rangeStart && rangeEnd)) {
      // Start a new range
      setRangeStart(dateStr);
      setRangeEnd('');
      setSelectedDate(dateStr);
      return;
    }
    // We have a start but no end yet
    const start = new Date(rangeStart);
    const end = new Date(dateStr);
    if (end < start) {
      // If clicked before start, reset start
      setRangeStart(dateStr);
      setRangeEnd('');
      setSelectedDate(dateStr);
      return;
    }
    // Validate that all dates in the range are selectable
    const days = enumerateDates(rangeStart, dateStr);
    const hasBlocked = days.some(d => !isDateAvailable(d) || isDateBooked(d));
    if (hasBlocked) {
      // Keep start, ignore invalid end
      return;
    }
    setRangeEnd(dateStr);
    setSelectedDate(rangeStart + ' → ' + dateStr);
    setShowBookingDialog(true);
  };

  // Submit booking
  const handleBookingSubmit = async () => {
    if (!bookingData.clientName || !bookingData.clientEmail || !bookingData.clientPhone) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap isi semua field yang wajib diisi.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          providerId: userId,
          providerName,
          pricePerDay: parseInt(pricePerDay),
          status: 'pending',
          ...(multiDayMode && rangeStart && rangeEnd
            ? { dateRange: [rangeStart, rangeEnd] }
            : { date: bookingData.date })
        }),
      });

      if (response.ok) {
        const booking = await response.json();
        
        // Update booked dates locally (or refresh cache)
        if (multiDayMode && rangeStart && rangeEnd) {
          const days = enumerateDates(rangeStart, rangeEnd);
          setBookedDates(prev => Array.from(new Set([...prev, ...days])));
        } else if (bookingData.date) {
          setBookedDates(prev => [...prev, bookingData.date]);
        }
        
        toast({
          title: "Booking Berhasil!",
          description: multiDayMode ? "Permintaan booking multi-hari telah terkirim." : "Permintaan booking Anda telah terkirim.",
        });

        // Reset form and close dialog
        setBookingData({
          date: '',
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          message: '',
          serviceType: 'translation'
        });
        setShowBookingDialog(false);
        setSelectedDate('');
        setRangeStart('');
        setRangeEnd('');
      } else if (response.status === 409) {
        toast({
          title: "Tanggal tidak tersedia",
          description: "Tanggal yang dipilih baru saja dibooking. Silakan pilih tanggal lain.",
          variant: "destructive"
        });
        // Refresh booked dates from cache
        try {
          const calRes = await fetch(`/api/provider-calendars/${userId}`);
          if (calRes.ok) {
            const calendar = await calRes.json();
            const unavailable = Array.isArray(calendar?.unavailableDates) ? calendar.unavailableDates : [];
            setBookedDates(unavailable);
          }
        } catch {}
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Gagal",
        description: "Terjadi kesalahan saat membuat booking. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToThisMonth = () => {
    const today = getCurrentDateUTC7();
    setSelectedMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            ← Bulan Lalu
          </Button>
          <Button variant="outline" size="sm" onClick={goToThisMonth}>
            Bulan Ini
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            Bulan Depan →
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Booking Multi-hari</span>
          <Switch checked={multiDayMode} onCheckedChange={setMultiDayMode} />
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {currentMonth.toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'long',
          timeZone: 'Asia/Jakarta'
        })}
      </p>

      {/* Calendar Grid */}
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">
          {currentMonth.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long',
            timeZone: 'Asia/Jakarta'
          })}
        </h3>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {/* Header - Days of week */}
          {dayNames.map((day) => (
            <div key={day} className="font-semibold p-2 text-center text-gray-600">
              {day.slice(0, 3)}
            </div>
          ))}

          {/* Calendar Dates */}
          {currentMonthDates.map(({ date, isCurrentMonth, isToday }, index) => {
            const dateStr = formatDateUTC7(date);
            const isAvailable = isDateAvailable(dateStr);
            const isBooked = isDateBooked(dateStr);
            const inRange = isWithinRange(dateStr);
            const isRangeStart = multiDayMode && rangeStart && dateStr === rangeStart;
            const isRangeEnd = multiDayMode && rangeEnd && dateStr === rangeEnd;
            const isPast = date < new Date(getCurrentDateUTC7().setHours(0, 0, 0, 0));
            
            return (
              <button
                key={index}
                className={`
                  p-3 border rounded-lg transition-all duration-200 min-h-[48px] flex items-center justify-center
                  ${!isCurrentMonth 
                    ? 'text-gray-300 bg-gray-50 cursor-default' 
                    : isPast
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : isBooked
                        ? 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed'
                        : inRange || isRangeStart || isRangeEnd
                          ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 cursor-pointer'
                          : isAvailable 
                            ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer' 
                            : 'bg-white border-gray-200 text-gray-400 cursor-not-allowed'
                  }
                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                `}
                onClick={() => 
                  isCurrentMonth && !isPast && (isAvailable || (multiDayMode && !isBooked)) && !isBooked && handleDateClick(dateStr)
                }
                disabled={!isCurrentMonth || isPast || isBooked || (!isAvailable && !multiDayMode)}
                title={
                  isBooked 
                    ? 'Sudah dibooking' 
                    : multiDayMode
                      ? (isAvailable ? 'Klik untuk memilih rentang tanggal' : 'Tidak tersedia')
                      : (isAvailable ? 'Tersedia - Klik untuk booking' : 'Tidak tersedia')
                }
              >
                <div className="text-center">
                  <div className={`${isToday ? 'font-bold' : ''}`}>
                    {date.getDate()}
                  </div>
                  {isAvailable && !isBooked && !inRange && !isRangeStart && !isRangeEnd && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                  )}
                  {isBooked && (
                    <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>
                  )}
                  {(inRange || isRangeStart || isRangeEnd) && !isBooked && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        </div>
   

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-sm text-gray-600">Sudah dibooking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded"></div>
          <span className="text-sm text-gray-600">Hari ini</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
          <span className="text-sm text-gray-600">Masa lalu / Tidak tersedia</span>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {multiDayMode ? `Book ${providerName} (Multi-hari)` : `Book ${providerName}`}
            </DialogTitle>
            <DialogDescription>
              {multiDayMode ? (
                <>
                  Pilih rentang tanggal: {rangeStart} → {rangeEnd} ({(() => {
                    const days = rangeStart && rangeEnd ? enumerateDates(rangeStart, rangeEnd).length : 0;
                    return `${days} hari`;
                  })()})
                </>
              ) : (
                <>Isi form di bawah untuk booking tanggal {selectedDate && (() => {
                  const parsedDate = parseDateUTC7(selectedDate);
                  return parsedDate.toLocaleDateString('id-ID', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Asia/Jakarta'
                  });
                })()}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Price Display */}
            <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{multiDayMode && rangeStart && rangeEnd ? 'Total Harga:' : 'Harga per hari:'}</span>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {multiDayMode && rangeStart && rangeEnd ? (
                  (() => {
                    const days = enumerateDates(rangeStart, rangeEnd).length || 1;
                    const total = (parseInt(pricePerDay) || 0) * days;
                    return `Rp ${total.toLocaleString()} (${days} hari)`;
                  })()
                ) : (
                  `Rp ${parseInt(pricePerDay).toLocaleString()}`
                )}
              </span>
            </div>

            {/* Client Information */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="clientName">Nama Lengkap *</Label>
                <Input
                  id="clientName"
                  value={bookingData.clientName}
                  onChange={(e) => setBookingData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>

              <div>
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={bookingData.clientEmail}
                  onChange={(e) => setBookingData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="contoh@email.com"
                />
              </div>

              <div>
                <Label htmlFor="clientPhone">Nomor WhatsApp *</Label>
                <Input
                  id="clientPhone"
                  value={bookingData.clientPhone}
                  onChange={(e) => setBookingData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="+62 812 3456 7890"
                />
              </div>

              <div>
                <Label htmlFor="serviceType">Jenis Layanan</Label>
                <select
                  id="serviceType"
                  value={bookingData.serviceType}
                  onChange={(e) => setBookingData(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="translation">Translator</option>
                  <option value="tour_guide">Tour Guide</option>
            
                </select>
              </div>

              <div>
                <Label htmlFor="message">Pesan (Opsional)</Label>
                <Textarea
                  id="message"
                  value={bookingData.message}
                  onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Jelaskan kebutuhan Anda secara detail..."
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleBookingSubmit}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Booking
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Terakhir diperbarui: {(() => {
          try {
            const lastUpdated = availability.lastUpdated as any;
            
            if (!lastUpdated) {
              return 'Tidak diketahui';
            }
            
            if (lastUpdated instanceof Date) {
              return lastUpdated.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            }
            
            if (typeof lastUpdated === 'object' && lastUpdated._seconds) {
              const date = new Date(lastUpdated._seconds * 1000);
              return date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            }
            
            if (typeof lastUpdated === 'string') {
              const date = new Date(lastUpdated);
              return isNaN(date.getTime()) ? 'Format tanggal tidak valid' : date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            }
            
            if (typeof lastUpdated === 'number') {
              const date = new Date(lastUpdated);
              return date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            }
            
            return 'Format tanggal tidak dikenal';
          } catch (error) {
            console.error('Error formatting lastUpdated:', error);
            return 'Error format tanggal';
          }
        })()}
      </div>
    </div>
  );
}
