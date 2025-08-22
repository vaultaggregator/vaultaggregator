import fs from 'fs';

async function run() {
  const url = process.env.ALCHEMY_RPC_URL;
  if (!url) throw new Error('ALCHEMY_RPC_URL missing');

  const body = { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] };
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const data = await res.json();

  if (!data.result) throw new Error('No blockNumber returned');

  fs.mkdirSync('admin/services/status', { recursive: true });
  fs.writeFileSync('admin/services/status/alchemyHealthCheck.json', JSON.stringify({
    last_run: new Date().toISOString(),
    block: parseInt(data.result, 16)
  }, null, 2));

  console.log('Alchemy HealthCheck ok, block:', data.result);
}

export { run };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(err => { console.error(err); process.exit(1); });
}