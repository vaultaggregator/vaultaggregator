/**
 * Official Platform Logo Updater Service
 * 
 * Fetches authentic logos from official sources:
 * - CryptoLogos.cc (highest quality SVG/PNG)
 * - Official GitHub repositories 
 * - Protocol brand asset pages
 * - Trusted community sources
 */

import fs from 'fs/promises';
import path from 'path';
import { storage } from '../storage';
import type { Platform } from '@shared/schema';

// Official logo sources mapping - prioritized by authenticity and quality
const OFFICIAL_LOGO_SOURCES = {
  // Major DeFi Protocols - Official/High-Quality Sources
  'aave': {
    urls: [
      'https://cryptologos.cc/logos/aave-aave-logo.svg',
      'https://raw.githubusercontent.com/aave-dao/aave-brand-kit/main/logo/aave-logo.svg'
    ],
    fallbackName: 'Aave'
  },
  'aave-v2': {
    urls: [
      'https://cryptologos.cc/logos/aave-aave-logo.svg'
    ],
    fallbackName: 'Aave V2'
  },
  'aave-v3': {
    urls: [
      'https://cryptologos.cc/logos/aave-aave-logo.svg'
    ],
    fallbackName: 'Aave V3'
  },
  'compound-v2': {
    urls: [
      'https://cryptologos.cc/logos/compound-comp-logo.svg'
    ],
    fallbackName: 'Compound V2'
  },
  'compound-v3': {
    urls: [
      'https://cryptologos.cc/logos/compound-comp-logo.svg'
    ],
    fallbackName: 'Compound V3'
  },
  'uniswap-v2': {
    urls: [
      'https://cryptologos.cc/logos/uniswap-uni-logo.svg',
      'https://raw.githubusercontent.com/Uniswap/brand-assets/main/Uniswap%20Brand%20Assets/Logo/PNG/Uniswap_Logo_Pink.png'
    ],
    fallbackName: 'Uniswap V2'
  },
  'uniswap-v3': {
    urls: [
      'https://cryptologos.cc/logos/uniswap-uni-logo.svg'
    ],
    fallbackName: 'Uniswap V3'
  },
  'curve-dex': {
    urls: [
      'https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg'
    ],
    fallbackName: 'Curve'
  },
  'curve-llamalend': {
    urls: [
      'https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg'
    ],
    fallbackName: 'Curve LlamaLend'
  },
  'sushiswap': {
    urls: [
      'https://cryptologos.cc/logos/sushiswap-sushi-logo.svg'
    ],
    fallbackName: 'SushiSwap'
  },
  'sushiswap-v3': {
    urls: [
      'https://cryptologos.cc/logos/sushiswap-sushi-logo.svg'
    ],
    fallbackName: 'SushiSwap V3'
  },
  'pancakeswap-amm': {
    urls: [
      'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg'
    ],
    fallbackName: 'PancakeSwap'
  },
  'pancakeswap-amm-v3': {
    urls: [
      'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg'
    ],
    fallbackName: 'PancakeSwap V3'
  },
  'lido': {
    urls: [
      'https://cryptologos.cc/logos/lido-dao-ldo-logo.svg',
      'https://static.lido.fi/LIDO%20logo%20no%20background/lido-logo.svg'
    ],
    fallbackName: 'Lido'
  },
  'yearn-finance': {
    urls: [
      'https://cryptologos.cc/logos/yearn-finance-yfi-logo.svg'
    ],
    fallbackName: 'Yearn Finance'
  },
  'balancer-v2': {
    urls: [
      'https://cryptologos.cc/logos/balancer-bal-logo.svg'
    ],
    fallbackName: 'Balancer V2'
  },
  'balancer-v3': {
    urls: [
      'https://cryptologos.cc/logos/balancer-bal-logo.svg'
    ],
    fallbackName: 'Balancer V3'
  },
  'maker': {
    urls: [
      'https://cryptologos.cc/logos/maker-mkr-logo.svg'
    ],
    fallbackName: 'MakerDAO'
  },
  'synthetix': {
    urls: [
      'https://cryptologos.cc/logos/synthetix-snx-logo.svg'
    ],
    fallbackName: 'Synthetix'
  },
  'chainlink': {
    urls: [
      'https://cryptologos.cc/logos/chainlink-link-logo.svg'
    ],
    fallbackName: 'Chainlink'
  },
  '1inch-network': {
    urls: [
      'https://cryptologos.cc/logos/1inch-1inch-logo.svg'
    ],
    fallbackName: '1inch Network'
  },
  // Additional protocols with high-quality logos
  'frax': {
    urls: [
      'https://cryptologos.cc/logos/frax-frax-logo.svg'
    ],
    fallbackName: 'Frax Finance'
  },
  'convex-finance': {
    urls: [
      'https://cryptologos.cc/logos/convex-finance-cvx-logo.svg'
    ],
    fallbackName: 'Convex Finance'
  },
  'rocket-pool': {
    urls: [
      'https://cryptologos.cc/logos/rocket-pool-rpl-logo.svg'
    ],
    fallbackName: 'Rocket Pool'
  }
};

export class LogoUpdaterService {
  private readonly LOGO_DIRECTORY = path.join(process.cwd(), 'client', 'src', 'assets', 'platform-logos');
  
  constructor() {}

  /**
   * Downloads a logo from URL and saves it locally
   */
  private async downloadLogo(url: string, filename: string): Promise<boolean> {
    try {
      console.log(`Downloading logo from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Failed to fetch logo from ${url}: ${response.status}`);
        return false;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Ensure logo directory exists
      await fs.mkdir(this.LOGO_DIRECTORY, { recursive: true });
      
      const filepath = path.join(this.LOGO_DIRECTORY, filename);
      await fs.writeFile(filepath, buffer);
      
      console.log(`✅ Downloaded logo: ${filename}`);
      return true;
    } catch (error) {
      console.error(`❌ Error downloading logo from ${url}:`, error);
      return false;
    }
  }

  /**
   * Gets the appropriate file extension from URL
   */
  private getFileExtension(url: string): string {
    if (url.includes('.svg')) return 'svg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    return 'svg'; // Default to SVG
  }

  /**
   * Updates logo for a specific platform
   */
  async updatePlatformLogo(platformName: string): Promise<boolean> {
    const logoConfig = OFFICIAL_LOGO_SOURCES[platformName as keyof typeof OFFICIAL_LOGO_SOURCES];
    
    if (!logoConfig) {
      console.log(`⚠️ No logo configuration found for platform: ${platformName}`);
      return false;
    }

    // Try each URL until one succeeds
    for (let i = 0; i < logoConfig.urls.length; i++) {
      const url = logoConfig.urls[i];
      const extension = this.getFileExtension(url);
      const filename = `${platformName}.${extension}`;
      
      const success = await this.downloadLogo(url, filename);
      if (success) {
        // Update platform in database with local logo path
        const localLogoUrl = `/src/assets/platform-logos/${filename}`;
        
        try {
          const platform = await storage.getPlatformByName(platformName);
          if (platform) {
            await storage.updatePlatform(platform.id, {
              logoUrl: localLogoUrl
            });
            console.log(`✅ Updated ${platformName} logo in database`);
          }
        } catch (error) {
          console.error(`❌ Failed to update platform ${platformName} in database:`, error);
        }
        
        return true;
      }
    }
    
    console.error(`❌ Failed to download logo for ${platformName} from all sources`);
    return false;
  }

  /**
   * Updates logos for all platforms with available official sources
   */
  async updateAllPlatformLogos(): Promise<{ success: number; failed: number; total: number }> {
    console.log('🚀 Starting platform logo update process...');
    
    const platformNames = Object.keys(OFFICIAL_LOGO_SOURCES);
    let successCount = 0;
    let failedCount = 0;

    // Process platforms in batches to avoid overwhelming servers
    const BATCH_SIZE = 5;
    for (let i = 0; i < platformNames.length; i += BATCH_SIZE) {
      const batch = platformNames.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (platformName) => {
        const success = await this.updatePlatformLogo(platformName);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
        return success;
      });
      
      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to be respectful to servers
      if (i + BATCH_SIZE < platformNames.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const total = platformNames.length;
    
    console.log(`🏁 Logo update completed:`);
    console.log(`✅ Successful: ${successCount}/${total}`);
    console.log(`❌ Failed: ${failedCount}/${total}`);
    
    return { success: successCount, failed: failedCount, total };
  }

  /**
   * Gets the list of platforms that have official logo configurations
   */
  getConfiguredPlatforms(): string[] {
    return Object.keys(OFFICIAL_LOGO_SOURCES);
  }

  /**
   * Checks if a platform has an official logo source configured
   */
  hasPlatformConfig(platformName: string): boolean {
    return platformName in OFFICIAL_LOGO_SOURCES;
  }
}

export const logoUpdaterService = new LogoUpdaterService();