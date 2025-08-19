import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Shield, Scale, Globe, Users } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-terms-title">
            Terms of Service
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-terms-subtitle">
            Last updated: December 2024
          </p>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-8 h-8 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Important Notice</h3>
                <p className="text-orange-800 text-sm">
                  Please read these Terms of Service carefully before using Vault Aggregator. 
                  By accessing or using our services, you agree to be bound by these terms. 
                  If you disagree with any part of these terms, you may not access our services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                These Terms of Service ("Terms") govern your use of Vault Aggregator's website, 
                platform, and services (collectively, the "Service") operated by Vault Aggregator, Inc. ("we," "us," or "our").
              </p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">By using our Service, you agree to:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Comply with these Terms and all applicable laws and regulations</li>
                  <li>Be at least 18 years old or have parental/guardian consent</li>
                  <li>Provide accurate and truthful information</li>
                  <li>Use the Service only for lawful purposes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-600" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Vault Aggregator is a decentralized finance (DeFi) yield aggregation platform that provides:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Core Services</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                    <li>Yield opportunity discovery and comparison</li>
                    <li>Real-time APY and TVL data aggregation</li>
                    <li>Risk assessment and analytics</li>
                    <li>Multi-chain protocol integration</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Important Disclaimers</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                    <li>We are an information aggregator only</li>
                    <li>We do not custody or manage your assets</li>
                    <li>We do not provide investment advice</li>
                    <li>All investments carry inherent risks</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Account Security</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Maintain the confidentiality of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Use strong passwords and enable two-factor authentication where available</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Wallet and Private Key Security</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>You are solely responsible for your wallet and private keys</li>
                  <li>We cannot recover lost private keys or access your funds</li>
                  <li>Always verify smart contract addresses before interacting</li>
                  <li>Use reputable wallets and keep them updated</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Prohibited Activities</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Attempting to gain unauthorized access to our systems</li>
                  <li>Using the Service for money laundering or illegal activities</li>
                  <li>Manipulating or providing false information</li>
                  <li>Interfering with other users' access to the Service</li>
                  <li>Reverse engineering or copying our technology</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Financial Disclaimers */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-900">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Financial Disclaimers and Risk Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Badge variant="destructive" className="mb-2">High Risk</Badge>
                  <h4 className="font-semibold text-red-900 mb-2">DeFi Investment Risks</h4>
                  <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
                    <li>DeFi protocols involve significant financial risk including total loss of funds</li>
                    <li>Smart contracts may contain bugs, vulnerabilities, or be subject to hacks</li>
                    <li>Token prices are highly volatile and can lose value rapidly</li>
                    <li>Impermanent loss may occur in liquidity providing</li>
                    <li>Regulatory changes may affect protocol operations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-900 mb-2">No Investment Advice</h4>
                  <p className="text-sm text-red-800">
                    Vault Aggregator provides information only and does not constitute financial, investment, 
                    or trading advice. All investment decisions are your sole responsibility. You should conduct 
                    your own research and consult with qualified financial advisors before making investment decisions.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-red-900 mb-2">No Guarantees</h4>
                  <p className="text-sm text-red-800">
                    We make no representations or warranties about the accuracy of data, expected returns, 
                    or the safety of any protocol. Past performance does not predict future results. 
                    APY rates and other metrics are estimates and may not reflect actual returns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-orange-600" />
                Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Our Content</h4>
                <p className="text-sm text-gray-600 mb-2">
                  The Service and its original content, features, and functionality are owned by Vault Aggregator 
                  and are protected by international copyright, trademark, patent, trade secret, and other 
                  intellectual property laws.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>You may not copy, modify, distribute, or reverse engineer our platform</li>
                  <li>Our logos, trademarks, and brand elements are protected</li>
                  <li>You may not use our intellectual property without written permission</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">User Content</h4>
                <p className="text-sm text-gray-600">
                  You retain ownership of any content you submit to our Service. However, by submitting content, 
                  you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute 
                  your content in connection with the Service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-5 h-5 mr-2 text-blue-600" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">DISCLAIMER OF WARRANTIES</h4>
                <p className="text-sm text-gray-600">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                  INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                  PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Liability Limitations</h4>
                <p className="text-sm text-gray-600 mb-3">
                  To the maximum extent permitted by law, Vault Aggregator shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including but not limited to:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Financial losses from DeFi protocol interactions</li>
                  <li>Damages resulting from security breaches or hacks</li>
                  <li>Losses due to market volatility or price changes</li>
                  <li>Technical failures or service interruptions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Maximum Liability</h4>
                <p className="text-sm text-gray-600">
                  In any case, our total liability to you for all damages shall not exceed the amount 
                  you paid to us for the Service in the 12 months preceding the claim, or $100, whichever is greater.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">By You</h4>
                <p className="text-sm text-gray-600">
                  You may stop using our Service at any time. If you have an account, you may delete it 
                  or contact us to request account deletion.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">By Us</h4>
                <p className="text-sm text-gray-600 mb-2">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Violation of these Terms</li>
                  <li>Suspected illegal or harmful activity</li>
                  <li>Extended periods of inactivity</li>
                  <li>Business or technical reasons</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-5 h-5 mr-2 text-purple-600" />
                Governing Law and Dispute Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Governing Law</h4>
                <p className="text-sm text-gray-600">
                  These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
                  United States, without regard to its conflict of law provisions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Dispute Resolution</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Any disputes arising from these Terms or your use of the Service will be resolved through:
                </p>
                <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                  <li>Good faith negotiation between the parties</li>
                  <li>Binding arbitration if negotiation fails</li>
                  <li>The state and federal courts of Delaware as a last resort</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to These Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by:
              </p>
              
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc mb-4">
                <li>Updating the "Last updated" date at the top of this page</li>
                <li>Sending email notifications to registered users</li>
                <li>Posting prominent notices on our platform</li>
                <li>Requiring acceptance for significant changes</li>
              </ul>

              <p className="text-sm text-gray-600">
                Your continued use of the Service after any changes constitutes acceptance of the new Terms. 
                If you disagree with the changes, you must stop using the Service.
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