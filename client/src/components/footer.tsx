import { BarChart3, Twitter, Github, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold" data-testid="text-footer-title">Vault Aggregator</h3>
                <p className="text-gray-400 text-sm" data-testid="text-footer-subtitle">DeFi Yield Aggregator</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4" data-testid="text-footer-description">
              Discover and track the best DeFi yield opportunities across multiple chains and protocols. 
              Stay informed with real-time data and comprehensive analytics.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                data-testid="link-twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                data-testid="link-discord"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                data-testid="link-github"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors duration-200" data-testid="link-dashboard">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-white transition-colors duration-200" data-testid="link-analytics">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-white transition-colors duration-200" data-testid="link-api">
                  API
                </Link>
              </li>
              <li>
                <Link href="/documentation" className="hover:text-white transition-colors duration-200" data-testid="link-docs">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/help-center" className="hover:text-white transition-colors duration-200" data-testid="link-help">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors duration-200" data-testid="link-contact">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors duration-200" data-testid="link-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors duration-200" data-testid="link-terms">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">More</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/chains" className="hover:text-white transition-colors duration-200" data-testid="link-chains">
                  Chains
                </Link>
              </li>
              <li>
                <Link href="/companion" className="hover:text-white transition-colors duration-200" data-testid="link-companion">
                  AI Companion
                </Link>
              </li>
              <li>
                <Link href="/market-intelligence" className="hover:text-white transition-colors duration-200" data-testid="link-market-intelligence">
                  Market Intelligence
                </Link>
              </li>
              <li>
                <Link href="/investment-advisor" className="hover:text-white transition-colors duration-200" data-testid="link-investment-advisor">
                  Investment Advisor
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p data-testid="text-copyright">
            &copy; 2024 Vault Aggregator. All rights reserved. Data provided by DeFi Llama.
          </p>
        </div>
      </div>
    </footer>
  );
}
