let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  const n = parseInt(input.trim(), 10);

  // TODO: print FizzBuzz for 1..n, one value per line
});
