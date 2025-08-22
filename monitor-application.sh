#!/bin/bash
echo "🖥️ Application Monitor - Live Server Logs"
echo "=========================================="
echo "Monitoring: Express server, API requests, errors"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Get the main process PID
PID=$(pgrep -f "server/index.ts")
if [[ -n "$PID" ]]; then
  echo "Main Process PID: $PID"
  echo "Server Status: ✅ RUNNING"
else
  echo "Server Status: ❌ NOT RUNNING"
fi
echo ""

# Monitor server logs in real-time
while true; do
  if pgrep -f "server/index.ts" > /dev/null; then
    # Follow the actual server process output
    tail -f /proc/$(pgrep -f "server/index.ts")/fd/1 2>/dev/null | grep -E "(express|Error|WARNING|✅|❌|🚀|⚠️|GET|POST|PUT|DELETE)" --line-buffered | while IFS= read -r line; do
      echo "$(date '+%H:%M:%S') - $line"
    done
  else
    echo "$(date '+%H:%M:%S') - ⚠️ Server process not found, waiting..."
    sleep 5
  fi
done