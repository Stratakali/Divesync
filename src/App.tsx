import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import WelcomePage from "@/pages/welcome-page";
import { useUser } from "@/hooks/use-user";
import Dashboard from "@/pages/dashboard";
import DiveLog from "@/pages/dive-log";
import NewDiveLog from "@/pages/dive-log/new-dive";
import Certifications from "@/pages/certifications";
import CertificationTimeline from "@/pages/certification-timeline";
import DivePlanner from "@/pages/dive-planner";
import JSABuilder from "@/pages/jsa-builder";
import NewJSA from "@/pages/jsa-builder/new";
import Toolbox from "@/pages/toolbox";
import NewToolbox from "@/pages/toolbox/new";
import SWMS from "@/pages/swms";
import NewSWMS from "@/pages/swms/new";
import JobBoard from "@/pages/job-board";
import DiverProfile from "@/pages/diver-profile";
import NewProject from "@/pages/projects/new";
import SafetyTools from "@/pages/safety-tools";
import Settings from "@/pages/settings";
import DisclaimerPage from "@/pages/disclaimer";
import { Loader2 } from "lucide-react";
import ProfileCompletion from "@/pages/profile-completion";

function Router() {
  const { user, isLoading } = useUser();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // If not logged in, show welcome page or auth pages
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={WelcomePage} />
        <Route path="/login" component={() => <AuthPage initialMode="login" />} />
        <Route path="/signup" component={() => <AuthPage initialMode="signup" />} />
        <Route path="/:rest*" component={WelcomePage} />
      </Switch>
    );
  }

  // If logged in but haven't accepted disclaimer, redirect to disclaimer page
  if (user?.authenticated && !user.disclaimerAccepted) {
    return <DisclaimerPage />;
  }

  // Main app routes for authenticated users who have accepted the disclaimer
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dive-log" component={DiveLog} />
      <Route path="/dive-log/new" component={NewDiveLog} />
      <Route path="/certifications" component={Certifications} />
      <Route path="/certifications/timeline" component={CertificationTimeline} />
      <Route path="/dive-planner" component={DivePlanner} />
      <Route path="/safety-tools" component={SafetyTools} />
      <Route path="/jsa-builder" component={JSABuilder} />
      <Route path="/jsa-builder/new" component={NewJSA} />
      <Route path="/toolbox" component={Toolbox} />
      <Route path="/toolbox/new" component={NewToolbox} />
      <Route path="/swms" component={SWMS} />
      <Route path="/swms/new" component={NewSWMS} />
      <Route path="/job-board" component={JobBoard} />
      <Route path="/projects/new" component={NewProject} />
      <Route path="/profile" component={DiverProfile} />
      <Route path="/profile-completion" component={ProfileCompletion} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </DndProvider>
  );
}

export default App;