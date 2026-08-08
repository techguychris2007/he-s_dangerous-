import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Bank Account

A classic first class: state (\`balance\`) held on \`this\`, methods that mutate it, and one method
that has to refuse to do its job under the wrong conditions.
`;

const STARTER = `class BankAccount {
  constructor(owner, balance = 0) {
    // TODO: store owner and balance on this
  }

  deposit(amount) {
    // TODO: add amount to the balance. Return the new balance.
  }

  withdraw(amount) {
    // TODO: subtract amount from the balance. Throw new Error("insufficient funds") if amount is
    // greater than the current balance. Return the new balance.
  }
}

module.exports = { BankAccount };
`;

const SOLUTION = `class BankAccount {
  constructor(owner, balance = 0) {
    this.owner = owner;
    this.balance = balance;
  }

  deposit(amount) {
    this.balance += amount;
    return this.balance;
  }

  withdraw(amount) {
    if (amount > this.balance) {
      throw new Error('insufficient funds');
    }
    this.balance -= amount;
    return this.balance;
  }
}

module.exports = { BankAccount };
`;

const TEST_CODE = `const { BankAccount } = require('./account');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const acct = new BankAccount('Ama', 100);
check('initial owner', acct.owner, 'Ama');
check('initial balance', acct.balance, 100);

check('deposit returns new balance', acct.deposit(50), 150);
check('balance updated after deposit', acct.balance, 150);

check('withdraw returns new balance', acct.withdraw(30), 120);
check('balance updated after withdraw', acct.balance, 120);

let raised = false;
try {
  acct.withdraw(1000);
} catch (e) {
  raised = true;
  check('overdraw error message', e.message, 'insufficient funds');
}
check('overdraw throws', raised, true);
check('balance unchanged after failed withdraw', acct.balance, 120);

const fresh = new BankAccount('Kofi');
check('default balance is 0', fresh.balance, 0);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-011',
  title: 'Bank Account',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'OOP/Classes',
  tags: ['classes', 'state', 'errors'],
  prompt: 'Build a BankAccount class that holds its balance as instance state and refuses to overdraw.',
  hints: [
    '`constructor` just assigns its parameters onto `this`: `this.owner = owner`, `this.balance = balance`.',
    '`deposit` mutates `this.balance` with `+=` then returns it — same shape for `withdraw` with `-=`.',
    'Check `if (amount > this.balance)` and throw BEFORE mutating anything, so a failed withdrawal leaves the balance untouched.',
    "The default parameter `balance = 0` in the constructor's signature is already there — you just need to actually store it on `this`.",
  ],
  files: [pf('README.md', README, { editable: false }), pf('account.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('account.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Bank Account', kind: 'node-js', entry: 'account.js', testCode: TEST_CODE }],
};

export default task;
