let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  const tokens = input.trim().split(/\s+/).map(Number);
  const n = tokens[0];
  const nums = tokens.slice(1, 1 + n);
  console.log(nums.reduce((a, b) => a + b, 0));
});
