# Alchemy API Integration Guide

## Overview
This is a controlled, step-by-step integration of the Alchemy API with strict cost controls to prevent excessive request charges.

## Architecture

### Components
1. **Alchemy Client Wrapper** (`server/lib/alchemyClient.ts`)
   - Request rate limiting (600 requests/minute default)
   - In-memory caching with TTL
   - Deduplication of concurrent identical calls
   - Exponential backoff with jitter on errors
   - Minimum interval between calls
   - Comprehensive logging to `alchemy_requests.log`
   - Budget warnings at 70% usage

2. **Feature Flags Middleware** (`server/middleware/featureFlags.ts`)
   - All endpoints disabled by default
   - Must be explicitly enabled one at a time
   - Returns 403 when disabled

3. **Test Routes** (`server/routes/alchemyTest.ts`)
   - Lightweight test endpoints for validation
   - Budget monitoring endpoint
   - Flag status endpoint

## Environment Variables

Add these to your `.env` file:

```env
# Required - Your Alchemy RPC URL
ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optional - Override defaults
ALCHEMY_REQUESTS_PER_MIN=600      # Max requests per minute
ALCHEMY_CACHE_TTL_S=15            # Cache TTL in seconds
ALCHEMY_MIN_INTERVAL_MS=250       # Min interval between calls
ALCHEMY_MAX_RETRIES=3             # Max retry attempts
ALCHEMY_RETRY_BASE_MS=250         # Base retry delay
STAGE=development                  # or staging/production
```

## Step-by-Step Activation Process

### Step 1: Initial Setup
1. Add your Alchemy RPC URL to environment variables
2. Restart the server
3. Check that all flags are disabled: `GET /api/test/alchemy/flags`

### Step 2: Test with Block Number (Lightweight)
1. Enable the flag: 
   ```bash
   curl -X POST http://localhost:3000/api/test/alchemy/flags/getBlockNumber \
     -H "Content-Type: application/json" \
     -d '{"enabled": true}'
   ```

2. Test the endpoint:
   ```bash
   curl http://localhost:3000/api/test/alchemy/blockNumber
   ```

3. Check logs in `alchemy_requests.log`

4. Monitor budget:
   ```bash
   curl http://localhost:3000/api/test/alchemy/budget
   ```

5. Disable when done testing:
   ```bash
   curl -X POST http://localhost:3000/api/test/alchemy/flags/getBlockNumber \
     -H "Content-Type: application/json" \
     -d '{"enabled": false}'
   ```

### Step 3: Test Token Balances (Heavier)
Only enable after validating Step 2 works correctly:

1. Enable the flag:
   ```bash
   curl -X POST http://localhost:3000/api/test/alchemy/flags/getTokenBalances \
     -H "Content-Type: application/json" \
     -d '{"enabled": true}'
   ```

2. Test with a single address:
   ```bash
   curl -X POST http://localhost:3000/api/test/alchemy/tokenBalances \
     -H "Content-Type: application/json" \
     -d '{"address": "0x..."}'
   ```

## Available Endpoints

### Test Endpoints
- `GET /api/test/alchemy/blockNumber` - Get current block number (requires `getBlockNumber` flag)
- `POST /api/test/alchemy/tokenBalances` - Get token balances for address (requires `getTokenBalances` flag)
- `GET /api/test/alchemy/budget` - Check current request budget status
- `GET /api/test/alchemy/flags` - View all feature flag states
- `POST /api/test/alchemy/flags/:flagName` - Enable/disable a feature flag

## Monitoring

### Logs
All requests are logged to `alchemy_requests.log` with:
- Timestamp
- Method name
- Cache hit/miss
- HTTP status
- Retry attempts
- Error messages

### Budget Monitoring
The system enforces:
- 600 requests per minute (configurable)
- Warning at 70% usage
- Hard stop at 100% usage

### Example Log Entries
```
[2024-01-01T12:00:00.000Z] HIT method=eth_blockNumber key=abc123
[2024-01-01T12:00:01.000Z] OK method=eth_blockNumber attempts=1 key=def456
[2024-01-01T12:00:02.000Z] WARN budget_warning method=eth_blockNumber count=420/600
[2024-01-01T12:00:03.000Z] BLOCK budget_exceeded method=eth_blockNumber
```

## Adding New Endpoints

When ready to add a new Alchemy endpoint:

1. Add the feature flag in `server/middleware/featureFlags.ts`
2. Create the route in appropriate file
3. Use `requireFlag('flagName')` middleware
4. Always call through `alchemyRequest()`
5. Test with flag disabled first
6. Enable flag and test with minimal data
7. Monitor logs and budget for 24 hours
8. Only then enable in production

## Troubleshooting

### "ALCHEMY_RPC_URL missing"
- Ensure the environment variable is set
- Restart the server after adding it

### "Budget exceeded, try later"
- Wait for the next minute window
- Check current usage: `GET /api/test/alchemy/budget`
- Consider increasing ALCHEMY_REQUESTS_PER_MIN if needed

### "Feature disabled"
- Check flag status: `GET /api/test/alchemy/flags`
- Enable the required flag using the POST endpoint

## Safety Features

1. **Request Budget**: Hard limit on requests per minute
2. **Feature Flags**: All endpoints off by default
3. **Caching**: Reduces duplicate requests
4. **Deduplication**: Prevents concurrent identical calls
5. **Rate Limiting**: Minimum interval between calls
6. **Retry Logic**: Exponential backoff on errors
7. **Logging**: Complete audit trail
8. **Budget Warnings**: Alert at 70% usage

## Next Steps

After successfully testing the basic endpoints:
1. Monitor usage patterns for 24 hours
2. Adjust cache TTL and rate limits based on needs
3. Add more endpoints one at a time
4. Consider implementing webhooks for real-time data
5. Set up alerts for budget warnings

Remember: **Never enable all endpoints at once!**