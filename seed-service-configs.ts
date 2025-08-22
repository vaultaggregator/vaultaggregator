#!/usr/bin/env tsx
import { db } from "./server/db";
import { serviceConfigurations } from "@shared/schema";
import { DEFAULT_SERVICE_CONFIGS } from "./server/config/service-configurations";

async function seedServiceConfigurations() {
  console.log("🔧 Seeding service configurations...");
  
  try {
    // Clear existing configurations
    await db.delete(serviceConfigurations);
    console.log("  🗑️ Cleared existing configurations");
    
    // Insert default configurations
    for (const [serviceName, config] of Object.entries(DEFAULT_SERVICE_CONFIGS)) {
      await db.insert(serviceConfigurations).values(config);
      console.log(`  ✅ Added ${config.displayName} (${config.intervalMinutes}min)`);
    }
    
    console.log(`🔧 Successfully seeded ${Object.keys(DEFAULT_SERVICE_CONFIGS).length} service configurations`);
  } catch (error) {
    console.error("❌ Failed to seed service configurations:", error);
    process.exit(1);
  }
}

seedServiceConfigurations().then(() => process.exit(0));