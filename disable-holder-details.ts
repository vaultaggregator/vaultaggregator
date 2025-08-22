import { db } from './server/db';
import { serviceConfigurations } from './shared/schema';
import { eq } from 'drizzle-orm';

async function disableHolderDetails() {
  try {
    // Disable the detailed holder data sync service
    await db
      .update(serviceConfigurations)
      .set({
        isEnabled: false,
        lastRun: new Date()
      })
      .where(eq(serviceConfigurations.serviceName, 'holderDataSync'));

    console.log('✅ Disabled detailed holder data sync service');
    console.log('ℹ️  The total holder count will still be updated');
    console.log('ℹ️  But individual holder details will not be synced anymore');

    // Check status
    const configs = await db.select().from(serviceConfigurations);
    const holderServices = configs.filter(c => c.serviceName.includes('holder') || c.displayName.includes('Holder'));
    console.log('\nHolder-related services:');
    for (const service of holderServices) {
      console.log(`  ${service.serviceName} (${service.displayName}): enabled=${service.isEnabled}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

disableHolderDetails();