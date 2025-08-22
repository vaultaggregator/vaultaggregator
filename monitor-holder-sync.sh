#!/bin/bash
echo "👥 Holder Data Sync Monitor - Watching Holder Count Updates"
echo "=========================================================="
echo "Monitoring: Alchemy API & Etherscan scraping every 30 minutes"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Create a log file for holder sync events
touch /tmp/holder-sync.log

# Monitor holder sync events
while true; do
  # Check for holder sync activity in the logs
  journalctl -f -u repl-runner 2>/dev/null | grep -E "(holder|Holder|Starting holder|Updated.*holders|Syncing holders)" --line-buffered | while IFS= read -r line; do
    echo "$(date '+%H:%M:%S') - $line" | tee -a /tmp/holder-sync.log
  done
  sleep 1
done