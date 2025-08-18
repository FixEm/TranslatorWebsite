import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProfileManagement from "@/components/profile-management";
import ClientProfileManagement from "@/components/client-profile-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Shield } from "lucide-react";

export default function EditProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [applicationData, setApplicationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth context to finish loading before making any decisions
    if (authLoading) {
      console.log('🔐 Auth context is still loading...');
      return;
    }

    console.log('🔐 Auth context loaded:', { user, authLoading });

    // Only redirect to login if auth is done loading and there's no user
    if (!user?.email && !user?.uid) {
      console.log('🔐 No user found, redirecting to login');
      setLocation('/login');
      return;
    }

    console.log('🔐 User authenticated, fetching application data...');

    const fetchApplicationData = async () => {
      try {
        setIsLoading(true);
        
        // Determine which API endpoint to use based on user role
        let endpoint = '';
        if (user.role === 'client') {
          endpoint = `/api/applications/client/${user.uid}`;
        } else {
          endpoint = `/api/applications/translator?email=${user.email}`;
        }
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Failed to fetch application data');
        }
        
        const data = await response.json();
        setApplicationData(data);
      } catch (err: any) {
        console.error('Error fetching application data:', err);
        setError(err.message || 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationData();
  }, [user?.email, user?.uid, user?.role, setLocation, authLoading]);

  const handleProfileUpdate = async () => {
    // Refresh application data when profile is updated
    if (user?.email || user?.uid) {
      try {
        let endpoint = '';
        if (user.role === 'client') {
          endpoint = `/api/applications/client/${user.uid}`;
        } else {
          endpoint = `/api/applications/translator?email=${user.email}`;
        }
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setApplicationData(data);
        }
      } catch (error) {
        console.error('Error refreshing application data:', error);
      }
    }
  };

  const getBackButtonDestination = () => {
    if (user?.role === 'client') {
      return '/client/dashboard';
    } else {
      return '/translator/dashboard';
    }
  };

  const getPageTitle = () => {
    if (user?.role === 'client') {
      return 'Edit Client Profile';
    } else {
      return 'Edit Translator Profile';
    }
  };

  const getPageDescription = () => {
    if (user?.role === 'client') {
      return 'Update your personal information and profile picture.';
    } else {
      return 'Update your profile information and upload a professional photo to make a great impression with clients.';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Profile</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Profile Found</h1>
            <p className="text-gray-600 mb-6">
              {user?.role === 'client' 
                ? "It looks like you haven't created a client profile yet."
                : "It looks like you haven't created a translator profile yet."
              }
            </p>
            <Button onClick={() => setLocation(user?.role === 'client' ? '/client-signup' : '/translator-signup')}>
              Create Profile
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation(getBackButtonDestination())}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-800 mb-2">{getPageTitle()}</h1>
          <p className="text-gray-600">
            {getPageDescription()}
          </p>
        </div>

        {/* Profile Management Component - Different for client vs translator */}
        {user?.role === 'client' ? (
          <ClientProfileManagement 
            applicationData={applicationData}
            onUpdate={handleProfileUpdate}
          />
        ) : (
          <ProfileManagement 
            applicationData={applicationData}
            onUpdate={handleProfileUpdate}
          />
        )}

        {/* Additional Information - Only show for translators */}
        {user?.role !== 'client' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Profile Visibility
              </CardTitle>
              <CardDescription>
                Your profile will be visible to clients once your verification is complete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-lg">💡</div>
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">Profile Tips:</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Upload a professional, high-quality photo</li>
                      <li>• Write a compelling description of your services</li>
                      <li>• Keep your contact information up to date</li>
                      <li>• Complete all verification steps for better visibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}

