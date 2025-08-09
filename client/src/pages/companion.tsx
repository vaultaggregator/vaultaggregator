import { CryptoCompanion } from "@/components/crypto-companion";
import Header from "@/components/header";
import Footer from "@/components/footer";

export function CompanionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Crypto Companion
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your AI-powered DeFi assistant for yield farming insights and personalized investment advice
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CryptoCompanion />
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  What I can help with:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    Find high-yield farming opportunities
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    Analyze risk levels and safety
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    Compare different protocols
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    Explain market trends
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500">•</span>
                    Provide investment strategies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500">•</span>
                    Answer DeFi questions
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Tips:
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      💡 Start Small
                    </p>
                    <p>Test strategies with small amounts first</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      🔍 DYOR
                    </p>
                    <p>Always research protocols thoroughly</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      🛡️ Diversify
                    </p>
                    <p>Spread risk across multiple platforms</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Example Questions:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    "What are the best high-yield pools?"
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    "Show me low-risk stablecoin yields"
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    "Compare Aave vs Morpho"
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    "What's happening in DeFi today?"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}