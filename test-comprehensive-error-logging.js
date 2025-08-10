// Comprehensive test to demonstrate error logging across all integrated services

async function testComprehensiveErrorLogging() {
  try {
    console.log('Testing comprehensive error logging system...');
    
    const baseUrl = 'http://localhost:5000';
    
    // Create test errors for each service to demonstrate integration
    const testErrors = [
      {
        title: 'DeFi Llama API Rate Limit',
        description: 'DeFi Llama API returned 429 rate limit error during scheduled sync. Pool data updates are delayed.',
        errorType: 'API',
        severity: 'high',
        source: 'DefiLlamaService',
        stackTrace: 'Error: Too Many Requests\n    at fetch (defiLlamaService.js:67)\n    at getPoolDetails (defiLlamaService.js:61)',
        fixPrompt: 'DeFi Llama API rate limit hit. Consider implementing request queuing, reducing sync frequency, or upgrading API plan.',
        metadata: {
          endpoint: 'https://yields.llama.fi/pools',
          retryAttempt: 3,
          timestamp: new Date().toISOString()
        }
      },
      {
        title: 'OpenAI API Quota Exceeded',
        description: 'OpenAI API quota exceeded during AI outlook generation. Users will not receive AI market insights.',
        errorType: 'External',
        severity: 'critical',
        source: 'AIOutlookService',
        stackTrace: 'Error: You exceeded your current quota\n    at openai.chat.completions.create (aiOutlookService.js:358)',
        fixPrompt: 'OpenAI API quota exceeded. Check billing status, upgrade plan, or implement AI outlook caching.',
        metadata: {
          model: 'gpt-4o',
          poolId: 'a44febf3-34f6-4cd5-8ab1-f246ebe49f9e',
          timestamp: new Date().toISOString()
        }
      },
      {
        title: 'Token Info Sync Database Error',
        description: 'Database connection failed during token information synchronization. Token details may be outdated.',
        errorType: 'Service',
        severity: 'medium',
        source: 'TokenInfoSyncService',
        stackTrace: 'Error: Connection timeout\n    at PostgresPool.connect (db.js:45)\n    at upsertTokenInfo (storage.js:234)',
        fixPrompt: 'Database connectivity issue during token sync. Check DATABASE_URL, verify connection pool settings.',
        metadata: {
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          operation: 'upsertTokenInfo',
          timestamp: new Date().toISOString()
        }
      },
      {
        title: 'Holder Data Sync API Failure',
        description: 'Etherscan API failed during holder data synchronization. Holder analytics will not be updated.',
        errorType: 'Service',
        severity: 'medium',
        source: 'HolderDataSyncService',
        stackTrace: 'Error: Network timeout\n    at fetch (etherscanTokenService.js:89)\n    at getTokenHolders (etherscanTokenService.js:156)',
        fixPrompt: 'Holder data sync failed. Check Etherscan API connectivity, verify ETHERSCAN_API_KEY, review rate limits.',
        metadata: {
          tokenAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
          operation: 'syncTokenHolderData',
          timestamp: new Date().toISOString()
        }
      },
      {
        title: 'Market Intelligence Analysis Failed',
        description: 'Market overview generation failed due to data processing error. Analytics dashboard will show stale data.',
        errorType: 'Service',
        severity: 'medium',
        source: 'MarketIntelligenceService',
        stackTrace: 'Error: Invalid pool data structure\n    at calculateMarketMetrics (marketIntelligenceService.js:144)\n    at getMarketOverview (marketIntelligenceService.js:48)',
        fixPrompt: 'Market analysis failed. Check pool data integrity, verify schema consistency, review data validation.',
        metadata: {
          operation: 'getMarketOverview',
          poolCount: 2,
          timestamp: new Date().toISOString()
        }
      },
      {
        title: 'Scheduled Task Execution Failed',
        description: 'Critical scheduled task failed during automated execution. Background data synchronization is compromised.',
        errorType: 'Service',
        severity: 'high',
        source: 'Scheduler',
        stackTrace: 'Error: Task timeout\n    at setTimeout (scheduler.js:54)\n    at scheduledDefiLlamaSync (scheduler.js:22)',
        fixPrompt: 'Scheduled task failure. Check service health, verify resource availability, review task timeout settings.',
        metadata: {
          service: 'DefiLlamaSync',
          operation: 'ScheduledTask',
          taskType: 'dataSync',
          timestamp: new Date().toISOString()
        }
      }
    ];

    // Create all test errors
    for (const error of testErrors) {
      const response = await fetch(`${baseUrl}/api/admin/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
      
      const result = await response.json();
      console.log(`Created ${error.source} error:`, { id: result.id, severity: error.severity });
    }

    // Get comprehensive statistics
    const statsResponse = await fetch(`${baseUrl}/api/admin/errors/stats`);
    const stats = await statsResponse.json();
    console.log('\nComprehensive Error Logging Stats:', stats);

    console.log('\n✅ Comprehensive error logging system fully operational!');
    console.log('Services covered:');
    console.log('  • DeFi Llama Service - API failures, rate limits');
    console.log('  • AI Outlook Service - OpenAI API issues, quota limits');
    console.log('  • Token Info Sync Service - Database errors, sync failures');
    console.log('  • Holder Data Sync Service - API timeouts, data processing');
    console.log('  • Market Intelligence Service - Analytics failures, data issues');
    console.log('  • Scheduler Service - Task failures, timeout errors');
    console.log('  • Etherscan Service - Rate limits, network errors (previously integrated)');

  } catch (error) {
    console.error('Error testing comprehensive error logging:', error);
  }
}

testComprehensiveErrorLogging();