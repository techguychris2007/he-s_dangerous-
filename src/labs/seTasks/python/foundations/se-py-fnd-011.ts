import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Bank Account

A classic first class: state (\`balance\`) held on \`self\`, methods that mutate it, and one method
that has to refuse to do its job under the wrong conditions.
`;

const STARTER = `class BankAccount:
    def __init__(self, owner, balance=0):
        # TODO: store owner and balance on self
        pass

    def deposit(self, amount):
        """Add \`amount\` to the balance. Return the new balance."""
        # TODO
        pass

    def withdraw(self, amount):
        """Subtract \`amount\` from the balance. Raise ValueError("insufficient funds") if amount is
        greater than the current balance. Return the new balance."""
        # TODO
        pass
`;

const SOLUTION = `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
        return self.balance
`;

const TEST_CODE = `from account import BankAccount

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

acct = BankAccount("Ama", 100)
__check__("initial owner", acct.owner, "Ama")
__check__("initial balance", acct.balance, 100)

__check__("deposit returns new balance", acct.deposit(50), 150)
__check__("balance updated after deposit", acct.balance, 150)

__check__("withdraw returns new balance", acct.withdraw(30), 120)
__check__("balance updated after withdraw", acct.balance, 120)

raised = False
try:
    acct.withdraw(1000)
except ValueError as e:
    raised = True
    __check__("overdraw error message", str(e), "insufficient funds")
__check__("overdraw raises", raised, True)
__check__("balance unchanged after failed withdraw", acct.balance, 120)

fresh = BankAccount("Kofi")
__check__("default balance is 0", fresh.balance, 0)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-011',
  title: 'Bank Account',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'OOP/Classes',
  tags: ['classes', 'state', 'exceptions'],
  prompt: 'Build a BankAccount class that holds its balance as instance state and refuses to overdraw.',
  hints: [
    '`__init__` just assigns its parameters onto `self`: `self.owner = owner`, `self.balance = balance`.',
    '`deposit` mutates `self.balance` with `+=` then returns it — same shape for `withdraw` with `-=`.',
    'Check `if amount > self.balance:` and raise BEFORE mutating anything, so a failed withdrawal leaves the balance untouched.',
    'The default parameter `balance=0` in `__init__`\'s signature is already there — you just need to actually store it on `self`.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('account.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('account.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Bank Account', kind: 'python', entry: 'account.py', testCode: TEST_CODE }],
};

export default task;
