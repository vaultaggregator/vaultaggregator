import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { lazy, Suspense } from "react";

// Core pages - loaded immediately
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import RiskCalculation from "@/pages/risk-calculation";

// Heavy pages - lazy loaded for better performance
const PoolDetail = lazy(() => import("@/pages/pool-detail"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const ProtocolDetailPage = lazy(() => import("@/pages/protocol-detail").then(m => ({ default: m.ProtocolDetailPage })));
const TokenDetail = lazy(() => import("@/pages/token-detail"));
const NetworkDetail = lazy(() => import("@/pages/network-detail"));
const PoolTransfersPage = lazy(() => import("@/pages/pool-transfers"));
const PoolHoldersPage = lazy(() => import("@/pages/pool-holders"));

// Admin pages - lazy loaded to reduce initial bundle
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminNetworks = lazy(() => import("@/pages/admin-networks"));
const AdminPlatforms = lazy(() => import("@/pages/admin-platforms"));
const AdminCategories = lazy(() => import("@/pages/admin-categories"));
const AdminTokens = lazy(() => import("@/pages/admin-tokens"));
const AdminApiKeys = lazy(() => import("@/pages/admin-api-keys"));
const AdminChatGPT = lazy(() => import("@/pages/admin-chatgpt"));
const AdminLogoManagement = lazy(() => import("@/pages/admin-logo-management"));
const AdminErrors = lazy(() => import("@/pages/admin-errors"));
const AdminSystem = lazy(() => import("@/pages/admin-system"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const AdminPools = lazy(() => import("@/pages/admin-pools"));
const ServiceMonitor = lazy(() => import("@/pages/admin/service-monitor"));
const AdminApiSettings = lazy(() => import("@/pages/AdminApiSettings"));
const AdminAnalytics = lazy(() => import("@/pages/admin-analytics"));
const AdminErrorManagement = lazy(() => import("@/pages/admin-error-management"));
const AdminHardcodeScan = lazy(() => import("@/pages/admin-hardcode-scan"));
const HealingDashboard = lazy(() => import("@/pages/healing-dashboard"));
const CacheMonitor = lazy(() => import("@/pages/admin/cache-monitor").then(m => ({ default: m.CacheMonitor })));
const AdminSwrCache = lazy(() => import("@/pages/admin-swr-cache"));



// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/risk-calculation" component={RiskCalculation} />
        <Route path="/profile/:address" component={ProfilePage} />
        <Route path="/protocols/:slug" component={ProtocolDetailPage} />
        <Route path="/protocol/:slug" component={ProtocolDetailPage} />
        <Route path="/token/:chainName/:tokenAddress" component={TokenDetail} />
        <Route path="/network/:name" component={NetworkDetail} />
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
        <Route path="/admin/services" component={ServiceMonitor} />
        <Route path="/admin/api-settings" component={AdminApiSettings} />
        <Route path="/admin/cache-monitor" component={CacheMonitor} />
        <Route path="/admin/swr-cache" component={AdminSwrCache} />

        <Route path="/admin/panel" component={AdminPanel} />
        <Route path="/admin/pools" component={AdminPools} />
        <Route path="/admin-pools" component={AdminPools} />
        <Route path="/admin-networks" component={AdminNetworks} />
        <Route path="/admin-platforms" component={AdminPlatforms} />
        <Route path="/admin-categories" component={AdminCategories} />
        <Route path="/admin-tokens" component={AdminTokens} />
        <Route path="/admin-api-keys" component={AdminApiKeys} />
        <Route path="/admin-chatgpt" component={AdminChatGPT} />
        <Route path="/admin-logo-management" component={AdminLogoManagement} />
        <Route path="/admin-errors" component={AdminErrors} />
        <Route path="/admin/error-management" component={AdminErrorManagement} />
        <Route path="/admin-error-management" component={AdminErrorManagement} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin-analytics" component={AdminAnalytics} />
        <Route path="/admin/hardcode-scan" component={AdminHardcodeScan} />
        <Route path="/admin-hardcode-scan" component={AdminHardcodeScan} />

        {/* Pool detail routes - these must come AFTER admin routes */}
        {/* Pool-specific pages - these must come BEFORE the generic pool detail routes */}
        <Route path="/yield/:network/:protocol/:tokenPair/transfers" component={PoolTransfersPage} />
        <Route path="/yield/:network/:protocol/:tokenPair/holders" component={PoolHoldersPage} />
        
        {/* SEO-friendly URL patterns for pool details */}
        <Route path="/yield/:network/:protocol/:tokenPair" component={PoolDetail} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
