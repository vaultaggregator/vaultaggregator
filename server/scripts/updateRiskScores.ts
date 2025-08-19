#!/usr/bin/env tsx

/**
 * Script to update risk scores for all pools using real data-driven analysis
 */

import { RiskAssessmentService } from '../services/riskAssessmentService';

async function main() {
  console.log('🚀 Starting risk score update process...');
  
  try {
    const riskService = new RiskAssessmentService();
    await riskService.assessAllPools();
    
    console.log('✅ Risk score update completed successfully');
  } catch (error) {
    console.error('❌ Risk score update failed:', error);
    process.exit(1);
  }
}

// Run the update
main().catch(console.error);

export { main as updateRiskScores };