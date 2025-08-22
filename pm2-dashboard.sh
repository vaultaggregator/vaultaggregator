#!/bin/bash

echo "🚀 PM2 Service Dashboard"
echo "========================"
echo ""

# Check if PM2 is running
if pm2 pid > /dev/null 2>&1; then
  echo "✅ PM2 Daemon: Running"
  echo ""
  
  # Show PM2 processes
  echo "📊 PM2 Services:"
  pm2 list
  
  echo ""
  echo "📈 Resource Usage:"
  pm2 info poolDataSync 2>/dev/null | grep -E "memory|cpu" || echo "  No services running yet"
  
  echo ""
  echo "📌 Commands:"
  echo "  Start all:    pm2 start admin/services/*.ts"
  echo "  Stop all:     pm2 stop all"
  echo "  Restart all:  pm2 restart all"
  echo "  View logs:    pm2 logs"
  echo "  Monitor:      pm2 monit"
  echo "  Save config:  pm2 save"
else
  echo "❌ PM2 Daemon: Not running"
  echo ""
  echo "Start PM2 with: node monitor-server.cjs"
fi

echo ""
echo "🔍 Monitor Server Status:"
if curl -s http://localhost:3001/monitor/status > /dev/null 2>&1; then
  echo "✅ Monitor API: Running on port 3001"
  curl -s http://localhost:3001/monitor/status | jq '.'
else
  echo "❌ Monitor API: Not running"
fi