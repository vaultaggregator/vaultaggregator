#!/bin/bash
echo "🔍 Simple Live Monitor - Pool Data Updates"
echo "=========================================="
echo "Press Ctrl+C to stop"
echo ""

while true; do
    echo "$(date '+%H:%M:%S') - Checking for live updates..."
    
    # Get current server status
    if pgrep -f "server/index.ts" > /dev/null; then
        echo "$(date '+%H:%M:%S') - ✅ Server running"
        
        # Check API health
        api_status=$(curl -s http://localhost:5000/api/admin/services/status | jq -r '.[] | select(.name=="poolDataSync") | .status' 2>/dev/null)
        echo "$(date '+%H:%M:%S') - Pool Sync Status: $api_status"
        
        # Check recent pool data
        recent_pools=$(curl -s http://localhost:5000/api/pools | jq -r '.[0:3] | .[] | "\(.tokenPair): \(.apy)%"' 2>/dev/null)
        if [[ -n "$recent_pools" ]]; then
            echo "$(date '+%H:%M:%S') - Recent Pool Data:"
            echo "$recent_pools" | sed 's/^/  /'
        fi
    else
        echo "$(date '+%H:%M:%S') - ❌ Server not running"
    fi
    
    echo ""
    sleep 15
done