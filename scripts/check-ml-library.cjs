// Catalog integrity, offline PDF provenance and library route/filter regression checks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
require('./register-typescript.cjs');
require.extensions['.css'] = () => {};
const { BOOKS, booksInTrack, findBook } = require('../src/data/books.ts');
const { ML_LIBRARY } = require('../src/data/mlLibrary.ts');
const manifest = require('../public/books/ml-sources.json');

assert.equal(new Set(BOOKS.map(book => book.id)).size, BOOKS.length, 'Duplicate library IDs');
const shelf = booksInTrack('machine-learning');
assert.equal(shelf.length, 23);
assert.equal(new Set(shelf.map(book => book.order)).size, shelf.length);
for (const book of ML_LIBRARY) {
  assert.equal(findBook(book.id), book);
  assert.ok(book.stage && book.kind && book.level && book.readingGuide && book.verifiedOn);
  assert.equal(new URL(book.officialUrl).protocol, 'https:');
  assert.equal(new URL(book.licenseUrl).protocol, 'https:');
  if (book.filename) {
    const provenance = manifest.files.find(file => file.filename === book.filename);
    assert.ok(provenance, 'Every mirrored ML file must have a source and fingerprint');
    assert.equal(provenance.modified, false);
    const data = fs.readFileSync(path.join('public/books', book.filename));
    assert.ok(data.subarray(0, 8).toString().startsWith('%PDF-'));
    assert.ok(data.subarray(-1024).includes(Buffer.from('%%EOF')));
    assert.equal(data.length, provenance.bytes);
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'), provenance.sha256);
    for (const license of provenance.licenseFiles) assert.ok(fs.statSync(path.join('public/books', license)).size > 100);
  } else {
    assert.equal(book.fileSizeMb, undefined, 'Link-only resources must not advertise local downloads');
  }
}

// Keep global portal/auth widgets outside this page-level render check.
for (const component of ['../src/components/layout/PortalNavigation.tsx', '../src/components/characters/CharacterAvatar.tsx', '../src/components/books/OfflineLibraryCard.tsx']) {
  const componentPath = require.resolve(component);
  require.cache[componentPath] = { id: componentPath, filename: componentPath, loaded: true, exports: { __esModule: true, default: () => null } };
}
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
const LibraryPage = require('../src/pages/LibraryPage.tsx').default;
const render = route => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(LibraryPage)));
const all = render('/library?track=machine-learning');
assert.ok(all.includes('23 resources shown'));
assert.ok(all.includes('Dive into Deep Learning'));
assert.ok(all.includes('Evaluation &amp; Production'));
const docs = render('/library?track=machine-learning&kind=Documentation');
assert.ok(docs.includes('scikit-learn User Guide'));
assert.ok(!docs.includes('Dive into Deep Learning'));
const search = render('/library?track=machine-learning&q=tokenization');
assert.ok(search.includes('Hugging Face LLM Course'));
assert.ok(!search.includes('Think Stats'));
assert.ok(render('/library?track=machine-learning&q=nonexistenttitle123').includes('Clear filters'));
assert.ok(render('/library?track=programming').includes('Think Python'));
assert.ok(!render('/library?track=security').includes('Dive into Deep Learning'));
console.log(`ML library passed: ${shelf.length} resources, verified PDF/license provenance, shelf routes, type/search filters and existing tracks.`);

if (process.argv.includes('--links')) {
  (async () => {
    const urls = [...new Set(shelf.flatMap(book => [book.officialUrl, book.licenseUrl]))];
    const failures = [];
    for (let start = 0; start < urls.length; start += 4) {
      await Promise.all(urls.slice(start, start + 4).map(async url => {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'DarkWorld-Library-Resource-Check' } });
          await response.body?.cancel();
          if (!response.ok) failures.push(`${response.status}: ${url}`);
        } catch (error) { failures.push(`${url}: ${error.message}`); }
      }));
    }
    assert.deepEqual(failures, [], 'Official source links failed');
    console.log(`Verified ${urls.length} official source and license URLs.`);
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
