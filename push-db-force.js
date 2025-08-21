const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'push', '--force'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Send '1' to select creating the table
child.stdin.write('1\n');
child.stdin.end();

child.on('exit', (code) => {
  console.log(`Database push completed with code ${code}`);
  process.exit(code);
});