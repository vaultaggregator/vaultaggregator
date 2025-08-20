import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNumber } from '@/lib/format';
import { Calculator, DollarSign, TrendingUp } from 'lucide-react';

interface APYCalculatorProps {
  currentAPY: number;
  tokenSymbol?: string;
}

export function APYCalculator({ currentAPY, tokenSymbol = 'USDC' }: APYCalculatorProps) {
  const [depositAmount, setDepositAmount] = useState<string>('1000');
  const [monthlyEarnings, setMonthlyEarnings] = useState<number>(0);
  const [yearlyEarnings, setYearlyEarnings] = useState<number>(0);

  useEffect(() => {
    const amount = parseFloat(depositAmount) || 0;
    const apyDecimal = currentAPY / 100;
    
    // Calculate yearly earnings
    const yearly = amount * apyDecimal;
    
    // Calculate monthly earnings (compound interest approximation)
    const monthly = (amount * Math.pow(1 + apyDecimal, 1/12)) - amount;
    
    setYearlyEarnings(yearly);
    setMonthlyEarnings(monthly);
  }, [depositAmount, currentAPY]);

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDepositAmount(value);
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          APY Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deposit Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="deposit-amount" className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Deposit {tokenSymbol}
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="deposit-amount"
              type="text"
              value={depositAmount}
              onChange={handleDepositChange}
              placeholder="0.00"
              className="pl-10 text-2xl font-bold bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500"
              data-testid="input-deposit-amount"
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            ${formatNumber(parseFloat(depositAmount) || 0, { maxDecimals: 2 })}
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3 pt-2">
          {/* Current APY Display */}
          <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">APY</span>
            </div>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-current-apy">
              {currentAPY.toFixed(2)}%
            </span>
          </div>

          {/* Monthly Earnings */}
          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Monthly earnings</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-monthly-earnings">
              ${formatNumber(monthlyEarnings, { maxDecimals: 2 })}
            </span>
          </div>

          {/* Yearly Earnings */}
          <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Yearly earnings</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-yearly-earnings">
              ${formatNumber(yearlyEarnings, { maxDecimals: 2 })}
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
          * Calculations are estimates based on current APY and assume compound interest. Actual returns may vary due to market conditions.
        </p>
      </CardContent>
    </Card>
  );
}