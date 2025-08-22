#!/usr/bin/env tsx

/**
 * Seed enhanced holder service configuration
 * Run with: tsx seed-enhanced-holder-service.ts
 */

import { db } from './server/db';
import { serviceConfigurations } from './shared/schema';
import { eq } from 'drizzle-orm';

async function seedEnhancedHolderService() {
  console.log('🌱 Seeding enhanced holder service configuration...');
  
  try {
    // Check if enhanced holder service already exists
    const existing = await db
      .select()
      .from(serviceConfigurations)
      .where(eq(serviceConfigurations.serviceId, 'enhancedHolderSync'))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing configuration
      await db
        .update(serviceConfigurations)
        .set({
          name: 'Enhanced Holder Sync',
          description: 'Syncs detailed top 100 holders for all pools using Alchemy and Etherscan',
          interval: 30, // 30 minutes
          enabled: false, // Disabled by default, enable manually
          config: {
            batchSize: 3,
            maxHolders: 100,
            useAlchemy: true,
            updateMetrics: true
          },
          lastRun: null,
          nextRun: new Date()
        })
        .where(eq(serviceConfigurations.serviceId, 'enhancedHolderSync'));
      
      console.log('✅ Updated enhanced holder service configuration');
    } else {
      // Insert new configuration
      await db
        .insert(serviceConfigurations)
        .values({
          id: crypto.randomUUID(),
          serviceId: 'enhancedHolderSync',
          name: 'Enhanced Holder Sync',
          description: 'Syncs detailed top 100 holders for all pools using Alchemy and Etherscan',
          interval: 30, // 30 minutes
          enabled: false, // Disabled by default, enable manually
          config: {
            batchSize: 3,
            maxHolders: 100,
            useAlchemy: true,
            updateMetrics: true
          },
          lastRun: null,
          nextRun: new Date(),
          createdAt: new Date()
        });
      
      console.log('✅ Added enhanced holder service configuration');
    }
    
    console.log('🎉 Enhanced holder service configuration seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed enhanced holder service:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the seed
seedEnhancedHolderService();