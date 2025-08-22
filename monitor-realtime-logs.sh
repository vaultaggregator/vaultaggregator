#!/bin/bash
echo "📡 Real-Time System Monitor - Live Data Feed"
echo "============================================"
echo "Monitoring: All system events, API calls, data updates"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to get server PID
get_server_pid() {
  pgrep -f "server/index.ts"
}

# Show initial status
PID=$(get_server_pid)
if [[ -n "$PID" ]]; then
  echo "✅ Server running (PID: $PID)"
  echo "🔍 Monitoring all server output..."
  echo "================================================"
  echo ""
else
  echo "❌ Server not running"
  exit 1
fi

# Monitor all server output in real-time
while true; do
  PID=$(get_server_pid)
  if [[ -n "$PID" ]]; then
    # Use stdbuf to disable buffering and get immediate output
    stdbuf -oL tail -f /proc/$PID/fd/1 2>/dev/null | stdbuf -oL sed 's/^/[SERVER] /' &
    stdbuf -oL tail -f /proc/$PID/fd/2 2>/dev/null | stdbuf -oL sed 's/^/[ERROR] /' &
    
    # Wait for the process to change or exit
    while kill -0 $PID 2>/dev/null; do
      sleep 1
    done
    
    echo "$(date '+%H:%M:%S') - Server process ended, waiting for restart..."
    pkill -P $$ tail 2>/dev/null
    sleep 2
  else
    echo "$(date '+%H:%M:%S') - No server process found, waiting..."
    sleep 5
  fi
done