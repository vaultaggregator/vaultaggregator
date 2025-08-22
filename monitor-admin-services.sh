#!/bin/bash
echo "⚙️ Admin Services Monitor - Live Dashboard"
echo "=========================================="
echo "Monitoring: All background services and scheduled jobs"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
  clear
  echo "⚙️ Admin Services Dashboard - $(date '+%H:%M:%S')"
  echo "=============================================="
  echo ""
  
  # Get service status from admin API
  echo "🔄 Service Status:"
  curl -s http://localhost:5000/api/admin/services/status 2>/dev/null | jq -r '.[] | "  \(.displayName): \(.status) - Last: \(.lastRun // "Never")"' || echo "  API not responding"
  
  echo ""
  echo "⚠️ Recent Errors:"
  errors=$(curl -s http://localhost:5000/api/admin/services/errors 2>/dev/null | jq -r '.[] | "  \(.serviceId): \(.message)"' 2>/dev/null)
  if [[ -n "$errors" ]]; then
    echo "$errors"
  else
    echo "  ✅ No recent errors"
  fi
  
  echo ""
  echo "📈 System Stats:"
  curl -s http://localhost:5000/api/stats 2>/dev/null | jq -r '"  Total Pools: \(.totalPools), Active: \(.activePools), Hidden: \(.hiddenPools)"' || echo "  Stats not available"
  
  echo ""
  echo "Next refresh in 10 seconds... (Ctrl+C to stop)"
  sleep 10
done