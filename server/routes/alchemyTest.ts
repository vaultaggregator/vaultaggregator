import express, { Request, Response } from 'express';
import { alchemyRequest, getBudgetStatus } from '../lib/alchemyClient';
import { requireFlag, getFlagStatus, setFlag } from '../middleware/featureFlags';

const router = express.Router();

// Test endpoint for eth_blockNumber - lightweight method for testing
router.get('/api/test/alchemy/blockNumber', requireFlag('getBlockNumber'), async (req: Request, res: Response) => {
  try {
    const result = await alchemyRequest('eth_blockNumber', []);
    const blockNumber = parseInt(result, 16); // Convert from hex
    res.json({ 
      blockNumber: result,
      blockNumberDecimal: blockNumber,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error('❌ Alchemy blockNumber error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Budget status endpoint - no flag required
router.get('/api/test/alchemy/budget', async (req: Request, res: Response) => {
  try {
    const status = getBudgetStatus();
    res.json({
      ...status,
      warning: status.percentage >= 70,
      critical: status.percentage >= 90
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Feature flags status endpoint - no flag required
router.get('/api/test/alchemy/flags', async (req: Request, res: Response) => {
  const flags = {
    getBlockNumber: getFlagStatus('getBlockNumber'),
    getTokenBalances: getFlagStatus('getTokenBalances'),
    getAssetTransfers: getFlagStatus('getAssetTransfers'),
    getLogs: getFlagStatus('getLogs'),
    getTokenMetadata: getFlagStatus('getTokenMetadata'),
    getNFTs: getFlagStatus('getNFTs'),
    getOwners: getFlagStatus('getOwners'),
    getTransactionReceipts: getFlagStatus('getTransactionReceipts'),
    getBalance: getFlagStatus('getBalance')
  };
  res.json(flags);
});

// Admin endpoint to toggle flags (in production, add authentication)
router.post('/api/test/alchemy/flags/:flagName', async (req: Request, res: Response) => {
  const { flagName } = req.params;
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be a boolean' });
  }
  
  setFlag(flagName, enabled);
  res.json({ 
    flag: flagName, 
    enabled,
    message: `Flag ${flagName} is now ${enabled ? 'enabled' : 'disabled'}`
  });
});

// Test endpoint for token balances - heavier method
router.post('/api/test/alchemy/tokenBalances', requireFlag('getTokenBalances'), async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    // Use alchemy_getTokenBalances method
    const result = await alchemyRequest('alchemy_getTokenBalances', [address, 'erc20']);
    res.json({ 
      address,
      tokenBalances: result,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error('❌ Alchemy tokenBalances error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Test endpoint for token metadata - lightweight method
router.get('/api/test/alchemy/tokenMetadata', requireFlag('getTokenMetadata'), async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'address query parameter is required' });
    }
    
    // Use alchemy_getTokenMetadata method
    const result = await alchemyRequest('alchemy_getTokenMetadata', [address as string]);
    res.json({ 
      address,
      metadata: result,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error('❌ Alchemy tokenMetadata error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;