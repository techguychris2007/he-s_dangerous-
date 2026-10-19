require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { isUnsupportedDevice } = require('../src/lib/deviceAccess.ts');
const computer = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 0, screenWidth: 1920, screenHeight: 1080, coarsePointer: false };
for (const signals of [computer, { ...computer, screenWidth: 800, screenHeight: 600 }, { ...computer, maxTouchPoints: 10, coarsePointer: true }, { ...computer, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', platform: 'MacIntel' }, { ...computer, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', platform: 'Linux x86_64' }]) {
  assert.equal(isUnsupportedDevice(signals), false, 'Computers, including touch laptops and resized windows, remain supported');
}
for (const signals of [{ ...computer, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18)' }, { ...computer, userAgent: 'Mozilla/5.0 (Linux; Android 15)' }, { ...computer, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', platform: 'MacIntel', maxTouchPoints: 5 }, { ...computer, mobile: true }, { ...computer, screenWidth: 390, screenHeight: 844, maxTouchPoints: 5, coarsePointer: true }]) {
  assert.equal(isUnsupportedDevice(signals), true, 'Phone and tablet signals must show the computer access notice');
}
console.log('Device access checks passed: computers allowed; phones and tablets blocked.');
