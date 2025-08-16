import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import StudentBooking from "@/components/student-booking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Calendar, CheckCircle, Clock } from "lucide-react";

export default function BookStudentPage() {
  const [bookingComplete, setBookingComplete] = useState(false);

  const handleBookingComplete = () => {
    setBookingComplete(true);
    // Auto-reset after 5 seconds
    setTimeout(() => {
      setBookingComplete(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-navy-800 mb-4">
              Book a Verified Student
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with our verified Chinese-speaking students for translation services, 
              tour guiding, and language support. All students are vetted and verified.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {bookingComplete && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Booking Request Submitted!
                  </h3>
                  <p className="text-green-700">
                    Thank you for your booking request. Our admin team will review and confirm your appointment within 24 hours. 
                    You will receive a confirmation email shortly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-8 w-8 text-navy-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Verified Students</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                All our students have been verified for their language skills, 
                academic credentials, and professional competency.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Calendar className="h-8 w-8 text-navy-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Flexible Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                View real-time availability and book time slots that work 
                for your schedule. Easy online booking system.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Clock className="h-8 w-8 text-navy-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Quick Confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Get booking confirmation within 24 hours. Our admin team 
                ensures all appointments are properly coordinated.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Booking Process */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-navy-100 text-navy-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  1
                </div>
                <h4 className="font-semibold mb-2">Browse Students</h4>
                <p className="text-sm text-gray-600">
                  View profiles, rates, and specializations of available students
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-navy-100 text-navy-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  2
                </div>
                <h4 className="font-semibold mb-2">Check Availability</h4>
                <p className="text-sm text-gray-600">
                  See real-time availability and select your preferred time slot
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-navy-100 text-navy-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  3
                </div>
                <h4 className="font-semibold mb-2">Book & Pay</h4>
                <p className="text-sm text-gray-600">
                  Complete your booking form and submit your request
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-navy-100 text-navy-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  4
                </div>
                <h4 className="font-semibold mb-2">Get Confirmed</h4>
                <p className="text-sm text-gray-600">
                  Receive confirmation and connect with your chosen student
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Booking Component */}
        <StudentBooking onBookingComplete={handleBookingComplete} />
      </div>

      <Footer />
    </div>
  );
}
