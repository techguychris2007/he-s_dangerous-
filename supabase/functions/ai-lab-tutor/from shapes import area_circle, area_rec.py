class BankAccount:
    def_init_(self,owner,balance=0)
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