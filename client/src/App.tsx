import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import Home from "@/pages/home.tsx";
import Search from "@/pages/search.tsx";
import Profile from "@/pages/profile.tsx";
import Login from "@/pages/login.tsx";
import Admin from "@/pages/admin.tsx";
import TranslatorSignup from "@/pages/translator-signup.tsx";
import TranslatorDashboard from "@/pages/translator-dashboard.tsx";
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
