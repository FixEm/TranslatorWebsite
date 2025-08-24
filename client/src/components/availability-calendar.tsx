import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { Calendar, Plus, X, Save, AlertCircle } from "lucide-react";

interface AvailableDate {
  date: string;
  isAvailable: boolean;
}

interface RecurringPattern {
  dayOfWeek: number;
  isActive: boolean;
}

interface UnavailablePeriod {
  startDate: string;
  endDate: string;
  reason?: string;
}

interface AvailabilityData {
  isAvailable: boolean;
  schedule: AvailableDate[];
  recurringPatterns?: RecurringPattern[];
  unavailablePeriods?: UnavailablePeriod[];
  lastUpdated: Date;
}

interface AvailabilityCalendarProps {
  userId: string;
  initialAvailability?: AvailabilityData;
  onUpdate?: (availability: AvailabilityData) => void;
  readOnly?: boolean;
}

const dayNames = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// Helper function to get current date in UTC+7
const getCurrentDateUTC7 = () => {
  const now = new Date();
  // Create a proper UTC+7 date
  const utc7Offset = 7 * 60; // UTC+7 in minutes
  const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
  const utc7Time = now.getTime() + (localOffset + utc7Offset) * 60 * 1000;
  return new Date(utc7Time);
};

// Helper function to format date to YYYY-MM-DD in UTC+7
const formatDateUTC7 = (date: Date) => {
  // Ensure we format the date correctly without timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AvailabilityCalendar({
  userId,
  initialAvailability,
  onUpdate,
  readOnly = false,
}: AvailabilityCalendarProps) {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<AvailabilityData>({
    isAvailable: true,
    schedule: [],
    recurringPatterns: [],
    unavailablePeriods: [],
    lastUpdated: new Date(),
  });

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const today = getCurrentDateUTC7();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);
  const [newRecurringPattern, setNewRecurringPattern] = useState<
    Partial<RecurringPattern>
  >({
    dayOfWeek: 1,
    isActive: true,
  });
  const [newUnavailablePeriod, setNewUnavailablePeriod] = useState<
    Partial<UnavailablePeriod>
  >({});

  // Initialize availability from props
  useEffect(() => {
    if (initialAvailability) {
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
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday of the first week

    // Generate 6 weeks (42 days) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === getCurrentDateUTC7().toDateString(),
      });
    }

    return dates;
  };

  // Generate dates for 2 months
  const firstMonth = selectedMonth;
  const secondMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    1
  );
  const firstMonthDates = getMonthDates(firstMonth);
  const secondMonthDates = getMonthDates(secondMonth);

  // Format date to YYYY-MM-DD using UTC+7
  const formatDate = (date: Date) => {
    return formatDateUTC7(date);
  };

  // Check if date is available
  const isDateAvailable = (date: string) => {
    const availableDate = availability.schedule.find((d) => d.date === date);
    return availableDate?.isAvailable || false;
  };

  // Check if date is in unavailable period
  const isDateUnavailable = (date: string) => {
    return (
      availability.unavailablePeriods?.some(
        (period) => date >= period.startDate && date <= period.endDate
      ) || false
    );
  };

  // Toggle date availability
  const toggleDate = (date: string) => {
    if (readOnly || isDateUnavailable(date)) return;

    setAvailability((prev) => {
      const newSchedule = [...prev.schedule];
      const existingIndex = newSchedule.findIndex((d) => d.date === date);

      if (existingIndex === -1) {
        // Add new available date
        newSchedule.push({ date, isAvailable: true });
      } else {
        // Toggle existing date
        newSchedule[existingIndex] = {
          ...newSchedule[existingIndex],
          isAvailable: !newSchedule[existingIndex].isAvailable,
        };

        // Remove if not available
        if (!newSchedule[existingIndex].isAvailable) {
          newSchedule.splice(existingIndex, 1);
        }
      }

      return {
        ...prev,
        schedule: newSchedule,
        lastUpdated: new Date(),
      };
    });
  };

  // Apply recurring patterns to current month
  const applyRecurringPatterns = () => {
    if (!availability.recurringPatterns) return;

    setAvailability((prev) => {
      const newSchedule = [...prev.schedule];

      // Apply to both months
      [...firstMonthDates, ...secondMonthDates].forEach(
        ({ date, isCurrentMonth }) => {
          if (!isCurrentMonth) return;

          const dateStr = formatDate(date);
          const dayOfWeek = date.getDay();

          // Find active recurring pattern for this day
          const pattern = prev.recurringPatterns?.find(
            (p) => p.dayOfWeek === dayOfWeek && p.isActive
          );

          if (pattern && !isDateUnavailable(dateStr)) {
            const existingIndex = newSchedule.findIndex(
              (d) => d.date === dateStr
            );

            if (existingIndex === -1) {
              newSchedule.push({ date: dateStr, isAvailable: true });
            } else {
              newSchedule[existingIndex] = { date: dateStr, isAvailable: true };
            }
          }
        }
      );

      return {
        ...prev,
        schedule: newSchedule,
        lastUpdated: new Date(),
      };
    });

    toast({
      title: "Pola Berulang Diterapkan",
      description: "Jadwal berulang telah diterapkan ke kedua bulan.",
    });
  };

  // Add recurring pattern
  const addRecurringPattern = () => {
    if (newRecurringPattern.dayOfWeek === undefined) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap pilih hari dalam seminggu.",
        variant: "destructive",
      });
      return;
    }

    setAvailability((prev) => ({
      ...prev,
      recurringPatterns: [
        ...(prev.recurringPatterns || []),
        newRecurringPattern as RecurringPattern,
      ],
      lastUpdated: new Date(),
    }));

    setNewRecurringPattern({
      dayOfWeek: 1,
      isActive: true,
    });
    setShowRecurringDialog(false);

    toast({
      title: "Pola Berulang Ditambahkan",
      description: "Pola jadwal berulang berhasil ditambahkan.",
    });
  };

  // Add unavailable period
  const addUnavailablePeriod = () => {
    if (!newUnavailablePeriod.startDate || !newUnavailablePeriod.endDate) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap pilih tanggal mulai dan selesai.",
        variant: "destructive",
      });
      return;
    }

    setAvailability((prev) => ({
      ...prev,
      unavailablePeriods: [
        ...(prev.unavailablePeriods || []),
        newUnavailablePeriod as UnavailablePeriod,
      ],
      lastUpdated: new Date(),
    }));

    setNewUnavailablePeriod({});
    setShowUnavailableDialog(false);

    toast({
      title: "Periode Tidak Tersedia Ditambahkan",
      description: "Periode ketidaktersediaan berhasil ditambahkan.",
    });
  };

  // Save availability to Firebase
  const saveAvailability = async () => {
    try {
      const response = await fetch(`/api/applications/${userId}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(availability),
      });

      if (response.ok) {
        toast({
          title: "Ketersediaan Disimpan",
          description: "Jadwal ketersediaan Anda berhasil diperbarui.",
        });
        onUpdate?.(availability);
      } else {
        throw new Error("Failed to save availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan jadwal ketersediaan.",
        variant: "destructive",
      });
    }
  };

  // Quick actions
  const setAllMonthAvailable = () => {
    setAvailability((prev) => {
      const newSchedule = [...prev.schedule];

      // Apply to both months
      [...firstMonthDates, ...secondMonthDates].forEach(
        ({ date, isCurrentMonth }) => {
          if (!isCurrentMonth) return;

          const dateStr = formatDate(date);
          if (!isDateUnavailable(dateStr)) {
            const existingIndex = newSchedule.findIndex(
              (d) => d.date === dateStr
            );

            if (existingIndex === -1) {
              newSchedule.push({ date: dateStr, isAvailable: true });
            } else {
              newSchedule[existingIndex] = { date: dateStr, isAvailable: true };
            }
          }
        }
      );

      return {
        ...prev,
        schedule: newSchedule,
        lastUpdated: new Date(),
      };
    });
  };

  const clearAllAvailability = () => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((d) => {
        const date = new Date(d.date);
        // Remove dates from both visible months
        const isFirstMonth =
          date.getMonth() === selectedMonth.getMonth() &&
          date.getFullYear() === selectedMonth.getFullYear();
        const isSecondMonth =
          date.getMonth() === secondMonth.getMonth() &&
          date.getFullYear() === secondMonth.getFullYear();
        return !isFirstMonth && !isSecondMonth;
      }),
      lastUpdated: new Date(),
    }));
  };

  // Calculate total available days for current view
  const calculateTotalAvailableDays = () => {
    let totalAvailable = 0;

    // Count available days in both months
    [...firstMonthDates, ...secondMonthDates].forEach(
      ({ date, isCurrentMonth }) => {
        if (!isCurrentMonth) return;

        const dateStr = formatDate(date);
        const isAvailable = isDateAvailable(dateStr);
        const isUnavailable = isDateUnavailable(dateStr);
        const isPast =
          date < new Date(getCurrentDateUTC7().setHours(0, 0, 0, 0));

        if (isAvailable && !isUnavailable && !isPast) {
          totalAvailable++;
        }
      }
    );

    return totalAvailable;
  };

  // Navigation
  const goToPreviousMonth = () => {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const goToThisMonth = () => {
    const today = getCurrentDateUTC7();
    setSelectedMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-800">
            Kelola Ketersediaan
          </h2>
          <p className="text-gray-600">
            Pilih tanggal-tanggal ketika Anda tersedia untuk bekerja
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={setAllMonthAvailable}
                className="hover:bg-red-700"
              >
                Tandai Semua Bulan Tersedia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllAvailability}
                className="hover:bg-red-700"
              >
                Kosongkan Kedua Bulan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={applyRecurringPatterns}
                className="hover:bg-red-700"
              >
                Terapkan Pola Berulang
              </Button>
              <Dialog
                open={showRecurringDialog}
                onOpenChange={setShowRecurringDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Pola Berulang
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pola Berulang</DialogTitle>
                    <DialogDescription>
                      Pilih hari dalam seminggu yang selalu tersedia (misalnya:
                      setiap Senin).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Hari</Label>
                      <Select
                        value={newRecurringPattern.dayOfWeek?.toString()}
                        onValueChange={(value) =>
                          setNewRecurringPattern((prev) => ({
                            ...prev,
                            dayOfWeek: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih hari" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowRecurringDialog(false)}
                      >
                        Batal
                      </Button>
                      <Button onClick={addRecurringPattern}>Tambah Pola</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog
                open={showUnavailableDialog}
                onOpenChange={setShowUnavailableDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-red-700"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Tandai Tidak Tersedia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tandai Periode Tidak Tersedia</DialogTitle>
                    <DialogDescription>
                      Tandai periode waktu tertentu ketika Anda tidak tersedia
                      (misalnya liburan atau ujian).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="start-date">Tanggal Mulai</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newUnavailablePeriod.startDate || ""}
                        onChange={(e) =>
                          setNewUnavailablePeriod((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">Tanggal Selesai</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newUnavailablePeriod.endDate || ""}
                        onChange={(e) =>
                          setNewUnavailablePeriod((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="reason">Alasan (Opsional)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Misalnya: Liburan, Ujian, dll."
                        value={newUnavailablePeriod.reason || ""}
                        onChange={(e) =>
                          setNewUnavailablePeriod((prev) => ({
                            ...prev,
                            reason: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowUnavailableDialog(false)}
                      >
                        Batal
                      </Button>
                      <Button onClick={addUnavailablePeriod}>
                        Tambah Periode
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kalender Ketersediaan
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="hover:bg-red-700"
              >
                ← Bulan Lalu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToThisMonth}
                className="hover:bg-red-700"
              >
                Bulan Ini
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="hover:bg-red-700"
              >
                Bulan Depan →
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {firstMonth.toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
              })}{" "}
              -{" "}
              {secondMonth.toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
              })}
            </p>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-300"
            >
              Total Tersedia: {calculateTotalAvailableDays()} hari
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Two Month Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* First Month */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                {firstMonth.toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                })}
              </h3>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {/* Header - Days of week */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="font-semibold p-2 text-center text-gray-600"
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}

                {/* Calendar Dates */}
                {firstMonthDates.map(
                  ({ date, isCurrentMonth, isToday }, index) => {
                    const dateStr = formatDate(date);
                    const isAvailable = isDateAvailable(dateStr);
                    const isUnavailable = isDateUnavailable(dateStr);
                    const isPast =
                      date <
                      new Date(getCurrentDateUTC7().setHours(0, 0, 0, 0));

                    // Skip rendering if not current month
                    if (!isCurrentMonth) {
                      return (
                        <div key={index} className="p-3 min-h-[48px]"></div>
                      );
                    }

                    return (
                      <button
                        key={index}
                        className={`
                        p-3 border rounded-lg transition-all duration-200 min-h-[48px] flex items-center justify-center
                        ${
                          isPast
                            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                            : isUnavailable
                            ? "bg-red-100 border-red-200 text-red-700 cursor-not-allowed"
                            : isAvailable
                            ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                        }
                        ${isToday ? "ring-2 ring-blue-400" : ""}
                        ${readOnly ? "cursor-default" : ""}
                      `}
                        onClick={() =>
                          !readOnly &&
                          !isPast &&
                          !isUnavailable &&
                          toggleDate(dateStr)
                        }
                        disabled={readOnly || isPast || isUnavailable}
                        title={
                          isUnavailable
                            ? "Tidak tersedia (periode liburan/ujian)"
                            : isAvailable
                            ? "Tersedia - Klik untuk batalkan"
                            : "Tidak tersedia - Klik untuk tandai tersedia"
                        }
                      >
                        <div className="text-center">
                          <div className={`${isToday ? "font-bold" : ""}`}>
                            {date.getDate()}
                          </div>
                          {isAvailable && !isUnavailable && (
                            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                          )}
                          {isUnavailable && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Second Month */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                {secondMonth.toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                })}
              </h3>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {/* Header - Days of week */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="font-semibold p-2 text-center text-gray-600"
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}

                {/* Calendar Dates */}
                {secondMonthDates.map(
                  ({ date, isCurrentMonth, isToday }, index) => {
                    const dateStr = formatDate(date);
                    const isAvailable = isDateAvailable(dateStr);
                    const isUnavailable = isDateUnavailable(dateStr);
                    const isPast =
                      date <
                      new Date(getCurrentDateUTC7().setHours(0, 0, 0, 0));

                    // Skip rendering if not current month
                    if (!isCurrentMonth) {
                      return (
                        <div key={index} className="p-3 min-h-[48px]"></div>
                      );
                    }

                    return (
                      <button
                        key={index}
                        className={`
                        p-3 border rounded-lg transition-all duration-200 min-h-[48px] flex items-center justify-center
                        ${
                          isPast
                            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                            : isUnavailable
                            ? "bg-red-100 border-red-200 text-red-700 cursor-not-allowed"
                            : isAvailable
                            ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                        }
                        ${isToday ? "ring-2 ring-blue-400" : ""}
                        ${readOnly ? "cursor-default" : ""}
                      `}
                        onClick={() =>
                          !readOnly &&
                          !isPast &&
                          !isUnavailable &&
                          toggleDate(dateStr)
                        }
                        disabled={readOnly || isPast || isUnavailable}
                        title={
                          isUnavailable
                            ? "Tidak tersedia (periode liburan/ujian)"
                            : isAvailable
                            ? "Tersedia - Klik untuk batalkan"
                            : "Tidak tersedia - Klik untuk tandai tersedia"
                        }
                      >
                        <div className="text-center">
                          <div className={`${isToday ? "font-bold" : ""}`}>
                            {date.getDate()}
                          </div>
                          {isAvailable && !isUnavailable && (
                            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                          )}
                          {isUnavailable && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm text-gray-600">Tersedia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-sm text-gray-600">Tidak tersedia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded"></div>
              <span className="text-sm text-gray-600">Hari ini</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-sm text-gray-600">Masa lalu</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Patterns & Unavailable Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recurring Patterns */}
        {availability.recurringPatterns &&
          availability.recurringPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pola Berulang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availability.recurringPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        Setiap {dayNames[pattern.dayOfWeek]}
                      </div>
                      <div className="text-sm text-gray-600">
                        Otomatis tersedia setiap{" "}
                        {dayNames[pattern.dayOfWeek].toLowerCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pattern.isActive}
                        onCheckedChange={(checked) => {
                          setAvailability((prev) => ({
                            ...prev,
                            recurringPatterns: prev.recurringPatterns?.map(
                              (p, i) =>
                                i === index ? { ...p, isActive: checked } : p
                            ),
                            lastUpdated: new Date(),
                          }));
                        }}
                        disabled={readOnly}
                      />
                      {!readOnly && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAvailability((prev) => ({
                              ...prev,
                              recurringPatterns: prev.recurringPatterns?.filter(
                                (_, i) => i !== index
                              ),
                              lastUpdated: new Date(),
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        {/* Unavailable Periods */}
        {availability.unavailablePeriods &&
          availability.unavailablePeriods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Periode Tidak Tersedia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availability.unavailablePeriods.map((period, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {new Date(period.startDate).toLocaleDateString("id-ID")}{" "}
                        - {new Date(period.endDate).toLocaleDateString("id-ID")}
                      </div>
                      {period.reason && (
                        <div className="text-sm text-gray-600">
                          {period.reason}
                        </div>
                      )}
                    </div>
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAvailability((prev) => ({
                            ...prev,
                            unavailablePeriods: prev.unavailablePeriods?.filter(
                              (_, i) => i !== index
                            ),
                            lastUpdated: new Date(),
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
      </div>

      {/* Save Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button
            onClick={saveAvailability}
            className="px-8 bg-red-700 hover:bg-red-800"
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan Ketersediaan
          </Button>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Terakhir diperbarui:{" "}
        {(() => {
          try {
            // Handle different types of date objects
            const lastUpdated = availability.lastUpdated as any;

            if (!lastUpdated) {
              return "Tidak diketahui";
            }

            // If it's already a Date object
            if (lastUpdated instanceof Date) {
              return lastUpdated.toLocaleString("id-ID");
            }

            // If it's a Firestore timestamp object with _seconds
            if (typeof lastUpdated === "object" && lastUpdated._seconds) {
              const date = new Date(lastUpdated._seconds * 1000);
              return date.toLocaleString("id-ID");
            }

            // If it's a string, try to parse it
            if (typeof lastUpdated === "string") {
              const date = new Date(lastUpdated);
              return isNaN(date.getTime())
                ? "Format tanggal tidak valid"
                : date.toLocaleString("id-ID");
            }

            // If it's a number (timestamp)
            if (typeof lastUpdated === "number") {
              const date = new Date(lastUpdated);
              return date.toLocaleString("id-ID");
            }

            // Fallback
            return "Format tanggal tidak dikenal";
          } catch (error) {
            console.error("Error formatting lastUpdated:", error);
            return "Error format tanggal";
          }
        })()}
      </div>
    </div>
  );
}
