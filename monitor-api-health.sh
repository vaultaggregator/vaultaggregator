#!/bin/bash
echo "🏥 API Health Monitor - Watching External API Status"
echo "=================================================="
echo "Monitoring: Alchemy, Morpho, Lido, Etherscan APIs"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
  echo ""
  echo "$(date '+%H:%M:%S') - API Health Check"
  echo "======================================"
  
  # Check Alchemy API
  curl -s http://localhost:5000/api/test/alchemy/blockNumber | jq -r '.status // "ERROR"' | sed 's/^/  Alchemy: /'
  
  # Check API settings
  curl -s http://localhost:5000/api/api-settings | jq -r '.[] | "\(.name): \(.isEnabled)"' | sed 's/^/  /'
  
  # Wait 30 seconds before next check
  sleep 30
done