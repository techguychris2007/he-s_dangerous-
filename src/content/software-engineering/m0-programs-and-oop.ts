import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module SE 2 — from scripts to programs: handling errors, files and modules, then object-oriented
 *  programming from the first class up to inheritance and polymorphism. Still beginner-paced: every
 *  idea starts from an everyday picture and a small runnable example before any design vocabulary. */
export const SE_OOP_MODULE: CurriculumLesson[] = [
  {
    id: 'sef-7',
    slug: 'errors-and-exceptions',
    title: 'When Things Go Wrong: Reading Errors and Handling Exceptions',
    summary: 'Read a traceback calmly, recognise the common error types, catch problems with try/except, and raise your own errors for bad input.',
    minutes: 30,
    prerequisite: 'Lesson: Functions (def, parameters and return).',
    outcomes: [
      'Read a traceback from the bottom up and find the line and cause of an error.',
      'Recognise the common beginner errors: SyntaxError, NameError, TypeError, ValueError, IndexError, KeyError and ZeroDivisionError.',
      'Use try / except / else / finally to handle errors you expect, catching specific exception types.',
      'Raise ValueError with a helpful message when a function receives input it cannot use.',
    ],
    introduction:
      'Every programmer, at every level, sees errors all day. The difference between a beginner and an experienced engineer is not that the engineer makes fewer mistakes — it is that they read the error message instead of panicking. Python\'s messages are unusually helpful: they say what went wrong, in which file, on which line. In this lesson you will learn to read them, to handle problems you can predict (like a user typing "ten" instead of 10), and to make your own functions complain clearly when they are misused.',
    keyTerms: [
      { term: 'Exception', meaning: 'An error that happens while a program is running, such as dividing by zero.' },
      { term: 'Traceback', meaning: 'The report Python prints when an exception is not handled, showing where it happened and why.' },
      { term: 'try / except', meaning: 'A block that runs risky code in try and handles a named error type in except instead of crashing.' },
      { term: 'raise', meaning: 'The keyword that deliberately signals an error, such as raise ValueError("age must be positive").' },
      { term: 'ValueError', meaning: 'The error for a value of the right type but the wrong content, such as int("ten").' },
      { term: 'SyntaxError', meaning: 'An error in how the code is written, such as a missing colon, found before the program even runs.' },
    ],
    sections: [
      {
        title: 'Reading a traceback from the bottom up',
        paragraphs: [
          'When an exception is not handled, Python prints a traceback. Read it from the bottom. The last line names the error type and gives a message. The lines just above it show the file and line number where it happened. Further up is the chain of function calls that led there.',
          'In the example, the last line says ZeroDivisionError: division by zero, and the line above points at return total / count inside average. The cause is clear: average was called with an empty list, so count was 0.',
        ],
        code: `def average(numbers):
    total = sum(numbers)
    count = len(numbers)
    return total / count

print(average([]))

# Traceback (most recent call last):
#   File "main.py", line 6, in <module>
#     print(average([]))
#   File "main.py", line 4, in average
#     return total / count
# ZeroDivisionError: division by zero      <- start reading here`,
        label: 'The last line tells you what; the line above tells you where',
      },
      {
        title: 'The errors you will meet most',
        paragraphs: [
          'A SyntaxError means Python could not even understand the code: a missing colon, bracket or quote. A NameError means you used a name that does not exist yet — usually a typo. A TypeError means you mixed types that do not go together, like "5" + 5. A ValueError means the type was right but the value was not, like int("ten").',
          'IndexError means a list or string position does not exist; KeyError means a dictionary key does not exist. Each name tells you which kind of mistake to look for, which narrows the search enormously.',
        ],
        code: `# print("hi"          -> SyntaxError: '(' was never closed
# pritn("hi")          -> NameError: name 'pritn' is not defined
# "5" + 5              -> TypeError: can only concatenate str (not "int") to str
# int("ten")           -> ValueError: invalid literal for int() with base 10: 'ten'
# [1, 2, 3][5]         -> IndexError: list index out of range
# {"a": 1}["b"]        -> KeyError: 'b'`,
        label: 'Common errors and what causes them',
      },
      {
        title: 'Handling errors you expect: try / except',
        paragraphs: [
          'Some errors are not bugs in your code but normal events: a user types letters where you wanted a number, or a file is missing. For those, wrap the risky line in try and handle the error in except. If no error happens, the except block is skipped.',
          'Always name the error type you expect, such as except ValueError. A bare except: catches everything, including real bugs and even Ctrl+C, and hides them. else runs only when no error happened, and finally always runs — useful for clean-up.',
        ],
        code: `def ask_age():
    while True:
        text = input("Age: ")
        try:
            age = int(text)
        except ValueError:
            print(f"'{text}' is not a whole number, try again")
        else:
            return age

def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None

print(safe_divide(10, 2))   # 5.0
print(safe_divide(10, 0))   # None`,
        label: 'Recovering from expected problems',
      },
      {
        title: 'Raising your own errors',
        paragraphs: [
          'When your function receives input it cannot sensibly use, the honest thing to do is stop and say so with raise. Returning a strange value such as -1 or None lets the mistake travel silently through the program and appear somewhere confusing much later. An exception with a clear message points straight at the real problem.',
          'This idea — fail fast, with a clear message — is a core habit of professional engineers. You will see it again in the Software Construction module, where it becomes part of a function\'s contract.',
        ],
        code: `def set_age(age):
    if not isinstance(age, int):
        raise TypeError("age must be a whole number")
    if age < 0 or age > 150:
        raise ValueError(f"age {age} is not realistic")
    return age

set_age(30)       # fine
# set_age(-4)     -> ValueError: age -4 is not realistic

try:
    set_age(200)
except ValueError as error:
    print("Could not save:", error)   # Could not save: age 200 is not realistic`,
        label: 'Failing fast with a clear message',
      },
    ],
    table: {
      headers: ['Error', 'Usual cause', 'First thing to check'],
      rows: [
        ['SyntaxError', 'Missing colon, bracket or quote', 'The line shown and the line just above it'],
        ['NameError', 'Typo, or using a variable before creating it', 'Spelling and order of lines'],
        ['TypeError', 'Mixing types, or wrong number of arguments', 'The types involved — use type()'],
        ['ValueError', 'Right type, wrong content', 'The actual value being converted'],
        ['IndexError / KeyError', 'Position or key does not exist', 'len() of the list or the dictionary\'s keys'],
      ],
    },
    exercise: {
      scenario: 'A function parse_price(text) converts what a user typed, such as "12.50", into a float. Users sometimes type "abc", "" or "-3".',
      task: 'Describe how parse_price should behave for each of those inputs and how the calling code should react, using try / except and raise.',
      answer: 'parse_price should try float(text.strip()); float("abc") and float("") raise ValueError, which it can let propagate or re-raise with a clearer message such as raise ValueError(f"{text!r} is not a price"). For "-3" the conversion succeeds, so it must check if price < 0: raise ValueError("price cannot be negative"). The caller wraps the call in try: price = parse_price(text) except ValueError as e: print(e) and asks again. Nobody uses a bare except, and no strange sentinel like -1 is returned.',
      evidence: 'Specific ValueError handling, an explicit check for the negative value that converts successfully, and the caller deciding how to recover.',
    },
    misconceptions: [
      'Errors mean the program is broken beyond repair. Most tracebacks point straight at a one-line fix.',
      'Wrapping everything in try / except: makes code safe. A bare except hides real bugs; catch only the specific errors you expect.',
      'Returning -1 or None for bad input is as good as raising. Silent bad values cause confusing failures far from the real cause.',
      'Read a traceback from the top. The most useful information is on the last line and the line just above it.',
    ],
    sources: [S.pythonExceptions, S.thinkPython],
    labs: [],
    questions: [
      { prompt: 'Which keyword deliberately signals an error from your own code?', answer: 'raise' },
      { prompt: 'Which error type does int("ten") raise?', answer: 'ValueError' },
    ],
    quiz: [
      { question: 'Where should you start reading a traceback?', options: ['The first line', 'The last line', 'The middle', 'The file name'], answer: 1, explanation: 'The last line names the error and the message; the line above shows where.' },
      { question: 'What does {"a": 1}["z"] raise?', options: ['IndexError', 'ValueError', 'KeyError', 'NameError'], answer: 2, explanation: 'Looking up a missing dictionary key raises KeyError.' },
      { question: 'Why is a bare except: discouraged?', options: ['It is slower', 'It catches every error, hiding real bugs', 'It is a SyntaxError', 'It only catches ValueError'], answer: 1, explanation: 'Catch the specific errors you expect so unexpected bugs still surface.' },
      { question: 'When does the else block of try / except / else run?', options: ['Always', 'Only when an exception occurred', 'Only when no exception occurred', 'Never'], answer: 2, explanation: 'else runs only if the try block finished without an exception.' },
    ],
  },
  {
    id: 'sef-8',
    slug: 'files-modules-and-libraries',
    title: 'Files, Modules and the Standard Library',
    summary: 'Read and write text files safely with with, store data as JSON, import modules, and split your own code into files.',
    minutes: 30,
    prerequisite: 'Lessons: Collections, Functions, and Handling Exceptions.',
    outcomes: [
      'Open, read and write text files using with, and explain why with is safer than open/close.',
      'Process a file line by line, cleaning and skipping blank lines.',
      'Save and load lists and dictionaries with the json module.',
      'Import from the standard library and from your own modules, and explain if __name__ == "__main__".',
    ],
    introduction:
      'Everything you have built so far forgets its data when the program ends. Files let programs remember: a to-do list that is still there tomorrow, a high-score table, a log of what happened. In the same lesson you will meet modules — Python files you can import — because as soon as programs get useful they get longer, and splitting them into files with clear names is how engineers keep them manageable. You will also discover the standard library: hundreds of ready-made modules that ship with Python.',
    keyTerms: [
      { term: 'File', meaning: 'Data stored on disk with a name, which stays after the program ends.' },
      { term: 'with statement', meaning: 'A block that opens a resource such as a file and always closes it afterwards, even if an error happens.' },
      { term: 'Module', meaning: 'A Python file whose functions and variables can be used in another file with import.' },
      { term: 'Standard library', meaning: 'The collection of modules that comes with every Python install, such as math, random, json and datetime.' },
      { term: 'JSON', meaning: 'A text format for storing lists and dictionaries that almost every language can read.' },
      { term: 'Path', meaning: 'The location of a file, such as notes/todo.txt.' },
    ],
    sections: [
      {
        title: 'Reading and writing text files with with',
        paragraphs: [
          'open(path, mode) opens a file: "r" to read, "w" to write (replacing what was there) and "a" to append to the end. Writing it inside a with block guarantees the file is closed when the block ends, even if an error happens halfway through. Forgetting to close files can lose data, so always use with.',
          'Pass encoding="utf-8" so names like "Abená" or emoji are stored correctly on every operating system.',
        ],
        code: `with open("todo.txt", "w", encoding="utf-8") as f:
    f.write("buy milk\\n")
    f.write("call Ama\\n")

with open("todo.txt", "a", encoding="utf-8") as f:
    f.write("finish lesson 8\\n")

with open("todo.txt", encoding="utf-8") as f:
    text = f.read()
print(text)
# buy milk
# call Ama
# finish lesson 8`,
        label: 'Write, append, read',
      },
      {
        title: 'Processing a file line by line',
        paragraphs: [
          'Looping over an open file gives you one line at a time, each ending with a newline character "\\n". strip() removes it. This style uses very little memory, so it works even for huge log files.',
          'Real files are messy: blank lines, extra spaces, comments. Clean each line before using it and skip what you do not need — the loop and string skills from earlier lessons do all the work.',
        ],
        code: `done = 0
with open("todo.txt", encoding="utf-8") as f:
    for number, line in enumerate(f, start=1):
        task = line.strip()
        if not task or task.startswith("#"):
            continue                      # skip blanks and comments
        print(f"{number}. {task}")

# Reading a file that may not exist
try:
    with open("missing.txt", encoding="utf-8") as f:
        print(f.read())
except FileNotFoundError:
    print("No file yet - starting fresh")`,
        label: 'Clean every line before using it',
      },
      {
        title: 'Saving structured data with JSON',
        paragraphs: [
          'Plain text is fine for a list of lines, but a dictionary of students with marks needs structure. The json module turns lists and dictionaries into text (json.dumps / json.dump) and back again (json.loads / json.load). The result is readable by people and by almost every other programming language.',
        ],
        code: `import json

marks = {"Ama": [91, 84], "Kofi": [78, 80]}

with open("marks.json", "w", encoding="utf-8") as f:
    json.dump(marks, f, indent=2)

with open("marks.json", encoding="utf-8") as f:
    loaded = json.load(f)

print(loaded["Ama"])              # [91, 84]
print(json.dumps({"ok": True}))   # {"ok": true}`,
        label: 'Round-tripping a dictionary through a file',
      },
      {
        title: 'Modules: using other people\'s code and organising your own',
        paragraphs: [
          'import math makes the math module available; use its contents with a dot: math.sqrt(16). from random import choice imports one name directly. The standard library covers dates (datetime), randomness (random), maths (math), file paths (pathlib), CSV files (csv) and much more — always check it before writing something yourself.',
          'Any .py file you write is a module too. Put your grade functions in grades.py and import them from main.py. Code under if __name__ == "__main__": runs only when you run that file directly, not when another file imports it, which lets a module contain a small demo without side effects.',
        ],
        code: `# grades.py
def average(marks):
    return sum(marks) / len(marks)

if __name__ == "__main__":
    print(average([80, 90]))     # runs only with: python grades.py

# main.py
import math
from datetime import date
from grades import average

print(math.sqrt(16))             # 4.0
print(average([70, 80, 90]))     # 80.0
print(date(2026, 10, 27).strftime("%A"))   # Tuesday`,
        label: 'Importing the standard library and your own module',
      },
    ],
    table: {
      headers: ['Mode', 'Meaning', 'If the file already exists'],
      rows: [
        ['"r"', 'Read (the default)', 'Reads it; FileNotFoundError if missing'],
        ['"w"', 'Write', 'Erases it and starts empty'],
        ['"a"', 'Append', 'Adds to the end'],
        ['"x"', 'Create', 'Fails with FileExistsError'],
      ],
    },
    exercise: {
      scenario: 'You are building a tiny habit tracker. Each day the user records a habit name and whether they did it. The data must survive restarting the program.',
      task: 'Describe how you would store the data, load it at start-up (including the first run when no file exists), add today\'s entry, and save it again. Name the modules and file modes you would use.',
      answer: 'Store a dictionary such as {"2026-10-27": {"read": true, "walk": false}} in habits.json. On start-up: try: with open("habits.json", encoding="utf-8") as f: data = json.load(f) except FileNotFoundError: data = {}. Get today\'s key with str(date.today()) from datetime. Update data[today][habit] = done, then save with with open("habits.json", "w", encoding="utf-8") as f: json.dump(data, f, indent=2). The functions load(), record() and save() could live in a habits.py module imported by main.py.',
      evidence: 'JSON for structured data, with blocks for every file, FileNotFoundError handled for the first run, and "w" mode used deliberately to replace the old file.',
    },
    misconceptions: [
      'Opening a file in "w" mode adds to it. "w" erases the file first; use "a" to add.',
      'You must call close() yourself. A with block closes the file for you, even when an error occurs.',
      'Importing a module runs only the functions you use. Importing runs the whole file once, which is why demos go under if __name__ == "__main__".',
      'You need to install packages for everyday tasks. The standard library already covers dates, JSON, CSV, maths, randomness and files.',
    ],
    sources: [S.pyInputOutput, S.pyModules, S.thinkPython],
    labs: [],
    questions: [
      { prompt: 'Which file mode adds to the end of an existing file without erasing it?', answer: 'a', accept: ['append', '"a"'] },
      { prompt: 'Which standard library module converts dictionaries to and from JSON text?', answer: 'json' },
    ],
    quiz: [
      { question: 'Why is with open(...) as f: preferred over f = open(...)?', options: ['It reads faster', 'It always closes the file, even after an error', 'It works only with JSON', 'It creates a backup'], answer: 1, explanation: 'The with block guarantees clean-up.' },
      { question: 'What happens to existing content when you open a file with "w"?', options: ['It is kept and new text is added', 'It is erased', 'An error is raised', 'It is moved to a backup'], answer: 1, explanation: '"w" truncates the file before writing.' },
      { question: 'Which error handles the first run, when a data file has not been created yet?', options: ['KeyError', 'FileNotFoundError', 'ValueError', 'ImportError'], answer: 1, explanation: 'Opening a missing file for reading raises FileNotFoundError.' },
      { question: 'What does code under if __name__ == "__main__": do?', options: ['Runs every time the module is imported', 'Runs only when the file is run directly', 'Never runs', 'Runs before any import'], answer: 1, explanation: 'It lets a module include a demo that does not run on import.' },
    ],
  },
  {
    id: 'sef-9',
    slug: 'classes-and-objects',
    title: 'Object-Oriented Programming 1: Classes and Objects',
    summary: 'Bundle data and behaviour together: define a class, create objects, use __init__ and self, write methods, and give objects a readable __repr__.',
    minutes: 35,
    prerequisite: 'Lessons: Collections and Functions. You should be comfortable writing functions that take parameters and return values.',
    outcomes: [
      'Explain the difference between a class (the blueprint) and an object (a thing built from it).',
      'Define a class with __init__, store attributes on self, and create several independent objects.',
      'Write methods that read and change an object\'s attributes.',
      'Add __repr__ so objects print helpfully, and explain when a class is better than a dictionary.',
    ],
    introduction:
      'Until now, data and the functions that work on it have lived separately: a dictionary for a bank account here, a withdraw() function there, and nothing stopping someone from changing the balance directly. Object-oriented programming (OOP) bundles them together. A class is a blueprint, like the architect\'s drawing of a house. An object is an actual house built from that drawing — you can build many, each with its own furniture. In this lesson you will write your first class and see how objects make programs easier to reason about.',
    keyTerms: [
      { term: 'Class', meaning: 'A blueprint that describes what data an object holds and what it can do.' },
      { term: 'Object', meaning: 'One thing built from a class, with its own values. Also called an instance.' },
      { term: 'Attribute', meaning: 'A value stored on an object, such as account.balance.' },
      { term: 'Method', meaning: 'A function defined inside a class that works on one object, called with a dot: account.deposit(50).' },
      { term: 'Constructor', meaning: 'The __init__ method, which runs automatically when a new object is created and sets its starting attributes.' },
      { term: 'self', meaning: 'The first parameter of every method: the particular object the method was called on.' },
    ],
    sections: [
      {
        title: 'From dictionaries to classes',
        paragraphs: [
          'You could represent a bank account as a dictionary: {"owner": "Ama", "balance": 100}. It works, but nothing describes what an account must contain, any code can set the balance to -5000, and the functions that handle accounts are scattered around. A class gathers all of this in one place with a name.',
          'By convention class names use CapitalisedWords (BankAccount), while functions and variables use snake_case.',
        ],
        code: `# Without a class: data and behaviour are separate
account = {"owner": "Ama", "balance": 100}

def deposit(acc, amount):
    acc["balance"] += amount

deposit(account, 50)
account["balance"] = -5000     # nothing stops this`,
        label: 'The problem classes solve',
      },
      {
        title: 'Your first class: __init__ and self',
        paragraphs: [
          'class BankAccount: starts the blueprint. __init__ (two underscores on each side) is the constructor: it runs automatically every time you create an object, and its job is to set the starting attributes. self is the object being created, so self.owner = owner means "store owner on this particular account".',
          'Create an object by calling the class like a function: BankAccount("Ama", 100). Python creates a new empty object, passes it to __init__ as self, and gives it back to you. Each object has its own attributes, so changing one account does not affect another.',
        ],
        code: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

ama = BankAccount("Ama", 100)
kofi = BankAccount("Kofi")

print(ama.owner, ama.balance)    # Ama 100
print(kofi.owner, kofi.balance)  # Kofi 0

ama.balance = 150
print(kofi.balance)              # 0  (separate objects)`,
        label: 'One blueprint, independent objects',
      },
      {
        title: 'Methods: behaviour that belongs to the object',
        paragraphs: [
          'A method is a function written inside the class. Its first parameter is always self, and Python fills it in for you: ama.deposit(50) actually calls BankAccount.deposit(ama, 50). Inside the method, self.balance is that account\'s balance.',
          'Methods are where the rules live. withdraw() can refuse to go below zero, so as long as everyone uses the methods, no account can end up in an impossible state. The next lesson shows how to make that guarantee stronger.',
        ],
        code: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount

acc = BankAccount("Ama", 100)
acc.deposit(50)
acc.withdraw(30)
print(acc.balance)        # 120
# acc.withdraw(500)       -> ValueError: insufficient funds`,
        label: 'Methods enforce the rules',
      },
      {
        title: 'Making objects print nicely with __repr__',
        paragraphs: [
          'Print an object without help and you get something like <__main__.BankAccount object at 0x7f…>, which tells you nothing. Define __repr__ to return a string describing the object, and Python uses it whenever the object is printed or shown in a list. This makes debugging dramatically easier.',
          'Methods with double underscores on both sides (often called dunder methods) are hooks Python calls for you: __init__ when creating, __repr__ when displaying, and others you will meet in the lesson on polymorphism.',
        ],
        code: `class Book:
    def __init__(self, title, author, pages):
        self.title = title
        self.author = author
        self.pages = pages

    def is_long(self):
        return self.pages > 400

    def __repr__(self):
        return f"Book({self.title!r}, {self.author!r}, {self.pages})"

shelf = [Book("Things Fall Apart", "Chinua Achebe", 209),
         Book("Half of a Yellow Sun", "Chimamanda Ngozi Adichie", 433)]
print(shelf)
# [Book('Things Fall Apart', 'Chinua Achebe', 209), Book('Half of a Yellow Sun', 'Chimamanda Ngozi Adichie', 433)]
print([b.title for b in shelf if b.is_long()])   # ['Half of a Yellow Sun']`,
        label: 'Readable objects with __repr__',
      },
    ],
    table: {
      headers: ['Idea', 'Everyday picture', 'Python'],
      rows: [
        ['Class', 'The blueprint for a house', 'class House:'],
        ['Object / instance', 'One actual house', 'home = House("Accra")'],
        ['Attribute', 'This house\'s colour', 'home.colour'],
        ['Method', 'Something the house can do', 'home.open_door()'],
        ['self', '"This particular house"', 'def open_door(self):'],
      ],
    },
    exercise: {
      scenario: 'A school library wants to track books. Each book has a title, an author and whether it is currently on loan. A book can be lent out (only if it is not already on loan) and returned.',
      task: 'Design a Book class: list its attributes, write the constructor, and describe lend() and give_back() including what should happen if someone tries to lend a book that is already on loan.',
      answer: 'class Book: def __init__(self, title, author): self.title = title; self.author = author; self.on_loan = False. def lend(self): if self.on_loan: raise ValueError(f"{self.title} is already on loan"); self.on_loan = True. def give_back(self): self.on_loan = False. def __repr__(self): return f"Book({self.title!r}, on_loan={self.on_loan})". Every new book starts available because __init__ sets on_loan to False; the rule "cannot lend twice" lives in one place, the lend method.',
      evidence: 'Attributes set in __init__, methods that use and change self, a rule enforced with an exception, and a useful __repr__.',
    },
    misconceptions: [
      'A class and an object are the same thing. The class is the blueprint; objects are the things built from it.',
      'You must pass self when calling a method. Python passes the object automatically: acc.deposit(50), not acc.deposit(acc, 50).',
      'All objects of a class share the same attributes. Attributes set on self belong to that one object.',
      'OOP is always better than functions. Use a class when data and the rules about it belong together; simple tasks are often clearer as functions.',
    ],
    sources: [S.pyClasses, S.thinkPython, S.pep8],
    labs: [],
    questions: [
      { prompt: 'What is the name of the method that runs automatically when a new object is created?', answer: '__init__', accept: ['init', 'constructor'] },
      { prompt: 'What is the conventional name of the first parameter of every method?', answer: 'self' },
    ],
    quiz: [
      { question: 'What does a = Dog("Rex") create?', options: ['A new class called Dog', 'A new object (instance) of the Dog class', 'A function', 'A dictionary'], answer: 1, explanation: 'Calling the class creates an instance and runs __init__.' },
      { question: 'Inside a method, what does self.name refer to?', options: ['A global variable', 'The name attribute of the object the method was called on', 'The class name', 'The method name'], answer: 1, explanation: 'self is the particular object.' },
      { question: 'Why define __repr__?', options: ['It is required for every class', 'So printing an object shows useful information', 'To make the object faster', 'To delete the object'], answer: 1, explanation: 'Without it, printing shows only the type and a memory address.' },
      { question: 'Two accounts a and b are created from BankAccount. After a.balance = 10, what is b.balance?', options: ['10', 'Whatever b was created with', 'An error', '0 always'], answer: 1, explanation: 'Each object has its own attributes.' },
    ],
  },
  {
    id: 'sef-10',
    slug: 'encapsulation-and-properties',
    title: 'Object-Oriented Programming 2: Encapsulation, Properties and Class Attributes',
    summary: 'Protect an object\'s data so it is always valid: private-by-convention attributes, read-only and validated properties, and class attributes shared by all objects.',
    minutes: 30,
    prerequisite: 'Lesson: Classes and Objects.',
    outcomes: [
      'Explain encapsulation and why outside code should change an object only through its methods.',
      'Use the leading underscore convention for internal attributes.',
      'Use @property for read-only values and computed values, and a setter to validate changes.',
      'Tell class attributes from instance attributes and avoid the shared-list trap.',
    ],
    introduction:
      'In the last lesson BankAccount had a withdraw() method that refused to overdraw — but any code could still write acc.balance = -5000 and skip the rule entirely. Encapsulation is the idea that an object should guard its own data: outside code asks the object to do things, and the object decides whether they are allowed. Think of a vending machine. You press buttons and insert coins; you do not open the back and rearrange the cans yourself. This lesson shows the Python tools for building objects that always stay valid.',
    keyTerms: [
      { term: 'Encapsulation', meaning: 'Keeping an object\'s data behind its methods so the object can enforce its own rules.' },
      { term: 'Private attribute', meaning: 'An attribute meant for internal use only, marked in Python with a leading underscore, such as self._balance.' },
      { term: 'Property', meaning: 'A method that is read like an attribute, created with @property, often used for read-only or computed values.' },
      { term: 'Setter', meaning: 'A method that runs when a property is assigned, letting the class validate the new value.' },
      { term: 'Class attribute', meaning: 'A value defined on the class itself and shared by every object of that class.' },
      { term: 'Invariant', meaning: 'A rule about an object\'s data that must always be true, such as "balance is never negative".' },
    ],
    sections: [
      {
        title: 'Why objects should guard their own data',
        paragraphs: [
          'An invariant is a rule that must always hold for an object: an account balance is never negative, a temperature is never below absolute zero, a to-do list never contains blank items. If any code anywhere can change the attributes directly, nobody can promise the invariant holds — you would have to check every line of the program.',
          'Encapsulation moves that promise into the class. If the only way to change the balance is through deposit() and withdraw(), and both check the rule, then the rule is guaranteed by reading one small class. That is a huge saving as programs grow.',
        ],
      },
      {
        title: 'The underscore convention',
        paragraphs: [
          'Python does not have truly private attributes. Instead it relies on a convention every Python programmer respects: a name starting with a single underscore, such as self._balance, means "internal — do not touch from outside the class". Tools and code reviewers will flag outside code that uses it.',
          'This keeps the public surface of the class small: a few methods and properties that are safe to use, while the details stay free to change.',
        ],
        code: `class BankAccount:
    def __init__(self, owner, balance=0):
        if balance < 0:
            raise ValueError("opening balance cannot be negative")
        self.owner = owner
        self._balance = balance      # internal: change it through methods

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._balance += amount`,
        label: 'Marking internal state',
      },
      {
        title: 'Properties: attributes with rules',
        paragraphs: [
          'Users of the class still need to read the balance. A property lets them write acc.balance as if it were a plain attribute, while the class runs a method behind the scenes. With only a getter, the property is read-only: assigning to it raises an AttributeError.',
          'Add a setter with @name.setter to allow changes but validate them first. Properties also work for computed values, such as a full name built from first and last names, so the value can never be out of date.',
        ],
        code: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance

    @property
    def balance(self):              # read like an attribute
        return self._balance

acc = BankAccount("Ama", 100)
print(acc.balance)                  # 100
# acc.balance = -5000  -> AttributeError: property 'balance' has no setter

class Thermostat:
    def __init__(self, celsius):
        self.celsius = celsius      # goes through the setter below

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):           # computed, never stale
        return self._celsius * 9 / 5 + 32

t = Thermostat(25)
print(t.fahrenheit)                 # 77.0
# t.celsius = -300  -> ValueError: below absolute zero`,
        label: 'Read-only, validated and computed properties',
      },
      {
        title: 'Class attributes and the shared-list trap',
        paragraphs: [
          'An attribute assigned in the class body (outside any method) is a class attribute, shared by every object. It is ideal for constants such as an interest rate or a counter of how many objects were created. Attributes assigned on self are per-object.',
          'The trap: putting a list or dictionary in the class body makes every object share the same one. Adding an item for one object adds it for all. Create mutable attributes inside __init__ instead.',
        ],
        code: `class Student:
    school = "Accra Academy"     # class attribute: shared
    count = 0

    def __init__(self, name):
        self.name = name         # instance attribute: per object
        self.courses = []        # created fresh for each student
        Student.count += 1

a = Student("Ama")
b = Student("Kofi")
a.courses.append("Maths")
print(b.courses)         # []  (separate lists)
print(Student.count)     # 2
print(b.school)          # Accra Academy

class Buggy:
    courses = []         # shared by every Buggy object!`,
        label: 'Shared versus per-object data',
      },
    ],
    table: {
      headers: ['Tool', 'What it gives you', 'Example'],
      rows: [
        ['_name', 'A signal that the attribute is internal', 'self._balance'],
        ['@property', 'Read access that looks like an attribute', 'acc.balance'],
        ['@x.setter', 'Validation whenever the value changes', 't.celsius = 30'],
        ['Computed property', 'A value that can never be out of date', 't.fahrenheit'],
        ['Class attribute', 'One value shared by all objects', 'Student.school'],
      ],
    },
    exercise: {
      scenario: 'A Rectangle class stores width and height. Some code sets width to 0 or a negative number, and some code stores area as an attribute that becomes wrong after the width changes.',
      task: 'Redesign Rectangle so width and height must always be positive and area is always correct.',
      answer: 'Store _width and _height. Make width and height properties whose setters raise ValueError if value <= 0, and have __init__ assign self.width = width and self.height = height so the setters validate the starting values too. Make area a read-only property: @property def area(self): return self._width * self._height. Because area is computed each time it is read, it can never be stale, and because every change to width or height goes through a setter, the "always positive" invariant always holds.',
      evidence: 'Validation in setters (used by __init__ as well), area computed rather than stored, and a stated invariant.',
    },
    misconceptions: [
      'A leading underscore makes an attribute truly private. It is a convention; Python still allows access, but well-behaved code does not use it.',
      'Properties are slower and so should be avoided. The cost is negligible, and the guarantees are worth it.',
      'Validating in __init__ is enough. Values can change later, so validation belongs wherever the value can change — a setter or method.',
      'Lists in the class body are per-object. They are shared by every object; create them in __init__.',
    ],
    sources: [S.pyClasses, S.pyProperty, S.thinkPython],
    labs: [],
    questions: [
      { prompt: 'Which decorator lets a method be read like an attribute?', answer: '@property', accept: ['property'] },
      { prompt: 'What prefix marks an attribute as internal by Python convention?', answer: 'underscore', accept: ['single underscore', 'leading underscore'] },
    ],
    quiz: [
      { question: 'What happens when you assign to a property that has no setter?', options: ['The value is stored', 'AttributeError', 'Nothing', 'The getter runs'], answer: 1, explanation: 'A property without a setter is read-only.' },
      { question: 'Why make area a property instead of storing it in __init__?', options: ['Properties use less memory', 'It is computed from current values, so it can never be out of date', 'Stored attributes are not allowed', 'It hides the value'], answer: 1, explanation: 'A stored copy goes stale when width or height changes.' },
      { question: 'A list written in the class body is…', options: ['Created fresh for each object', 'Shared by every object of the class', 'Read-only', 'Deleted after __init__'], answer: 1, explanation: 'Class attributes are shared; create mutable per-object data in __init__.' },
      { question: 'What is an invariant?', options: ['A variable that never changes', 'A rule about an object\'s data that must always be true', 'A private method', 'A type of loop'], answer: 1, explanation: 'Encapsulation exists to protect invariants.' },
    ],
  },
  {
    id: 'sef-11',
    slug: 'inheritance-composition-polymorphism',
    title: 'Object-Oriented Programming 3: Inheritance, Composition and Polymorphism',
    summary: 'Reuse and extend classes with inheritance and super(), override methods, write code that works with many types through polymorphism, and know when composition is the better choice.',
    minutes: 35,
    prerequisite: 'Lessons: Classes and Objects, Encapsulation and Properties.',
    outcomes: [
      'Create a subclass, call the parent constructor with super(), and override a method.',
      'Explain polymorphism and write a loop that treats different objects through the same method.',
      'Use special methods such as __eq__, __len__ and __str__ so objects work with Python\'s built-in operations.',
      'Choose between inheritance ("is a") and composition ("has a") and explain why composition is often safer.',
    ],
    introduction:
      'Many things in the world are special cases of something more general. A savings account is a bank account that also earns interest. A circle and a square are both shapes. Inheritance lets one class build on another, reusing everything and changing only what is different. Polymorphism — a long word for a simple idea — means different objects can respond to the same request in their own way: ask any shape for its area and it knows how to work it out. Together with composition (building objects out of other objects), these ideas complete the object-oriented toolkit you will rely on in the design and architecture modules later in this track.',
    keyTerms: [
      { term: 'Inheritance', meaning: 'Creating a new class (subclass) that reuses and extends an existing class (parent).' },
      { term: 'Subclass', meaning: 'A class that inherits from another, written class Savings(BankAccount).' },
      { term: 'Override', meaning: 'Redefining in a subclass a method that the parent class already has.' },
      { term: 'super()', meaning: 'A way to call the parent class\'s version of a method, most often super().__init__(...).' },
      { term: 'Polymorphism', meaning: 'Different objects responding to the same method call in their own way.' },
      { term: 'Composition', meaning: 'Building a class out of other objects it holds as attributes — a "has a" relationship.' },
    ],
    sections: [
      {
        title: 'Inheritance: reuse and extend',
        paragraphs: [
          'Write the parent class name in brackets to inherit from it: class SavingsAccount(BankAccount):. The subclass gets every method and attribute of the parent automatically. Add new methods for new behaviour.',
          'If the subclass needs extra starting data, give it its own __init__ and call super().__init__(...) first so the parent can set up its part. Forgetting this is a common bug: the parent\'s attributes are never created.',
        ],
        code: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

class SavingsAccount(BankAccount):
    def __init__(self, owner, balance=0, rate=0.05):
        super().__init__(owner, balance)   # parent sets owner and balance
        self.rate = rate

    def add_interest(self):
        self.deposit(self.balance * self.rate)

s = SavingsAccount("Esi", 1000)
s.deposit(100)          # inherited
s.add_interest()        # new
print(s.balance)        # 1155.0`,
        label: 'A subclass with its own constructor',
      },
      {
        title: 'Overriding and polymorphism',
        paragraphs: [
          'A subclass can override a parent method by defining a method with the same name. When you call it, Python uses the most specific version — the subclass\'s if it has one, otherwise the parent\'s.',
          'This is what makes polymorphism work. The loop below calls area() on every shape without knowing or caring what kind of shape each one is. Adding a Triangle later needs no change to the loop at all — just a new class with its own area(). Code that is open to new types without being edited is one of the main goals of good design.',
        ],
        code: `import math

class Shape:
    def area(self):
        raise NotImplementedError("each shape must define area()")

    def describe(self):
        return f"{type(self).__name__} with area {self.area():.2f}"

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius
    def area(self):
        return math.pi * self.radius ** 2

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width, self.height = width, height
    def area(self):
        return self.width * self.height

for shape in [Circle(1), Rectangle(2, 3)]:
    print(shape.describe())
# Circle with area 3.14
# Rectangle with area 6.00`,
        label: 'One call, many behaviours',
      },
      {
        title: 'Special methods: making objects feel built-in',
        paragraphs: [
          'Python\'s operators and built-in functions are themselves polymorphic, using special methods. len(x) calls x.__len__(), x == y calls x.__eq__(y), and str(x) or print(x) uses x.__str__(). Define these and your objects work naturally with the rest of Python.',
          'Python also uses "duck typing": if an object has the method you call, it works, whatever its class. If it walks like a duck and quacks like a duck, Python treats it as a duck. Inheritance is one way to share behaviour, but not the only one.',
        ],
        code: `class Playlist:
    def __init__(self, name, songs=None):
        self.name = name
        self.songs = list(songs or [])

    def __len__(self):
        return len(self.songs)

    def __eq__(self, other):
        return isinstance(other, Playlist) and self.songs == other.songs

    def __str__(self):
        return f"{self.name} ({len(self)} songs)"

a = Playlist("Road trip", ["Ye", "Joha"])
b = Playlist("Copy", ["Ye", "Joha"])
print(len(a))     # 2
print(a == b)     # True  (same songs)
print(a)          # Road trip (2 songs)`,
        label: 'Objects that work with len, == and print',
      },
      {
        title: 'Composition: "has a" is often better than "is a"',
        paragraphs: [
          'Inheritance means "is a": a SavingsAccount is a BankAccount, so everything true of accounts must be true of savings accounts. Composition means "has a": a Car has an Engine, a Library has Books. The class holds other objects as attributes and asks them to do work.',
          'Prefer composition when the relationship is "has a", or when you would only inherit to reuse a few methods. Deep inheritance chains are hard to change, because every subclass depends on the details of every parent. A good rule of thumb: inherit for genuine "is a" relationships only, and keep hierarchies shallow — one or two levels.',
        ],
        code: `class Engine:
    def __init__(self, horsepower):
        self.horsepower = horsepower
    def start(self):
        return "vroom"

class Car:                       # a Car HAS an Engine
    def __init__(self, model, engine):
        self.model = model
        self.engine = engine
    def start(self):
        return f"{self.model}: {self.engine.start()}"

car = Car("Kantanka", Engine(150))
print(car.start())               # Kantanka: vroom

# Swapping parts is easy with composition:
car.engine = Engine(200)`,
        label: 'Building objects from other objects',
      },
    ],
    table: {
      headers: ['Relationship', 'Question to ask', 'Tool'],
      rows: [
        ['"is a"', 'Is every Savings account really a Bank account?', 'Inheritance: class Savings(BankAccount)'],
        ['"has a"', 'Does a Car contain an Engine?', 'Composition: self.engine = Engine()'],
        ['Same request, different behaviour', 'Do all shapes answer area()?', 'Polymorphism through overriding'],
        ['Work with Python built-ins', 'Should len() or == work on it?', 'Special methods: __len__, __eq__'],
      ],
    },
    exercise: {
      scenario: 'A school system has Teachers and Students. Both have a name and an email. Teachers have a list of subjects they teach; students have a list of marks. The report page prints one summary line per person.',
      task: 'Design the classes. Decide what goes in a shared parent, what each subclass adds or overrides, and how the report loops over everyone. Also say where composition would help.',
      answer: 'class Person: __init__(self, name, email) and summary(self) returning f"{self.name} <{self.email}>". class Teacher(Person): __init__ calls super().__init__(name, email) then sets self.subjects = list(subjects); summary overrides to add the subjects. class Student(Person): super().__init__ then self.marks = []; summary adds the average. The report is polymorphic: for person in people: print(person.summary()). Composition helps for things people have rather than are: a Student could hold a Timetable object, and a school could hold lists of Person objects rather than inheriting from list.',
      evidence: 'A shallow hierarchy with super().__init__, an overridden summary method used polymorphically, and composition chosen for "has a" relationships.',
    },
    misconceptions: [
      'A subclass automatically sets up the parent\'s attributes when it defines its own __init__. You must call super().__init__(...).',
      'Inheritance is the main way to reuse code. Composition and plain functions are often simpler and easier to change.',
      'Polymorphism needs a shared parent class. Python\'s duck typing only needs objects to have the method being called.',
      'More levels of inheritance mean better design. Deep hierarchies make change harder; keep them shallow.',
    ],
    sources: [S.pyClasses, S.thinkPython, S.patterns],
    labs: [],
    questions: [
      { prompt: 'Which built-in lets a subclass call its parent class\'s __init__?', answer: 'super', accept: ['super()', 'super().__init__'] },
      { prompt: 'What is the term for building a class out of other objects it holds as attributes?', answer: 'composition' },
    ],
    quiz: [
      { question: 'class Dog(Animal): means…', options: ['Animal inherits from Dog', 'Dog inherits from Animal', 'Dog contains an Animal', 'Dog and Animal are unrelated'], answer: 1, explanation: 'The parent class goes in the brackets.' },
      { question: 'A subclass defines speak() and so does its parent. Which runs for subclass objects?', options: ['The parent\'s', 'The subclass\'s', 'Both', 'Neither'], answer: 1, explanation: 'The most specific (overriding) version is used.' },
      { question: 'A Library holds many Book objects. Which relationship is this?', options: ['Inheritance: Library is a Book', 'Composition: Library has Books', 'Polymorphism', 'Encapsulation only'], answer: 1, explanation: 'It is a "has a" relationship.' },
      { question: 'Which special method makes len(obj) work?', options: ['__size__', '__len__', '__count__', '__length__'], answer: 1, explanation: 'len() calls __len__.' },
    ],
  },
];
