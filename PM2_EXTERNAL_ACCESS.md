# PM2 Monitoring - External Access Guide

## 🎯 **Problem Solved**
You can now access PM2 monitoring through your external Replit URL!

## 🌐 **External Access URLs**

### PM2 Process Status
```
https://dc10b6b7-3fe2-4be7-8e53-bc83c302b4eb-00-334oy17bcobqc.janeway.replit.dev/api/monitor/status
```

### PM2 System Health
```
https://dc10b6b7-3fe2-4be7-8e53-bc83c302b4eb-00-334oy17bcobqc.janeway.replit.dev/api/monitor/health
```

### Service Logs
```
https://dc10b6b7-3fe2-4be7-8e53-bc83c302b4eb-00-334oy17bcobqc.janeway.replit.dev/api/monitor/logs/poolDataSync
https://dc10b6b7-3fe2-4be7-8e53-bc83c302b4eb-00-334oy17bcobqc.janeway.replit.dev/api/monitor/logs/holderDataSync
```

### Service Control (POST requests)
```
https://dc10b6b7-3fe2-4be7-8e53-bc83c302b4eb-00-334oy17bcobqc.janeway.replit.dev/api/monitor/start/poolDataSync
https://dc10b6b7-3fe2-4be7-8e53-bc83c302b4eb-00-334oy17bcobqc.janeway.replit.dev/api/monitor/stop/poolDataSync
https://dc10b6b7-3fe2-4be7-8e53-bc83c302b4eb-00-334oy17bcobqc.janeway.replit.dev/api/monitor/restart/poolDataSync
```

## 📊 **What You'll See**

### Status Response Format:
```json
[
  {
    "name": "pm2-monitor", 
    "pid": 12345,
    "status": "online",
    "restarts": 0,
    "cpu": 0,
    "memory_mb": 22,
    "uptime_ms": 123456,
    "uptime_display": "2m 3s"
  }
]
```

## 🔧 **Integration Details**

The PM2 monitoring is now integrated directly into your main application (port 5000) instead of running on a separate port (3001). This makes it accessible via your external Replit domain.

### Architecture:
- **Main App**: Port 5000 (externally accessible)
- **PM2 Monitor**: Integrated into main app via `/api/monitor/*` routes
- **Direct PM2 Access**: Uses PM2 JavaScript API for real-time data

## 🚀 **Usage Examples**

### Browser Access
Simply open the URLs above in your browser to see JSON responses.

### API Testing
```bash
# Get process status
curl "https://your-replit-url/api/monitor/status"

# Get specific service logs
curl "https://your-replit-url/api/monitor/logs/poolDataSync"

# Start a service (requires authentication)
curl -X POST "https://your-replit-url/api/monitor/start/poolDataSync"
```

## 🛡️ **Security Notes**
- All PM2 monitoring endpoints require authentication
- Service control operations are logged
- External access is secured through the main application's auth system

Your PM2 monitoring is now fully accessible via your external Replit URL! 🎉