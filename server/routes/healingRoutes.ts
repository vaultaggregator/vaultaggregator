/**
 * Self-Healing System Routes
 * Provides monitoring and control endpoints for the self-healing system
 */

import { Router } from 'express';
import { getSelfHealingService } from '../services/selfHealingService';

const router = Router();

/**
 * Get self-healing system statistics
 */
router.get('/api/healing/stats', (req, res) => {
  try {
    const healingService = getSelfHealingService();
    const stats = healingService.getHealingStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching healing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch healing statistics'
    });
  }
});

/**
 * Get healing history
 */
router.get('/api/healing/history', (req, res) => {
  try {
    const healingService = getSelfHealingService();
    const stats = healingService.getHealingStats();
    
    res.json({
      success: true,
      data: {
        recentHistory: stats.recentHistory,
        totalAttempts: stats.totalAttempts
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching healing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch healing history'
    });
  }
});

/**
 * Trigger a test healing scenario
 */
router.post('/api/healing/test', async (req, res) => {
  try {
    const { service = 'test', simulateError = true } = req.body;
    const healingService = getSelfHealingService();
    
    // Simulate an operation that might fail
    const result = await healingService.executeWithHealing(
      service,
      async () => {
        if (simulateError) {
          // First attempt will fail
          if (Math.random() > 0.3) {
            throw new Error('Simulated network error: ECONNREFUSED');
          }
        }
        return { message: 'Operation successful', timestamp: Date.now() };
      },
      {
        maxRetries: 3,
        retryDelay: 1000
      }
    );
    
    res.json({
      success: true,
      data: result,
      healingStats: healingService.getHealingStats()
    });
  } catch (error) {
    console.error('Test healing scenario failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    });
  }
});

export default router;