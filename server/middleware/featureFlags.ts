import { Request, Response, NextFunction } from 'express';

interface FeatureFlags {
  [key: string]: boolean;
}

const flags: FeatureFlags = {
  // Alchemy endpoints - all disabled by default
  getBlockNumber: false,
  getTokenBalances: false,
  getAssetTransfers: false,
  getLogs: false,
  getTokenMetadata: false,
  getNFTs: false,
  getOwners: false,
  getTransactionReceipts: false,
  getBalance: false,
  // Add more as needed
};

export function requireFlag(name: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!flags[name]) {
      return res.status(403).json({ 
        error: `Feature ${name} disabled. Ask owner to enable`,
        message: 'This Alchemy endpoint is currently disabled to control costs. Please contact admin to enable.'
      });
    }
    next();
  };
}

export function setFlag(name: string, value: boolean): void {
  flags[name] = value;
  console.log(`🚦 Feature flag '${name}' set to ${value}`);
}

export function getFlags(): FeatureFlags {
  return { ...flags };
}

export function getFlagStatus(name: string): boolean {
  return flags[name] || false;
}