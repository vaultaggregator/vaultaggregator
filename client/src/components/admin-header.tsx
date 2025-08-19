import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Database, Key, Settings, Users, Tag, BarChart3, AlertTriangle, Monitor, Layers } from "lucide-react";
import { useAuth, type User } from "@/hooks/useAuth";

export function AdminHeader() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    // Clear session and redirect to home
    fetch("/api/auth/logout", { 
      method: "POST",
      credentials: "include" 
    }).then(() => {
      window.location.href = "/";
    });
  };

  const navItems = [
    { path: "/admin", icon: BarChart3, label: "Dashboard" },
    { path: "/admin/system", icon: Monitor, label: "System", highlight: "system" },
    { path: "/admin/pools", icon: Layers, label: "Pool Management" },

    { path: "/admin-platforms", icon: Database, label: "Platforms" },
    { path: "/admin-networks", icon: Settings, label: "Networks" },
    { path: "/admin-categories", icon: Tag, label: "Categories" },
    { path: "/admin-api-keys", icon: Key, label: "API Keys" },
    { path: "/admin-errors", icon: AlertTriangle, label: "Error Logs", highlight: "error" },
  ];

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <a className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">VA</span>
                </div>
                <span className="font-semibold text-lg">Admin Panel</span>
              </a>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              const highlightType = item.highlight;
              
              const getHighlightColors = (type: string | boolean | undefined, active: boolean) => {
                if (type === "error") {
                  return active
                    ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                    : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300";
                } else if (type === "system") {
                  return active
                    ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                    : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300";
                }
                return active
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white";
              };
              
              return (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      getHighlightColors(highlightType, isActive)
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">View Site</span>
              </Button>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user ? (user as User)?.username || 'Admin' : 'Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;