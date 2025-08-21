import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";


import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import RiskCalculation from "@/pages/risk-calculation";

import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminNetworks from "@/pages/admin-networks";
import AdminPlatforms from "@/pages/admin-platforms";
import AdminCategories from "@/pages/admin-categories";
import AdminApiKeys from "@/pages/admin-api-keys";
import AdminChatGPT from "@/pages/admin-chatgpt";
import PoolDetail from "@/pages/pool-detail";


import AdminLogoManagement from "@/pages/admin-logo-management";
import AdminErrors from "@/pages/admin-errors";
import AdminSystem from "@/pages/admin-system";
import AdminPanel from "@/pages/admin-panel";
import AdminPools from "@/pages/admin-pools";
import AdminServices from "@/pages/admin-services";
import AdminApiSettings from "@/pages/AdminApiSettings";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminErrorManagement from "@/pages/admin-error-management";

import HealingDashboard from "@/pages/healing-dashboard";
import ProfilePage from "@/pages/profile";



function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/risk-calculation" component={RiskCalculation} />
      <Route path="/profile/:address" component={ProfilePage} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />

      {/* Admin routes MUST come before the catch-all pool route */}
      <Route path="/admin/healing" component={HealingDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/system" component={AdminSystem} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/api-settings" component={AdminApiSettings} />
      <Route path="/admin/panel" component={AdminPanel} />
      <Route path="/admin/pools" component={AdminPools} />
      <Route path="/admin-pools" component={AdminPools} />
      <Route path="/admin-networks" component={AdminNetworks} />
      <Route path="/admin-platforms" component={AdminPlatforms} />
      <Route path="/admin-categories" component={AdminCategories} />
      <Route path="/admin-api-keys" component={AdminApiKeys} />
      <Route path="/admin-chatgpt" component={AdminChatGPT} />
      <Route path="/admin-logo-management" component={AdminLogoManagement} />
      <Route path="/admin-errors" component={AdminErrors} />
      <Route path="/admin/error-management" component={AdminErrorManagement} />
      <Route path="/admin-error-management" component={AdminErrorManagement} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin-analytics" component={AdminAnalytics} />

      {/* Pool detail routes - these must come AFTER admin routes */}
      {/* Primary SEO-friendly URL patterns for pool details */}
      <Route path="/yield/:network/:protocol/:tokenPair" component={PoolDetail} />
      <Route path="/pools/:network/:protocol/:tokenPair" component={PoolDetail} />
      
      {/* Legacy UUID-based routes for backward compatibility */}
      <Route path="/pool/:poolId" component={PoolDetail} />
      <Route path="/pools/:poolId" component={PoolDetail} />
      <Route path="/:poolId" component={PoolDetail} /> {/* Direct UUID support - MUST be last */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vault-aggregator-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
