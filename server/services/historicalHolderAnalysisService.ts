import { AlchemyService } from './alchemyService';

interface HolderSnapshot {
  timestamp: Date;
  uniqueHolders: number;
  newHolders: number;
  exitedHolders: number;
}

interface HistoricalHolderAnalysis {
  current: number;
  change7d: { value: number; percentage: number } | null;
  change30d: { value: number; percentage: number } | null;
  changeAllTime: { value: number; percentage: number } | null;
  snapshots: HolderSnapshot[];
  dataSource: 'authentic_transfers';
}

export class HistoricalHolderAnalysisService {
  private alchemyService: AlchemyService;

  constructor() {
    this.alchemyService = new AlchemyService();
  }

  /**
   * Analyze historical holder counts from transfer data
   */
  async analyzeHistoricalHolders(tokenAddress: string): Promise<HistoricalHolderAnalysis | null> {
    if (!this.alchemyService.isAvailable()) {
      return null;
    }

    try {
      // Get 90 days of transfer data from Alchemy
      const transfers = await this.alchemyService.getHistoricalTransfers(tokenAddress, 90, 15000);
      
      if (transfers.length === 0) {
        return null;
      }

      // Reconstruct holder counts over time
      const snapshots = this.reconstructHolderTimeline(transfers);
      
      if (snapshots.length === 0) {
        return null;
      }

      // Calculate changes
      const current = snapshots[snapshots.length - 1].uniqueHolders;
      const change7d = this.calculateChange(snapshots, 7, current);
      const change30d = this.calculateChange(snapshots, 30, current);
      const changeAllTime = this.calculateChange(snapshots, 90, current);

      return {
        current,
        change7d,
        change30d,
        changeAllTime,
        snapshots,
        dataSource: 'authentic_transfers'
      };

    } catch (error) {
      console.error('Error analyzing historical holders:', error);
      return null;
    }
  }

  /**
   * Reconstruct holder timeline from transfer events
   */
  private reconstructHolderTimeline(transfers: any[]): HolderSnapshot[] {
    // Sort transfers by timestamp (oldest first) - handle both metadata.blockTimestamp and timeStamp formats
    const sortedTransfers = transfers
      .filter(t => t.metadata?.blockTimestamp || t.timeStamp)
      .map(t => ({
        ...t,
        timestamp: t.metadata?.blockTimestamp || new Date(parseInt(t.timeStamp) * 1000).toISOString()
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (sortedTransfers.length === 0) {
      return [];
    }

    // Track holder balances over time
    const holderBalances = new Map<string, number>();
    const snapshots: HolderSnapshot[] = [];
    
    // Group transfers by day to create daily snapshots
    const dailyTransfers = this.groupTransfersByDay(sortedTransfers);
    
    for (const [date, dayTransfers] of Array.from(dailyTransfers.entries())) {
      const previousHolders = new Set(Array.from(holderBalances.keys()).filter(addr => holderBalances.get(addr)! > 0));
      
      // Process all transfers for this day
      for (const transfer of dayTransfers) {
        const from = transfer.from.toLowerCase();
        const to = transfer.to.toLowerCase();
        const value = parseFloat(transfer.value) || 0;
        
        // Skip zero address (minting/burning)
        if (from !== '0x0000000000000000000000000000000000000000') {
          const currentBalance = holderBalances.get(from) || 0;
          holderBalances.set(from, Math.max(0, currentBalance - value));
        }
        
        if (to !== '0x0000000000000000000000000000000000000000') {
          const currentBalance = holderBalances.get(to) || 0;
          holderBalances.set(to, currentBalance + value);
        }
      }
      
      // Count current holders (addresses with positive balance)
      const currentHolders = new Set(Array.from(holderBalances.keys()).filter(addr => holderBalances.get(addr)! > 0));
      
      // Calculate new and exited holders
      const newHolders = Array.from(currentHolders).filter(addr => !previousHolders.has(addr)).length;
      const exitedHolders = Array.from(previousHolders).filter(addr => !currentHolders.has(addr)).length;
      
      snapshots.push({
        timestamp: new Date(date),
        uniqueHolders: currentHolders.size,
        newHolders,
        exitedHolders
      });
    }

    return snapshots;
  }

  /**
   * Group transfers by day
   */
  private groupTransfersByDay(transfers: any[]): Map<string, any[]> {
    const dailyGroups = new Map<string, any[]>();
    
    for (const transfer of transfers) {
      // Use the normalized timestamp we added earlier
      const date = new Date(transfer.timestamp).toISOString().split('T')[0];
      if (!dailyGroups.has(date)) {
        dailyGroups.set(date, []);
      }
      dailyGroups.get(date)!.push(transfer);
    }
    
    return dailyGroups;
  }

  /**
   * Calculate holder change for a specific period
   */
  private calculateChange(snapshots: HolderSnapshot[], daysBack: number, current: number): { value: number; percentage: number } | null {
    if (snapshots.length === 0) return null;
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);
    
    // Find the snapshot closest to the target date
    let closestSnapshot = snapshots[0];
    let closestDiff = Math.abs(targetDate.getTime() - closestSnapshot.timestamp.getTime());
    
    for (const snapshot of snapshots) {
      const diff = Math.abs(targetDate.getTime() - snapshot.timestamp.getTime());
      if (diff < closestDiff) {
        closestSnapshot = snapshot;
        closestDiff = diff;
      }
    }
    
    // Only return data if we have a snapshot within reasonable range (within 2 days of target)
    const maxDiff = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
    if (closestDiff > maxDiff) {
      return null;
    }
    
    const value = current - closestSnapshot.uniqueHolders;
    const percentage = closestSnapshot.uniqueHolders > 0 ? (value / closestSnapshot.uniqueHolders) * 100 : 0;
    
    return { value, percentage };
  }
}