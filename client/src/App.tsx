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

import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";

import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminNetworks from "@/pages/admin-networks";
import AdminPlatforms from "@/pages/admin-platforms";
import AdminCategories from "@/pages/admin-categories";
import AdminApiKeys from "@/pages/admin-api-keys";
import PoolDetail from "@/pages/pool-detail";
import RiskDashboard from "@/pages/risk-dashboard";
import SmartAlerts from "@/pages/smart-alerts";
import PoolReviews from "@/pages/pool-reviews";

import Watchlists from "@/pages/watchlists";
import ApiMarketplace from "@/pages/api-marketplace";

import AdminLogoManagement from "@/pages/admin-logo-management";
import AdminErrors from "@/pages/admin-errors";
import AdminCache from "@/pages/admin-cache";
import AdminSystem from "@/pages/admin-system";
import AdminPanel from "@/pages/admin-panel";
import AdvancedSearch from "@/pages/advanced-search";
import YieldForecasting from "@/pages/yield-forecasting";
import RiskCalculator from "@/pages/risk-calculator";
import EtherscanDashboard from "@/pages/etherscan-dashboard";
import HealingDashboard from "@/pages/healing-dashboard";
import Portfolio from "@/pages/portfolio";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/chains" component={Chains} />

      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />

      <Route path="/yield/:network/:protocol/:poolId/:slug?" component={PoolDetail} />
      <Route path="/pool/:poolId" component={PoolDetail} /> {/* Legacy support */}
      <Route path="/pools/:poolId" component={PoolDetail} /> {/* Pools (plural) support */}
      <Route path="/risk-dashboard" component={RiskDashboard} />
      <Route path="/smart-alerts" component={SmartAlerts} />
      <Route path="/pool-reviews" component={PoolReviews} />

      <Route path="/watchlists" component={Watchlists} />
      <Route path="/api-marketplace" component={ApiMarketplace} />
      <Route path="/advanced-search" component={AdvancedSearch} />
      <Route path="/yield-forecasting" component={YieldForecasting} />
      <Route path="/risk-calculator" component={RiskCalculator} />
      <Route path="/etherscan" component={EtherscanDashboard} />
      <Route path="/admin/healing" component={HealingDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/cache" component={AdminCache} />
      <Route path="/admin/system" component={AdminSystem} />
      <Route path="/admin/panel" component={AdminPanel} />
      <Route path="/admin-networks" component={AdminNetworks} />
      <Route path="/admin-platforms" component={AdminPlatforms} />
      <Route path="/admin-categories" component={AdminCategories} />
      <Route path="/admin-api-keys" component={AdminApiKeys} />
      <Route path="/admin-logo-management" component={AdminLogoManagement} />
      <Route path="/admin-errors" component={AdminErrors} />
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
