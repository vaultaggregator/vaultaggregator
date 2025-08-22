#!/bin/bash
echo "⚙️ Admin Services Monitor - Service Status Dashboard"
echo "=================================================="
echo "Monitoring: All background services and scheduled jobs"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
  echo ""
  echo "$(date '+%H:%M:%S') - Service Status"
  echo "===================================="
  
  # Get service status from admin API
  curl -s http://localhost:5000/api/admin/services/status | jq -r '.[] | "\(.name): \(.status) (Last: \(.lastRun // "N/A"))"' | sed 's/^/  /'
  
  echo ""
  echo "Service Errors:"
  curl -s http://localhost:5000/api/admin/services/errors | jq -r '.[] | "  \(.serviceId): \(.message)"' || echo "  No errors"
  
  # Wait 15 seconds before next check
  sleep 15
done