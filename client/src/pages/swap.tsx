import { useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownIcon } from 'lucide-react';

export default function Swap() {
  // Set document title
  useEffect(() => {
    document.title = 'Swap - Vault Aggregator';
  }, []);

  return (
    <AppShell>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Swap
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Exchange tokens across DeFi protocols
          </p>
        </div>

        {/* Swap Card */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Token Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* From Token */}
              <div className="space-y-2">
                <Label htmlFor="from-amount" className="text-sm text-gray-600 dark:text-gray-400">
                  From
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="from-amount"
                    type="number"
                    placeholder="0.0"
                    disabled
                    className="flex-1"
                  />
                  <Button variant="outline" disabled className="w-32">
                    Select Token
                  </Button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: --
                </div>
              </div>

              {/* Swap Direction */}
              <div className="flex justify-center py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled
                  className="rounded-full border border-gray-200 dark:border-gray-700"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <Label htmlFor="to-amount" className="text-sm text-gray-600 dark:text-gray-400">
                  To
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="to-amount"
                    type="number"
                    placeholder="0.0"
                    disabled
                    className="flex-1"
                  />
                  <Button variant="outline" disabled className="w-32">
                    Select Token
                  </Button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: --
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                  <span className="text-gray-900 dark:text-gray-100">--</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
                  <span className="text-gray-900 dark:text-gray-100">--</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Network Fee</span>
                  <span className="text-gray-900 dark:text-gray-100">--</span>
                </div>
              </div>

              {/* Swap Button */}
              <Button 
                className="w-full" 
                size="lg"
                disabled
              >
                Connect Wallet to Swap
              </Button>

              {/* Notice */}
              <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                Swap functionality is coming soon
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}