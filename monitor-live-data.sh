#!/bin/bash
echo "🔄 Live Pool Data Monitor - Real-time APY Updates"
echo "================================================"
echo "Shows live pool data changes every 10 seconds"
echo "Press Ctrl+C to stop"
echo ""

previous_data=""
counter=0

while true; do
  counter=$((counter + 1))
  echo ""
  echo "$(date '+%H:%M:%S') - Update #$counter"
  echo "------------------------"
  
  # Get current pool data
  current_data=$(curl -s http://localhost:5000/api/pools | jq -r '.[0:8][] | "\(.tokenPair // "Unknown"): \(.apy // "N/A")%"' 2>/dev/null)
  
  if [[ -n "$current_data" ]]; then
    if [[ "$current_data" != "$previous_data" ]]; then
      echo "✅ Pool data updated:"
      echo "$current_data"
      previous_data="$current_data"
    else
      echo "📊 Pool data (no changes):"
      echo "$current_data"
    fi
  else
    echo "⚠️ Unable to fetch pool data"
  fi
  
  # Show service activity
  service_status=$(curl -s http://localhost:5000/api/admin/services/status | jq -r '.[] | select(.name=="poolDataSync" or .name=="morphoApiSync") | "\(.name): \(.status)"' 2>/dev/null)
  if [[ -n "$service_status" ]]; then
    echo ""
    echo "🔧 Services:"
    echo "$service_status"
  fi
  
  sleep 10
done