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
import AdminApiKeys from "@/pages/admin-api-keys";
import PoolDetail from "@/pages/pool-detail";
import { CompanionPage } from "@/pages/companion";
import InvestmentAdvisor from "@/pages/investment-advisor";
import RiskDashboard from "@/pages/risk-dashboard";
import SmartAlerts from "@/pages/smart-alerts";
import PoolReviews from "@/pages/pool-reviews";
import CommunityInsights from "@/pages/community-insights";
import Watchlists from "@/pages/watchlists";
import ApiMarketplace from "@/pages/api-marketplace";
import FloatingChat from "@/components/floating-chat";


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
      <Route path="/yield/:network/:protocol/:poolId/:slug?" component={PoolDetail} />
      <Route path="/pool/:poolId" component={PoolDetail} /> {/* Legacy support */}
      <Route path="/companion" component={CompanionPage} />
      <Route path="/investment-advisor" component={InvestmentAdvisor} />
      <Route path="/risk-dashboard" component={RiskDashboard} />
      <Route path="/smart-alerts" component={SmartAlerts} />
      <Route path="/pool-reviews" component={PoolReviews} />
      <Route path="/community-insights" component={CommunityInsights} />
      <Route path="/watchlists" component={Watchlists} />
      <Route path="/api-marketplace" component={ApiMarketplace} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-networks" component={AdminNetworks} />
      <Route path="/admin-platforms" component={AdminPlatforms} />
      <Route path="/admin-categories" component={AdminCategories} />
      <Route path="/admin-api-keys" component={AdminApiKeys} />
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
          <FloatingChat />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
