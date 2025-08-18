import { BarChart3 } from "lucide-react";
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
                href="https://x.com/vaultaggregator" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                data-testid="link-twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="text-right">
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

            </ul>
          </div>
          
          <div className="text-right">
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">

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


        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p data-testid="text-copyright">
            &copy; 2025 Vault Aggregator. All rights reserved. Data provided by DeFi Llama.
          </p>
        </div>
      </div>
    </footer>
  );
}
