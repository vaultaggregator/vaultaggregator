#!/bin/bash
echo "🏥 API Health Monitor - Live API Status"
echo "======================================="
echo "Monitoring: Alchemy, Morpho, Lido, Etherscan APIs"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
  clear
  echo "🏥 API Health Monitor - $(date '+%H:%M:%S')"
  echo "======================================="
  echo ""
  
  # Check Alchemy API
  echo "🔗 Alchemy API:"
  alchemy_status=$(curl -s http://localhost:5000/api/test/alchemy/blockNumber | jq -r '.blockNumber // "ERROR"' 2>/dev/null)
  if [[ $alchemy_status != "ERROR" ]] && [[ $alchemy_status != "null" ]]; then
    echo "  ✅ ONLINE - Block: $alchemy_status"
  else
    echo "  ❌ OFFLINE"
  fi
  
  echo ""
  echo "⚙️ API Settings:"
  curl -s http://localhost:5000/api/api-settings 2>/dev/null | jq -r '.[] | "  \(.name): \(if .isEnabled then "✅ ENABLED" else "❌ DISABLED" end)"' || echo "  API not responding"
  
  echo ""
  echo "📊 Service Status:"
  curl -s http://localhost:5000/api/admin/services/status 2>/dev/null | jq -r '.[] | "  \(.displayName): \(.status)"' || echo "  Services not responding"
  
  echo ""
  echo "Next refresh in 15 seconds... (Ctrl+C to stop)"
  sleep 15
done