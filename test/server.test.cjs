const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
for (const port of [3000, 4317]) {
  test('npm start serves / on ' + port, async () => {
    const env = { ...process.env }; delete env.PORT;
    if (port !== 3000) env.PORT = String(port);
    const child = spawn('npm', ['start'], { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', d => output += d); child.stderr.on('data', d => output += d);
    try {
      for (let i = 0; i < 100 && !output.includes('listening on ' + port); i++) await new Promise(r => setTimeout(r, 50));
      assert.match(output, new RegExp('listening on ' + port));
      const res = await fetch('http://127.0.0.1:' + port + '/');
      assert.equal(res.status, 200); assert.match(await res.text(), /<canvas/);
    } finally { process.kill(-child.pid, 'SIGTERM'); }
  });
}
