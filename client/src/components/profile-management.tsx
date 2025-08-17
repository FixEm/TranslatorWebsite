import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, GraduationCap, Star, Languages, Briefcase } from "lucide-react";

interface ProfileManagementProps {
  applicationData?: any;
  onUpdate?: () => void;
}

export default function ProfileManagement({ applicationData, onUpdate }: ProfileManagementProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Form data
  const [profileData, setProfileData] = useState({
    description: '',
    pricePerDay: '',
    whatsapp: '',
  });

  // Initialize form data when applicationData changes
  useEffect(() => {
    if (applicationData) {
      setProfileData({
        description: applicationData.description || '',
        pricePerDay: applicationData.pricePerDay || '',
        whatsapp: applicationData.whatsapp || '',
      });
    }
  }, [applicationData]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileImageChange = async (file: File) => {
    if (!applicationData?.id) {
      toast({ title: "Error", description: "Application data not found.", variant: "destructive" });
      return;
    }
    const formData = new FormData();
    formData.append('profileImage', file);

    setIsUploadingImage(true);
    try {
      const response = await fetch(`/api/applications/${applicationData.id}/upload`, {
        method: 'PATCH',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to upload profile image');
      }
      toast({ title: 'Profile photo updated' });
      onUpdate?.();
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message || 'Unable to upload image', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!applicationData?.id) {
        toast({
          title: "Error",
          description: "Application data not found.",
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);

      const response = await fetch(`/api/applications/${applicationData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved successfully.",
      });

      setIsEditing(false);
      onUpdate?.();

    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (applicationData) {
      setProfileData({
        description: applicationData.description || '',
        pricePerDay: applicationData.pricePerDay || '',
        whatsapp: applicationData.whatsapp || '',
      });
    }
    setIsEditing(false);
  };

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'translator': return 'Translator';
      case 'tour_guide': return 'Tour Guide';
      case 'both': return 'Translator & Tour Guide';
      default: return 'Not specified';
    }
  };

  const getServices = () => {
    if (!applicationData?.services) return [];
    return Array.isArray(applicationData.services) ? applicationData.services : [];
  };

  // Compute completeness score locally to match VerificationStatus
  const completenessScore = (() => {
    try {
      const points = { emailVerified: 25, studentIdUploaded: 20, hskUploaded: 25, cvUploaded: 20, introVideoUploaded: 10 } as const;
      const steps: any = applicationData?.verificationSteps || {};
      let score = 0;
      if (steps.emailVerified) score += points.emailVerified;
      if (steps.studentIdUploaded && steps.studentIdStatus !== 'changes_requested') score += points.studentIdUploaded;
      if (steps.hskUploaded && steps.hskStatus !== 'changes_requested') score += points.hskUploaded;
      if (steps.cvUploaded && steps.cvStatus !== 'changes_requested') score += points.cvUploaded;
      if (steps.introVideoUploaded) score += points.introVideoUploaded;
      return Math.max(0, Math.min(100, score));
    } catch {
      return 0;
    }
  })();

  if (!applicationData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Manage your personal and professional information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile image + uploader */}
          <div className="flex items-center gap-4">
            <img
              src={applicationData.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=60"}
              alt={applicationData.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-navy-200"
            />
            <div>
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfileImageChange(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => (document.getElementById('profile-image-input') as HTMLInputElement)?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>
          </div>

          {/* Read-only Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Name</Label>
              <p className="text-lg font-semibold">{applicationData.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Email</Label>
              <p className="text-lg">{applicationData.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">City</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <p className="text-lg">{applicationData.city}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Intent</Label>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <p className="text-lg">{getIntentLabel(applicationData.intent)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Experience</Label>
              <p className="text-lg">{applicationData.experience} years</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">HSK Level</Label>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <p className="text-lg">{applicationData.hskLevel || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          {getServices().length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Services</Label>
              <div className="flex flex-wrap gap-2">
                {getServices().map((service: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              {isEditing ? (
                <Input
                  id="whatsapp"
                  value={profileData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="Enter your WhatsApp number"
                />
              ) : (
                <p className="text-lg">{profileData.whatsapp || 'Not provided'}</p>
              )}
            </div>
              

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <p className="text-sm text-gray-600">
                Describe your experience, specializations, and what makes you unique as a translator/guide
              </p>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={profileData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell clients about your experience, specializations, and what makes you unique..."
                  rows={6}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  {profileData.description ? (
                    <p className="text-gray-800 whitespace-pre-wrap">{profileData.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided yet. Click "Edit Profile" to add one. This will be shown to clients</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons (Edit Mode) */}
          {isEditing && (
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 mr-2">Status</Label>
              <Badge variant={
                applicationData.status === 'approved' && applicationData.verificationSteps?.adminApproved 
                  ? "default" 
                  : applicationData.status === 'rejected' 
                  ? "destructive" 
                  : "secondary"
              }>
                {applicationData.status === 'approved' && applicationData.verificationSteps?.adminApproved 
                  ? "Verified" 
                  : applicationData.status === 'rejected' 
                  ? "Rejected" 
                  : "Pending"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Completeness Score</Label>
              <p className="text-lg font-semibold">{completenessScore}/100</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
