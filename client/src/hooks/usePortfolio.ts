/**
 * Portfolio Management Hook
 * Tracks user's saved pools and calculates portfolio metrics
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface PortfolioItem {
  poolId: string;
  amount: number;
  addedAt: Date;
  notes?: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalYield: number;
  avgApy: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  chainDistribution: Record<string, number>;
  platformDistribution: Record<string, number>;
}

const PORTFOLIO_STORAGE_KEY = 'vault-aggregator-portfolio';

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // Load portfolio from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPortfolio(parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        })));
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  }, []);

  // Save portfolio to localStorage
  const savePortfolio = useCallback((items: PortfolioItem[]) => {
    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(items));
      setPortfolio(items);
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  }, []);

  // Add pool to portfolio
  const addToPortfolio = useCallback((poolId: string, amount: number, notes?: string) => {
    const newItem: PortfolioItem = {
      poolId,
      amount,
      addedAt: new Date(),
      notes
    };
    
    const updated = [...portfolio.filter(p => p.poolId !== poolId), newItem];
    savePortfolio(updated);
    return true;
  }, [portfolio, savePortfolio]);

  // Remove pool from portfolio
  const removeFromPortfolio = useCallback((poolId: string) => {
    const updated = portfolio.filter(p => p.poolId !== poolId);
    savePortfolio(updated);
    return true;
  }, [portfolio, savePortfolio]);

  // Update portfolio item
  const updatePortfolioItem = useCallback((poolId: string, amount: number, notes?: string) => {
    const updated = portfolio.map(item => 
      item.poolId === poolId 
        ? { ...item, amount, notes }
        : item
    );
    savePortfolio(updated);
    return true;
  }, [portfolio, savePortfolio]);

  // Check if pool is in portfolio
  const isInPortfolio = useCallback((poolId: string) => {
    return portfolio.some(p => p.poolId === poolId);
  }, [portfolio]);

  // Get portfolio item
  const getPortfolioItem = useCallback((poolId: string) => {
    return portfolio.find(p => p.poolId === poolId);
  }, [portfolio]);

  // Fetch pool data for portfolio items
  const { data: poolsData, isLoading: isLoadingPools } = useQuery({
    queryKey: ['/api/pools/batch', portfolio.map(p => p.poolId)],
    queryFn: async () => {
      if (portfolio.length === 0) return [];
      
      const poolIds = portfolio.map(p => p.poolId).join(',');
      const response = await fetch(`/api/pools?ids=${poolIds}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio pools');
      return response.json();
    },
    enabled: portfolio.length > 0,
    staleTime: 60000 // 1 minute
  });

  // Calculate portfolio metrics
  const metrics: PortfolioMetrics = {
    totalValue: 0,
    totalYield: 0,
    avgApy: 0,
    riskDistribution: { low: 0, medium: 0, high: 0 },
    chainDistribution: {},
    platformDistribution: {}
  };

  if (poolsData && portfolio.length > 0) {
    let totalWeightedApy = 0;
    
    portfolio.forEach(item => {
      const pool = poolsData.find((p: any) => p.id === item.poolId);
      if (pool) {
        // Calculate value
        metrics.totalValue += item.amount;
        
        // Calculate yield
        const apy = parseFloat(pool.apy) / 100;
        const dailyYield = (item.amount * apy) / 365;
        metrics.totalYield += dailyYield;
        
        // Calculate weighted APY
        totalWeightedApy += apy * item.amount;
        
        // Risk distribution
        const riskLevel = pool.riskLevel as 'low' | 'medium' | 'high';
        metrics.riskDistribution[riskLevel] += item.amount;
        
        // Chain distribution
        const chainName = pool.chain?.displayName || 'Unknown';
        metrics.chainDistribution[chainName] = (metrics.chainDistribution[chainName] || 0) + item.amount;
        
        // Platform distribution
        const platformName = pool.platform?.displayName || 'Unknown';
        metrics.platformDistribution[platformName] = (metrics.platformDistribution[platformName] || 0) + item.amount;
      }
    });
    
    // Calculate average APY
    if (metrics.totalValue > 0) {
      metrics.avgApy = (totalWeightedApy / metrics.totalValue) * 100;
    }
  }

  // Export portfolio data
  const exportPortfolio = useCallback(() => {
    const data = {
      portfolio,
      metrics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [portfolio, metrics]);

  // Import portfolio data
  const importPortfolio = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.portfolio && Array.isArray(data.portfolio)) {
          const imported = data.portfolio.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }));
          savePortfolio(imported);
        }
      } catch (error) {
        console.error('Failed to import portfolio:', error);
      }
    };
    reader.readAsText(file);
  }, [savePortfolio]);

  return {
    portfolio,
    metrics,
    isLoadingPools,
    addToPortfolio,
    removeFromPortfolio,
    updatePortfolioItem,
    isInPortfolio,
    getPortfolioItem,
    exportPortfolio,
    importPortfolio,
    clearPortfolio: () => savePortfolio([])
  };
}