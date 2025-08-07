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
import Chains from "@/pages/chains";
import API from "@/pages/api";
import Documentation from "@/pages/documentation";
import HelpCenter from "@/pages/help-center";
import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import ListYourProject from "@/pages/list-your-project";
import PressMedia from "@/pages/press-media";
import Watchlist from "@/pages/watchlist";
import Jobs from "@/pages/jobs";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminNetworks from "@/pages/admin-networks";
import AdminPlatforms from "@/pages/admin-platforms";
import AdminCategories from "@/pages/admin-categories";
import PoolDetail from "@/pages/pool-detail";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/chains" component={Chains} />
      <Route path="/api" component={API} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/list-your-project" component={ListYourProject} />
      <Route path="/press-media" component={PressMedia} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/pool/:poolId" component={PoolDetail} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-networks" component={AdminNetworks} />
      <Route path="/admin-platforms" component={AdminPlatforms} />
      <Route path="/admin-categories" component={AdminCategories} />
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
