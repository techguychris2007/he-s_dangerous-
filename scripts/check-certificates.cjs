require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { CERTIFICATE_PATHS, certificateStatus, certificateId } = require('../src/data/pathCertificates.ts');

assert.equal(CERTIFICATE_PATHS.length, 6, 'Expected six learning-path certificates');

for (const path of CERTIFICATE_PATHS) {
  const none = certificateStatus(path.track, () => false);
  const all = certificateStatus(path.track, () => true);

  // Every path must have real lessons behind it, or its certificate could never be earned.
  assert.ok(none.total > 0, `${path.track}: certificate has no lessons and can never be earned`);
  assert.ok(none.moduleCount > 0, `${path.track}: certificate has no modules`);

  // With nothing done, the certificate is locked; with everything done, it is earned at 100%.
  assert.equal(none.earned, false, `${path.track}: should not be earned with zero progress`);
  assert.equal(none.completed, 0, `${path.track}: completed should be 0 with zero progress`);
  assert.equal(all.earned, true, `${path.track}: should be earned when every lesson is complete`);
  assert.equal(all.completed, all.total, `${path.track}: completed must equal total when fully done`);
  assert.equal(all.percent, 100, `${path.track}: percent must be 100 when fully done`);
  assert.equal(all.modulesDone, all.moduleCount, `${path.track}: all modules should read done when fully complete`);

  // Record ids are deterministic and namespaced per track.
  const id1 = certificateId(path.track, 'Ada Lovelace');
  const id2 = certificateId(path.track, 'Ada Lovelace');
  assert.equal(id1, id2, `${path.track}: record id must be deterministic for the same name`);
  assert.match(id1, /^DW-[A-Z]{3}-[0-9A-F]{8}$/, `${path.track}: record id format`);
  assert.notEqual(certificateId(path.track, 'Someone Else'), id1, `${path.track}: different names must yield different ids`);
}

// A credential's id must differ across tracks for the same learner (so certificates are distinct).
const ids = new Set(CERTIFICATE_PATHS.map((path) => certificateId(path.track, 'Same Learner')));
assert.equal(ids.size, CERTIFICATE_PATHS.length, 'Each track must produce a distinct record id for one learner');

console.log(`Certificates passed: ${CERTIFICATE_PATHS.length} learning-path certificates earnable, locked at zero and issued at full completion with deterministic record ids.`);
