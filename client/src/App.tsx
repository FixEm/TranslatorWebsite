import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import TranslatorSignup from "@/pages/translator-signup";
import TranslatorDashboard from "@/pages/translator-dashboard";
import EditProfile from "@/pages/edit-profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      <Route path="/translator/signup" component={TranslatorSignup} />
      <Route path="/translator/dashboard" component={TranslatorDashboard} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
