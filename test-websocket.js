const WebSocket = require('ws');

console.log('🧪 Testing WebSocket connection for real-time APY updates...');

const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('open', function open() {
  console.log('✅ WebSocket connection established');
});

ws.on('message', function message(data) {
  const parsed = JSON.parse(data.toString());
  console.log('📡 Received message:', parsed);
  
  if (parsed.type === 'apy_update') {
    console.log(`💰 APY Update: Pool ${parsed.poolId} = ${parsed.apy}%`);
  }
});

ws.on('close', function close() {
  console.log('❌ WebSocket connection closed');
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

// Keep alive for 30 seconds to test
setTimeout(() => {
  console.log('🔚 Test completed - closing connection');
  ws.close();
  process.exit(0);
}, 30000);