import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Admin from "@/pages/admin";
import ErrorBoundary from "./components/error-boundary";
import SecurityHeaders from "./components/security-headers";
import PerformanceMonitor from "./components/performance-monitor";
import AnalyticsTracker from "./components/analytics-tracker";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/admin" component={Admin} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SecurityHeaders />
          <AnalyticsTracker />
          <Toaster />
          <Router />
          <PerformanceMonitor />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;