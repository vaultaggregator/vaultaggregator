#!/bin/bash
echo "📡 Live Pool Updates Monitor - Real-Time APY/TVL Data"
echo "====================================================="
echo "Watching for: Pool updates, Morpho scraping, Lido data"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to extract and format pool update info
format_pool_update() {
    local line="$1"
    if [[ "$line" =~ "Updated pool" ]] && [[ "$line" =~ "APY" ]]; then
        # Extract pool ID and APY from the line
        pool_id=$(echo "$line" | grep -o '[a-f0-9-]\{36\}' | head -1)
        apy=$(echo "$line" | grep -o 'APY [0-9.]\+%' | head -1)
        echo "🔄 Pool Update: $apy (ID: ${pool_id:0:8}...)"
    elif [[ "$line" =~ "Successfully scraped" ]]; then
        # Extract pool ID and APY from Morpho scraping
        pool_id=$(echo "$line" | grep -o '[a-f0-9-]\{36\}' | head -1)
        apy=$(echo "$line" | grep -o 'APY [0-9.]\+%' | head -1)
        echo "✅ Morpho Scraped: $apy (ID: ${pool_id:0:8}...)"
    elif [[ "$line" =~ "Scraping completed" ]]; then
        echo "🎯 Scraping Cycle Complete: $line"
    else
        echo "📊 $line"
    fi
}

# Monitor the workflow logs directly
while true; do
    # Check if server is running
    if ! pgrep -f "server/index.ts" > /dev/null; then
        echo "$(date '+%H:%M:%S') - ⚠️ Server not running, waiting..."
        sleep 5
        continue
    fi
    
    # Get the main server PID
    server_pid=$(pgrep -f "tsx.*server/index.ts" | head -1)
    
    if [[ -n "$server_pid" ]]; then
        echo "$(date '+%H:%M:%S') - 🔍 Monitoring server PID: $server_pid"
        
        # Monitor server stdout for pool-related events
        timeout 60 stdbuf -oL tail -f /proc/$server_pid/fd/1 2>/dev/null | \
        grep -E "(Updated pool|Successfully scraped|\[Morpho\]|💾|✅.*Scraping|APY [0-9])" --line-buffered | \
        while IFS= read -r line; do
            echo "$(date '+%H:%M:%S') - $(format_pool_update "$line")"
        done
    fi
    
    sleep 2
done