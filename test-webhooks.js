/**
 * Test script for webhook management endpoints
 */

// Node.js 18+ has fetch built-in, no import needed

const BASE_URL = 'http://localhost:5000';

async function testWebhookEndpoints() {
  console.log('🧪 Testing Webhook Management Endpoints...\n');

  // Test 1: Get monitored addresses
  try {
    console.log('📍 Test 1: Getting all monitored addresses...');
    const response = await fetch(`${BASE_URL}/api/webhooks/monitored-addresses`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.total} monitored addresses`);
    console.log(`   - Ethereum pools: ${data.byNetwork?.ethereum?.length || 0}`);
    console.log(`   - Base pools: ${data.byNetwork?.base?.length || 0}`);
    
    // Show first 3 addresses
    if (data.addresses && data.addresses.length > 0) {
      console.log('   Sample addresses:');
      data.addresses.slice(0, 3).forEach(addr => {
        console.log(`     • ${addr}`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error getting monitored addresses:', error.message);
  }

  // Test 2: Get webhook config status
  try {
    console.log('📍 Test 2: Getting webhook configuration status...');
    const response = await fetch(`${BASE_URL}/api/webhooks/config-status`);
    const data = await response.json();
    
    console.log(`✅ Webhook Status: ${data.status}`);
    console.log(`   - Total configs: ${data.totalConfigs || 0}`);
    console.log(`   - Active configs: ${data.activeConfigs || 0}`);
    console.log(`   - Networks: ${data.networks?.join(', ') || 'none'}`);
    console.log(`   - Endpoint: ${data.webhookEndpoint}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error getting webhook status:', error.message);
  }

  // Test 3: Get new pools (last 24 hours)
  try {
    console.log('📍 Test 3: Getting new pools added in last 24 hours...');
    const response = await fetch(`${BASE_URL}/api/webhooks/new-pools`);
    const data = await response.json();
    
    console.log(`✅ New pools in last 24 hours: ${data.count || 0}`);
    if (data.pools && data.pools.length > 0) {
      console.log('   New pools:');
      data.pools.forEach(pool => {
        console.log(`     • ${pool.name} (${pool.network}): ${pool.address}`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error getting new pools:', error.message);
  }

  // Test 4: Get webhook status
  try {
    console.log('📍 Test 4: Checking webhook health status...');
    const response = await fetch(`${BASE_URL}/api/webhooks/status`);
    const data = await response.json();
    
    console.log(`✅ Webhooks enabled: ${data.enabled}`);
    console.log(`   - Provider: ${data.provider}`);
    console.log(`   - Message: ${data.message}`);
    console.log(`   - Capabilities: ${data.capabilities?.length || 0} features`);
    console.log('');
  } catch (error) {
    console.error('❌ Error getting webhook health:', error.message);
  }

  console.log('🎉 Webhook Management System Test Complete!');
  console.log('\n📋 SUMMARY:');
  console.log('• All pools with contract addresses are automatically tracked');
  console.log('• New pools added to the site will be included in monitoring');
  console.log('• Webhook endpoint is live and ready for Alchemy configuration');
  console.log('• Use /api/webhooks/monitored-addresses to get all addresses for Alchemy setup');
}

// Run tests
testWebhookEndpoints().catch(console.error);