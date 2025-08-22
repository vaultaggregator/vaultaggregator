#!/bin/bash
echo "🔄 Pool Data Sync Monitor - Live APY/TVL Updates"
echo "==============================================="
echo "Monitoring: Morpho API & Lido API scraping every 5 minutes"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to get the main server process
get_server_process() {
  pgrep -f "tsx.*server/index.ts"
}

# Start monitoring
echo "$(date '+%H:%M:%S') - Starting pool data monitoring..."

# Monitor using journalctl for more reliable log capture
exec 3< <(journalctl -f --no-pager 2>/dev/null | grep -E "(Updated pool|Successfully scraped|\[Morpho\]|\[Lido\]|APY|TVL|💾|✅|Scraping completed)" --line-buffered)

while IFS= read -r -u 3 line || {
  # Fallback: monitor server process directly if journalctl fails
  server_pid=$(get_server_process)
  if [[ -n "$server_pid" ]]; then
    exec 3< <(tail -f /proc/$server_pid/fd/1 2>/dev/null | grep -E "(Updated pool|Successfully scraped|\[Morpho\]|\[Lido\]|APY|TVL|💾|✅|Scraping completed)" --line-buffered)
    continue
  else
    sleep 5
    echo "$(date '+%H:%M:%S') - Waiting for server process..."
    continue
  fi
}; do
  if [[ -n "$line" ]]; then
    echo "$(date '+%H:%M:%S') - $line"
  fi
done