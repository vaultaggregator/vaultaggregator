import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, BarChart3, ChevronDown } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  onAdminClick: () => void;
}

export default function Header({ onAdminClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" data-testid="text-site-title">Vault Aggregator</h1>
              <p className="text-xs text-gray-500" data-testid="text-site-subtitle">DeFi Yield Aggregator</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
              data-testid="link-dashboard"
            >
              Dashboard
            </Link>
            <Link 
              href="/analytics" 
              className="text-gray-500 hover:text-primary-600 transition-colors duration-200"
              data-testid="link-analytics"
            >
              Analytics
            </Link>
            <Link 
              href="/chains" 
              className="text-gray-500 hover:text-primary-600 transition-colors duration-200"
              data-testid="link-chains"
            >
              Chains
            </Link>
            <Link 
              href="/api" 
              className="text-gray-500 hover:text-primary-600 transition-colors duration-200"
              data-testid="link-api"
            >
              API
            </Link>
            <Link 
              href="/documentation" 
              className="text-gray-500 hover:text-primary-600 transition-colors duration-200"
              data-testid="link-documentation"
            >
              Docs
            </Link>
            <Link 
              href="/help-center" 
              className="text-gray-500 hover:text-primary-600 transition-colors duration-200"
              data-testid="link-help"
            >
              Help
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-500 hover:text-primary-600 transition-colors duration-200"
              data-testid="link-contact"
            >
              Contact
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4" data-testid="mobile-menu">
            <nav className="space-y-2">
              <Link 
                href="/dashboard" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                data-testid="link-mobile-dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/analytics" 
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                data-testid="link-mobile-analytics"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link 
                href="/chains" 
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                data-testid="link-mobile-chains"
                onClick={() => setMobileMenuOpen(false)}
              >
                Chains
              </Link>
              <Link 
                href="/api" 
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                data-testid="link-mobile-api"
                onClick={() => setMobileMenuOpen(false)}
              >
                API
              </Link>
              <Link 
                href="/documentation" 
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                data-testid="link-mobile-documentation"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
              <Link 
                href="/help-center" 
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                data-testid="link-mobile-help"
                onClick={() => setMobileMenuOpen(false)}
              >
                Help Center
              </Link>
              <Link 
                href="/contact" 
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
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
