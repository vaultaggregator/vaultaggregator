#!/bin/bash
echo "🔄 Pool Data Sync Monitor - Live APY/TVL Updates"
echo "==============================================="
echo "Monitoring: Morpho API & Lido API scraping every 5 minutes"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Create a named pipe for real-time log streaming
mkfifo /tmp/pool_monitor 2>/dev/null || true

# Monitor the main server logs for pool-related events
tail -f /proc/$(pgrep -f "server/index.ts")/fd/1 2>/dev/null | grep -E "(Updated pool|Successfully scraped|Morpho|Lido|APY|TVL|💾|✅|Scraping completed)" --line-buffered | while IFS= read -r line; do
  echo "$(date '+%H:%M:%S') - $line"
done &

# Also monitor by tailing the main process stdout
while true; do
  if pgrep -f "server/index.ts" > /dev/null; then
    echo "$(date '+%H:%M:%S') - Monitoring active server process..."
    # Keep the monitor alive and show periodic status
    sleep 30
    echo "$(date '+%H:%M:%S') - Pool monitoring active - waiting for next sync cycle..."
  else
    echo "$(date '+%H:%M:%S') - Server not running, waiting..."
    sleep 5
  fi
done