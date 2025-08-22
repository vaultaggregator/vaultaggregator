const fs = require('fs');
const path = require('path');
const express = require('express');
const pm2 = require('pm2');

const SERVICES_DIR = 'admin/services';
const LOG_DIR = 'logs';
const PORT = process.env.MONITOR_PORT || 3001; // Using 3001 to avoid conflict with main app

function findServices() {
  if (!fs.existsSync(SERVICES_DIR)) return [];
  return fs.readdirSync(SERVICES_DIR)
    .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
    .map(f => {
      const ext = path.extname(f);
      const name = path.basename(f, ext);
      const script = path.join(SERVICES_DIR, f);
      const isTs = ext === '.ts';
      return { name, script, isTs };
    });
}

function startAll(cb) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const services = findServices();
  pm2.connect(err => {
    if (err) return cb(err);
    let left = services.length;
    if (!left) return cb(null);
    services.forEach(svc => {
      pm2.start({
        name: svc.name,
        script: svc.script,
        node_args: svc.isTs ? ['-r', 'ts-node/register'] : undefined,
        env: { NODE_ENV: 'production' },
        out_file: path.join(LOG_DIR, `${svc.name}.log`),
        error_file: path.join(LOG_DIR, `${svc.name}.err.log`),
        time: true,
        watch: false,
        autorestart: true
      }, () => {
        left -= 1;
        if (left === 0) cb(null);
      });
    });
  });
}

const app = express();

app.get('/monitor/status', (_, res) => {
  pm2.list((err, list) => {
    if (err) return res.status(500).json({ error: String(err) });
    const data = list.map(p => ({
      name: p.name,
      pid: p.pid,
      status: p.pm2_env.status,
      restarts: p.pm2_env.restart_time,
      cpu: p.monit.cpu,
      memory_mb: Math.round((p.monit.memory || 0) / 1048576),
      uptime_ms: Date.now() - (p.pm2_env.pm_uptime || Date.now())
    }));
    res.json(data);
  });
});

app.get('/monitor/logs/:name', (req, res) => {
  const name = req.params.name;
  const lines = Math.min(parseInt(req.query.lines || '200', 10), 2000);
  const file = path.join(LOG_DIR, `${name}.log`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'log not found' });
  const text = fs.readFileSync(file, 'utf8');
  const tail = text.split('\n').slice(-lines).join('\n');
  res.type('text/plain').send(tail);
});

app.get('/monitor/start/:name', (req, res) => {
  pm2.start(req.params.name, err => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ ok: true });
  });
});

app.get('/monitor/stop/:name', (req, res) => {
  pm2.stop(req.params.name, err => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ ok: true });
  });
});

startAll(err => {
  if (err) console.error('pm2 start error', err);
  app.listen(PORT, () => console.log('PM2 Monitor Server running on port', PORT));
});