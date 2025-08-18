import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Briefcase, Phone, Shield } from "lucide-react";

interface ClientProfileManagementProps {
  applicationData?: any;
  onUpdate?: () => void;
}

export default function ClientProfileManagement({ applicationData, onUpdate }: ClientProfileManagementProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Form data - only editable fields for clients
  const [profileData, setProfileData] = useState({
    name: '',
    city: '',
    whatsapp: '',
  });

  // Initialize form data when applicationData changes
  useEffect(() => {
    if (applicationData) {
      setProfileData({
        name: applicationData.name || '',
        city: applicationData.city || '',
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
        name: applicationData.name || '',
        city: applicationData.city || '',
        whatsapp: applicationData.whatsapp || '',
      });
    }
    setIsEditing(false);
  };

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'individu': return 'Individual';
      case 'travel_agency': return 'Travel Agency';
      default: return 'Not specified';
    }
  };

  if (!applicationData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
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
                Manage your personal information
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
            {applicationData.profileImage ? (
              <img
                src={applicationData.profileImage}
                alt={applicationData.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-navy-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-navy-200 bg-gray-100 flex items-center justify-center">
                <User className="h-10 w-10 text-gray-400" />
              </div>
            )}
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

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-lg font-semibold">{profileData.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Location</Label>
              {isEditing ? (
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter your city"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <p className="text-lg">{profileData.city}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="whatsapp"
                  value={profileData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="Enter your WhatsApp number"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <p className="text-lg">{profileData.whatsapp || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Intent</Label>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <p className="text-lg">{getIntentLabel(applicationData.intent)}</p>
              </div>
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
            <Shield className="h-5 w-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 mr-2">Status</Label>
              <Badge variant={
                applicationData.status === 'approved' 
                  ? "default" 
                  : applicationData.status === 'rejected' 
                  ? "destructive" 
                  : "secondary"
              }>
                {applicationData.status === 'approved' 
                  ? "Verified" 
                  : applicationData.status === 'rejected' 
                  ? "Rejected" 
                  : "Pending"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 mr-2">Email Verified</Label>
              <Badge variant={applicationData.verificationSteps?.emailVerified ? "default" : "secondary"}>
                {applicationData.verificationSteps?.emailVerified ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
