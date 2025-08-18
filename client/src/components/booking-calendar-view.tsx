import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar } from 'lucide-react';

interface Booking {
  id: string;
  date?: string;
  dateRange?: string[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: string;
  pricePerDay: number;
  createdAt: string;
}

interface BookingCalendarViewProps {
  bookings: Booking[];
  userId: string;
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

export default function BookingCalendarView({ bookings, userId }: BookingCalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const today = getCurrentDateUTC7();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [availability, setAvailability] = useState<any>(null);

  // Fetch student availability
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`/api/applications/verified`);
        if (response.ok) {
          const students = await response.json();
          const student = students.find((s: any) => s.id === userId);
          if (student?.availability) {
            setAvailability(student.availability);
          }
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };

    fetchAvailability();
  }, [userId]);

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

  const currentMonth = selectedMonth;
  const currentMonthDates = getMonthDates(currentMonth);

  // Format date to YYYY-MM-DD using UTC+7
  const formatDate = (date: Date) => {
    return formatDateUTC7(date);
  };

  // Check if date is available
  const isDateAvailable = (date: string) => {
    if (!availability?.schedule) return false;
    const availableDate = availability.schedule.find((d: any) => d.date === date);
    return availableDate?.isAvailable || false;
  };

  // Check if date has pending bookings
  const getDateBookingStatus = (date: string) => {
    const dateBookings = bookings.filter(booking => {
      if (booking.date) return booking.date === date;
      if (Array.isArray(booking.dateRange)) return booking.dateRange.includes(date);
      return false;
    });
    if (dateBookings.length === 0) return null;
    
    // Check if any booking is confirmed
    const hasConfirmed = dateBookings.some(booking => booking.status === 'confirmed');
    if (hasConfirmed) return 'confirmed';
    
    // Check if any booking is pending
    const hasPending = dateBookings.some(booking => booking.status === 'pending');
    if (hasPending) return 'pending';
    
    return 'other';
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
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth} className='hover:bg-red-700'>
            ← Bulan Lalu
          </Button>
          <Button variant="outline" size="sm" onClick={goToThisMonth} className='hover:bg-red-700'>
            Bulan Ini
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth} className='hover:bg-red-700'>
            Bulan Depan →
          </Button>
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
            const dateStr = formatDate(date);
            const isAvailable = isDateAvailable(dateStr);
            const bookingStatus = getDateBookingStatus(dateStr);
            const isPast = date < new Date(getCurrentDateUTC7().setHours(0, 0, 0, 0));
            
            return (
              <div
                key={index}
                className={`
                  p-3 border rounded-lg min-h-[48px] flex items-center justify-center
                  ${!isCurrentMonth 
                    ? 'text-gray-300 bg-gray-50' 
                    : isPast
                      ? 'text-gray-400 bg-gray-100'
                      : bookingStatus === 'confirmed'
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : bookingStatus === 'pending'
                          ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                          : isAvailable 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : 'bg-white border-gray-200 text-gray-400'
                  }
                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                `}
                title={
                  bookingStatus === 'confirmed'
                    ? 'Sudah dikonfirmasi (Booked)' 
                    : bookingStatus === 'pending'
                      ? 'Menunggu konfirmasi (Pending)'
                      : isAvailable 
                        ? 'Tersedia'
                        : 'Tidak tersedia'
                }
              >
                <div className="text-center">
                  <div className={`${isToday ? 'font-bold' : ''}`}>
                    {date.getDate()}
                  </div>
                  {isAvailable && !bookingStatus && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                  )}
                  {bookingStatus === 'pending' && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mt-1"></div>
                  )}
                  {bookingStatus === 'confirmed' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span className="text-sm text-gray-600">Menunggu Konfirmasi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-sm text-gray-600">Sudah Dikonfirmasi</span>
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
    </div>
  );
}
