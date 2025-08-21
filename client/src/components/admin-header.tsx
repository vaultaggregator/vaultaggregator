import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Home, Database, Key, Settings, Users, Tag, BarChart3, AlertTriangle, Monitor, Layers, Activity, ChevronDown, Menu, X, Shield, TrendingUp, FileText, Eye } from "lucide-react";
import { useAuth, type User } from "@/hooks/useAuth";
import { useState } from "react";

export function AdminHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear session and redirect to home
    fetch("/api/auth/logout", { 
      method: "POST",
      credentials: "include" 
    }).then(() => {
      window.location.href = "/";
    });
  };

  // Organized navigation with grouped sections
  const navSections = [
    {
      label: "Overview",
      items: [
        { path: "/admin", icon: BarChart3, label: "Dashboard" },
        { path: "/admin-analytics", icon: TrendingUp, label: "Analytics" },
      ]
    },
    {
      label: "System",
      items: [
        { path: "/admin/system", icon: Monitor, label: "System Health", highlight: "system" },
        { path: "/admin/services", icon: Activity, label: "Services", highlight: "service" },
        { path: "/admin/api-settings", icon: Settings, label: "API Settings", highlight: "service" },
      ]
    },
    {
      label: "Content",
      items: [
        { path: "/admin/pools", icon: Layers, label: "Pools" },
        { path: "/admin-platforms", icon: Database, label: "Platforms" },
        { path: "/admin-networks", icon: Settings, label: "Networks" },
        { path: "/admin-categories", icon: Tag, label: "Categories" },
        { path: "/admin-content", icon: FileText, label: "Content" },
        { path: "/admin-monitoring", icon: Eye, label: "Monitoring" },
      ]
    },
    {
      label: "Security",
      items: [
        { path: "/admin-users", icon: Users, label: "Users" },
        { path: "/admin-security", icon: Shield, label: "Security" },
        { path: "/admin-api-keys", icon: Key, label: "API Keys" },
        { path: "/admin-errors", icon: AlertTriangle, label: "Error Logs", highlight: "error" },
      ]
    }
  ];

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <a className="flex items-center space-x-2 text-white hover:text-blue-300 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">VA</span>
                </div>
                <div>
                  <span className="font-bold text-xl text-white">Admin Panel</span>
                  <p className="text-xs text-gray-300">System Management</p>
                </div>
              </a>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navSections.map((section) => (
              <DropdownMenu key={section.label}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-blue-300 hover:bg-gray-700 flex items-center space-x-1"
                  >
                    <span>{section.label}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">
                    {section.label}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    
                    return (
                      <DropdownMenuItem key={item.path} className="p-0">
                        <Link href={item.path} className="w-full">
                          <a className={`
                            flex items-center space-x-2 px-3 py-2 text-sm w-full
                            ${isActive 
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                              : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
                            }
                          `}>
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            className="lg:hidden text-white hover:text-blue-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">View Site</span>
              </Button>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user ? (user as User)?.username || 'Admin' : 'Admin'}
                </p>
                <p className="text-xs text-gray-300">Administrator</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-red-300 border-red-500/50 hover:bg-red-500/20 hover:text-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>



        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
            <div className="px-4 py-4 space-y-2">
              {navSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                    {section.label}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    
                    return (
                      <Link key={item.path} href={item.path}>
                        <a
                          className={`
                            flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors
                            ${isActive 
                              ? "bg-blue-600 text-white" 
                              : "text-gray-300 hover:text-white hover:bg-gray-700"
                            }
                          `}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                  {section !== navSections[navSections.length - 1] && (
                    <div className="border-t border-gray-700 my-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default AdminHeader;