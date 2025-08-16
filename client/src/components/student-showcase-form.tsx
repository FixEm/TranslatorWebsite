import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, User, Clock, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface StudentShowcaseFormProps {
  verifiedTranslators?: any[];
  onJobCreated?: (job: any) => void;
  onCancel?: () => void;
}

export default function StudentShowcaseForm({ 
  verifiedTranslators = [], 
  onJobCreated, 
  onCancel
}: StudentShowcaseFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTranslator, setSelectedTranslator] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    budget: '',
    customDescription: '', // Admin can add custom description
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTranslatorSelect = (translatorId: string) => {
    const translator = verifiedTranslators.find(t => t.id === translatorId);
    setSelectedTranslator(translator);
  };

  const getTranslatorServices = (translator: any) => {
    if (!translator?.services) return [];
    return Array.isArray(translator.services) ? translator.services : [];
  };

  const getTranslatorAvailability = (translator: any) => {
    // Use the translator's existing availability or create default
    if (translator?.availability?.schedule) {
      return translator.availability.schedule;
    }
    // Return empty if no availability set
    return [];
  };

  const handleSubmit = async () => {
    try {
      if (!selectedTranslator) {
        toast({
          title: "Translator Required",
          description: "Please select a verified translator.",
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

      setIsLoading(true);

      // Create job listing using student's information
      const jobData = {
        userId: selectedTranslator.id,
        // Auto-generate title based on student info
        title: `Professional ${selectedTranslator.intent === 'translator' ? 'Translation' : selectedTranslator.intent === 'tour_guide' ? 'Tour Guide' : 'Translation & Tour Guide'} Services - ${selectedTranslator.name}`,
        // Use student's description or admin's custom description
        description: formData.customDescription || selectedTranslator.description || `Experienced ${selectedTranslator.intent} from ${selectedTranslator.city} with ${selectedTranslator.experience} of experience.`,
        budget: Number(formData.budget),
        // Set a default far future deadline since this is a service listing
        deadline: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 1 year from now
        // Use student's services as category
        category: getTranslatorServices(selectedTranslator)[0] || 'Translation',
        // Use all student's services as skills
        skills: getTranslatorServices(selectedTranslator),
        // Use student's existing availability
        availability: {
          isAvailable: true,
          schedule: getTranslatorAvailability(selectedTranslator),
          timezone: selectedTranslator.availability?.timezone || 'Asia/Shanghai'
        }
      };

      console.log('🚀 Creating student showcase:', jobData);

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student showcase');
      }

      const result = await response.json();
      
      toast({
        title: "Student Showcase Created!",
        description: `${selectedTranslator.name}'s profile has been listed for clients.`,
      });

      // Reset form
      setFormData({
        budget: '',
        customDescription: '',
      });
      setSelectedTranslator(null);

      // Notify parent component
      onJobCreated?.(result.job);

    } catch (error: any) {
      console.error('❌ Error creating student showcase:', error);
      toast({
        title: "Failed to Create Showcase",
        description: error.message || "An error occurred while creating the student showcase.",
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
          <CardTitle>Create Student Showcase</CardTitle>
          <CardDescription>
            Create a client-facing listing for verified students using their provided information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="translator">Select Verified Student *</Label>
            <Select value={selectedTranslator?.id || ''} onValueChange={handleTranslatorSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a verified translator" />
              </SelectTrigger>
              <SelectContent>
                {verifiedTranslators.map((translator) => (
                  <SelectItem key={translator.id} value={translator.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {translator.name} - {translator.city} ({translator.intent})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Student Info Preview */}
          {selectedTranslator && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Student Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedTranslator.name}
                  </div>
                  <div>
                    <strong>City:</strong> {selectedTranslator.city}
                  </div>
                  <div>
                    <strong>Intent:</strong> {selectedTranslator.intent}
                  </div>
                  <div>
                    <strong>Experience:</strong> {selectedTranslator.experience}
                  </div>
                  <div>
                    <strong>HSK Level:</strong> {selectedTranslator.hskLevel || 'Not specified'}
                  </div>
                  <div>
                    <strong>Years in China:</strong> {selectedTranslator.yearsInChina || 'Not specified'}
                  </div>
                  <div className="md:col-span-2">
                    <strong>Services:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getTranslatorServices(selectedTranslator).map((service: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedTranslator.description && (
                    <div className="md:col-span-2">
                      <strong>Student Description:</strong>
                      <p className="text-gray-700 mt-1">{selectedTranslator.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Starting Rate (IDR per day) *</Label>
            <Input
              id="budget"
              type="number"
              placeholder="e.g., 500000"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
            />
            <p className="text-sm text-gray-600">This will be the starting rate displayed to clients</p>
          </div>

          {/* Custom Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customDescription">Custom Description (Optional)</Label>
            <Textarea
              id="customDescription"
              placeholder="Add any additional information or custom description for this student's listing..."
              rows={4}
              value={formData.customDescription}
              onChange={(e) => handleInputChange('customDescription', e.target.value)}
            />
            <p className="text-sm text-gray-600">
              If left empty, the student's own description will be used
            </p>
          </div>

          {/* Availability Preview */}
          {selectedTranslator && getTranslatorAvailability(selectedTranslator).length > 0 && (
            <div className="space-y-2">
              <Label>Student's Availability</Label>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {getTranslatorAvailability(selectedTranslator).slice(0, 3).map((day: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          {format(new Date(day.date), 'EEEE, MMMM d', { locale: id })}:
                        </span>
                        <div className="flex gap-1">
                          {(day.timeSlots || []).length > 0 ? (
                            (day.timeSlots || []).map((slot: any, slotIndex: number) => (
                              <Badge key={slotIndex} variant="outline" className="text-xs">
                                {slot.startTime}-{slot.endTime}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 italic">No specific times set</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {getTranslatorAvailability(selectedTranslator).length > 3 && (
                      <p className="text-xs text-gray-600">
                        ... and {getTranslatorAvailability(selectedTranslator).length - 3} more days
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTranslator && getTranslatorAvailability(selectedTranslator).length === 0 && (
            <div className="text-center py-4 text-orange-600">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">This student hasn't set their availability yet.</p>
              <p className="text-xs">They can update this in their dashboard.</p>
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
          disabled={isLoading || !selectedTranslator}
          className="min-w-[120px]"
        >
          {isLoading ? "Creating..." : "Create Showcase"}
        </Button>
      </div>
    </div>
  );
}
