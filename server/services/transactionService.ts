import { Alchemy, Network } from 'alchemy-sdk';

interface TransactionDetails {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string | null;
  value: string;
  gasLimit: string;
  gasUsed?: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce: number;
  status?: number;
  timestamp: number;
  confirmations: number;
  data: string;
  logs: TransactionLog[];
  functionName?: string;
  methodId?: string;
  decodedInput?: any;
}

interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
  removed: boolean;
}

class TransactionService {
  private alchemy: Alchemy;
  private alchemyBase: Alchemy;

  constructor() {
    // Get Alchemy configuration from environment
    const alchemyRpcUrl = process.env.ALCHEMY_RPC_URL;
    
    if (!alchemyRpcUrl) {
      throw new Error('ALCHEMY_RPC_URL not configured');
    }
    
    // Extract API key from RPC URL
    const urlMatch = alchemyRpcUrl.match(/\/v2\/([^/]+)$/);
    const apiKey = urlMatch ? urlMatch[1] : null;
    
    if (!apiKey) {
      throw new Error('Invalid ALCHEMY_RPC_URL format');
    }
    
    // Initialize Alchemy clients
    this.alchemy = new Alchemy({
      apiKey,
      network: Network.ETH_MAINNET,
    });
    
    this.alchemyBase = new Alchemy({
      apiKey,
      network: Network.BASE_MAINNET,
    });
  }

  /**
   * Get transaction details by hash
   */
  async getTransactionDetails(txHash: string, network: 'ethereum' | 'base' = 'ethereum'): Promise<TransactionDetails | null> {
    try {
      const alchemyClient = network === 'base' ? this.alchemyBase : this.alchemy;
      
      // Get transaction and receipt in parallel
      const [transaction, receipt, latestBlock] = await Promise.all([
        alchemyClient.core.getTransaction(txHash),
        alchemyClient.core.getTransactionReceipt(txHash),
        alchemyClient.core.getBlockNumber()
      ]);
      
      if (!transaction) {
        return null;
      }
      
      // Get block details for timestamp
      const block = await alchemyClient.core.getBlock(transaction.blockNumber!);
      
      // Calculate confirmations
      const confirmations = transaction.blockNumber ? latestBlock - transaction.blockNumber + 1 : 0;
      
      // Process logs
      const logs: TransactionLog[] = receipt?.logs?.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        logIndex: log.logIndex,
        removed: log.removed || false,
      })) || [];
      
      // Try to decode method name from input data
      let functionName: string | undefined;
      let methodId: string | undefined;
      
      if (transaction.data && transaction.data.length >= 10) {
        methodId = transaction.data.slice(0, 10);
        functionName = this.getKnownMethodName(methodId);
      }
      
      return {
        hash: transaction.hash,
        blockNumber: transaction.blockNumber || 0,
        blockHash: transaction.blockHash || '',
        transactionIndex: transaction.transactionIndex || 0,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value.toString(),
        gasLimit: transaction.gasLimit.toString(),
        gasUsed: receipt?.gasUsed?.toString(),
        gasPrice: transaction.gasPrice?.toString() || '0',
        maxFeePerGas: transaction.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas?.toString(),
        nonce: transaction.nonce,
        status: receipt?.status,
        timestamp: block?.timestamp || 0,
        confirmations,
        data: transaction.data,
        logs,
        functionName,
        methodId,
      };
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }
  
  /**
   * Get known method names for common function signatures
   */
  private getKnownMethodName(methodId: string): string | undefined {
    const knownMethods: Record<string, string> = {
      '0xa9059cbb': 'transfer',
      '0x23b872dd': 'transferFrom',
      '0x095ea7b3': 'approve',
      '0x6b0c932d': 'deposit',
      '0x2e1a7d4d': 'withdraw',
      '0xd0e30db0': 'deposit',
      '0x70a08231': 'balanceOf',
      '0x18160ddd': 'totalSupply',
      '0xdd62ed3e': 'allowance',
      '0x313ce567': 'decimals',
      '0x06fdde03': 'name',
      '0x95d89b41': 'symbol',
    };
    
    return knownMethods[methodId.toLowerCase()];
  }
  
  /**
   * Format transaction value to ETH
   */
  formatValue(value: string): string {
    try {
      const valueInWei = BigInt(value);
      const valueInEth = Number(valueInWei) / 1e18;
      return valueInEth.toFixed(6);
    } catch {
      return '0';
    }
  }
  
  /**
   * Format gas price to Gwei
   */
  formatGasPrice(gasPrice: string): string {
    try {
      const gasPriceInWei = BigInt(gasPrice);
      const gasPriceInGwei = Number(gasPriceInWei) / 1e9;
      return gasPriceInGwei.toFixed(2);
    } catch {
      return '0';
    }
  }
  
  /**
   * Calculate transaction fee
   */
  calculateTransactionFee(gasUsed: string, gasPrice: string): string {
    try {
      const gasUsedBig = BigInt(gasUsed);
      const gasPriceBig = BigInt(gasPrice);
      const feeInWei = gasUsedBig * gasPriceBig;
      const feeInEth = Number(feeInWei) / 1e18;
      return feeInEth.toFixed(6);
    } catch {
      return '0';
    }
  }
}

export const transactionService = new TransactionService();
export type { TransactionDetails, TransactionLog };
