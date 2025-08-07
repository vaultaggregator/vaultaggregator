import { BarChart3, Twitter, Github, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
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
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-dashboard">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-analytics">
                  Analytics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-api">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-docs">
                  Documentation
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-help">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-contact">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-privacy">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200" data-testid="link-terms">
                  Terms of Service
                </a>
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
