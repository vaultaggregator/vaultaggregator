import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, Globe, Users } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2" data-testid="text-privacy-subtitle">
            Last updated: December 2024
          </p>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Privacy Summary</h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Vault Aggregator respects your privacy and is committed to protecting your personal information. 
                  We collect minimal data necessary to provide our services, never sell your information to third parties, 
                  and use industry-standard security measures to protect your data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-600" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Information You Provide</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                  <li>Contact information when you reach out for support</li>
                  <li>Account information if you create an account</li>
                  <li>Feedback and communications you send to us</li>
                  <li>Newsletter subscription information</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Information We Collect Automatically</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                  <li>Usage data and analytics (pages visited, time spent, features used)</li>
                  <li>Device information (browser type, operating system, screen resolution)</li>
                  <li>IP address and approximate location</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Blockchain Data</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                  <li>Wallet addresses you connect (publicly available on blockchain)</li>
                  <li>Transaction data related to DeFi interactions</li>
                  <li>Portfolio information for analytical purposes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Service Provision</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                  <li>Provide and maintain Vault Aggregator services</li>
                  <li>Process and respond to your inquiries</li>
                  <li>Personalize your experience and improve our platform</li>
                  <li>Send important service updates and notifications</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Analytics and Improvement</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                  <li>Analyze usage patterns to improve our services</li>
                  <li>Monitor platform performance and identify issues</li>
                  <li>Develop new features and functionality</li>
                  <li>Generate aggregated, anonymized statistics</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Legal and Security</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                  <li>Comply with legal obligations and regulatory requirements</li>
                  <li>Protect against fraud, abuse, and security threats</li>
                  <li>Enforce our terms of service and other policies</li>
                  <li>Respond to legal requests and prevent harm</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-600">
                <h4 className="font-semibold text-red-900 dark:text-red-50 mb-2">We Do NOT Sell Your Data</h4>
                <p className="text-red-800 dark:text-red-100 text-sm">
                  Vault Aggregator does not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">We May Share Information With:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-4 list-disc">
                  <li><strong>Service Providers:</strong> Third-party companies that help us operate our platform (hosting, analytics, support)</li>
                  <li><strong>Business Partners:</strong> DeFi protocols and blockchain networks we integrate with</li>
                  <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                  <li><strong>Consent:</strong> When you explicitly authorize us to share your information</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-orange-600" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We implement industry-standard security measures to protect your information:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Technical Safeguards</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                    <li>SSL/TLS encryption for data transmission</li>
                    <li>Encrypted data storage</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Organizational Measures</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                    <li>Employee training on data protection</li>
                    <li>Limited access to personal information</li>
                    <li>Incident response procedures</li>
                    <li>Regular privacy impact assessments</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Your Privacy Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: "Access",
                    description: "Request a copy of the personal information we hold about you"
                  },
                  {
                    title: "Rectification",
                    description: "Request correction of inaccurate or incomplete information"
                  },
                  {
                    title: "Erasure",
                    description: "Request deletion of your personal information under certain conditions"
                  },
                  {
                    title: "Portability",
                    description: "Request transfer of your data to another service provider"
                  },
                  {
                    title: "Restriction",
                    description: "Request limitation on how we process your information"
                  },
                  {
                    title: "Objection",
                    description: "Object to certain types of processing of your information"
                  }
                ].map((right, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{right.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{right.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:privacy@vault-aggregator.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  privacy@vault-aggregator.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-600" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Vault Aggregator operates globally and may transfer your information to countries outside your residence. 
                We ensure appropriate safeguards are in place:
              </p>
              
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                <li>Standard Contractual Clauses for EU data transfers</li>
                <li>Adequacy decisions where available</li>
                <li>Binding corporate rules for internal transfers</li>
                <li>Your explicit consent where required</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                We may update this Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc mb-4">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending you an email notification for significant changes</li>
                <li>Providing prominent notice on our platform</li>
              </ul>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your continued use of our services after any changes indicates your acceptance of the new Privacy Policy.
              </p>
            </CardContent>
          </Card>

          
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}