#!/bin/bash

echo "🔍 PM2 Service Monitor Status"
echo "============================="
echo ""

# Check PM2 monitor server
if curl -s http://localhost:3001/monitor/status > /dev/null 2>&1; then
  echo "✅ PM2 Monitor Server: Running on port 3001"
  echo ""
  echo "📊 Service Status:"
  curl -s http://localhost:3001/monitor/status | jq -r '.[] | "  \(.name): \(.status) | PID: \(.pid) | Restarts: \(.restarts) | Memory: \(.memory_mb)MB"' 2>/dev/null || echo "  (No services running)"
else
  echo "❌ PM2 Monitor Server: Not running"
  echo "  Start with: node monitor-server.js"
fi

echo ""
echo "📌 Available Commands:"
echo "  View status:     curl http://localhost:3001/monitor/status"
echo "  View logs:       curl http://localhost:3001/monitor/logs/{service_name}"
echo "  Start service:   curl http://localhost:3001/monitor/start/{service_name}"
echo "  Stop service:    curl http://localhost:3001/monitor/stop/{service_name}"
echo ""
echo "  PM2 CLI:         pm2 list"
echo "  PM2 logs:        pm2 logs {service_name}"
echo "  PM2 monit:       pm2 monit"