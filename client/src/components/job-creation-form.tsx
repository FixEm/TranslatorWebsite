import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, X, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import { id } from "date-fns/locale";

interface JobCreationFormProps {
  userId: string;
  verifiedTranslators?: any[]; // For admin mode - list of verified translators
  onJobCreated?: (job: any) => void;
  onCancel?: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface AvailabilityDay {
  date: string;
  timeSlots: TimeSlot[];
}

export default function JobCreationForm({ userId, verifiedTranslators, onJobCreated, onCancel }: JobCreationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Admin mode detection
  const isAdminMode = userId === 'admin' && verifiedTranslators;
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    category: '',
    skills: [] as string[],
    selectedTranslatorId: '', // For admin mode
  });
  
  // Availability data
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  // Skill input
  const [skillInput, setSkillInput] = useState('');
  
  // Time slot input
  const [newTimeSlot, setNewTimeSlot] = useState({
    startTime: '09:00',
    endTime: '17:00'
  });

  const categories = [
    'Translation',
    'Interpretation',
    'Business Documents',
    'Legal Documents', 
    'Medical Documents',
    'Academic Papers',
    'Technical Manuals',
    'Marketing Content',
    'Website Localization',
    'Event Translation',
    'Tour Guide Services',
    'Other'
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addTimeSlot = () => {
    if (!selectedDate) {
      toast({
        title: "Select Date",
        description: "Please select a date first.",
        variant: "destructive"
      });
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingDayIndex = availabilityDays.findIndex(day => day.date === dateStr);
    
    const timeSlot: TimeSlot = {
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      isAvailable: true
    };

    if (existingDayIndex >= 0) {
      // Add to existing day
      const updatedDays = [...availabilityDays];
      updatedDays[existingDayIndex].timeSlots.push(timeSlot);
      setAvailabilityDays(updatedDays);
    } else {
      // Create new day
      const newDay: AvailabilityDay = {
        date: dateStr,
        timeSlots: [timeSlot]
      };
      setAvailabilityDays(prev => [...prev, newDay]);
    }

    toast({
      title: "Time Slot Added",
      description: `Added ${newTimeSlot.startTime} - ${newTimeSlot.endTime} for ${format(selectedDate, 'PPP', { locale: id })}`,
    });
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedDays = [...availabilityDays];
    updatedDays[dayIndex].timeSlots.splice(slotIndex, 1);
    
    // Remove day if no time slots left
    if (updatedDays[dayIndex].timeSlots.length === 0) {
      updatedDays.splice(dayIndex, 1);
    }
    
    setAvailabilityDays(updatedDays);
  };

  const handleSubmit = async () => {
    try {
      // Admin mode validation
      if (isAdminMode && !formData.selectedTranslatorId) {
        toast({
          title: "Translator Required",
          description: "Please select a translator for this job.",
          variant: "destructive"
        });
        return;
      }

      // Validation
      if (!formData.title.trim()) {
        toast({
          title: "Title Required",
          description: "Please enter a job title.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: "Description Required", 
          description: "Please enter a job description.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.budget || Number(formData.budget) <= 0) {
        toast({
          title: "Budget Required",
          description: "Please enter a valid budget amount.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.deadline) {
        toast({
          title: "Deadline Required",
          description: "Please select a deadline date.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.category) {
        toast({
          title: "Category Required",
          description: "Please select a job category.",
          variant: "destructive"
        });
        return;
      }

      if (availabilityDays.length === 0) {
        toast({
          title: "Availability Required",
          description: "Please add at least one available time slot.",
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);

      const jobData = {
        userId: isAdminMode ? formData.selectedTranslatorId : userId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: Number(formData.budget),
        deadline: formData.deadline,
        category: formData.category,
        skills: formData.skills,
        availability: {
          isAvailable: true,
          schedule: availabilityDays,
          timezone: 'Asia/Shanghai'
        }
      };

      console.log('🚀 Submitting job data:', jobData);

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create job');
      }

      const result = await response.json();
      
      toast({
        title: "Job Created Successfully!",
        description: "Your job posting has been created and is now visible in the marketplace.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        category: '',
        skills: [],
        selectedTranslatorId: '',
      });
      setAvailabilityDays([]);
      setSelectedDate(undefined);

      // Notify parent component
      onJobCreated?.(result.job);

    } catch (error: any) {
      console.error('❌ Error creating job:', error);
      toast({
        title: "Failed to Create Job",
        description: error.message || "An error occurred while creating the job.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Job Posting</CardTitle>
          <CardDescription>
            Share your availability and attract potential clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Translator Selection (Admin Mode Only) */}
          {isAdminMode && (
            <div className="space-y-2">
              <Label htmlFor="translator-select">Select Translator *</Label>
              <Select 
                value={formData.selectedTranslatorId} 
                onValueChange={(value) => handleInputChange('selectedTranslatorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a verified translator for this job" />
                </SelectTrigger>
                <SelectContent>
                  {verifiedTranslators?.map((translator: any) => (
                    <SelectItem key={translator.id} value={translator.id}>
                      {translator.name} - {translator.city} (HSK: {translator.hskLevel || 'Not specified'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Job Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Professional Chinese-Indonesian Translation"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (IDR) *</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 500000"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your translation services, experience, and what makes you unique..."
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                min={format(new Date(), 'yyyy-MM-dd')}
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills & Specializations</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g., Business Chinese, Legal Translation)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Availability Section */}
      <Card>
        <CardHeader>
          <CardTitle>Set Your Availability</CardTitle>
          <CardDescription>
            Add the dates and times when you're available for this type of work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Available Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: id }) : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot Addition */}
          {selectedDate && (
            <div className="space-y-2">
              <Label>Add Time Slot for {format(selectedDate, 'PPP', { locale: id })}</Label>
              <div className="flex gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-sm">Start Time</Label>
                  <Input
                    type="time"
                    value={newTimeSlot.startTime}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">End Time</Label>
                  <Input
                    type="time"
                    value={newTimeSlot.endTime}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                <Button type="button" onClick={addTimeSlot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Current Availability Display */}
          {availabilityDays.length > 0 && (
            <div className="space-y-2">
              <Label>Your Current Availability</Label>
              <div className="space-y-2">
                {availabilityDays.map((day, dayIndex) => (
                  <div key={day.date} className="border rounded-lg p-3">
                    <div className="font-semibold mb-2">
                      {format(new Date(day.date), 'EEEE, MMMM d, yyyy', { locale: id })}
                    </div>
                    <div className="space-y-1">
                      {day.timeSlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? "Creating..." : "Create Job"}
        </Button>
      </div>
    </div>
  );
}
