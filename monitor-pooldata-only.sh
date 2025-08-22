#!/bin/bash

echo "🔄 Pool Data Sync Service Monitor"
echo "================================="
echo "Monitoring: poolDataSync service only"
echo "Press Ctrl+C to stop"
echo ""

# Function to get poolDataSync status
get_pool_sync_status() {
  curl -s http://localhost:5000/api/admin/services/status | jq -r '.[] | select(.name=="poolDataSync") | "Status: \(.status) | Interval: \(.interval)min | Last Run: \(.lastRun // "Never") | Next Run: \(.nextRun // "Unknown")"' 2>/dev/null
}

# Function to trigger poolDataSync manually
trigger_pool_sync() {
  curl -s -X POST http://localhost:5000/api/admin/services/poolDataSync/trigger | jq -r '.message // "Trigger failed"' 2>/dev/null
}

# Function to show recent pool updates
show_recent_updates() {
  echo "Recent Pool Updates:"
  curl -s http://localhost:5000/api/pools | jq -r '.[0:5][] | "  \(.tokenPair): \(.apy)% APY | TVL: $\(.tvl)"' 2>/dev/null
}

echo "$(date '+%H:%M:%S') - poolDataSync Monitor Started"
echo ""

# Show initial status
echo "Current Service Status:"
get_pool_sync_status
echo ""

# Show menu
echo "Commands:"
echo "  ENTER - Refresh status"
echo "  't' - Trigger manual sync"
echo "  'q' - Quit"
echo ""

# Monitor loop
while true; do
  echo "----------------------------------------"
  echo "$(date '+%H:%M:%S') - poolDataSync Status:"
  get_pool_sync_status
  echo ""
  show_recent_updates
  echo ""
  echo "Press ENTER to refresh, 't' to trigger, 'q' to quit:"
  
  read -t 10 -n 1 input
  case $input in
    't'|'T')
      echo ""
      echo "Triggering manual poolDataSync..."
      trigger_pool_sync
      echo ""
      ;;
    'q'|'Q')
      echo ""
      echo "Stopping monitor..."
      exit 0
      ;;
    *)
      # Just refresh (including timeout)
      ;;
  esac
done