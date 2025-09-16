import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEffect } from "react";

import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import WorkflowPage from "@/pages/workflow";
import WorkspacePage from "@/pages/workspace";
import NotFound from "@/pages/not-found";
import { Cpu } from "lucide-react";

function Router() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/signup" component={SignupPage} />
        <Route path="/" component={LoginPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border px-4 py-3 fixed w-full top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold ai-text-gradient">
                VibeCoders IDE
              </span>
            </div>
            <span className="text-sm text-muted-foreground hidden md:inline">
              AI-Powered Development Platform
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium">
                  {useAuthStore.getState().user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium hidden md:inline">
                {useAuthStore.getState().user?.username}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 min-h-screen">
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/workflow/:projectId" component={WorkflowPage} />
          <Route path="/workspace/:projectId" component={WorkspacePage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
