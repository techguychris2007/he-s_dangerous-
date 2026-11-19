import type { LessonDepth } from './types';

/** Deeper reading for the beginner Software Engineering lessons (SE 1–2). Each lesson gains, after its
 *  core steps: what Python is doing underneath, a longer worked example traced line by line, the
 *  mistakes beginners really make (with the error message they will see), and short practice prompts. */
export const SOFTWARE_ENGINEERING_BASICS_DEPTH: Record<string, LessonDepth> = {
  // ── SE 1 · Programming Basics ────────────────────────────────────────────────────────────────
  'sef-1': {
    keyTerms: [
      { term: 'Expression', meaning: 'Any piece of code that produces a value, such as 2 + 3, "hi" or price * 2.' },
      { term: 'Statement', meaning: 'A complete instruction, such as an assignment (x = 5) or a call to print().' },
      { term: 'Interpreter', meaning: 'The program that reads your Python code and carries it out, one statement at a time.' },
    ],
    after: [
      {
        title: 'Under the hood: how Python runs your file',
        paragraphs: [
          `When you press Run, a program called the Python interpreter reads your file from the first line to the last. For each line it does two things: it works out the value of any expression on the line, then it carries out the instruction. print(2 + 3) is worked out as "the expression 2 + 3 is 5, now print 5".`,
          `Assignment always happens right-to-left. In total = price * quantity, Python first looks up the current values of price and quantity, multiplies them, and only then attaches the name total to the result. This is why the order of your lines matters: if quantity has not been created yet when that line runs, Python stops with a NameError.`,
          `A variable does not hold a copy of a formula. After total = price * quantity, total is just a number. If you later change price, total does not update by itself; you would have to run the calculation again. Spreadsheets recalculate automatically. Python does not, and expecting it to is one of the first surprises for new programmers.`,
        ],
        code: `price = 4
quantity = 3
total = price * quantity
print(total)      # 12

price = 10        # change price...
print(total)      # ...total is still 12: it was calculated once, earlier

total = price * quantity   # recalculate on purpose
print(total)      # 30`,
        label: 'Variables store results, not formulas',
      },
      {
        title: 'Worked example: a receipt calculator, traced line by line',
        paragraphs: [
          `Let us build something small but real: a program that works out the total for a shop receipt, including a 15% tax. Read the code first, then follow the trace table below it, which shows the value of every variable after each line runs. Tracing like this is the single most useful skill for understanding code you did not write.`,
          `Notice how each line uses only values that already exist. The tax line needs subtotal, so subtotal is calculated first. The total line needs both subtotal and tax. If you swapped the order of lines 4 and 5, Python would fail with NameError: name 'tax' is not defined, because tax would not exist yet.`,
          `Also notice round(total, 2). Floats can produce long decimals such as 41.400000000000006 because computers store decimal fractions approximately. round() tidies the number for display. For real money, professional code uses whole pesewas or cents (integers), or Python's decimal module; you will meet that idea again later in the track.`,
        ],
        code: `item_price = 12.0         # line 1
items_bought = 3          # line 2
tax_rate = 0.15           # line 3
subtotal = item_price * items_bought   # line 4
tax = subtotal * tax_rate              # line 5
total = subtotal + tax                 # line 6
print("Total:", round(total, 2))       # line 7

# Trace (value of each variable after the line runs):
# line 1  item_price=12.0
# line 2  items_bought=3
# line 3  tax_rate=0.15
# line 4  subtotal=36.0
# line 5  tax=5.4
# line 6  total=41.4
# Output: Total: 41.4`,
        label: 'Receipt calculator with a trace table',
      },
      {
        title: 'Mistakes beginners make (and the message you will see)',
        paragraphs: [
          `Forgetting quotes around text: print(Hello) makes Python look for a variable called Hello, so you get NameError: name 'Hello' is not defined. The fix is print("Hello"). Whenever you see NameError, ask: did I mean text, did I misspell a name, or did I use it before creating it?`,
          `Mixing text and numbers: "Age: " + 19 gives TypeError: can only concatenate str (not "int") to str. Python refuses to guess whether you wanted maths or joining. Convert on purpose with "Age: " + str(19), or pass both to print separated by a comma: print("Age:", 19).`,
          `Treating input() as a number: input() always returns a string, even if the user types 42. So age = input("Age? ") followed by age + 1 fails. Convert first: age = int(input("Age? ")). If the user types something that is not a whole number, int() raises ValueError; you will learn to handle that politely in the lesson on errors.`,
          `Capital letters matter. Score and score are two different names, and True must be written with a capital T. true (lower case) is not a boolean in Python; it is an undefined name.`,
        ],
        code: `print("Age: " + str(19))     # Age: 19
print("Age:", 19)            # Age: 19  (print adds the space)

age = int("42")              # the string "42" becomes the number 42
print(age + 1)               # 43

print(type(True), type("True"))   # <class 'bool'> <class 'str'>`,
        label: 'Fixing the three most common first-day errors',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a program that stores your name and the year you were born in two variables, then prints a sentence such as "Ama will turn 20 in 2026". Calculate the age; do not type it in.`,
          `2. Predict the output before running: a = 5, b = a, a = 7, print(b). Then run it. (Answer: 5. b was given the value a had at that moment; changing a later does not change b.)`,
          `3. Print type(7 / 2) and type(7 // 2). One division keeps the decimal part and one throws it away. Which is which, and what type does each produce?`,
        ],
      },
    ],
  },
  'sef-2': {
    keyTerms: [
      { term: 'Immutable', meaning: 'Cannot be changed after it is created. Strings are immutable: methods return a new string instead of editing the old one.' },
      { term: 'Method', meaning: 'A function that belongs to a value and is called with a dot, such as name.upper().' },
      { term: 'Escape sequence', meaning: 'A backslash code inside a string for a character you cannot type directly, such as \\n for a new line.' },
    ],
    after: [
      {
        title: 'Under the hood: strings never change',
        paragraphs: [
          `A string in Python is immutable: once created, its characters can never be changed. That is why name.upper() does not change name. It builds a brand-new string and returns it. If you do not store the result somewhere, it is thrown away.`,
          `This trips up almost everyone at first. The line email.strip() on its own does nothing useful; you must write email = email.strip() to keep the cleaned version. The same applies to replace(), lower(), title() and every other string method.`,
          `Trying to change one character directly, such as word[0] = "J", raises TypeError: 'str' object does not support item assignment. To "change" a string you build a new one from pieces: word = "J" + word[1:].`,
        ],
        code: `name = "  kofi  "
name.strip()             # result is thrown away
print("[" + name + "]")  # [  kofi  ]  unchanged!

name = name.strip().title()   # keep the new string
print("[" + name + "]")  # [Kofi]

word = "Python"
word = "J" + word[1:]
print(word)              # Jython`,
        label: 'String methods return new strings',
      },
      {
        title: 'Worked example: cleaning messy user input',
        paragraphs: [
          `Real programs receive messy text. Someone types their email as "  Ama.Mensah@UG.edu.GH " with spaces and mixed capitals. Before you store it or compare it with another email, you want one standard form. This process is called normalising.`,
          `The example chains methods: each one returns a new string and the next method is called on that result. Read a chain left to right: strip the spaces, then make everything lower case. Then split("@") cuts the email at the @ sign and gives back a list of two parts, which we unpack into two variables.`,
          `Finally an f-string builds a message. Inside the braces you can put any expression, including method calls and formatting rules. {len(user)} counts characters; {domain.upper()} shouts the domain. Format specifiers after a colon control layout: {price:.2f} shows exactly two decimal places and {name:>10} right-aligns in 10 characters, which is handy for neat tables.`,
        ],
        code: `raw = "  Ama.Mensah@UG.edu.GH "
email = raw.strip().lower()
print(email)                    # ama.mensah@ug.edu.gh

user, domain = email.split("@")
print(user, "|", domain)        # ama.mensah | ug.edu.gh

print(f"{user} has {len(user)} characters")   # ama.mensah has 10 characters
print(f"Domain: {domain.upper()}")            # Domain: UG.EDU.GH

price = 7.5
print(f"Price: GHS {price:.2f}")             # Price: GHS 7.50
for item, cost in [("Bread", 12), ("Milk", 8.5)]:
    print(f"{item:<8}{cost:>8.2f}")
# Bread      12.00
# Milk        8.50`,
        label: 'Normalising an email and formatting output',
      },
      {
        title: 'Slicing, step by step',
        paragraphs: [
          `Slices often confuse beginners because the end index is not included. A helpful picture: imagine the indexes sit between the characters, like fence posts. text[1:4] means "from post 1 to post 4", which captures the characters at positions 1, 2 and 3.`,
          `Leaving out a number means "from the start" or "to the end". Negative numbers count from the right, so text[-3:] is always the last three characters, whatever the length. A third number is the step: text[::2] takes every second character, and text[::-1] walks backwards, which reverses the string.`,
          `Slices never raise an IndexError. "abc"[1:100] simply returns "bc". Indexing a single position that does not exist, such as "abc"[5], does raise IndexError: string index out of range. That difference is worth remembering when you work with text of unknown length.`,
        ],
        code: `#   P   y   t   h   o   n
#   0   1   2   3   4   5
#  -6  -5  -4  -3  -2  -1
text = "Python"
print(text[1:4])    # yth
print(text[:2])     # Py
print(text[-3:])    # hon
print(text[::2])    # Pto
print(text[::-1])   # nohtyP
print(text[1:100])  # ython  (no error)`,
        label: 'Index positions and slices',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write code that takes a full name such as "kwame nkrumah" and prints the initials in capitals ("K.N."). Hint: split() with no argument splits on spaces.`,
          `2. A palindrome reads the same backwards. Using a slice, check whether "level" and "racecar" are palindromes. Then make your check ignore capitals so "Level" also passes.`,
          `3. Use an f-string with a format specifier to print 1/3 with exactly three decimal places.`,
        ],
      },
    ],
  },
  'sef-3': {
    keyTerms: [
      { term: 'Condition', meaning: 'An expression that is True or False and decides which code runs.' },
      { term: 'Short-circuit', meaning: 'and/or stop evaluating as soon as the answer is known, so later parts may never run.' },
      { term: 'Nested if', meaning: 'An if statement inside another if block.' },
    ],
    after: [
      {
        title: 'Under the hood: Python checks branches in order and stops at the first match',
        paragraphs: [
          `An if/elif/else chain is checked from top to bottom. As soon as one condition is True, Python runs that block and skips every remaining branch, even if later conditions would also be True. At most one block in the chain ever runs, and if there is an else, exactly one runs.`,
          `This means order matters. If a grading program checks score >= 50 before score >= 80, a score of 95 matches the first branch and is graded as a pass instead of a distinction. Put the narrowest or highest condition first, or write each condition so it cannot overlap with the others.`,
          `and and or short-circuit. In x != 0 and 10 / x > 2, if x is 0 the left side is False, so Python never evaluates the division and the program does not crash. Programmers use this deliberately as a guard: check that something is safe first, then use it.`,
        ],
        code: `score = 95
# Wrong order: the first True branch wins
if score >= 50:
    print("Pass")          # this runs...
elif score >= 80:
    print("Distinction")   # ...so this never can

# Right order: most specific first
if score >= 80:
    print("Distinction")
elif score >= 50:
    print("Pass")
else:
    print("Fail")

x = 0
if x != 0 and 10 / x > 2:   # safe: division skipped when x is 0
    print("big")`,
        label: 'Branch order and short-circuit guards',
      },
      {
        title: 'Worked example: a ticket price calculator',
        paragraphs: [
          `A cinema charges GHS 50 for adults, half price for children under 12 and for people aged 65 or over, and children under 3 go free. Students get GHS 10 off the adult price, but only on weekdays. This is typical of real rules: several conditions interact, and the order you check them in matters.`,
          `Start with the case that overrides everything (under 3 is always free), then the age discounts, then the student rule, then the default. Writing the rules down as a list first, before coding, makes the program almost write itself.`,
          `Test your branches with values on each side of every boundary: ages 2, 3, 11, 12, 64 and 65, plus a student on a weekday and on a weekend. Each one should land in a different, correct branch. If two test values that should behave differently land in the same branch, you have found a bug before your users did.`,
        ],
        code: `def ticket_price(age, is_student, is_weekday):
    if age < 3:
        return 0
    if age < 12 or age >= 65:
        return 25
    if is_student and is_weekday:
        return 40
    return 50

for age, student, weekday in [(2, False, True), (11, False, True), (12, False, True),
                              (64, False, True), (65, False, True),
                              (20, True, True), (20, True, False)]:
    print(age, student, weekday, "->", ticket_price(age, student, weekday))
# 2 False True -> 0
# 11 False True -> 25
# 12 False True -> 50
# 64 False True -> 50
# 65 False True -> 25
# 20 True True -> 40
# 20 True False -> 50`,
        label: 'Ticket pricing with boundary tests',
      },
      {
        title: 'Mistakes beginners make',
        paragraphs: [
          `Using = instead of ==. if age = 18: is a SyntaxError, because = means "store", not "compare". Python's error message even suggests the fix: "Maybe you meant '==' or ':=' instead of '='?"`,
          `Writing if x == 1 or 2:. This reads like English but means (x == 1) or (2), and 2 on its own is always truthy, so the condition is always True. Write if x == 1 or x == 2:, or better, if x in (1, 2):.`,
          `Forgetting the colon or the indentation. Every if, elif and else line ends with a colon, and the code that belongs to it must be indented (four spaces is the standard). An IndentationError means the spaces do not line up the way Python expects.`,
          `Comparing strings with different capitals. "Yes" == "yes" is False. When checking what a user typed, normalise it first: if answer.strip().lower() == "yes":.`,
        ],
        code: `x = 5
print(x == 1 or 2)       # 2  (truthy!) — the classic trap
print(x == 1 or x == 2)  # False
print(x in (1, 2))       # False — clearer

answer = "  YES "
print(answer.strip().lower() == "yes")   # True`,
        label: 'The "or" trap and normalising answers',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a function that takes a year and returns True if it is a leap year: divisible by 4, except centuries, which must be divisible by 400. Test 1900 (no), 2000 (yes), 2024 (yes) and 2023 (no).`,
          `2. Rewrite this nested code as a single if with and: if logged_in: then inside it if is_admin: print("Welcome, admin").`,
          `3. Predict the output of print(bool(""), bool(" "), bool(0), bool([])). Which one surprises you?`,
        ],
      },
    ],
  },
  'sef-4': {
    keyTerms: [
      { term: 'Iteration', meaning: 'One pass through the body of a loop. A loop over 5 items performs 5 iterations.' },
      { term: 'Infinite loop', meaning: 'A loop whose condition never becomes False, so it runs forever until you stop the program.' },
      { term: 'Loop variable', meaning: 'The name in for name in ... that takes the next value on each iteration.' },
    ],
    after: [
      {
        title: 'Under the hood: what a for loop really does',
        paragraphs: [
          `for item in collection: asks the collection for its values one at a time. On each iteration Python assigns the next value to item and runs the indented body. When there are no values left, the loop ends and the program carries on with the first line after the loop.`,
          `range() does not build a list of numbers in memory; it produces them one at a time as the loop asks. That is why range(1_000_000_000) is instant to create. range(start, stop, step) follows the same "stop is not included" rule as slicing, so range(1, 6) gives 1, 2, 3, 4, 5.`,
          `A while loop is simpler underneath: before every iteration, Python checks the condition. If it is True the body runs; if False the loop ends. Something inside the body must eventually make the condition False, otherwise the loop never ends. In the Code Portal, a runaway loop is stopped for you; in a terminal, press Ctrl+C.`,
        ],
        code: `print(list(range(5)))          # [0, 1, 2, 3, 4]
print(list(range(1, 6)))       # [1, 2, 3, 4, 5]
print(list(range(10, 0, -3)))  # [10, 7, 4, 1]

count = 3
while count > 0:      # checked before each pass
    print(count)
    count -= 1        # without this line the loop never ends
print("Lift off!")`,
        label: 'range and a while loop that ends',
      },
      {
        title: 'Worked example: analysing a week of temperatures',
        paragraphs: [
          `Many loops follow the same few patterns. This example uses four of them in one pass over the data: the accumulator (a running total), the counter (how many items match), the "best so far" tracker (the highest value seen) and enumerate() to know which position each value came from.`,
          `Before the loop, each tracker gets a starting value. total and hot_days start at 0. For the hottest day we start with the first reading, not 0, because if every temperature were negative, starting at 0 would give the wrong answer. Choosing correct starting values is where most loop bugs hide.`,
          `enumerate(temps, start=1) gives pairs of (position, value), so we can report "day 4" instead of only the temperature. Python also has built-ins for the simple cases: sum(temps), max(temps) and len(temps). Use them in real code; writing the loop yourself here is how you learn what they do.`,
        ],
        code: `temps = [29, 31, 34, 36, 33, 28, 30]

total = 0
hot_days = 0
hottest = temps[0]
hottest_day = 1

for day, t in enumerate(temps, start=1):
    total += t                # accumulator
    if t >= 33:
        hot_days += 1         # counter
    if t > hottest:           # best so far
        hottest = t
        hottest_day = day

average = total / len(temps)
print(f"Average: {average:.1f}")              # Average: 31.6
print(f"Hot days (>= 33): {hot_days}")        # Hot days (>= 33): 3
print(f"Hottest: {hottest} on day {hottest_day}")   # Hottest: 36 on day 4
print(sum(temps), max(temps))                 # 221 36  (built-in shortcuts)`,
        label: 'Accumulator, counter and best-so-far in one loop',
      },
      {
        title: 'Mistakes beginners make',
        paragraphs: [
          `Off-by-one errors: range(1, 10) stops at 9, not 10. If you want 1 to 10 inclusive, write range(1, 11). When in doubt, print(list(range(...))) to see exactly which numbers you get.`,
          `Resetting the accumulator inside the loop. If total = 0 is indented inside the for loop, it is reset on every iteration and only the last value survives. Starting values belong before the loop.`,
          `Changing a list while looping over it. Removing items from the list you are iterating over makes Python skip elements, because positions shift under the loop. Build a new list instead: keep = [x for x in items if x != 0] or a loop that appends to a new list.`,
          `A while loop that never updates its variable. If the body never changes what the condition checks, the loop runs forever. Before running a while loop, point to the line that moves it towards stopping.`,
        ],
        code: `numbers = [0, 1, 0, 0, 2]
for n in numbers:          # buggy: removing while iterating
    if n == 0:
        numbers.remove(n)
print(numbers)             # [1, 0, 2]  — one 0 survived!

numbers = [0, 1, 0, 0, 2]
kept = []
for n in numbers:          # correct: build a new list
    if n != 0:
        kept.append(n)
print(kept)                # [1, 2]`,
        label: 'Why you should not remove items while looping',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Print the 7 times table from 7 × 1 to 7 × 12, one line each, in the form "7 x 3 = 21".`,
          `2. Ask the user for a password with a while loop and keep asking until they type the correct one, or until they have failed three times. Print a different message for each outcome.`,
          `3. Count how many vowels are in a sentence using a loop over the string and the in operator ("a" in "aeiou").`,
        ],
      },
    ],
  },
  'sef-5': {
    keyTerms: [
      { term: 'Mutable', meaning: 'Can be changed in place after it is created. Lists, dictionaries and sets are mutable; tuples and strings are not.' },
      { term: 'Key', meaning: 'The label used to look up a value in a dictionary. Keys must be unique and immutable (strings, numbers, tuples).' },
      { term: 'List comprehension', meaning: 'A one-line way to build a new list from another: [x * 2 for x in nums].' },
    ],
    after: [
      {
        title: 'Under the hood: names point to objects, and two names can share one list',
        paragraphs: [
          `A variable does not contain a list; it points to a list object stored somewhere in memory. When you write b = a, you do not copy the list. You make a second name for the same list. Change it through b and you will see the change through a too, because there is only one list.`,
          `This is called aliasing, and it explains many confusing bugs. It does not happen with numbers and strings in a way you can notice, because they are immutable: you cannot change them in place, only replace them. It matters for lists, dictionaries and sets, which you can change in place.`,
          `When you really want an independent copy, ask for one: b = a.copy() or b = list(a). For a list of lists, those copies only copy the outer list (a shallow copy); the inner lists are still shared. copy.deepcopy() copies everything all the way down.`,
        ],
        code: `a = [1, 2, 3]
b = a            # same list, two names
b.append(4)
print(a)         # [1, 2, 3, 4]  — a changed too!
print(a is b)    # True: one object

c = a.copy()     # a new, separate list
c.append(5)
print(a)         # [1, 2, 3, 4]
print(c)         # [1, 2, 3, 4, 5]`,
        label: 'Aliasing versus copying',
      },
      {
        title: 'Worked example: a class register with a dictionary of lists',
        paragraphs: [
          `Real data is usually a mix of collections. Here a dictionary maps each student's name to a list of their scores. Dictionaries give fast lookup by name; lists keep the scores in order. Together they answer questions like "what is Esi's average?" in one line.`,
          `Adding a score for a student who may not exist yet is a common pattern. setdefault(name, []) returns the existing list if the name is there, or inserts an empty list and returns it if not, so the append always works. Without it you would write an if name not in register check first.`,
          `Looping over a dictionary with .items() gives (key, value) pairs. sorted() with a key function orders the results; here we sort students by their average, highest first. Notice that sorted() returns a new list and leaves the dictionary untouched.`,
        ],
        code: `register = {}
results = [("Esi", 78), ("Kojo", 64), ("Esi", 90), ("Adwoa", 85), ("Kojo", 71)]

for name, score in results:
    register.setdefault(name, []).append(score)

print(register)
# {'Esi': [78, 90], 'Kojo': [64, 71], 'Adwoa': [85]}

averages = {name: sum(s) / len(s) for name, s in register.items()}
for name, avg in sorted(averages.items(), key=lambda pair: pair[1], reverse=True):
    print(f"{name:<6} {avg:.1f}")
# Adwoa  85.0
# Esi    84.0
# Kojo   67.5

print("Kojo" in register)        # True — fast membership check
print(register.get("Yaw", []))   # [] — safe lookup with a default`,
        label: 'Grouping scores by student',
      },
      {
        title: 'Mistakes beginners make',
        paragraphs: [
          `Looking up a key that is not there. register["Yaw"] raises KeyError: 'Yaw'. Use register.get("Yaw") (returns None) or register.get("Yaw", default) when a key might be missing, or check with "Yaw" in register first.`,
          `Using a list as a dictionary key or set item. TypeError: unhashable type: 'list' means you tried to use something mutable where Python needs an unchanging value. Convert it to a tuple: locations[(5.6, -0.2)] works; locations[[5.6, -0.2]] does not.`,
          `Expecting a set to keep order. Sets are for "is this in the group?" and removing duplicates, not for ordered data. If you need unique values in their original order, use list(dict.fromkeys(items)).`,
          `Confusing append and extend. nums.append([4, 5]) adds one item, which is a list; nums.extend([4, 5]) adds two items.`,
        ],
        code: `nums = [1, 2, 3]
nums.append([4, 5])
print(nums)          # [1, 2, 3, [4, 5]]

nums = [1, 2, 3]
nums.extend([4, 5])
print(nums)          # [1, 2, 3, 4, 5]

tags = ["red", "blue", "red", "green", "blue"]
print(list(dict.fromkeys(tags)))   # ['red', 'blue', 'green']  unique, in order`,
        label: 'append versus extend, and ordered de-duplication',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Count how often each word appears in a sentence using a dictionary. Then try collections.Counter and compare.`,
          `2. Given two lists of course codes, use sets to print the courses both students take, and the courses only the first student takes.`,
          `3. Use a list comprehension to build a list of the squares of the even numbers from 1 to 20.`,
        ],
      },
    ],
  },
  'sef-6': {
    keyTerms: [
      { term: 'Call stack', meaning: 'Python\'s list of functions that are currently running, each waiting for the one it called to finish.' },
      { term: 'Side effect', meaning: 'Anything a function does besides returning a value: printing, changing a list it was given, writing a file.' },
      { term: 'Docstring', meaning: 'A string on the first line of a function body that explains what it does. help() displays it.' },
    ],
    after: [
      {
        title: 'Under the hood: what happens when you call a function',
        paragraphs: [
          `When Python reaches a call such as area(3, 4), it pauses the current line, creates a fresh, private workspace for the function (called a frame), and assigns the arguments to the parameter names in that workspace: width = 3, height = 4. Then it runs the body.`,
          `When the body reaches return, the function's workspace is thrown away and the returned value replaces the call in the original line. If the body ends without a return, the function returns None. This is why a function that only prints gives you None if you try to store its result.`,
          `Functions can call other functions. Python keeps a stack of paused frames, which is exactly what you see in a traceback: the most recent call is at the bottom. Each frame has its own local variables, so a variable called total inside one function never collides with a total in another.`,
          `Parameters receive references to the same objects you passed in. If you pass a list and the function appends to it, the caller's list changes. That is a side effect. Good functions either return a new value or clearly say (in the name or docstring) that they modify their argument.`,
        ],
        code: `def add_tax(prices):
    """Return a NEW list with 15% added. Does not change the input."""
    return [round(p * 1.15, 2) for p in prices]

def add_tax_in_place(prices):
    """Change the given list directly. Returns None."""
    for i in range(len(prices)):
        prices[i] = round(prices[i] * 1.15, 2)

original = [10, 20]
print(add_tax(original), original)   # [11.5, 23.0] [10, 20]
result = add_tax_in_place(original)
print(result, original)              # None [11.5, 23.0]`,
        label: 'Returning a new value versus changing the argument',
      },
      {
        title: 'Worked example: breaking a problem into small functions',
        paragraphs: [
          `Task: given a list of exam scores, print a short report with the average, the highest score, and a letter grade for the average. You could write it as one long block, but splitting it into functions makes each piece easy to read, test and reuse.`,
          `The approach professionals use is called top-down design. Write the main function first as if helper functions already exist, using names that describe what you want. Then write each helper. Each one does one job and can be checked on its own: average([50, 70]) should be 60, letter_grade(85) should be "A".`,
          `Notice that only report() prints. The helpers return values. Keeping printing at the edges and calculation in the middle means you can reuse average() in a web page, a file export or a test without unwanted output appearing.`,
        ],
        code: `def average(scores):
    """Mean of a non-empty list of numbers."""
    return sum(scores) / len(scores)

def letter_grade(score):
    """A for 80+, B for 70+, C for 60+, D for 50+, otherwise F."""
    for cutoff, letter in [(80, "A"), (70, "B"), (60, "C"), (50, "D")]:
        if score >= cutoff:
            return letter
    return "F"

def report(scores):
    avg = average(scores)
    print(f"Average: {avg:.1f} ({letter_grade(avg)})")
    print(f"Highest: {max(scores)}")

report([72, 88, 65, 91])
# Average: 79.0 (B)
# Highest: 91`,
        label: 'Top-down design with small helpers',
      },
      {
        title: 'Mistakes beginners make',
        paragraphs: [
          `Printing instead of returning. If a function prints its answer, the caller cannot use it. total = add(2, 3) gives None when add only prints. Return the value and let the caller decide whether to print it.`,
          `Forgetting the brackets. print(get_name) prints something like <function get_name at 0x7f...> because you referred to the function without calling it. Calling needs brackets: get_name().`,
          `A mutable default argument. def add_item(item, basket=[]): looks harmless, but the same list is reused on every call, so items from earlier calls reappear. Use None as the default and create the list inside: if basket is None: basket = [].`,
          `Expecting a function to see variables created inside another function. Locals are private. Pass what a function needs as parameters and return what it produces.`,
        ],
        code: `def add_item(item, basket=[]):     # buggy default
    basket.append(item)
    return basket

print(add_item("rice"))   # ['rice']
print(add_item("beans"))  # ['rice', 'beans']  — surprise!

def add_item_fixed(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket

print(add_item_fixed("rice"))   # ['rice']
print(add_item_fixed("beans"))  # ['beans']`,
        label: 'The mutable default argument trap',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write is_valid_pin(pin) that returns True only for strings of exactly four digits. Test it with "1234", "123", "12a4" and "12345".`,
          `2. Write celsius_to_fahrenheit(c) and fahrenheit_to_celsius(f). Check that converting there and back gives the original number.`,
          `3. Take any program you wrote in an earlier lesson and split it into at least three functions, with only one function that prints.`,
        ],
      },
    ],
  },

  // ── SE 2 · Building Programs & Object-Oriented Programming ───────────────────────────────────
  'sef-7': {
    keyTerms: [
      { term: 'Exception', meaning: 'An object Python creates when something goes wrong. If nothing catches it, the program stops and prints a traceback.' },
      { term: 'Validation', meaning: 'Checking that input is acceptable before using it, and rejecting it clearly if not.' },
      { term: 'finally', meaning: 'A block that always runs after try/except, whether or not an error happened. Used for clean-up.' },
    ],
    after: [
      {
        title: 'Under the hood: how an exception travels',
        paragraphs: [
          `When an error happens, Python creates an exception object and stops running the current line. It then looks for a matching except block in the current function. If there is none, it leaves that function and looks in the function that called it, and so on up the call stack.`,
          `If it finds a matching except, that block runs and the program carries on after the try statement. If it reaches the top without finding one, the program stops and prints the traceback, which is a record of the exact path the exception travelled.`,
          `This travelling is useful. Low-level code (reading a file, converting a number) should usually not decide what to tell the user. It raises an exception, and the higher-level code that knows the context ("we are loading settings at start-up") catches it and responds sensibly.`,
          `The full form of try has four parts. try holds the risky code. except handles a specific error. else runs only if no error happened, which keeps the try block small. finally always runs, error or not, and is where clean-up goes.`,
        ],
        code: `def parse_age(text):
    age = int(text)              # may raise ValueError
    if age < 0:
        raise ValueError("age cannot be negative")
    return age

for raw in ["21", "abc", "-4"]:
    try:
        age = parse_age(raw)
    except ValueError as err:
        print(f"{raw!r}: rejected ({err})")
    else:
        print(f"{raw!r}: accepted {age}")
    finally:
        print("  checked one value")
# '21': accepted 21
#   checked one value
# 'abc': rejected (invalid literal for int() with base 10: 'abc')
#   checked one value
# '-4': rejected (age cannot be negative)
#   checked one value`,
        label: 'try, except, else and finally together',
      },
      {
        title: 'Worked example: asking until the input is valid',
        paragraphs: [
          `A program that asks for a number must cope with people typing words, blank lines or numbers out of range. A while True loop combined with try/except is the standard way: keep asking until you get something valid, then break out of the loop.`,
          `The function below is written to be testable. Instead of calling input() directly, it receives a function to call for each answer. In a real program you pass input; in a test you can pass a fake that returns prepared answers. You will see this idea again, in more detail, in the testing modules.`,
          `Notice what is caught: only ValueError, the specific error int() raises for bad text. We do not catch everything, because a bare except: would also hide real bugs such as a typo in a variable name, making them very hard to find.`,
        ],
        code: `def ask_number(ask, low, high):
    while True:
        text = ask(f"Enter a number from {low} to {high}: ")
        try:
            value = int(text)
        except ValueError:
            print("That is not a whole number. Try again.")
            continue
        if low <= value <= high:
            return value
        print(f"Out of range. Try again.")

answers = iter(["ten", "", "42", "7"])      # pretend user input
print(ask_number(lambda prompt: next(answers), 1, 10))
# That is not a whole number. Try again.
# That is not a whole number. Try again.
# Out of range. Try again.
# 7`,
        label: 'A robust input loop',
      },
      {
        title: 'Mistakes beginners make',
        paragraphs: [
          `Catching everything. except: or except Exception: on its own hides the real cause. Your program "works" but silently does the wrong thing. Catch the specific errors you expect and can handle, and let surprises crash loudly while you are developing.`,
          `Putting too much inside try. If twenty lines are inside one try, you cannot tell which line failed. Keep only the line that can raise the expected error inside try, and put the rest in else or after the statement.`,
          `Using exceptions for normal decisions you could check cheaply. If you can test a condition simply (is the list empty?), an if is clearer than waiting for an IndexError.`,
          `Losing the message. except ValueError: print("error") throws away Python's helpful explanation. Use except ValueError as err: and include err in what you log or show.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write safe_divide(a, b) that returns the result, or None if b is zero, using try/except ZeroDivisionError.`,
          `2. Write a function withdraw(balance, amount) that raises ValueError with a clear message if amount is not positive or is larger than balance. Call it inside try/except and print the message.`,
          `3. Deliberately cause a KeyError, an IndexError and a TypeError. For each, read the last line of the traceback aloud and say in plain words what went wrong.`,
        ],
      },
    ],
  },
  'sef-8': {
    keyTerms: [
      { term: 'Path', meaning: 'The location of a file, such as data/scores.txt. Relative paths start from the folder the program runs in.' },
      { term: 'Encoding', meaning: 'The rule for turning text into bytes on disk. UTF-8 handles every language and is the safe default.' },
      { term: 'CSV', meaning: 'Comma-separated values: a plain-text table, one row per line, used by spreadsheets.' },
    ],
    after: [
      {
        title: 'Under the hood: files, paths and why with matters',
        paragraphs: [
          `Opening a file asks the operating system for access to it. The OS hands back a handle, and while the handle is open the file may be locked and writes may be sitting in a memory buffer rather than on disk. If your program crashes before closing it, buffered data can be lost.`,
          `with open(...) as f: guarantees the file is closed when the indented block ends, even if an exception happens inside it. That is why every example in this track uses with. It is the same try/finally idea from the previous lesson, packaged so you cannot forget it.`,
          `Relative paths are relative to the current working directory (where the program was started from), not to where the .py file lives. That is why "it works on my machine" file bugs are so common. pathlib.Path gives you a clear way to build paths, check if they exist and join folder names in a way that works on Windows, macOS and Linux.`,
          `Always pass encoding="utf-8" when reading or writing text. Without it, Python uses the operating system's default, which differs between computers, and names such as "Adwoa Ɔforiwaa" or "Zoë" can come out garbled or crash with UnicodeDecodeError.`,
        ],
        code: `from pathlib import Path

folder = Path("reports")
folder.mkdir(exist_ok=True)          # create it if missing
path = folder / "summary.txt"         # works on every OS

with open(path, "w", encoding="utf-8") as f:
    f.write("Total: 3 students\\n")
print(path.exists(), path.read_text(encoding="utf-8").strip())
# True Total: 3 students`,
        label: 'Safe paths and files with pathlib',
      },
      {
        title: 'Worked example: reading a CSV of results and writing a summary',
        paragraphs: [
          `Spreadsheet data is often exported as CSV. You could split each line on commas yourself, but that breaks as soon as a field contains a comma inside quotes ("Mensah, Ama"). The standard library's csv module handles those rules correctly, so use it.`,
          `csv.DictReader reads the first line as column names and gives you each following row as a dictionary, so you write row["score"] instead of remembering that the score is column 2. Every value arrives as a string, so convert numbers explicitly.`,
          `The program reads, processes and writes in three clear stages. Bad rows are counted and skipped rather than crashing the whole import, and the summary is saved as JSON so another program (or a later run of this one) can load it back exactly.`,
        ],
        code: `import csv, json, io

# In a real program this would be: open("results.csv", newline="", encoding="utf-8")
data = io.StringIO("name,score\\n\\"Mensah, Ama\\",81\\nKojo,73\\nEsi,not-entered\\n")

scores, skipped = {}, 0
for row in csv.DictReader(data):
    try:
        scores[row["name"]] = int(row["score"])
    except ValueError:
        skipped += 1

summary = {"count": len(scores), "average": sum(scores.values()) / len(scores),
           "skipped": skipped, "scores": scores}
print(json.dumps(summary, indent=2))
# {
#   "count": 2,
#   "average": 77.0,
#   "skipped": 1,
#   "scores": {
#     "Mensah, Ama": 81,
#     "Kojo": 73
#   }
# }`,
        label: 'CSV in, JSON out',
      },
      {
        title: 'Organising your own code into modules',
        paragraphs: [
          `Once a program grows past a hundred lines or so, put related functions into their own file. A file called grading.py is a module named grading; another file in the same folder can write from grading import letter_grade and use it.`,
          `When Python imports a module it runs the whole file once. That is why modules should mostly contain definitions (functions, classes, constants) and not code that prints or asks for input at the top level. Put the "run the program" code inside if __name__ == "__main__":, which is only True when the file is run directly, not when it is imported.`,
          `Never name your own file after a standard-library module. A file called random.py or json.py in your folder will be imported instead of the real one, and you will get baffling errors such as AttributeError: module 'random' has no attribute 'randint'.`,
        ],
        code: `# grading.py
def letter_grade(score):
    return "A" if score >= 80 else "B" if score >= 70 else "C"

if __name__ == "__main__":       # only when run directly
    print(letter_grade(85))

# main.py
# from grading import letter_grade
# print(letter_grade(72))   -> B   (the test print in grading.py does NOT run)`,
        label: 'A module with a __main__ guard',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a program that appends each line the user types to notes.txt (open with mode "a"), stopping when they type an empty line. Run it twice and check that the old notes are kept.`,
          `2. Save a dictionary of settings to settings.json, then load it back and check the loaded dictionary equals the original.`,
          `3. Handle the missing-file case: try to open a file that does not exist, catch FileNotFoundError and print a friendly message that includes the path.`,
        ],
      },
    ],
  },
  'sef-9': {
    keyTerms: [
      { term: 'Instance', meaning: 'One object made from a class. Two accounts made from Account are two instances.' },
      { term: 'Attribute', meaning: 'A value stored on an object and reached with a dot, such as account.balance.' },
      { term: 'Constructor', meaning: 'The code that sets up a new object. In Python this is __init__.' },
    ],
    after: [
      {
        title: 'Under the hood: what self really is',
        paragraphs: [
          `A class is a blueprint; an object is a thing built from it. When you write acc = Account("Ama", 100), Python creates a new, empty object, then calls Account.__init__(that_object, "Ama", 100). The new object is passed in as the first argument, which by convention we name self.`,
          `So self is simply "the particular object this method is working on". Inside __init__, self.owner = owner stores the value on that object. Each object has its own attributes: changing one account's balance never touches another's.`,
          `Calling a method works the same way. acc.deposit(50) is translated by Python into Account.deposit(acc, 50). That is why every method's first parameter is self, and why forgetting it gives the error TypeError: deposit() takes 1 positional argument but 2 were given.`,
        ],
        code: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

ama = Account("Ama", 100)
kojo = Account("Kojo")
ama.deposit(50)                 # same as Account.deposit(ama, 50)
Account.deposit(kojo, 20)       # the long form — it works identically
print(ama.balance, kojo.balance)   # 150 20`,
        label: 'self is the object the method is called on',
      },
      {
        title: 'Worked example: a library book tracker',
        paragraphs: [
          `Objects shine when data and the rules about that data belong together. A library book has a title, an author, and a status (on the shelf, or borrowed by someone until a date). The rules, such as "you cannot borrow a book that is already out", live in methods next to the data they protect.`,
          `Compare this with the dictionary version from earlier lessons. With a dictionary, any code anywhere could set book["borrower"] without checking whether it is already borrowed. With a class, the right way to borrow a book is the borrow() method, and that method enforces the rule every time.`,
          `The Library class holds many Book objects and offers operations across them. This pattern of one object containing a collection of others is how most real programs are structured: a shop has orders, an order has items, a course has students.`,
        ],
        code: `class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author
        self.borrower = None

    def is_available(self):
        return self.borrower is None

    def borrow(self, person):
        if not self.is_available():
            raise ValueError(f"{self.title} is already borrowed by {self.borrower}")
        self.borrower = person

    def give_back(self):
        self.borrower = None

    def __repr__(self):
        status = "available" if self.is_available() else f"with {self.borrower}"
        return f"Book({self.title!r}, {status})"

class Library:
    def __init__(self):
        self.books = []

    def add(self, book):
        self.books.append(book)

    def available(self):
        return [b for b in self.books if b.is_available()]

lib = Library()
lib.add(Book("Things Fall Apart", "Achebe"))
lib.add(Book("Homegoing", "Gyasi"))
lib.books[0].borrow("Esi")
print(lib.books)        # [Book('Things Fall Apart', with Esi), Book('Homegoing', available)]
print(lib.available())  # [Book('Homegoing', available)]
try:
    lib.books[0].borrow("Kojo")
except ValueError as err:
    print(err)          # Things Fall Apart is already borrowed by Esi`,
        label: 'Book and Library classes',
      },
      {
        title: 'Mistakes beginners make',
        paragraphs: [
          `Forgetting self. in front of attributes. Inside a method, balance = 0 creates a local variable that disappears when the method ends; self.balance = 0 stores it on the object. If an attribute "will not stay set", check for a missing self.`,
          `Forgetting self as the first parameter. def deposit(amount): inside a class leads to TypeError when you call it, because Python passes the object automatically and there is no parameter to receive it.`,
          `Calling the class without brackets. acc = Account gives you the class itself, not a new object. You need acc = Account("Ama").`,
          `Misspelling __init__. With one underscore on each side, or init without underscores, Python never calls it, and your object is created without its attributes. The error appears later, as AttributeError: 'Account' object has no attribute 'balance'.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a Rectangle class with width and height, and methods area() and perimeter(). Add a __repr__ that shows both sides.`,
          `2. Write a Counter class with increment(), reset() and a value attribute. Create two counters and show that they are independent.`,
          `3. Extend the Book example: record how many times each book has been borrowed, and add a Library method that returns the most popular book.`,
        ],
      },
    ],
  },
  'sef-10': {
    keyTerms: [
      { term: 'Invariant', meaning: 'A rule that must always be true for an object, such as "balance is never negative".' },
      { term: 'Getter / setter', meaning: 'Methods that read or change an attribute. Python\'s @property lets them look like plain attributes.' },
      { term: 'Class attribute', meaning: 'A value stored on the class and shared by every instance, unlike instance attributes set on self.' },
    ],
    after: [
      {
        title: 'Under the hood: how attribute lookup works',
        paragraphs: [
          `When you write obj.name, Python first looks in the object's own attributes. If it is not there, it looks in the class. That is why class attributes appear on every instance: they are not copied onto each object; every object finds the single shared value on the class.`,
          `Assigning through an instance, obj.name = value, always creates or changes the object's own attribute. So obj.rate = 0.2 does not change the class's rate; it hides the class value for that one object only. To change the shared value for everyone, assign on the class: Account.rate = 0.2.`,
          `A property is a special class attribute. When Python finds it during lookup, instead of returning it as a value it calls its getter method. Assigning to it calls the setter. That is how a property can validate data while still looking like a plain attribute to the code that uses it.`,
        ],
        code: `class Account:
    interest_rate = 0.05          # class attribute: shared

    def __init__(self, owner):
        self.owner = owner        # instance attribute: per object

a, b = Account("Ama"), Account("Kojo")
print(a.interest_rate, b.interest_rate)   # 0.05 0.05  (both read the class)

a.interest_rate = 0.10                    # creates a's OWN attribute
print(a.interest_rate, b.interest_rate)   # 0.1 0.05

Account.interest_rate = 0.07              # change the shared value
print(a.interest_rate, b.interest_rate)   # 0.1 0.07  (a's own value hides it)`,
        label: 'Instance first, then class',
      },
      {
        title: 'Worked example: a temperature reading that cannot be invalid',
        paragraphs: [
          `Encapsulation is about making invalid states impossible. Temperatures cannot go below absolute zero (−273.15 °C). If any code can set reading.celsius = -500, every function that uses readings has to double-check. If the object refuses invalid values, everyone else can trust it.`,
          `The class stores the real value in _celsius (the underscore says "internal, do not touch from outside"). The public celsius property validates on every assignment, including the one in __init__, so even construction cannot bypass the rule.`,
          `fahrenheit is a computed, read-only property. It has no stored value of its own; it is calculated from _celsius every time, so the two can never disagree. Trying to assign to it raises AttributeError, which is exactly what we want: there is one source of truth.`,
        ],
        code: `class Temperature:
    ABSOLUTE_ZERO = -273.15

    def __init__(self, celsius):
        self.celsius = celsius            # goes through the setter below

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < self.ABSOLUTE_ZERO:
            raise ValueError(f"{value} is below absolute zero")
        self._celsius = float(value)

    @property
    def fahrenheit(self):                 # computed, read-only
        return self._celsius * 9 / 5 + 32

t = Temperature(30)
print(t.celsius, t.fahrenheit)   # 30.0 86.0
t.celsius = 100
print(t.fahrenheit)              # 212.0
for bad in (lambda: Temperature(-300), lambda: setattr(t, "fahrenheit", 50)):
    try:
        bad()
    except (ValueError, AttributeError) as err:
        print(type(err).__name__, err)
# ValueError -300 is below absolute zero
# AttributeError property 'fahrenheit' of 'Temperature' object has no setter`,
        label: 'Validated and computed properties',
      },
      {
        title: 'Mistakes beginners make',
        paragraphs: [
          `Infinite recursion in a property. Inside the celsius setter, writing self.celsius = value calls the setter again, forever, until Python stops with RecursionError. Store the value under a different name: self._celsius.`,
          `Making every attribute private "just in case". The underscore convention is for data with rules or internal details that may change. Simple data with no rules can stay as plain public attributes; Python lets you turn one into a property later without changing any calling code.`,
          `Putting a list or dictionary as a class attribute when each object needs its own. students = [] at class level is shared by every instance, so adding a student to one course adds it to all of them. Create per-object collections in __init__: self.students = [].`,
          `Thinking the double underscore (__balance) makes data secure. Python only renames it (name mangling) to avoid accidental clashes in subclasses. Encapsulation in Python is a design agreement, not a security wall.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Add a pin property to a BankCard class that accepts only strings of four digits and never lets the stored PIN be read back (the getter can return "****").`,
          `2. Give a Student class a class attribute count that increases each time a student is created. Show that it is shared across all instances.`,
          `3. Write a Rectangle whose width and height must both be positive, and an area property computed from them.`,
        ],
      },
    ],
  },
  'sef-11': {
    keyTerms: [
      { term: 'Method resolution order', meaning: 'The order Python searches classes for a method: the object\'s class first, then its parents.' },
      { term: 'Abstract base class', meaning: 'A class that defines methods subclasses must provide and cannot itself be instantiated.' },
      { term: 'Duck typing', meaning: 'Using any object that has the right methods, regardless of its class: "if it quacks like a duck…".' },
    ],
    after: [
      {
        title: 'Under the hood: how Python finds an overridden method',
        paragraphs: [
          `When you call obj.describe(), Python searches for describe in a fixed order: the object's own class first, then its parent, then the parent's parent, ending at object, the root of every class. The first match wins. This order is called the method resolution order (MRO), and ClassName.__mro__ shows it.`,
          `Overriding is therefore just "define a method with the same name lower down the tree". The child's version is found first, so it is the one that runs. super().describe() says "skip my own class and continue the search from my parent", which is how a child extends behaviour instead of replacing it entirely.`,
          `Polymorphism falls out of this naturally. Code that calls shape.area() does not need to know which class shape belongs to; Python finds the right area for each object at the moment of the call. Python goes further than many languages: any object with an area() method works, even one unrelated by inheritance. That is duck typing.`,
        ],
        code: `class Animal:
    def speak(self):
        return "..."
    def introduce(self):
        return f"I say {self.speak()}"

class Dog(Animal):
    def speak(self):
        return "Woof"

class Puppy(Dog):
    def speak(self):
        return super().speak() + " (squeaky)"

print([c.__name__ for c in Puppy.__mro__])  # ['Puppy', 'Dog', 'Animal', 'object']
print(Puppy().introduce())                  # I say Woof (squeaky)`,
        label: 'Method lookup and super()',
      },
      {
        title: 'Worked example: payment methods with an abstract base class',
        paragraphs: [
          `A shop accepts several payment methods: mobile money, card and cash. Each needs a different fee rule and different steps, but the checkout code should treat them all the same way. This is the textbook use of polymorphism.`,
          `PaymentMethod is an abstract base class (ABC). The @abstractmethod decorator marks methods every subclass must implement. If someone writes a new subclass and forgets fee(), Python refuses to create objects from it, catching the mistake immediately instead of in the middle of a customer's checkout.`,
          `checkout() only uses the methods the base class promises. Adding a new payment type, such as bank transfer, means writing one new class. checkout() does not change at all. That property, being open to new behaviour without editing tested code, is what makes polymorphism valuable in large programs.`,
        ],
        code: `from abc import ABC, abstractmethod

class PaymentMethod(ABC):
    @abstractmethod
    def fee(self, amount): ...

    @abstractmethod
    def name(self): ...

class MobileMoney(PaymentMethod):
    def fee(self, amount):
        return round(amount * 0.01, 2)    # 1%
    def name(self):
        return "Mobile Money"

class Card(PaymentMethod):
    def fee(self, amount):
        return round(amount * 0.025 + 1, 2)   # 2.5% + GHS 1
    def name(self):
        return "Card"

class Cash(PaymentMethod):
    def fee(self, amount):
        return 0
    def name(self):
        return "Cash"

def checkout(amount, method):
    total = amount + method.fee(amount)
    return f"{method.name()}: GHS {total:.2f}"

for m in (MobileMoney(), Card(), Cash()):
    print(checkout(200, m))
# Mobile Money: GHS 202.00
# Card: GHS 206.00
# Cash: GHS 200.00

try:
    PaymentMethod()
except TypeError as err:
    print("Cannot create:", type(err).__name__)   # Cannot create: TypeError`,
        label: 'Polymorphic checkout',
      },
      {
        title: 'Choosing between inheritance and composition',
        paragraphs: [
          `Ask the "is a" question honestly. A Dog is an Animal in every situation where an Animal is expected, so inheritance fits. A Car is not an Engine; it has an engine. If you made Car inherit from Engine, a Car would have every engine method (start_ignition, check_oil_pressure) as part of its own interface, which is confusing and fragile.`,
          `A useful test is substitution: anywhere the program uses a parent object, could it use the child without anything going wrong? If a Square subclass of Rectangle breaks code that sets width and height independently, the inheritance is wrong even though "a square is a rectangle" sounds right in maths.`,
          `Deep inheritance trees (five or six levels) are hard to follow because behaviour is spread across many files. Most experienced Python developers keep trees shallow, use ABCs to define what is required, and build objects from smaller parts (composition) for everything else. You will meet this principle again, in more depth, in the design module.`,
        ],
        code: `class Engine:
    def start(self):
        return "engine running"

class Car:                       # composition: a Car HAS an Engine
    def __init__(self, engine):
        self.engine = engine
    def drive(self):
        return f"{self.engine.start()}, car moving"

class ElectricMotor:             # a different part, same interface
    def start(self):
        return "motor humming"

print(Car(Engine()).drive())          # engine running, car moving
print(Car(ElectricMotor()).drive())   # motor humming, car moving`,
        label: 'Swapping parts with composition',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Create a Shape ABC with area() and perimeter(), then Circle and Rectangle subclasses. Write a function that prints the total area of a list of mixed shapes.`,
          `2. Add __eq__ and __lt__ to a Money class so amounts can be compared and sorted with sorted().`,
          `3. Redesign a Square(Rectangle) example using composition or a separate class, and explain in one sentence why the substitution test fails for inheritance here.`,
        ],
      },
    ],
  },
};
