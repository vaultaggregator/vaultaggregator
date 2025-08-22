# PM2 Service Monitoring System Access Guide

## Overview
Your DeFi yield aggregator platform now includes enterprise-grade PM2 process management with comprehensive monitoring capabilities.

## Access Methods

### 1. PM2 Monitor Server (Port 3001)
**Primary monitoring interface running on port 3001**

#### Basic Status
```bash
curl http://localhost:3001/status
```

#### Service Status API
```bash
curl http://localhost:3001/monitor/status | jq
```

#### Service Logs
```bash
curl http://localhost:3001/monitor/logs/poolDataSync
curl http://localhost:3001/monitor/logs/holderDataSync
curl http://localhost:3001/monitor/logs/morphoApiSync
```

#### Service Control
```bash
# Start service
curl http://localhost:3001/monitor/start/poolDataSync

# Stop service  
curl http://localhost:3001/monitor/stop/poolDataSync
```

### 2. Admin Dashboard (Main Application)
**Integrated admin interface at http://localhost:5000/admin**

- Service configuration management
- Real-time status monitoring
- Database-persistent settings
- Service interval configuration
- Manual service triggers

### 3. Command Line Monitoring Scripts

#### PM2 Process Monitoring
```bash
./monitor-pm2-status.sh         # Real-time PM2 status
./access-pm2-dashboard.sh       # Quick access guide
```

#### Live Data Monitoring
```bash
./monitor-pooldata-live.sh      # Pool data sync monitoring
./monitor-live-updates.sh       # Real-time data updates
./monitor-api-health.sh         # API health monitoring
```

#### Direct PM2 Commands
```bash
pm2 list                        # List all processes
pm2 status                      # Process status
pm2 logs poolDataSync           # Service logs
pm2 restart poolDataSync        # Restart service
pm2 stop poolDataSync           # Stop service
pm2 start poolDataSync          # Start service
```

## Current Active Services

1. **poolDataSync** - APY and TVL data synchronization (1 minute intervals)
2. **holderDataSync** - Token holder tracking (25 minute intervals)  
3. **morphoApiSync** - Morpho protocol data sync (5 minute intervals)
4. **alchemyHealthCheck** - API health monitoring (2 minute intervals)
5. **pm2-monitor** - PM2 monitoring server (port 3001)

## Service Configuration

All service intervals and settings are database-persistent and can be modified through:

- Admin dashboard: http://localhost:5000/admin
- API endpoints: `PUT /api/admin/services/{service}/config`
- Direct database updates via service configuration tables

## Troubleshooting

### If PM2 Monitor Server is Not Responding:
```bash
pm2 restart pm2-monitor
pm2 logs pm2-monitor
```

### If Services Are Not Running:
```bash
pm2 list
pm2 restart all
```

### If Admin Dashboard is Inaccessible:
1. Ensure you're logged in (authentication required)
2. Check main application is running on port 5000
3. Navigate to http://localhost:5000/admin

## Log Files
- Service logs: `logs/{serviceName}.log`
- Error logs: `logs/{serviceName}.err.log`
- PM2 logs: `~/.pm2/logs/`

## Next Steps
1. Access the admin dashboard for full control
2. Use monitoring scripts for real-time updates
3. Configure service intervals as needed
4. Monitor performance via PM2 metrics