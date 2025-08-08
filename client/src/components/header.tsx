import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, BarChart3, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { AINavigationMenu } from "@/components/ai-navigation-menu";

interface HeaderProps {
  onAdminClick: () => void;
}

export default function Header({ onAdminClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-site-title">Vault Aggregator</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-site-subtitle">DeFi Yield Aggregator</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
              data-testid="link-dashboard"
            >
              Dashboard
            </Link>
            <Link 
              href="/analytics" 
              className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              data-testid="link-analytics"
            >
              Analytics
            </Link>
            <Link 
              href="/chains" 
              className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              data-testid="link-chains"
            >
              Chains
            </Link>
            <Link 
              href="/api" 
              className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              data-testid="link-api"
            >
              API
            </Link>
            <Link 
              href="/documentation" 
              className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              data-testid="link-documentation"
            >
              Docs
            </Link>
            <Link 
              href="/help-center" 
              className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              data-testid="link-help"
            >
              Help
            </Link>
            <Link 
              href="/investment-advisor" 
              className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              data-testid="link-investment-advisor"
            >
              AI Advisor
            </Link>

            {/* Advanced Features Dropdown */}
            <div className="relative group">
              <button className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex items-center gap-1">
                Advanced
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link
                    href="/risk-dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-risk-dashboard"
                  >
                    Risk Analysis Dashboard
                  </Link>
                  <Link
                    href="/smart-alerts"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-smart-alerts"
                  >
                    Smart Alerts
                  </Link>
                  <Link
                    href="/pool-reviews"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-pool-reviews"
                  >
                    Pool Reviews & Ratings
                  </Link>
                  <Link
                    href="/community-insights"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-community-insights"
                  >
                    Community Insights
                  </Link>
                  <Link
                    href="/watchlists"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-watchlists"
                  >
                    Custom Watchlists
                  </Link>
                  <Link
                    href="/api-marketplace"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    data-testid="link-api-marketplace"
                  >
                    API Marketplace
                  </Link>
                </div>
              </div>
            </div>

            <Link 
              href="/contact" 
              className="text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              data-testid="link-contact"
            >
              Contact
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <AINavigationMenu />
            <ThemeToggle />
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4" data-testid="mobile-menu">
            <nav className="space-y-2">
              <Link 
                href="/dashboard" 
                className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/analytics" 
                className="block px-4 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-analytics"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link 
                href="/chains" 
                className="block px-4 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-chains"
                onClick={() => setMobileMenuOpen(false)}
              >
                Chains
              </Link>
              <Link 
                href="/api" 
                className="block px-4 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-api"
                onClick={() => setMobileMenuOpen(false)}
              >
                API
              </Link>
              <Link 
                href="/documentation" 
                className="block px-4 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-documentation"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
              <Link 
                href="/help-center" 
                className="block px-4 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-help"
                onClick={() => setMobileMenuOpen(false)}
              >
                Help Center
              </Link>
              <Link 
                href="/investment-advisor" 
                className="block px-4 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-investment-advisor"
                onClick={() => setMobileMenuOpen(false)}
              >
                AI Investment Advisor
              </Link>
              
              <div className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Advanced Features
              </div>
              <Link 
                href="/risk-dashboard" 
                className="block px-6 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-risk-dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                Risk Analysis
              </Link>
              <Link 
                href="/smart-alerts" 
                className="block px-6 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-smart-alerts"
                onClick={() => setMobileMenuOpen(false)}
              >
                Smart Alerts
              </Link>
              <Link 
                href="/pool-reviews" 
                className="block px-6 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-pool-reviews"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pool Reviews
              </Link>
              <Link 
                href="/community-insights" 
                className="block px-6 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-community-insights"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community Insights
              </Link>
              <Link 
                href="/watchlists" 
                className="block px-6 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-watchlists"
                onClick={() => setMobileMenuOpen(false)}
              >
                Watchlists
              </Link>
              <Link 
                href="/api-marketplace" 
                className="block px-6 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-api-marketplace"
                onClick={() => setMobileMenuOpen(false)}
              >
                API Marketplace
              </Link>
              <Link 
                href="/contact" 
                className="block px-4 py-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                data-testid="link-mobile-contact"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
