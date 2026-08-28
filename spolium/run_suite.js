const http = require('http');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
      res.end('OK');
      try {
        const data = JSON.parse(body);
        console.log('\n=================== TEST RESULTS ===================\n');
        console.log(data.output);
        console.log('\n====================================================\n');
        server.close();
        if (data.fails === 0) {
          console.log('ALL SPOLIUM TESTS PASSED!');
          process.exit(0);
        } else {
          console.error(`FAILED: ${data.fails} test(s) failed.`);
          process.exit(1);
        }
      } catch (e) {
        console.error('Error parsing report:', e);
        process.exit(1);
      }
    });
  } else {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' });
    res.end();
  }
});

server.listen(9876, () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const testUrl = 'http://localhost:8000/anexacta/spolium/test.html?autorun=1&report=http://localhost:9876/report';
  const child = spawn(edgePath, ['--headless=new', '--autoplay-policy=no-user-gesture-required', testUrl], { stdio: 'ignore' });
  child.on('error', err => {
    console.error('Failed to spawn browser:', err);
    process.exit(1);
  });
  setTimeout(() => {
    console.error('Test run timed out after 30 seconds');
    try { child.kill(); } catch (_) {}
    server.close();
    process.exit(1);
  }, 30000);
});
