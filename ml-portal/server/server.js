const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PYTHON_DIR = path.join(__dirname, '..', 'python');
const PORT = process.env.PORT || 3000;

let pythonCmd = null;
function resolvePython() {
  if (pythonCmd) return pythonCmd;
  for (const candidate of ['python', 'python3']) {
    const probe = spawnSync(candidate, ['--version']);
    if (!probe.error) {
      pythonCmd = candidate;
      return pythonCmd;
    }
  }
  return null;
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.csv': 'text/csv',
};

function serveStatic(req, res) {
  const reqPath = (req.url === '/' ? '/index.html' : req.url).split('?')[0];
  const filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

function runEngine(scriptName, args, csvData, res) {
  const scriptPath = path.join(PYTHON_DIR, `${scriptName}.py`);

  if (!fs.existsSync(scriptPath)) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `engine script not found: ${scriptPath}` }));
  }

  const python = resolvePython();
  if (!python) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Python was not found on PATH. Install Python 3 (python.org) and restart the server.',
    }));
  }

  const child = spawn(python, [scriptPath, ...args]);
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });

  child.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `failed to launch ${scriptName}: ${err.message}` }));
  });

  child.on('close', (code) => {
    if (res.writableEnded) return;
    if (code !== 0) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(stderr.trim() || JSON.stringify({ error: `${scriptName} exited with code ${code}` }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(stdout);
  });

  child.stdin.write(csvData);
  child.stdin.end();
}

function handleRun(req, res) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'invalid JSON body' }));
    }

    const { algorithm, data } = payload;
    if (typeof data !== 'string' || !data.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'missing CSV data' }));
    }

    if (algorithm === 'linear_regression') {
      runEngine('linear_regression', [], data, res);
    } else if (algorithm === 'kmeans') {
      const k = String(Math.max(1, parseInt(payload.k, 10) || 3));
      const maxIter = String(Math.max(1, parseInt(payload.maxIter, 10) || 100));
      runEngine('kmeans', [k, maxIter], data, res);
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `unknown algorithm: ${algorithm}` }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/run') {
    return handleRun(req, res);
  }
  if (req.method === 'GET') {
    return serveStatic(req, res);
  }
  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`ML portal running at http://localhost:${PORT}`);
});
