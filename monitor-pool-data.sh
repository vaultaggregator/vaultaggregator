#!/bin/bash
echo "🔄 Pool Data Sync Monitor - Live APY/TVL Updates"
echo "==============================================="
echo "Monitoring: Morpho API & Lido API scraping every 2 minutes"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Start monitoring
echo "$(date '+%H:%M:%S') - Starting pool data monitoring..."

# Monitor by checking pool data changes and service status
while true; do
  echo ""
  echo "$(date '+%H:%M:%S') - Pool Data Status Check"
  echo "----------------------------------------"
  
  # Check service status
  status_response=$(curl -s http://localhost:5000/api/admin/services/status 2>/dev/null)
  if [[ $? -eq 0 ]]; then
    pool_sync_status=$(echo "$status_response" | jq -r '.[] | select(.name=="poolDataSync") | "\(.status) - \(.interval)min intervals"' 2>/dev/null)
    morpho_sync_status=$(echo "$status_response" | jq -r '.[] | select(.name=="morphoApiSync") | "\(.status) - \(.interval)min intervals"' 2>/dev/null)
    
    echo "📊 Pool Data Sync: ${pool_sync_status:-"checking..."}"
    echo "🔶 Morpho API Sync: ${morpho_sync_status:-"checking..."}"
  else
    echo "⚠️  Cannot connect to admin API"
  fi
  
  # Check recent pool data
  pools_response=$(curl -s http://localhost:5000/api/pools 2>/dev/null)
  if [[ $? -eq 0 ]]; then
    echo "📈 Recent Pool APY Data:"
    echo "$pools_response" | jq -r '.[0:5][] | "  \(.name): \(.apy // "N/A")%"' 2>/dev/null || echo "  Data format error"
  else
    echo "⚠️  Cannot fetch pool data"
  fi
  
  # Wait and show countdown
  for i in {15..1}; do
    printf "\r⏰ Next check in: %2d seconds" $i
    sleep 1
  done
  printf "\r                              \r"
done