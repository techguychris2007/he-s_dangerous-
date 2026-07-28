let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  const s = input.split('\n')[0];
  console.log(s.split('').reverse().join(''));
});
