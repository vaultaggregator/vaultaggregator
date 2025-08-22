#!/bin/bash
echo "🖥️ Application Monitor - Main Server Logs"
echo "========================================"
echo "Monitoring: Express server, API requests, errors"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor the main application process
ps aux | grep -E "(tsx|node)" | grep "server/index.ts" | head -1 | awk '{print "Main Process PID: " $2}'
echo ""

# Follow application logs with filtering
npm run dev 2>&1 | grep -E "(express|Error|WARNING|✅|❌|🚀|⚠️)" --line-buffered | while IFS= read -r line; do
  echo "$(date '+%H:%M:%S') - $line"
done