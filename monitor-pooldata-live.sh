#!/bin/bash

echo "📊 Live poolDataSync Monitor"
echo "============================"
echo "Real-time monitoring of poolDataSync service"
echo "Shows service status, triggers, and pool updates"
echo "Press Ctrl+C to stop"
echo ""

last_status=""
last_trigger_time=""

while true; do
  current_time=$(date '+%H:%M:%S')
  
  # Get current service status
  status_info=$(curl -s http://localhost:5000/api/admin/services/status | jq -r '.[] | select(.name=="poolDataSync") | "\(.status)|\(.interval)|\(.lastRun // "Never")|\(.nextRun // "Unknown")"' 2>/dev/null)
  
  if [[ -n "$status_info" ]]; then
    IFS='|' read -r status interval last_run next_run <<< "$status_info"
    
    # Check if status changed
    current_status="$status|$interval|$last_run"
    if [[ "$current_status" != "$last_status" ]]; then
      echo ""
      echo "[$current_time] poolDataSync Status Update:"
      echo "  Status: $status"
      echo "  Interval: ${interval} minutes"
      echo "  Last Run: $last_run"
      echo "  Next Run: $next_run"
      
      # If last run time changed, show pool data
      if [[ "$last_run" != "Never" && "$last_run" != "$last_trigger_time" ]]; then
        echo "  ✅ New sync completed! Latest pools:"
        curl -s http://localhost:5000/api/pools | jq -r '.[0:3][] | "    \(.tokenPair): \(.apy)%"' 2>/dev/null
        last_trigger_time="$last_run"
      fi
      
      last_status="$current_status"
      echo ""
    else
      # Show a dot to indicate monitoring is active
      printf "."
    fi
  else
    echo "[$current_time] ⚠️ Cannot connect to poolDataSync service"
  fi
  
  sleep 2
done