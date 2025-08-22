#!/bin/bash
echo "🔄 Pool Data Sync Monitor - Watching APY/TVL Updates"
echo "=================================================="
echo "Monitoring: Morpho API & Lido API scraping every 5 minutes"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor the main application logs for pool data sync events
tail -f /dev/null | while IFS= read -r line; do
  echo "$(date '+%H:%M:%S') - $line"
done &

# Monitor specific pool sync events from the application
npm run dev 2>&1 | grep -E "(Updated pool|Successfully scraped|Morpho|Lido|APY|TVL|💾|✅)" --line-buffered | while IFS= read -r line; do
  echo "$(date '+%H:%M:%S') - $line"
done