#!/bin/bash
echo "👥 Holder Data Sync Monitor - Live Holder Updates"
echo "================================================"
echo "Monitoring: Alchemy API & Etherscan scraping every 30 minutes"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor for holder-related events
while true; do
  echo "$(date '+%H:%M:%S') - Holder sync monitor active"
  
  # Check current holder sync status via API
  curl -s http://localhost:5000/api/admin/services/status | jq -r '.[] | select(.name=="holderDataSync") | "Status: \(.status), Last Run: \(.lastRun // "Never"), Next: \(.nextRun // "Unknown")"' 2>/dev/null || echo "API not responding"
  
  # Monitor the main server logs for holder-related events
  timeout 30 tail -f /proc/$(pgrep -f "server/index.ts")/fd/1 2>/dev/null | grep -E "(holder|Holder|Starting holder|Updated.*holders|Syncing holders|holdersCount)" --line-buffered | while IFS= read -r line; do
    echo "$(date '+%H:%M:%S') - $line"
  done
  
  sleep 5
done