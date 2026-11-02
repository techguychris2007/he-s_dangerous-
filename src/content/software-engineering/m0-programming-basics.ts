import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module SE 1 — programming from zero. No prior coding assumed: every idea is introduced with an
 *  everyday comparison, a tiny runnable example and the output it prints, before anything abstract. */
export const SE_BASICS_MODULE: CurriculumLesson[] = [
  {
    id: 'sef-1',
    slug: 'first-program-values-and-variables',
    title: 'Your First Program: Values, Variables and Types',
    summary: 'Run Python for the first time, print output, store values in variables and learn the four basic types: int, float, str and bool.',
    minutes: 25,
    prerequisite: 'None. This is the very first lesson. You only need a computer and the Code Portal (or Python installed).',
    outcomes: [
      'Run a Python program and explain what print() does.',
      'Create variables, change their values and explain what the = sign means in code.',
      'Recognise the four basic types (int, float, str, bool) and check a value\'s type with type().',
      'Convert between types with int(), float() and str(), and explain why "5" + 5 is an error.',
    ],
    introduction:
      'A program is a list of instructions that a computer follows exactly, one line at a time, from top to bottom. It does not guess what you meant and it does not skip steps. That sounds strict, but it is also what makes programming learnable: if you know what each instruction does, you can predict what the whole program will do. In this lesson you will write your first instructions, learn how a program remembers things using variables, and meet the four kinds of values every Python program is built from.',
    keyTerms: [
      { term: 'Program', meaning: 'A list of instructions the computer runs in order, top to bottom.' },
      { term: 'Variable', meaning: 'A name that points to a value so the program can remember it and use it later.' },
      { term: 'Assignment', meaning: 'Giving a variable a value with the = sign, for example age = 19.' },
      { term: 'Integer', meaning: 'A whole number with no decimal point, such as 7, 0 or -12. In Python the type is int.' },
      { term: 'Float', meaning: 'A number with a decimal point, such as 3.5 or 0.25.' },
      { term: 'String', meaning: 'A piece of text written inside quotes, such as "hello". In Python the type is str.' },
      { term: 'Boolean', meaning: 'A value that is either True or False. In Python the type is bool.' },
    ],
    sections: [
      {
        title: 'Step 1: make the computer say something',
        paragraphs: [
          'The traditional first program prints a greeting. print() is a built-in instruction (called a function) that shows whatever you put between its brackets. Text must be wrapped in quotes so Python knows it is text and not an instruction.',
          'Type the example into the Code Portal and press Run. Then change the words and run it again. Changing things and watching what happens is the fastest way to learn; you cannot break the computer by experimenting.',
          'Lines that start with # are comments. Python ignores them completely. They are notes for humans, and you will see them in every example in this track explaining what a line does.',
        ],
        code: `# This is a comment. Python skips it.
print("Hello, world!")
print("My name is Ama")
print(2 + 3)        # Python can do maths too

# Output:
# Hello, world!
# My name is Ama
# 5`,
        label: 'Your first program and what it prints',
      },
      {
        title: 'Step 2: variables are labelled boxes',
        paragraphs: [
          'Imagine a box with a name written on the side. You can put a value in it, look at it later, or swap the value for a new one. A variable works like that box. The line score = 10 means "make a box called score and put 10 in it".',
          'In code, = does not mean "is equal to" like in maths. It means "store the value on the right in the name on the left". That is why score = score + 5 makes sense in Python: work out the right side first (10 + 5 = 15), then store 15 back in score.',
          'Good names describe what the value means: total_price, player_name, is_logged_in. Python names use lower-case words joined by underscores (this style is called snake_case). Names cannot start with a digit or contain spaces.',
        ],
        code: `score = 10
print(score)          # 10

score = score + 5     # right side first: 10 + 5, then store 15
print(score)          # 15

player_name = "Kofi"
print(player_name, "has", score, "points")
# Kofi has 15 points`,
        label: 'Storing and updating values',
      },
      {
        title: 'Step 3: the four basic types',
        paragraphs: [
          'Every value has a type, which tells Python what kind of thing it is and what you are allowed to do with it. You can add two numbers, but you cannot add a number to a sentence. These four types cover most beginner programs: int (whole numbers), float (decimal numbers), str (text) and bool (True or False).',
          'Use type() to ask Python what type a value has. When something behaves unexpectedly, checking the type is often the quickest way to find out why.',
        ],
        code: `age = 19            # int
height = 1.72       # float
name = "Esi"        # str
is_student = True   # bool (note the capital T)

print(type(age))         # <class 'int'>
print(type(height))      # <class 'float'>
print(type(name))        # <class 'str'>
print(type(is_student))  # <class 'bool'>

print(7 / 2)    # 3.5  (/ always gives a float)
print(7 // 2)   # 3    (// divides and drops the remainder)
print(7 % 2)    # 1    (% gives the remainder)`,
        label: 'Types and arithmetic',
      },
      {
        title: 'Step 4: converting between types',
        paragraphs: [
          'Text that looks like a number is still text. "5" (with quotes) is a string; 5 (without quotes) is an int. Python refuses to guess what "5" + 5 should mean, so it stops with a TypeError. This is a good thing: guessing would hide mistakes.',
          'To convert, wrap the value in the type you want: int("5") gives 5, str(5) gives "5", float("2.5") gives 2.5. You will need this constantly, because input() — which reads what a user types — always gives you a string.',
        ],
        code: `print("5" + "5")        # 55   (joining two strings)
print(5 + 5)            # 10   (adding two numbers)
print(int("5") + 5)     # 10   (convert first, then add)
print("Age: " + str(19))  # Age: 19

# print("5" + 5)  -> TypeError: can only concatenate str (not "int") to str

typed = input("How old are you? ")   # the user types 19
next_year = int(typed) + 1
print("Next year you will be", next_year)`,
        label: 'Converting text to numbers and back',
      },
    ],
    table: {
      headers: ['Type', 'Example values', 'Typical use'],
      rows: [
        ['int', '0, 42, -7', 'Counting things: items, scores, ages'],
        ['float', '3.14, 0.5, -2.0', 'Measurements and money calculations'],
        ['str', '"hi", "Accra", ""', 'Names, messages, anything typed by a user'],
        ['bool', 'True, False', 'Yes/no facts: is_admin, has_paid'],
      ],
    },
    exercise: {
      scenario: 'A shop sells notebooks for 4.50 each. A customer buys 3. The program should show the total and a thank-you message with the customer\'s name, Abena.',
      task: 'Write the program using variables named price, quantity, customer and total. Then explain what type each variable has.',
      answer: 'price = 4.50; quantity = 3; customer = "Abena"; total = price * quantity; print("Thank you,", customer); print("Your total is", total). The output is "Thank you, Abena" then "Your total is 13.5". price and total are floats, quantity is an int and customer is a str. Multiplying an int by a float gives a float.',
      evidence: 'Four well-named variables, the correct total of 13.5, and the right type named for each variable.',
    },
    misconceptions: [
      'The = sign means "equals". In Python it means "store the value on the right in the name on the left". Comparing uses ==, which you will meet in the lesson on decisions.',
      '"10" and 10 are the same thing. One is text and one is a number; Python treats them completely differently.',
      'You need to be good at maths to program. Most everyday programming is about organising steps clearly, not advanced maths.',
      'Errors mean you did something terrible. Errors are Python telling you exactly which line confused it and why. Reading them is a skill you will practise in every lesson.',
    ],
    sources: [S.pyTutorial, S.thinkPython, S.pep8],
    labs: [],
    questions: [
      { prompt: 'Which built-in function shows a value on the screen?', answer: 'print', accept: ['print()'] },
      { prompt: 'What type does input() always return, whatever the user types?', answer: 'str', accept: ['string'] },
    ],
    quiz: [
      { question: 'What does the line count = count + 1 do?', options: ['Checks whether count equals count + 1', 'Adds 1 to the value in count and stores the result back in count', 'Causes an error because a value cannot equal itself plus one', 'Creates a second variable called count'], answer: 1, explanation: 'The right side is worked out first, then stored in the name on the left.' },
      { question: 'What is the type of the value "3.5"?', options: ['float', 'int', 'str', 'bool'], answer: 2, explanation: 'It is inside quotes, so it is text (str), even though it looks like a number.' },
      { question: 'What does print(7 // 2) show?', options: ['3.5', '3', '1', '4'], answer: 1, explanation: '// is whole-number division: it drops the remainder.' },
      { question: 'Why does "5" + 5 cause an error?', options: ['5 is too small', 'Python will not guess whether you meant to join text or add numbers', 'Quotes are not allowed in Python', 'The + sign only works with strings'], answer: 1, explanation: 'Mixing a str and an int with + is ambiguous, so Python raises a TypeError instead of guessing.' },
    ],
  },
  {
    id: 'sef-2',
    slug: 'working-with-text-strings',
    title: 'Working With Text: Strings, Indexing and f-strings',
    summary: 'Join and repeat text, pick out characters with indexes and slices, use common string methods, and build messages with f-strings.',
    minutes: 25,
    prerequisite: 'Lesson: Your First Program (variables and types).',
    outcomes: [
      'Join strings with +, repeat them with * and measure them with len().',
      'Read single characters with indexes (including negative ones) and pieces with slices.',
      'Use common methods such as upper(), lower(), strip(), replace(), split() and startswith().',
      'Build readable output with f-strings instead of joining many pieces with +.',
    ],
    introduction:
      'Almost every program handles text: names, passwords, messages, file contents, web pages. In Python, text is a string — a sequence of characters in order, like beads on a string. Because the characters have positions, you can count them, pick one out, cut out a piece, or search inside. Strings also come with dozens of built-in tools (methods) for common jobs like tidying spaces or changing case. By the end of this lesson you will be able to clean up messy user input and produce neat output.',
    keyTerms: [
      { term: 'Character', meaning: 'A single letter, digit, space or symbol inside a string.' },
      { term: 'Index', meaning: 'The position number of a character in a string. Counting starts at 0.' },
      { term: 'Slice', meaning: 'A piece cut from a string using start and stop positions, written text[start:stop].' },
      { term: 'Method', meaning: 'A function that belongs to a value and is called with a dot, such as name.upper().' },
      { term: 'f-string', meaning: 'A string with f before the opening quote, where {expressions} inside are replaced by their values.' },
      { term: 'Immutable', meaning: 'Cannot be changed after it is created. String methods return a new string instead of changing the old one.' },
    ],
    sections: [
      {
        title: 'Joining, repeating and measuring',
        paragraphs: [
          'You can write strings with single or double quotes; both mean the same thing. Use + to join two strings end to end (this is called concatenation) and * to repeat one. len() tells you how many characters a string has, including spaces.',
          'Notice that + does not add a space for you. If you want "Ama Mensah", you must join "Ama", a space, and "Mensah".',
        ],
        code: `first = "Ama"
last = 'Mensah'
full = first + " " + last
print(full)            # Ama Mensah
print(len(full))       # 10  (the space counts)
print("ha" * 3)        # hahaha
print("-" * 20)        # --------------------`,
        label: 'Concatenation, repetition and length',
      },
      {
        title: 'Positions: indexing and slicing',
        paragraphs: [
          'Each character has a position number called an index. Python counts from 0, so the first character is at index 0, the second at 1, and so on. Negative indexes count from the end: -1 is the last character, -2 the one before it. Asking for an index that does not exist raises an IndexError.',
          'A slice cuts out a piece: text[start:stop] gives the characters from start up to, but not including, stop. Leave out start to begin at the beginning, or stop to go to the end. text[::-1] is a handy trick that reverses a string.',
        ],
        code: `word = "PYTHON"
#       P  Y  T  H  O  N
# index 0  1  2  3  4  5
#      -6 -5 -4 -3 -2 -1

print(word[0])     # P
print(word[-1])    # N
print(word[0:2])   # PY   (positions 0 and 1, stops before 2)
print(word[2:])    # THON
print(word[:3])    # PYT
print(word[::-1])  # NOHTYP`,
        label: 'Reading characters by position',
      },
      {
        title: 'String methods: built-in tools',
        paragraphs: [
          'A method is a function attached to a value, called with a dot. Strings have many: upper() and lower() change case, strip() removes spaces from both ends, replace(old, new) swaps text, split() breaks a string into a list of words, and startswith() / endswith() / in check what a string contains.',
          'Strings are immutable: a method never changes the original string. It gives you back a new one. If you want to keep the result, store it — for example name = name.strip(). Forgetting this is one of the most common beginner bugs.',
        ],
        code: `raw = "   kofi@Example.COM  "
email = raw.strip().lower()
print(email)                         # kofi@example.com
print(email.endswith(".com"))        # True
print("@" in email)                  # True

sentence = "learn python step by step"
print(sentence.split())              # ['learn', 'python', 'step', 'by', 'step']
print(sentence.replace("step", "bit"))  # learn python bit by bit
print(sentence.title())              # Learn Python Step By Step

name = "esi"
name.upper()      # result thrown away!
print(name)       # esi
name = name.upper()
print(name)       # ESI`,
        label: 'Cleaning up user input',
      },
      {
        title: 'f-strings: the easy way to build messages',
        paragraphs: [
          'Joining many pieces with + gets messy, and you must convert every number with str() first. An f-string solves both problems. Put f before the opening quote and write any variable or expression inside curly braces. Python replaces each {…} with its value.',
          'You can also format numbers inside the braces: {price:.2f} shows exactly two decimal places, which is what you want for money.',
        ],
        code: `name = "Kwame"
items = 3
price = 4.5

# The hard way:
print("Hi " + name + ", you bought " + str(items) + " items.")

# The f-string way:
print(f"Hi {name}, you bought {items} items.")
print(f"Total: {items * price:.2f} cedis")
# Hi Kwame, you bought 3 items.
# Total: 13.50 cedis`,
        label: 'Building output with f-strings',
      },
    ],
    table: {
      headers: ['You want to…', 'Write', 'Result for s = " Hi There "'],
      rows: [
        ['Remove outer spaces', 's.strip()', '"Hi There"'],
        ['Make lower case', 's.lower()', '" hi there "'],
        ['Count characters', 'len(s)', '10'],
        ['Check for a word', '"There" in s', 'True'],
        ['Split into words', 's.split()', '["Hi", "There"]'],
      ],
    },
    exercise: {
      scenario: 'A sign-up form receives the name "  yaw BOATENG " and you need to greet the user properly and create a username.',
      task: 'Clean the name into "Yaw Boateng", then build the username "ybo" (first letter of the first name plus the first two letters of the surname, lower case) and print "Welcome, Yaw Boateng! Your username is ybo".',
      answer: 'clean = "  yaw BOATENG ".strip().title() gives "Yaw Boateng". parts = clean.split() gives ["Yaw", "Boateng"]. username = (parts[0][0] + parts[1][:2]).lower() gives "ybo". print(f"Welcome, {clean}! Your username is {username}").',
      evidence: 'strip and title used together, indexing and slicing to build the username, and an f-string for the final message.',
    },
    misconceptions: [
      'The first character is at index 1. Python counts from 0.',
      'name.upper() changes name. Strings cannot change; you must store the new string the method returns.',
      'A slice text[1:4] includes position 4. The stop position is never included.',
      'You must convert numbers with str() inside an f-string. f-strings convert values for you.',
    ],
    sources: [S.pyTutorial, S.pyStrings, S.thinkPython],
    labs: [],
    questions: [
      { prompt: 'What index number does the first character of a string have?', answer: '0', accept: ['zero'] },
      { prompt: 'Which string method removes spaces from both ends of a string?', answer: 'strip', accept: ['strip()', '.strip()'] },
    ],
    quiz: [
      { question: 'For word = "HELLO", what is word[1:3]?', options: ['"HEL"', '"EL"', '"ELL"', '"HE"'], answer: 1, explanation: 'Positions 1 and 2 are E and L; the stop position 3 is not included.' },
      { question: 'What does "abc"[-1] give?', options: ['"a"', '"c"', 'An IndexError', '"b"'], answer: 1, explanation: 'Negative indexes count from the end; -1 is the last character.' },
      { question: 'After name = "ama"; name.upper(), what is name?', options: ['"AMA"', '"ama"', '"Ama"', 'None'], answer: 1, explanation: 'Strings are immutable; the upper-case result was not stored.' },
      { question: 'Which line prints "Total: 5.00"?', options: ['print("Total: " + 5)', 'print(f"Total: {5:.2f}")', 'print("Total: {5}")', 'print(f"Total: 5.2f")'], answer: 1, explanation: 'The :.2f format inside an f-string shows two decimal places.' },
    ],
  },
  {
    id: 'sef-3',
    slug: 'making-decisions-if-else',
    title: 'Making Decisions: Booleans, Comparisons and if/elif/else',
    summary: 'Compare values, combine conditions with and/or/not, and make a program choose between paths with if, elif and else.',
    minutes: 25,
    prerequisite: 'Lessons: Your First Program, Working With Text.',
    outcomes: [
      'Write comparisons with ==, !=, <, >, <= and >= and predict whether they are True or False.',
      'Combine conditions with and, or and not.',
      'Write if / elif / else blocks with correct indentation and explain which branch runs.',
      'Avoid the classic mistakes: = instead of ==, wrong order of elif checks, and missing cases.',
    ],
    introduction:
      'So far every line of your programs has run, every time. Real programs need to react: show an error if a password is too short, give a discount if the basket is big enough, let a user in only if they are an admin. Decisions in code are built from questions with yes/no answers (True or False) and an if statement that runs some lines only when the answer is True. This is the first time your programs will behave differently depending on their input.',
    keyTerms: [
      { term: 'Condition', meaning: 'An expression that is either True or False, used to decide what the program does next.' },
      { term: 'Comparison operator', meaning: 'A symbol that compares two values: == (equal), != (not equal), <, >, <= and >=.' },
      { term: 'Logical operator', meaning: 'and, or and not — words that combine or flip conditions.' },
      { term: 'Branch', meaning: 'One of the possible paths through an if / elif / else statement.' },
      { term: 'Indentation', meaning: 'The spaces at the start of a line. Python uses them to know which lines belong inside an if block.' },
      { term: 'Truthy', meaning: 'A value that counts as True in a condition, such as a non-empty string or a non-zero number.' },
    ],
    sections: [
      {
        title: 'Questions with yes/no answers',
        paragraphs: [
          'A comparison asks a question and gives back a bool. Is age at least 18? age >= 18. Is the password exactly "letmein"? password == "letmein". Notice the double equals: == compares, while a single = stores a value. Mixing them up is the most common decision bug of all.',
          'Strings can be compared too, but comparison is case-sensitive: "Yes" == "yes" is False. That is why you often lower() user input before comparing it.',
        ],
        code: `age = 17
print(age >= 18)        # False
print(age == 17)        # True
print(age != 20)        # True

answer = "Yes"
print(answer == "yes")          # False (capital Y)
print(answer.lower() == "yes")  # True`,
        label: 'Comparisons produce True or False',
      },
      {
        title: 'if, elif and else',
        paragraphs: [
          'An if statement runs its indented block only when its condition is True. The colon at the end of the if line and the four spaces of indentation on the lines below are both required: they are how Python knows which lines are "inside" the decision.',
          'Add elif ("else if") to check another condition when the first was False, and else to catch everything that is left. Python checks the conditions from top to bottom and runs only the first branch that matches; the rest are skipped. Order therefore matters: put the most specific checks first.',
        ],
        code: `score = 72

if score >= 80:
    grade = "A"
elif score >= 70:
    grade = "B"      # 72 lands here; the checks below are skipped
elif score >= 60:
    grade = "C"
else:
    grade = "F"

print(f"Score {score} gets grade {grade}")   # Score 72 gets grade B`,
        label: 'Exactly one branch runs',
      },
      {
        title: 'Combining conditions: and, or, not',
        paragraphs: [
          'and is True only when both sides are True: you may enter if you have a ticket and you are on the list. or is True when at least one side is True: pay with cash or card. not flips a value: not is_banned.',
          'Python also lets you chain comparisons the way maths does: 13 <= age <= 19 means "age is between 13 and 19 inclusive".',
        ],
        code: `has_ticket = True
on_list = False
is_banned = False

if has_ticket and not is_banned:
    print("Welcome in")

age = 15
if 13 <= age <= 19:
    print("Teenager")

day = "sat"
if day == "sat" or day == "sun":
    print("Weekend")`,
        label: 'and, or, not and chained comparisons',
      },
      {
        title: 'Truthiness and a common trap',
        paragraphs: [
          'Python treats some values as False in a condition even though they are not the bool False: 0, 0.0, the empty string "", empty lists and None. Everything else counts as True. So if name: means "if name is not empty", which is a neat way to check that a user typed something.',
          'The trap: if day == "sat" or "sun": is always True, because "sun" on its own is a non-empty string and therefore truthy. Each side of or must be a complete comparison: day == "sat" or day == "sun", or more simply day in ("sat", "sun").',
        ],
        code: `name = input("Name: ").strip()
if not name:
    print("You must type a name")

day = "mon"
print(day == "sat" or "sun")        # 'sun'  -> truthy! bug
print(day == "sat" or day == "sun") # False  -> correct
print(day in ("sat", "sun"))        # False  -> correct and shorter`,
        label: 'Empty values are falsy',
      },
    ],
    table: {
      headers: ['Operator', 'Meaning', 'Example that is True'],
      rows: [
        ['==', 'Equal to', '3 == 3'],
        ['!=', 'Not equal to', '"a" != "b"'],
        ['>= / <=', 'At least / at most', '18 >= 18'],
        ['and', 'Both must be True', 'True and True'],
        ['or', 'At least one is True', 'False or True'],
        ['not', 'Flip True and False', 'not False'],
      ],
    },
    exercise: {
      scenario: 'A cinema charges 0 for children under 3, 20 for ages 3 to 12, 35 for ages 13 to 64 and 25 for ages 65 and over. Students aged 13 to 25 get 10 off the normal price.',
      task: 'Write the if / elif / else logic that sets price from age and is_student, and list the ages you would test to be sure every branch works.',
      answer: 'if age < 3: price = 0 / elif age <= 12: price = 20 / elif age <= 64: price = 35 / else: price = 25. Then a separate check: if is_student and 13 <= age <= 25: price = price - 10. Test the edges of every range: 2, 3, 12, 13, 25, 26, 64 and 65, each with is_student True and False where it matters.',
      evidence: 'Branches ordered from smallest age up so each check only needs one side, the student discount handled with and plus a chained range, and boundary ages chosen for testing.',
    },
    misconceptions: [
      'if x = 5: compares x with 5. A single = stores a value; comparisons use ==.',
      'All matching branches run. Only the first branch whose condition is True runs.',
      'if day == "sat" or "sun" checks both days. The right side is just the string "sun", which is always truthy.',
      'Indentation is only for looks. In Python indentation decides which lines belong to which block.',
    ],
    sources: [S.pyControlFlow, S.thinkPython],
    labs: [],
    questions: [
      { prompt: 'Which logical operator is True only when both of its sides are True?', answer: 'and' },
      { prompt: 'Which keyword adds another condition to check after an if was False?', answer: 'elif', accept: ['else if'] },
    ],
    quiz: [
      { question: 'With temp = 30, what does this print? if temp > 25: print("hot") elif temp > 15: print("warm") else: print("cold")', options: ['hot and warm', 'hot', 'warm', 'cold'], answer: 1, explanation: 'The first True condition wins; later branches are skipped.' },
      { question: 'Which value is falsy in a condition?', options: ['"0"', '" "', '0', '"False"'], answer: 2, explanation: 'The number 0 is falsy; the strings shown are non-empty and therefore truthy.' },
      { question: 'What is True and not False?', options: ['False', 'True', 'An error', 'None'], answer: 1, explanation: 'not False is True, and True and True is True.' },
      { question: 'Why is if colour == "red" or "blue": a bug?', options: ['or cannot be used with strings', '"blue" alone is truthy, so the condition is always True', 'Strings cannot be compared with ==', 'It should use and'], answer: 1, explanation: 'Each side of or must be a full comparison.' },
    ],
  },
  {
    id: 'sef-4',
    slug: 'repeating-work-loops',
    title: 'Repeating Work: for Loops, while Loops and range',
    summary: 'Make the computer repeat instructions with for and while, count with range(), stop early with break, and build totals with the accumulator pattern.',
    minutes: 30,
    prerequisite: 'Lessons: Your First Program, Working With Text, Making Decisions.',
    outcomes: [
      'Loop over a range of numbers and over the characters of a string with for.',
      'Use range(start, stop, step) and predict exactly which numbers it produces.',
      'Write a while loop that is guaranteed to stop, and use break and continue correctly.',
      'Use the accumulator pattern to count, total and find the largest value.',
    ],
    introduction:
      'Computers are brilliant at doing the same thing many times without getting bored or making mistakes. Printing a times table, checking every line of a file, adding up a shopping list, asking for a password until it is right — all of these are loops. Python has two kinds: a for loop repeats once for each item in a collection or range, and a while loop repeats for as long as a condition stays True. With loops plus the decisions from the last lesson, you can already write genuinely useful programs.',
    keyTerms: [
      { term: 'Loop', meaning: 'A block of code that repeats.' },
      { term: 'Iteration', meaning: 'One pass through the body of a loop.' },
      { term: 'for loop', meaning: 'A loop that runs once for each item in a sequence such as a range, string or list.' },
      { term: 'while loop', meaning: 'A loop that keeps running as long as its condition is True.' },
      { term: 'Accumulator', meaning: 'A variable that collects a result across loop iterations, such as a running total.' },
      { term: 'Infinite loop', meaning: 'A loop whose condition never becomes False, so it never stops.' },
    ],
    sections: [
      {
        title: 'for loops and range()',
        paragraphs: [
          'A for loop takes each item in turn, puts it in a loop variable, and runs the indented body once for that item. range(5) produces the numbers 0, 1, 2, 3, 4 — five numbers, starting at 0 and stopping before 5, exactly like slicing.',
          'range(start, stop) starts somewhere else, and range(start, stop, step) jumps by step each time. A negative step counts down.',
        ],
        code: `for i in range(3):
    print("Round", i)
# Round 0
# Round 1
# Round 2

for n in range(1, 6):          # 1 2 3 4 5
    print(f"7 x {n} = {7 * n}")

for n in range(10, 0, -3):     # 10 7 4 1
    print(n)`,
        label: 'Counting with range',
      },
      {
        title: 'Looping over text and the accumulator pattern',
        paragraphs: [
          'You can loop over a string directly; the loop variable gets one character each time. This is how you count vowels, check a password contains a digit, or reverse text by hand.',
          'The accumulator pattern is the most important loop idea you will learn: create a variable before the loop (total = 0, count = 0, largest = None), update it inside the loop, and use it after the loop. Almost every "work something out from a list of things" problem uses it.',
        ],
        code: `word = "programming"
vowels = 0                     # 1. start the accumulator
for letter in word:
    if letter in "aeiou":
        vowels = vowels + 1    # 2. update it each time
print(f"{word} has {vowels} vowels")   # 3. use it after
# programming has 3 vowels

total = 0
for n in range(1, 101):
    total += n                 # += is short for total = total + n
print(total)                   # 5050`,
        label: 'Counting and totalling',
      },
      {
        title: 'while loops: repeat until something changes',
        paragraphs: [
          'Use while when you do not know in advance how many repetitions you need — for example, keep asking until the user types a valid answer. The condition is checked before each iteration; when it becomes False, the loop ends.',
          'Every while loop needs something inside it that eventually makes the condition False. If nothing changes, you get an infinite loop and the program never finishes. In the Code Portal you can stop a stuck program; in a terminal press Ctrl+C.',
        ],
        code: `balance = 100
months = 0
while balance < 200:
    balance = balance * 1.10    # grows 10% a month
    months += 1
print(f"Doubled after {months} months")   # Doubled after 8 months

# Keep asking until the answer is valid
answer = ""
while answer not in ("yes", "no"):
    answer = input("yes or no? ").strip().lower()`,
        label: 'Looping until a condition changes',
      },
      {
        title: 'break and continue',
        paragraphs: [
          'break stops the loop immediately and jumps to the first line after it. Use it when you have found what you were looking for. continue skips the rest of the current iteration and moves on to the next item. Use it to ignore items you do not care about.',
          'Use them sparingly. A loop with many breaks and continues is hard to follow; often a clearer condition does the same job.',
        ],
        code: `for n in range(2, 50):
    if n % 7 == 0:
        print("First multiple of 7:", n)   # 7
        break

for letter in "a-b-c":
    if letter == "-":
        continue          # skip dashes
    print(letter)         # a, b, c on separate lines`,
        label: 'Leaving early and skipping items',
      },
    ],
    table: {
      headers: ['Situation', 'Use', 'Example'],
      rows: [
        ['Repeat a known number of times', 'for + range', 'for i in range(10):'],
        ['Visit every item', 'for item in collection', 'for ch in "hello":'],
        ['Repeat until a condition changes', 'while', 'while attempts < 3:'],
        ['Stop when you find something', 'break', 'if found: break'],
        ['Skip an item', 'continue', 'if blank: continue'],
      ],
    },
    exercise: {
      scenario: 'A login screen allows at most 3 attempts. The correct PIN is "4821". After 3 wrong attempts the account is locked.',
      task: 'Describe a loop that asks for the PIN, stops as soon as it is right, and prints "Locked" if all 3 attempts fail.',
      answer: 'attempts = 0; unlocked = False; while attempts < 3 and not unlocked: pin = input("PIN: "); attempts += 1; if pin == "4821": unlocked = True. After the loop: if unlocked: print("Welcome") else: print("Locked"). A for attempt in range(3): loop with break on success also works. Both are guaranteed to stop because attempts grows every iteration.',
      evidence: 'A loop that always ends (the counter increases every time), stops early on success, and decides the final message after the loop.',
    },
    misconceptions: [
      'range(5) includes 5. It produces 0 to 4; the stop value is excluded.',
      'Changing the loop variable inside a for loop changes how many times it runs. The next item is taken from the range or collection regardless.',
      'A while loop checks its condition continuously. It checks once before each iteration, not in the middle.',
      'Resetting the accumulator inside the loop is fine. Put total = 0 before the loop, or it restarts every iteration.',
    ],
    sources: [S.pyControlFlow, S.thinkPython],
    labs: [],
    questions: [
      { prompt: 'Which keyword stops a loop immediately?', answer: 'break' },
      { prompt: 'What is the last number produced by range(1, 5)?', answer: '4', accept: ['four'] },
    ],
    quiz: [
      { question: 'Which numbers does range(2, 10, 3) produce?', options: ['2, 5, 8', '2, 5, 8, 11', '3, 6, 9', '2, 3, 4 … 9'], answer: 0, explanation: 'Start at 2 and add 3 while below 10: 2, 5, 8.' },
      { question: 'What is the bug? total = 0 is written inside the for loop body.', options: ['No bug', 'The total restarts at 0 every iteration', 'total cannot be a number', 'The loop will never end'], answer: 1, explanation: 'The accumulator must be created once, before the loop.' },
      { question: 'What does continue do?', options: ['Ends the whole loop', 'Skips to the next iteration', 'Restarts the loop from the beginning', 'Pauses the program'], answer: 1, explanation: 'continue skips the rest of the current pass only.' },
      { question: 'When is a while loop the better choice than a for loop?', options: ['When looping over a string', 'When you do not know in advance how many repetitions are needed', 'When counting from 1 to 10', 'Never'], answer: 1, explanation: 'while repeats until a condition changes, such as valid input arriving.' },
    ],
  },
  {
    id: 'sef-5',
    slug: 'collections-lists-dicts',
    title: 'Collections: Lists, Tuples, Dictionaries and Sets',
    summary: 'Store many values together: ordered lists you can change, fixed tuples, dictionaries that look things up by key, and sets that remove duplicates.',
    minutes: 35,
    prerequisite: 'Lessons: Making Decisions and Repeating Work (if statements and loops).',
    outcomes: [
      'Create, read, change, add to and remove from a list, and loop over it.',
      'Explain when to use a tuple instead of a list.',
      'Store and look up values by key in a dictionary, and loop over its keys and values.',
      'Use a set to remove duplicates and test membership quickly, and pick the right collection for a job.',
    ],
    introduction:
      'One variable holding one value only gets you so far. A class register has forty names; a shop has hundreds of prices; a game tracks every player\'s score. Collections let one variable hold many values. Python\'s four everyday collections each match a real-world object: a list is a numbered shopping list, a tuple is a fixed pair like a map coordinate, a dictionary is a phone book that finds a number by name, and a set is a bag of unique stickers with no duplicates. Choosing the right one makes code shorter and faster.',
    keyTerms: [
      { term: 'List', meaning: 'An ordered, changeable collection written with square brackets, such as [3, 1, 2].' },
      { term: 'Tuple', meaning: 'An ordered collection that cannot be changed, written with round brackets, such as (5.6, -0.2).' },
      { term: 'Dictionary', meaning: 'A collection of key: value pairs where you look values up by key, written with curly braces.' },
      { term: 'Key', meaning: 'The label used to find a value in a dictionary, such as "Ama" in {"Ama": 91}.' },
      { term: 'Set', meaning: 'An unordered collection with no duplicates, useful for uniqueness and fast membership tests.' },
      { term: 'Mutable', meaning: 'Can be changed after creation. Lists, dictionaries and sets are mutable; tuples and strings are not.' },
    ],
    sections: [
      {
        title: 'Lists: an ordered, changeable row of values',
        paragraphs: [
          'A list keeps items in order and uses the same indexing and slicing you learned for strings. Unlike strings, lists are mutable: you can change an item, append() a new one to the end, insert() one in the middle, or remove() one.',
          'Loop over a list with for, and use len() to count it. sum(), min(), max() and sorted() work on lists of numbers straight away.',
        ],
        code: `scores = [72, 88, 95]
scores.append(60)          # [72, 88, 95, 60]
scores[0] = 75             # [75, 88, 95, 60]
scores.remove(88)          # [75, 95, 60]

print(len(scores), sum(scores), max(scores))   # 3 230 95
print(sorted(scores))      # [60, 75, 95]  (original unchanged)

for s in scores:
    if s >= 70:
        print(s, "pass")`,
        label: 'Creating and changing a list',
      },
      {
        title: 'Tuples: values that belong together and should not change',
        paragraphs: [
          'A tuple looks like a list with round brackets, but once created it cannot be changed. Use it for small groups of values that belong together, such as a coordinate (latitude, longitude) or a date (2026, 10, 27). The fixed shape tells the reader "these always come as a set".',
          'You can unpack a tuple straight into variables. Functions often return tuples for exactly this reason.',
        ],
        code: `accra = (5.6037, -0.1870)
lat, lon = accra            # unpacking
print(f"Latitude {lat}, longitude {lon}")

# accra[0] = 6.0  -> TypeError: 'tuple' object does not support item assignment`,
        label: 'A fixed pair of values',
      },
      {
        title: 'Dictionaries: look things up by name',
        paragraphs: [
          'A dictionary maps keys to values, like a phone book maps names to numbers. Instead of remembering that Ama\'s score is at position 2, you ask for marks["Ama"]. Keys must be unique; adding a value under an existing key replaces the old value.',
          'Asking for a key that does not exist raises a KeyError. Use "key" in d to check first, or d.get("key", default) to get a fallback value. Loop over d.items() to get each key and value together.',
        ],
        code: `marks = {"Ama": 91, "Kofi": 78}
marks["Esi"] = 85            # add
marks["Kofi"] = 80           # update
print(marks["Ama"])          # 91
print(marks.get("Yaw", 0))   # 0  (no KeyError)

for name, mark in marks.items():
    print(f"{name}: {mark}")

# Counting with a dictionary — a very common pattern
counts = {}
for word in "the cat and the hat".split():
    counts[word] = counts.get(word, 0) + 1
print(counts)   # {'the': 2, 'cat': 1, 'and': 1, 'hat': 1}`,
        label: 'Lookup, update and counting',
      },
      {
        title: 'Sets, and choosing the right collection',
        paragraphs: [
          'A set stores each value at most once and has no order. Turning a list into a set removes duplicates instantly. Checking whether something is in a set is very fast even with millions of items, while checking a list means looking at every item.',
          'How to choose: need order or duplicates? list. Fixed small group? tuple. Look up by a name or id? dictionary. Only care about uniqueness or membership? set.',
        ],
        code: `visitors = ["ama", "kofi", "ama", "esi", "kofi"]
unique = set(visitors)
print(len(unique))           # 3
print("esi" in unique)       # True

blocked = {"spam@x.com", "bot@y.com"}
email = "bot@y.com"
if email in blocked:
    print("Rejected")`,
        label: 'Removing duplicates and fast membership tests',
      },
    ],
    table: {
      headers: ['Collection', 'Ordered? Changeable? Duplicates?', 'Best for'],
      rows: [
        ['list [ ]', 'Yes / Yes / Yes', 'A sequence of items you will add to or sort'],
        ['tuple ( )', 'Yes / No / Yes', 'A fixed group such as a coordinate or date'],
        ['dict { k: v }', 'Insertion order / Yes / Unique keys', 'Looking up a value by key'],
        ['set { }', 'No / Yes / No', 'Uniqueness and fast "is it in here?" checks'],
      ],
    },
    exercise: {
      scenario: 'A teacher has the list of submissions ["ama", "kofi", "ama", "esi"] and a dictionary of class members {"ama": "Ama Owusu", "kofi": "Kofi Asante", "esi": "Esi Badu", "yaw": "Yaw Mensah"}.',
      task: 'Work out who submitted at least once and who has not submitted at all, printing full names. Say which collection types you use and why.',
      answer: 'submitted = set(submissions) gives {"ama", "kofi", "esi"} (a set removes the duplicate). missing = [code for code in members if code not in submitted] gives ["yaw"]. Loop over each group and print members[code] to show full names: Yaw Mensah has not submitted. The dictionary gives fast lookup of full names by code; the set removes duplicates and makes each "in" check fast.',
      evidence: 'A set used for uniqueness, a dictionary used for lookup by key, and a loop or comprehension to find the missing members.',
    },
    misconceptions: [
      'sorted(my_list) sorts the list in place. sorted() returns a new list; my_list.sort() changes the original.',
      'Dictionaries are looked up by position like lists. They are looked up by key.',
      '{} creates an empty set. {} creates an empty dictionary; use set() for an empty set.',
      'Checking membership is equally fast in every collection. Sets and dictionary keys are much faster than lists for large data.',
    ],
    sources: [S.pyDataStructures, S.thinkPython],
    labs: [],
    questions: [
      { prompt: 'Which list method adds an item to the end of a list?', answer: 'append', accept: ['append()', '.append()'] },
      { prompt: 'Which collection type automatically removes duplicate values?', answer: 'set', accept: ['a set', 'sets'] },
    ],
    quiz: [
      { question: 'What does {"a": 1}.get("b", 5) return?', options: ['KeyError', 'None', '5', '1'], answer: 2, explanation: 'get returns the default when the key is missing.' },
      { question: 'Which collection is best for storing a fixed (x, y) point?', options: ['list', 'tuple', 'set', 'dict'], answer: 1, explanation: 'A tuple is a small fixed group that should not change.' },
      { question: 'What is len(set([1, 1, 2, 3, 3]))?', options: ['5', '3', '2', '1'], answer: 1, explanation: 'The set keeps 1, 2 and 3 once each.' },
      { question: 'After nums = [3, 1, 2]; nums.sort(), what is nums?', options: ['[3, 1, 2]', '[1, 2, 3]', 'None', '[3, 2, 1]'], answer: 1, explanation: 'list.sort() sorts the list in place.' },
    ],
  },
  {
    id: 'sef-6',
    slug: 'functions-reusable-steps',
    title: 'Functions: Naming and Reusing Steps',
    summary: 'Package steps into functions with def, pass in parameters, return results, understand scope, and break a problem into small functions.',
    minutes: 35,
    prerequisite: 'Lessons: Repeating Work and Collections.',
    outcomes: [
      'Define a function with def, call it, and explain the difference between a parameter and an argument.',
      'Explain the difference between return and print, and use the value a function returns.',
      'Use default parameter values and keyword arguments.',
      'Explain local scope and split a bigger problem into small functions with docstrings.',
    ],
    introduction:
      'A recipe card for "make tea" lets you say "make tea" instead of listing every step each time. A function is a recipe card for code: you write the steps once, give them a name, and then use that name wherever you need them. Functions are the single most important tool for keeping programs understandable. Every lesson after this one — testing, design, object-oriented programming — builds on writing good functions, so take your time here.',
    keyTerms: [
      { term: 'Function', meaning: 'A named block of reusable code that can take inputs and give back a result.' },
      { term: 'Parameter', meaning: 'A name in the function definition that receives an input value, such as price in def tax(price).' },
      { term: 'Argument', meaning: 'The actual value passed in when calling a function, such as 100 in tax(100).' },
      { term: 'Return value', meaning: 'The result a function hands back to whoever called it, using the return keyword.' },
      { term: 'Scope', meaning: 'Where a name can be seen. Variables created inside a function only exist inside it.' },
      { term: 'Docstring', meaning: 'A string on the first line of a function that explains what it does.' },
    ],
    sections: [
      {
        title: 'Defining and calling a function',
        paragraphs: [
          'def starts a function definition: the name, brackets containing the parameters, and a colon. The indented body runs only when the function is called — defining it just stores the recipe. Call it by writing its name followed by brackets containing the arguments.',
          'Parameters are the empty slots in the recipe (how many cups?). Arguments are what you fill them with when you use it (2 cups).',
        ],
        code: `def greet(name):
    """Print a friendly greeting for name."""
    print(f"Hello, {name}!")

greet("Ama")     # Hello, Ama!
greet("Kofi")    # Hello, Kofi!`,
        label: 'A function with one parameter',
      },
      {
        title: 'return versus print',
        paragraphs: [
          'print() shows a value on the screen for a human. return hands a value back to the code that called the function, so the program can keep using it — store it, add to it, compare it. A function without return gives back None.',
          'Most functions should return their result rather than print it. A function that returns can be used anywhere: in a calculation, in an if condition, in a test. A function that only prints can only be looked at.',
        ],
        code: `def area(width, height):
    return width * height

room = area(4, 5)
print(room)                  # 20
print(area(2, 3) + area(1, 1))  # 7

def bad_area(width, height):
    print(width * height)    # shows it, but gives back None

total = bad_area(4, 5)       # prints 20
print(total)                 # None  <- the value is lost`,
        label: 'Returning a result so it can be reused',
      },
      {
        title: 'Defaults, keyword arguments and returning several values',
        paragraphs: [
          'Give a parameter a default value and callers may leave it out. Callers can also name arguments (keyword arguments), which makes calls with several numbers much easier to read: price_with_tax(100, rate=0.15).',
          'To return more than one value, return a tuple and unpack it where you call the function.',
        ],
        code: `def price_with_tax(price, rate=0.125):
    return round(price * (1 + rate), 2)

print(price_with_tax(100))            # 112.5
print(price_with_tax(100, rate=0.15)) # 115.0

def min_max(numbers):
    return min(numbers), max(numbers)

low, high = min_max([4, 9, 1, 7])
print(low, high)                      # 1 9`,
        label: 'Optional parameters and multiple results',
      },
      {
        title: 'Scope, and breaking a problem into small functions',
        paragraphs: [
          'Variables created inside a function are local: they exist only while the function runs and cannot be seen outside it. This is a feature — it means each function is a self-contained box you can understand on its own. Pass values in through parameters and get them out through return rather than reaching for outside variables.',
          'When a task feels big, write it as a few small functions that each do one thing and have a clear name. The main program then reads almost like English. Small functions are also much easier to test, which you will do in the testing module.',
        ],
        code: `def clean(text):
    """Return text stripped and lower-cased."""
    return text.strip().lower()

def is_valid_email(email):
    """True if email has one @ and a dot after it."""
    if email.count("@") != 1:
        return False
    user, domain = email.split("@")
    return bool(user) and "." in domain

def sign_up(raw_email):
    email = clean(raw_email)
    if not is_valid_email(email):
        return "Please enter a valid email"
    return f"Welcome, {email}"

print(sign_up("  Ama@Example.com "))   # Welcome, ama@example.com
print(sign_up("not-an-email"))         # Please enter a valid email
# print(email)  -> NameError: email only exists inside sign_up`,
        label: 'Small functions composed into a program',
      },
    ],
    table: {
      headers: ['Term', 'Where it appears', 'Example'],
      rows: [
        ['Parameter', 'In the def line', 'def tax(price, rate):'],
        ['Argument', 'In the call', 'tax(100, 0.15)'],
        ['Keyword argument', 'In the call, by name', 'tax(100, rate=0.15)'],
        ['Default value', 'In the def line', 'def tax(price, rate=0.125):'],
        ['Return value', 'After return', 'return price * rate'],
      ],
    },
    exercise: {
      scenario: 'You are writing a grade report. Each student has a list of marks out of 100. The report needs each student\'s average (rounded to 1 decimal place) and a letter: A for 80+, B for 70+, C for 60+, otherwise F.',
      task: 'Design two functions, average(marks) and letter(avg), and show how a third function report(name, marks) uses them to return a line such as "Ama: 84.3 (A)".',
      answer: 'def average(marks): return round(sum(marks) / len(marks), 1). def letter(avg): if avg >= 80: return "A"; elif avg >= 70: return "B"; elif avg >= 60: return "C"; return "F". def report(name, marks): avg = average(marks); return f"{name}: {avg} ({letter(avg)})". Each function does one job, returns rather than prints, and can be tested on its own — for example letter(80) should be "A" and letter(79.9) should be "B".',
      evidence: 'Each function has one responsibility, returns its result, and the report composes them; boundary values are considered.',
    },
    misconceptions: [
      'Defining a function runs it. The body only runs when the function is called.',
      'print and return do the same thing. print shows a value; return hands it back so the program can use it.',
      'A function can change any variable in the program. Variables inside a function are local; pass values in and return results out.',
      'Long functions are fine if they work. Short, single-purpose functions are easier to read, test and fix.',
    ],
    sources: [S.pyControlFlow, S.thinkPython, S.pep8],
    labs: [],
    questions: [
      { prompt: 'Which keyword starts a function definition in Python?', answer: 'def' },
      { prompt: 'What value does a function give back if it has no return statement?', answer: 'None' },
    ],
    quiz: [
      { question: 'In def add(a, b): and the call add(2, 3), what are 2 and 3?', options: ['Parameters', 'Arguments', 'Return values', 'Docstrings'], answer: 1, explanation: 'Values passed in a call are arguments; a and b are parameters.' },
      { question: 'What does x = print(5) store in x?', options: ['5', '"5"', 'None', 'An error'], answer: 2, explanation: 'print shows the value but returns None.' },
      { question: 'Given def f(n, step=1): return n + step, what is f(10, step=5)?', options: ['11', '15', '10', 'An error'], answer: 1, explanation: 'The keyword argument overrides the default.' },
      { question: 'Why should most functions return results instead of printing them?', options: ['print is slower', 'Returned values can be reused, combined and tested', 'Python does not allow print in functions', 'return also prints automatically'], answer: 1, explanation: 'A returned value can flow into the rest of the program and into tests.' },
    ],
  },
];
