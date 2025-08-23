import { useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  // Set document title
  useEffect(() => {
    document.title = 'Terms of Service - Vault Aggregator';
  }, []);

  return (
    <AppShell>
      <div className="p-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Terms of Service</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Last updated: August 23, 2025
              </p>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                By accessing and using Vault Aggregator, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>

              <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Permission is granted to temporarily access the materials (information or software) on 
                Vault Aggregator for personal, non-commercial transitory viewing only.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                <li>This license shall automatically terminate if you violate any of these restrictions</li>
                <li>Upon terminating your viewing of these materials, you must destroy any downloaded materials</li>
                <li>You may not use our service for any illegal or unauthorized purpose</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3">3. Investment Disclaimer</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                The information provided on Vault Aggregator is for informational purposes only and should 
                not be considered as financial or investment advice. DeFi investments carry significant risks:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                <li>Past performance does not guarantee future results</li>
                <li>APY rates are subject to change and may fluctuate</li>
                <li>Smart contract risks and potential loss of funds</li>
                <li>Market volatility and impermanent loss</li>
                <li>Always do your own research (DYOR) before investing</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3">4. Accuracy of Materials</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                The materials appearing on Vault Aggregator could include technical, typographical, or 
                photographic errors. We do not warrant that any of the materials are accurate, complete, 
                or current. We may make changes to the materials at any time without notice.
              </p>

              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Vault Aggregator aggregates data from various DeFi protocols and platforms. We are not 
                responsible for the services, security, or reliability of these third-party platforms:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                <li>We do not control the underlying smart contracts</li>
                <li>We are not responsible for losses on third-party platforms</li>
                <li>Users interact with protocols at their own risk</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3">6. Privacy</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Your use of our website is also governed by our Privacy Policy. Please review our 
                Privacy Policy, which also governs the site and informs users of our data collection practices.
              </p>

              <h2 className="text-xl font-semibold mb-3">7. Prohibited Uses</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                You may not use Vault Aggregator:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To interfere with or circumvent the security features of the service</li>
                <li>To transmit viruses or any other type of malicious code</li>
                <li>To engage in any automated use of the system</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                In no event shall Vault Aggregator or its suppliers be liable for any damages (including, 
                without limitation, damages for loss of data or profit, or due to business interruption) 
                arising out of the use or inability to use the materials on Vault Aggregator, even if 
                Vault Aggregator or an authorized representative has been notified orally or in writing 
                of the possibility of such damage.
              </p>

              <h2 className="text-xl font-semibold mb-3">9. Modifications</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Vault Aggregator may revise these terms of service at any time without notice. By using 
                this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>

              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                These terms and conditions are governed by and construed in accordance with the laws of 
                the jurisdiction in which the service operates, and you irrevocably submit to the exclusive 
                jurisdiction of the courts in that location.
              </p>

              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                If you have any questions about these Terms of Service, please contact us through the 
                Contact page on our website.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}