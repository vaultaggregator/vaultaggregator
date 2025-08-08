/**
 * Admin Logo Management Routes
 * Provides endpoints for updating platform logos from official sources
 */

import { Router } from 'express';
import { logoUpdaterService } from '../services/logo-updater';
// Using the same auth middleware as the main routes
// We'll use requireAuth from the main routes file

const router = Router();

/**
 * POST /api/admin/logos/update-all
 * Updates all platform logos from official sources
 */
router.post('/update-all', async (req, res) => {
  try {
    console.log('Admin initiated bulk logo update');
    const result = await logoUpdaterService.updateAllPlatformLogos();
    
    res.json({
      message: `Logo update completed. ${result.success}/${result.total} successful.`,
      ...result
    });
  } catch (error) {
    console.error('Error updating all platform logos:', error);
    res.status(500).json({
      message: 'Failed to update platform logos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/logos/update/:platformName
 * Updates logo for a specific platform
 */
router.post('/update/:platformName', async (req, res) => {
  try {
    const { platformName } = req.params;
    
    if (!logoUpdaterService.hasPlatformConfig(platformName)) {
      return res.status(404).json({
        message: `No official logo source configured for platform: ${platformName}`,
        configuredPlatforms: logoUpdaterService.getConfiguredPlatforms()
      });
    }

    console.log(`Admin initiated logo update for: ${platformName}`);
    const success = await logoUpdaterService.updatePlatformLogo(platformName);
    
    if (success) {
      res.json({
        message: `Successfully updated logo for ${platformName}`,
        platform: platformName
      });
    } else {
      res.status(500).json({
        message: `Failed to update logo for ${platformName}`,
        platform: platformName
      });
    }
  } catch (error) {
    console.error(`Error updating logo for ${req.params.platformName}:`, error);
    res.status(500).json({
      message: 'Failed to update platform logo',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/logos/configured-platforms
 * Gets list of platforms with official logo configurations
 */
router.get('/configured-platforms', async (req, res) => {
  try {
    const platforms = logoUpdaterService.getConfiguredPlatforms();
    
    res.json({
      platforms,
      total: platforms.length,
      message: 'Platforms with official logo sources configured'
    });
  } catch (error) {
    console.error('Error fetching configured platforms:', error);
    res.status(500).json({
      message: 'Failed to fetch configured platforms',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;