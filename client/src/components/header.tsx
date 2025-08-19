import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, BarChart3, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { WebSocketStatus } from "@/components/websocket-status";


interface HeaderProps {
  onAdminClick?: () => void;
}

export default function Header({ onAdminClick = () => {} }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white" data-testid="text-site-title">Vault Aggregator</h1>
              <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400" data-testid="text-site-subtitle">DeFi Yield Aggregator</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">




          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <WebSocketStatus variant="compact" />
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


            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
