let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  const n = parseInt(input.trim(), 10);
  const lines = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) lines.push('FizzBuzz');
    else if (i % 3 === 0) lines.push('Fizz');
    else if (i % 5 === 0) lines.push('Buzz');
    else lines.push(String(i));
  }
  console.log(lines.join('\n'));
});
