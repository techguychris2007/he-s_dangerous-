const https = require('node:https');

function get(url) {
  return new Promise((resolve, reject) => {
    // No cookies, credentials or bypass tokens: test a new learner's access.
    const request = https.get(url, { headers: { 'User-Agent': 'DarkWorld-Public-Deployment-Check/1.0' } }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { if (body.length < 2_000_000) body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    request.setTimeout(20_000, () => request.destroy(new Error('Request timed out')));
    request.on('error', reject);
  });
}

function classify(response, url) {
  if (response.headers.location) {
    const target = new URL(response.headers.location, url);
    if (target.hostname === 'vercel.com' && /\/(?:sso-api|login|access)/.test(target.pathname)) {
      return 'Vercel Authentication blocks public access. Check Project Settings → Deployment Protection and share the public production domain.';
    }
  }
  if (/Protected by Vercel Authentication/i.test(response.body)) return 'Vercel Authentication blocks public access.';
  if (/DEPLOYMENT_NOT_FOUND|DEPLOYMENT_DELETED|DEPLOYMENT_DISABLED/.test(response.body)) return 'This deployment is unavailable. Check the current production domain and deployment status.';
  if (response.status >= 400) return 'Public request failed with HTTP ' + response.status + '. Check the deployment and domain configuration.';
  return null;
}

async function check(input) {
  let url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Supply a public HTTPS URL without credentials.');
  url.hash = '';
  for (let hop = 0; hop < 5; hop++) {
    const response = await get(url);
    const issue = classify(response, url);
    if (issue) throw new Error(issue);
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      url = new URL(response.headers.location, url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Unexpected non-HTTPS or credential-bearing redirect.');
      continue;
    }
    if (response.status !== 200 || !/id=["']root["']/.test(response.body) || !/<script\b[^>]*\bsrc=/i.test(response.body)) {
      throw new Error('This URL did not serve the DarkWorld application shell. Check the build output and assigned domain.');
    }
    const asset = response.body.match(/<script\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
    const assetUrl = new URL(asset, url);
    if (assetUrl.origin !== url.origin) throw new Error('The entry script is unexpectedly hosted on another origin.');
    const javascript = await get(assetUrl);
    const assetIssue = classify(javascript, assetUrl);
    if (assetIssue) throw new Error(assetIssue);
    if (javascript.status !== 200 || !/javascript|ecmascript/i.test(javascript.headers['content-type'] ?? '')) {
      throw new Error('The entry script is unavailable or served with the wrong content type.');
    }
    console.log('PASS: Anonymous visitors can load the app shell and entry script at ' + url.origin);
    console.log('This verifies public delivery, not learner sign-in or backend functionality.');
    return;
  }
  throw new Error('Too many redirects before reaching the application.');
}

if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: npm run check:deployment -- https://your-public-production-domain');
    process.exitCode = 1;
  } else check(input).catch(error => { console.error('FAIL: ' + error.message); process.exitCode = 1; });
}
module.exports = { classify };
