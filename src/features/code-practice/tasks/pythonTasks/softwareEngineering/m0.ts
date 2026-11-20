import type { CodeTask } from '../../codeTypes';
import { grader } from './harness';

const base = { language: 'python', category: 'Software Engineering' } as const;

/** Beginner practice for SE 1 (Programming Basics) and SE 2 (Programs & OOP). Every task gives the
 *  function or class shape already written; the learner replaces `pass` with the body. */
export const SE_M0_TASKS: CodeTask[] = [
  // ── sef-1 · Values, variables and types ─────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-01',
    title: 'First Steps: Work Out a Shopping Total',
    difficulty: 'Easy',
    prompt:
      'A shop needs the total cost of an order. The function total_cost(price, quantity) is already written for you — ' +
      'you only need to replace pass with the body. Multiply price by quantity, round the result to 2 decimal places ' +
      'with round(value, 2), and return it. For example total_cost(4.5, 3) returns 13.5. Use return, not print: ' +
      'the checker reads the value your function gives back.',
    starterCode: `def total_cost(price, quantity):
    # TODO: multiply, round to 2 decimal places, and return the result
    pass
`,
    hints: [
      'Store the multiplication in a variable first: total = price * quantity',
      'round(total, 2) gives the value rounded to two decimal places.',
      'The last line of the body should be: return round(total, 2)',
    ],
    solution: `def total_cost(price, quantity):
    total = price * quantity
    return round(total, 2)
`,
    testCode: grader(`
__check__("4.5 x 3", total_cost(4.5, 3), 13.5)
__check__("whole numbers", total_cost(10, 2), 20)
__check__("rounds to 2 places", total_cost(0.1, 3), 0.3)
__check__("zero items", total_cost(9.99, 0), 0)
__check__("returns a number, not text", isinstance(total_cost(2, 2), (int, float)), True)
`),
  },
  {
    ...base,
    id: 'se-fnd-02',
    title: 'First Steps: Turn Typed Text Into Numbers',
    difficulty: 'Easy',
    prompt:
      'Values typed by a user always arrive as strings, so "5" + "7" gives "57", not 12. Write add_text_numbers(a, b): ' +
      'a and b are strings containing whole numbers, possibly with spaces around them such as " 7 ". Convert both to ' +
      'int and return their sum as an int. Then write minutes_to_hours(minutes) that returns the number of whole hours ' +
      'in a number of minutes (use //), so minutes_to_hours(135) returns 2.',
    starterCode: `def add_text_numbers(a, b):
    # TODO: convert a and b to int, then return the sum
    pass


def minutes_to_hours(minutes):
    # TODO: return the whole hours using //
    pass
`,
    hints: [
      'int(" 7 ") already ignores the spaces around a number, so int(a) + int(b) is enough.',
      '// divides and drops the remainder: 135 // 60 is 2.',
    ],
    solution: `def add_text_numbers(a, b):
    return int(a) + int(b)


def minutes_to_hours(minutes):
    return minutes // 60
`,
    testCode: grader(`
__check__("adds as numbers", add_text_numbers("5", "7"), 12)
__check__("ignores spaces", add_text_numbers(" 10", "20 "), 30)
__check__("negative numbers", add_text_numbers("-3", "3"), 0)
__check__("result is an int", type(add_text_numbers("1", "2")).__name__, "int")
__check__("135 minutes", minutes_to_hours(135), 2)
__check__("59 minutes", minutes_to_hours(59), 0)
__check__("exactly 3 hours", minutes_to_hours(180), 3)
`),
  },
  // ── sef-2 · Strings ─────────────────────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-03',
    title: 'Strings: Tidy a Name From a Sign-Up Form',
    difficulty: 'Easy',
    prompt:
      'People type names in every possible way: "  yaw   BOATENG ", "esi badu", "KOFI". Write tidy_name(raw) that ' +
      'removes spaces at both ends, collapses repeated spaces between words into one, and capitalises each word, so ' +
      '"  yaw   BOATENG " becomes "Yaw Boateng". Then write initials(raw) that returns the tidied name\'s initials ' +
      'joined by full stops, so initials("  yaw   BOATENG ") returns "Y.B.".',
    starterCode: `def tidy_name(raw):
    # TODO: clean spaces and capitalise each word
    pass


def initials(raw):
    # TODO: use tidy_name, then take the first letter of each word
    pass
`,
    hints: [
      'raw.split() with no argument splits on any run of spaces and ignores spaces at the ends.',
      '" ".join(words) puts the words back together with single spaces; .title() capitalises each word.',
      'For initials, loop over tidy_name(raw).split() and add word[0] + "." to a result string.',
    ],
    solution: `def tidy_name(raw):
    return " ".join(raw.split()).title()


def initials(raw):
    result = ""
    for word in tidy_name(raw).split():
        result += word[0] + "."
    return result
`,
    testCode: grader(`
__check__("messy spaces and case", tidy_name("  yaw   BOATENG "), "Yaw Boateng")
__check__("already lower case", tidy_name("esi badu"), "Esi Badu")
__check__("one word", tidy_name("KOFI"), "Kofi")
__check__("three words", tidy_name("ama  serwaa owusu"), "Ama Serwaa Owusu")
__check__("initials", initials("  yaw   BOATENG "), "Y.B.")
__check__("three initials", initials("ama serwaa owusu"), "A.S.O.")
`),
  },
  {
    ...base,
    id: 'se-fnd-04',
    title: 'Strings: Mask a Card Number for a Receipt',
    difficulty: 'Easy',
    prompt:
      'Receipts must never show a full card number. Write mask_card(number) where number is a string of digits that ' +
      'may contain spaces, such as "4111 1111 1111 1234". Remove the spaces, then return a string where every digit ' +
      'except the last four is replaced by "*": "************1234". If there are 4 or fewer digits, return them ' +
      'unchanged (after removing spaces).',
    starterCode: `def mask_card(number):
    # TODO: remove spaces, then keep only the last four digits visible
    pass
`,
    hints: [
      'number.replace(" ", "") removes every space.',
      'digits[-4:] is the last four characters; len(digits) - 4 is how many stars you need.',
      '"*" * 3 gives "***" — strings can be repeated with *.',
    ],
    solution: `def mask_card(number):
    digits = number.replace(" ", "")
    if len(digits) <= 4:
        return digits
    return "*" * (len(digits) - 4) + digits[-4:]
`,
    testCode: grader(`
__check__("16 digits with spaces", mask_card("4111 1111 1111 1234"), "************1234")
__check__("no spaces", mask_card("5500000000000004"), "************0004")
__check__("short number", mask_card("1234"), "1234")
__check__("very short", mask_card("12"), "12")
__check__("length preserved", len(mask_card("1234 5678 9012")), 12)
`),
  },
  // ── sef-3 · Decisions ───────────────────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-05',
    title: 'Decisions: Price a Cinema Ticket',
    difficulty: 'Easy',
    prompt:
      'Write ticket_price(age, is_student). Prices: under 3 → 0; 3 to 12 → 20; 13 to 64 → 35; 65 and over → 25. ' +
      'Students aged 13 to 25 (inclusive) get 10 off the price. Raise ValueError if age is negative. ' +
      'Think about the order of your if / elif checks and test the edges: 2, 3, 12, 13, 25, 26, 64, 65.',
    starterCode: `def ticket_price(age, is_student):
    # TODO: reject negative ages, pick the base price, then apply the student discount
    pass
`,
    hints: [
      'Start with: if age < 0: raise ValueError("age cannot be negative")',
      'Check ages from smallest up: if age < 3 … elif age <= 12 … elif age <= 64 … else …',
      'After choosing the price: if is_student and 13 <= age <= 25: price -= 10',
    ],
    solution: `def ticket_price(age, is_student):
    if age < 0:
        raise ValueError("age cannot be negative")
    if age < 3:
        price = 0
    elif age <= 12:
        price = 20
    elif age <= 64:
        price = 35
    else:
        price = 25
    if is_student and 13 <= age <= 25:
        price -= 10
    return price
`,
    testCode: grader(`
__check__("age 2", ticket_price(2, False), 0)
__check__("age 3", ticket_price(3, False), 20)
__check__("age 12", ticket_price(12, False), 20)
__check__("age 13", ticket_price(13, False), 35)
__check__("student 13", ticket_price(13, True), 25)
__check__("student 25", ticket_price(25, True), 25)
__check__("student 26 gets no discount", ticket_price(26, True), 35)
__check__("age 64", ticket_price(64, False), 35)
__check__("age 65", ticket_price(65, False), 25)
__check__("child student flag ignored", ticket_price(10, True), 20)
__raises__("negative age", lambda: ticket_price(-1, False), ValueError)
`),
  },
  {
    ...base,
    id: 'se-fnd-06',
    title: 'Decisions: Is It a Leap Year?',
    difficulty: 'Easy',
    prompt:
      'Calendars need to know whether February has 29 days. Write is_leap_year(year) returning True or False. ' +
      'The rule: a year is a leap year if it is divisible by 4, except years divisible by 100, which are only leap ' +
      'years if they are also divisible by 400. So 2024 is a leap year, 1900 is not, and 2000 is. Then write ' +
      'days_in_february(year) that returns 29 or 28 by using is_leap_year.',
    starterCode: `def is_leap_year(year):
    # TODO: combine % checks with and / or
    pass


def days_in_february(year):
    # TODO: use is_leap_year
    pass
`,
    hints: [
      'year % 4 == 0 means "divisible by 4".',
      'One way: return (year % 4 == 0 and year % 100 != 0) or year % 400 == 0',
    ],
    solution: `def is_leap_year(year):
    return (year % 4 == 0 and year % 100 != 0) or year % 400 == 0


def days_in_february(year):
    if is_leap_year(year):
        return 29
    return 28
`,
    testCode: grader(`
__check__("2024", is_leap_year(2024), True)
__check__("2023", is_leap_year(2023), False)
__check__("1900 (century)", is_leap_year(1900), False)
__check__("2000 (divisible by 400)", is_leap_year(2000), True)
__check__("2100", is_leap_year(2100), False)
__check__("February 2024", days_in_february(2024), 29)
__check__("February 2026", days_in_february(2026), 28)
`),
  },
  // ── sef-4 · Loops ───────────────────────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-07',
    title: 'Loops: Count the Vowels',
    difficulty: 'Easy',
    prompt:
      'Write count_vowels(text) that returns how many vowels (a, e, i, o, u) the text contains, counting upper and ' +
      'lower case letters. Use a for loop over the characters and the accumulator pattern: start a counter at 0 ' +
      'before the loop and add 1 for every vowel. count_vowels("Programming") returns 3.',
    starterCode: `def count_vowels(text):
    count = 0
    # TODO: loop over text and add 1 to count for every vowel
    pass
`,
    hints: [
      'for letter in text: visits one character at a time.',
      'letter.lower() in "aeiou" is True for both "A" and "a".',
      'Do not forget to return count after the loop.',
    ],
    solution: `def count_vowels(text):
    count = 0
    for letter in text:
        if letter.lower() in "aeiou":
            count += 1
    return count
`,
    testCode: grader(`
__check__("Programming", count_vowels("Programming"), 3)
__check__("upper case", count_vowels("AEIOU"), 5)
__check__("no vowels", count_vowels("rhythm"), 0)
__check__("empty", count_vowels(""), 0)
__check__("sentence", count_vowels("Hello, World!"), 3)
`),
  },
  {
    ...base,
    id: 'se-fnd-08',
    title: 'Loops: Add Up the Multiples',
    difficulty: 'Easy',
    prompt:
      'Write sum_of_multiples(limit) that adds up every whole number from 1 up to but NOT including limit that is ' +
      'divisible by 3 or by 5. For limit 10 the numbers are 3, 5, 6 and 9, so the answer is 23. Then write ' +
      'first_square_over(target) that uses a while loop to find the smallest whole number n whose square n * n is ' +
      'greater than target: first_square_over(50) returns 8 because 7 * 7 = 49 but 8 * 8 = 64.',
    starterCode: `def sum_of_multiples(limit):
    # TODO: loop with range and add the numbers divisible by 3 or 5
    pass


def first_square_over(target):
    # TODO: start at n = 1 and keep adding 1 while n * n <= target
    pass
`,
    hints: [
      'range(1, limit) gives 1 up to limit - 1.',
      'n % 3 == 0 or n % 5 == 0 tests "divisible by 3 or 5".',
      'n = 1; while n * n <= target: n += 1 — then return n.',
    ],
    solution: `def sum_of_multiples(limit):
    total = 0
    for n in range(1, limit):
        if n % 3 == 0 or n % 5 == 0:
            total += n
    return total


def first_square_over(target):
    n = 1
    while n * n <= target:
        n += 1
    return n
`,
    testCode: grader(`
__check__("limit 10", sum_of_multiples(10), 23)
__check__("limit 1", sum_of_multiples(1), 0)
__check__("15 itself is excluded", sum_of_multiples(15), 45)
__check__("limit 1000", sum_of_multiples(1000), 233168)
__check__("over 50", first_square_over(50), 8)
__check__("over 49", first_square_over(49), 8)
__check__("over 0", first_square_over(0), 1)
`),
  },
  // ── sef-5 · Collections ─────────────────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-09',
    title: 'Collections: Count Words With a Dictionary',
    difficulty: 'Easy',
    prompt:
      'Write word_counts(text) that returns a dictionary mapping each word to how many times it appears. Treat ' +
      'upper and lower case as the same word, and remove the punctuation characters . , ! ? from the ends of words. ' +
      'word_counts("The cat and the hat.") returns {"the": 2, "cat": 1, "and": 1, "hat": 1}.',
    starterCode: `def word_counts(text):
    counts = {}
    # TODO: split the text, clean each word, and count it
    pass
`,
    hints: [
      'text.lower().split() gives the words in lower case.',
      'word.strip(".,!?") removes those characters from both ends of word.',
      'counts[word] = counts.get(word, 0) + 1 counts a word whether or not it has been seen before.',
    ],
    solution: `def word_counts(text):
    counts = {}
    for word in text.lower().split():
        word = word.strip(".,!?")
        if word:
            counts[word] = counts.get(word, 0) + 1
    return counts
`,
    testCode: grader(`
__check__("simple sentence", word_counts("The cat and the hat."), {"the": 2, "cat": 1, "and": 1, "hat": 1})
__check__("punctuation", word_counts("Hi! hi? HI."), {"hi": 3})
__check__("empty text", word_counts(""), {})
__check__("lone punctuation ignored", word_counts("yes , no"), {"yes": 1, "no": 1})
`),
  },
  {
    ...base,
    id: 'se-fnd-10',
    title: 'Collections: Find the Top Scorer',
    difficulty: 'Medium',
    prompt:
      'scores is a dictionary such as {"Ama": 91, "Kofi": 78, "Esi": 91}. Write top_scorer(scores) that returns the ' +
      'name with the highest score. If several people share the top score, return the one that comes first ' +
      'alphabetically ("Ama" before "Esi"). Return None for an empty dictionary. Then write unique_sorted(items) that ' +
      'returns the items of a list with duplicates removed, in sorted order.',
    starterCode: `def top_scorer(scores):
    # TODO: handle the empty case, then find the best score and the right name
    pass


def unique_sorted(items):
    # TODO: remove duplicates and sort
    pass
`,
    hints: [
      'if not scores: return None handles the empty dictionary.',
      'best = max(scores.values()) finds the highest score.',
      'Collect every name with that score in a list and return min(...) or sorted(...)[0]. For unique_sorted, sorted(set(items)).',
    ],
    solution: `def top_scorer(scores):
    if not scores:
        return None
    best = max(scores.values())
    winners = [name for name, score in scores.items() if score == best]
    return sorted(winners)[0]


def unique_sorted(items):
    return sorted(set(items))
`,
    testCode: grader(`
__check__("clear winner", top_scorer({"Ama": 70, "Kofi": 88, "Esi": 60}), "Kofi")
__check__("tie goes alphabetical", top_scorer({"Esi": 91, "Kofi": 78, "Ama": 91}), "Ama")
__check__("single person", top_scorer({"Yaw": 50}), "Yaw")
__check__("empty", top_scorer({}), None)
__check__("unique sorted", unique_sorted([3, 1, 3, 2, 1]), [1, 2, 3])
__check__("strings", unique_sorted(["kofi", "ama", "kofi"]), ["ama", "kofi"])
__check__("returns a list", type(unique_sorted([1])).__name__, "list")
`),
  },
  // ── sef-6 · Functions ───────────────────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-11',
    title: 'Functions: Build a Grade Report',
    difficulty: 'Easy',
    prompt:
      'Split a small program into three functions. average(marks) returns the mean of a list of marks rounded to 1 ' +
      'decimal place. letter(avg) returns "A" for 80 and above, "B" for 70 and above, "C" for 60 and above, ' +
      'otherwise "F". report(name, marks) uses the other two to return a line such as "Ama: 84.3 (A)".',
    starterCode: `def average(marks):
    pass


def letter(avg):
    pass


def report(name, marks):
    # TODO: call average and letter, then build the line with an f-string
    pass
`,
    hints: [
      'average: return round(sum(marks) / len(marks), 1)',
      'letter: check from the highest grade down with if / elif and return early.',
      'report: avg = average(marks); return f"{name}: {avg} ({letter(avg)})"',
    ],
    solution: `def average(marks):
    return round(sum(marks) / len(marks), 1)


def letter(avg):
    if avg >= 80:
        return "A"
    elif avg >= 70:
        return "B"
    elif avg >= 60:
        return "C"
    return "F"


def report(name, marks):
    avg = average(marks)
    return f"{name}: {avg} ({letter(avg)})"
`,
    testCode: grader(`
__check__("average", average([80, 85, 88]), 84.3)
__check__("average whole", average([70, 80]), 75.0)
__check__("letter 80 is A", letter(80), "A")
__check__("letter 79.9 is B", letter(79.9), "B")
__check__("letter 60 is C", letter(60), "C")
__check__("letter 59 is F", letter(59), "F")
__check__("report", report("Ama", [80, 85, 88]), "Ama: 84.3 (A)")
__check__("report F", report("Kofi", [40, 50]), "Kofi: 45.0 (F)")
`),
  },
  {
    ...base,
    id: 'se-fnd-12',
    title: 'Functions: Validate an Email Address',
    difficulty: 'Medium',
    prompt:
      'Write is_valid_email(email) returning True or False with these simple rules: after removing outer spaces the ' +
      'address contains exactly one "@"; the part before "@" is not empty; the part after "@" contains a "." that is ' +
      'neither its first nor its last character; and there are no spaces inside. Then write normalise_email(email) ' +
      'that returns the stripped, lower-cased address, or raises ValueError if it is not valid. Keep each function ' +
      'small and let normalise_email call is_valid_email.',
    starterCode: `def is_valid_email(email):
    pass


def normalise_email(email):
    pass
`,
    hints: [
      'email = email.strip(); then if email.count("@") != 1: return False',
      'user, domain = email.split("@") gives the two parts.',
      'A dot that is not first or last: "." in domain[1:-1]. Spaces: " " in email.',
    ],
    solution: `def is_valid_email(email):
    email = email.strip()
    if " " in email or email.count("@") != 1:
        return False
    user, domain = email.split("@")
    return bool(user) and "." in domain[1:-1]


def normalise_email(email):
    if not is_valid_email(email):
        raise ValueError(f"not a valid email: {email!r}")
    return email.strip().lower()
`,
    testCode: grader(`
__check__("valid", is_valid_email("ama@example.com"), True)
__check__("outer spaces allowed", is_valid_email("  ama@example.com "), True)
__check__("no @", is_valid_email("ama.example.com"), False)
__check__("two @", is_valid_email("a@b@c.com"), False)
__check__("empty user", is_valid_email("@example.com"), False)
__check__("dot at end", is_valid_email("ama@example."), False)
__check__("dot at start", is_valid_email("ama@.com"), False)
__check__("inner space", is_valid_email("a ma@example.com"), False)
__check__("normalise", normalise_email("  Ama@Example.COM "), "ama@example.com")
__raises__("normalise rejects bad", lambda: normalise_email("nope"), ValueError)
`),
  },
  // ── sef-7 · Errors and exceptions ───────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-13',
    title: 'Exceptions: Parse a Price Safely',
    difficulty: 'Easy',
    prompt:
      'Write parse_price(text) that converts typed text such as " 12.50 " into a float. If the text is not a number ' +
      '(for example "abc" or ""), raise ValueError. If it is a number but negative, also raise ValueError with a ' +
      'clear message. Never return a made-up value such as -1. Then write price_or_default(text, default=0.0) that ' +
      'calls parse_price and returns default instead of crashing when parse_price raises ValueError.',
    starterCode: `def parse_price(text):
    pass


def price_or_default(text, default=0.0):
    # TODO: use try / except ValueError around parse_price
    pass
`,
    hints: [
      'float("abc") already raises ValueError for you — you do not need to catch it in parse_price.',
      'After converting: if price < 0: raise ValueError("price cannot be negative")',
      'try: return parse_price(text) / except ValueError: return default',
    ],
    solution: `def parse_price(text):
    price = float(text.strip())
    if price < 0:
        raise ValueError("price cannot be negative")
    return price


def price_or_default(text, default=0.0):
    try:
        return parse_price(text)
    except ValueError:
        return default
`,
    testCode: grader(`
__check__("with spaces", parse_price(" 12.50 "), 12.5)
__check__("whole number", parse_price("3"), 3.0)
__check__("zero", parse_price("0"), 0.0)
__raises__("letters", lambda: parse_price("abc"), ValueError)
__raises__("empty", lambda: parse_price(""), ValueError)
__raises__("negative", lambda: parse_price("-3"), ValueError)
__check__("default on bad text", price_or_default("abc"), 0.0)
__check__("custom default", price_or_default("-1", default=None), None)
__check__("good text passes through", price_or_default("2.5"), 2.5)
`),
  },
  {
    ...base,
    id: 'se-fnd-14',
    title: 'Exceptions: Look Up Stock Without Crashing',
    difficulty: 'Medium',
    prompt:
      'A shop keeps stock in a dictionary such as {"pen": 10, "book": 2}. Write take_from_stock(stock, item, amount) ' +
      'that lowers the count for item by amount and returns the new count. Raise KeyError if the item is unknown, ' +
      'ValueError if amount is not positive, and ValueError if there is not enough stock (leave the stock unchanged ' +
      'in every error case). Then write try_order(stock, item, amount) that returns "ok" on success, or the text ' +
      '"error: " followed by the exception class name (for example "error: KeyError") when take_from_stock fails.',
    starterCode: `def take_from_stock(stock, item, amount):
    pass


def try_order(stock, item, amount):
    pass
`,
    hints: [
      'Check every problem before changing anything: if item not in stock: raise KeyError(item)',
      'Then check amount <= 0 and amount > stock[item]; only then subtract.',
      'In try_order: except (KeyError, ValueError) as error: return f"error: {type(error).__name__}"',
    ],
    solution: `def take_from_stock(stock, item, amount):
    if item not in stock:
        raise KeyError(item)
    if amount <= 0:
        raise ValueError("amount must be positive")
    if amount > stock[item]:
        raise ValueError(f"only {stock[item]} {item} left")
    stock[item] -= amount
    return stock[item]


def try_order(stock, item, amount):
    try:
        take_from_stock(stock, item, amount)
    except (KeyError, ValueError) as error:
        return f"error: {type(error).__name__}"
    return "ok"
`,
    testCode: grader(`
s = {"pen": 10, "book": 2}
__check__("take 3 pens", take_from_stock(s, "pen", 3), 7)
__raises__("unknown item", lambda: take_from_stock(s, "cup", 1), KeyError)
__raises__("zero amount", lambda: take_from_stock(s, "pen", 0), ValueError)
__raises__("too many", lambda: take_from_stock(s, "book", 5), ValueError)
__check__("stock unchanged after errors", s, {"pen": 7, "book": 2})
__check__("try_order ok", try_order(s, "book", 2), "ok")
__check__("try_order empty stock", try_order(s, "book", 1), "error: ValueError")
__check__("try_order unknown", try_order(s, "cup", 1), "error: KeyError")
`),
  },
  // ── sef-8 · Files and modules ───────────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-15',
    title: 'Files: Load and Save a To-Do List',
    difficulty: 'Medium',
    prompt:
      'Write save_tasks(path, tasks) that writes each task in the list on its own line to the file at path ' +
      '(replacing anything already there), and load_tasks(path) that reads the file back as a list of tasks. ' +
      'load_tasks must strip each line, skip blank lines and lines starting with "#", and return an empty list if ' +
      'the file does not exist yet. Always use with and encoding="utf-8".',
    starterCode: `def save_tasks(path, tasks):
    pass


def load_tasks(path):
    pass
`,
    hints: [
      'with open(path, "w", encoding="utf-8") as f: then f.write(task + "\\n") for each task.',
      'Reading: for line in f: task = line.strip(); skip it if not task or task.startswith("#").',
      'Wrap the reading in try / except FileNotFoundError: return []',
    ],
    solution: `def save_tasks(path, tasks):
    with open(path, "w", encoding="utf-8") as f:
        for task in tasks:
            f.write(task + "\\n")


def load_tasks(path):
    tasks = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                task = line.strip()
                if task and not task.startswith("#"):
                    tasks.append(task)
    except FileNotFoundError:
        return []
    return tasks
`,
    testCode: grader(`
import os, tempfile
folder = tempfile.mkdtemp()
path = os.path.join(folder, "todo.txt")
__check__("missing file gives []", load_tasks(os.path.join(folder, "nope.txt")), [])
save_tasks(path, ["buy milk", "call Ama"])
__check__("round trip", load_tasks(path), ["buy milk", "call Ama"])
save_tasks(path, ["only this"])
__check__("save replaces old content", load_tasks(path), ["only this"])
with open(path, "w", encoding="utf-8") as f:
    f.write("# my list\\n\\n  read  \\n\\nwalk\\n")
__check__("skips comments and blanks", load_tasks(path), ["read", "walk"])
save_tasks(path, ["Abená's task"])
__check__("unicode survives", load_tasks(path), ["Abená's task"])
`),
  },
  {
    ...base,
    id: 'se-fnd-16',
    title: 'Modules: Update Saved Scores Stored as JSON',
    difficulty: 'Medium',
    prompt:
      'Scores are stored as JSON text such as \'{"Ama": 91, "Kofi": 78}\'. Import the standard json module and write ' +
      'add_score(json_text, name, score) that loads the text into a dictionary, sets name to score (keeping the ' +
      'higher score if the name already exists), and returns new JSON text with keys sorted (json.dumps with ' +
      'sort_keys=True). Empty text "" means no scores yet. Then write leaderboard(json_text) that returns a list of ' +
      'names ordered from highest to lowest score.',
    starterCode: `import json


def add_score(json_text, name, score):
    pass


def leaderboard(json_text):
    pass
`,
    hints: [
      'scores = json.loads(json_text) if json_text else {}',
      'scores[name] = max(score, scores.get(name, score)) keeps the higher score.',
      'sorted(scores, key=scores.get, reverse=True) orders names by their score.',
    ],
    solution: `import json


def add_score(json_text, name, score):
    scores = json.loads(json_text) if json_text else {}
    scores[name] = max(score, scores.get(name, score))
    return json.dumps(scores, sort_keys=True)


def leaderboard(json_text):
    scores = json.loads(json_text) if json_text else {}
    return sorted(scores, key=scores.get, reverse=True)
`,
    testCode: grader(`
import json
__check__("first score", json.loads(add_score("", "Ama", 50)), {"Ama": 50})
__check__("adds a name", json.loads(add_score('{"Ama": 91}', "Kofi", 78)), {"Ama": 91, "Kofi": 78})
__check__("keeps higher score", json.loads(add_score('{"Ama": 91}', "Ama", 60)), {"Ama": 91})
__check__("raises a lower score", json.loads(add_score('{"Ama": 40}', "Ama", 60)), {"Ama": 60})
__check__("keys sorted in text", add_score('{"Kofi": 1}', "Ama", 2), '{"Ama": 2, "Kofi": 1}')
__check__("leaderboard order", leaderboard('{"Ama": 70, "Kofi": 90, "Esi": 80}'), ["Kofi", "Esi", "Ama"])
__check__("empty leaderboard", leaderboard(""), [])
`),
  },
  // ── sef-9 · Classes and objects ─────────────────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-17',
    title: 'Classes: Your First Bank Account',
    difficulty: 'Easy',
    prompt:
      'Write a BankAccount class. BankAccount(owner, balance=0) stores owner and balance. deposit(amount) adds money ' +
      'and raises ValueError if amount is not positive. withdraw(amount) removes money and raises ValueError if ' +
      'amount is not positive or is more than the balance. __repr__ returns text like "BankAccount(\'Ama\', 100)". ' +
      'Two accounts must not share their balances.',
    starterCode: `class BankAccount:
    def __init__(self, owner, balance=0):
        # TODO: store owner and balance on self
        pass

    def deposit(self, amount):
        pass

    def withdraw(self, amount):
        pass

    def __repr__(self):
        pass
`,
    hints: [
      'In __init__: self.owner = owner and self.balance = balance',
      'deposit: if amount <= 0: raise ValueError(...) then self.balance += amount',
      '__repr__: return f"BankAccount({self.owner!r}, {self.balance})" — !r adds the quotes.',
    ],
    solution: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self.balance += amount

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("withdrawal must be positive")
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount

    def __repr__(self):
        return f"BankAccount({self.owner!r}, {self.balance})"
`,
    testCode: grader(`
a = BankAccount("Ama", 100)
b = BankAccount("Kofi")
__check__("owner stored", a.owner, "Ama")
__check__("default balance", b.balance, 0)
a.deposit(50)
a.withdraw(30)
__check__("deposit then withdraw", a.balance, 120)
__check__("accounts are separate", b.balance, 0)
__raises__("negative deposit", lambda: a.deposit(-5), ValueError)
__raises__("overdraw", lambda: a.withdraw(1000), ValueError)
__raises__("zero withdrawal", lambda: a.withdraw(0), ValueError)
__check__("balance unchanged by errors", a.balance, 120)
__check__("repr", repr(a), "BankAccount('Ama', 120)")
`),
  },
  {
    ...base,
    id: 'se-fnd-18',
    title: 'Classes: A To-Do List Object',
    difficulty: 'Medium',
    prompt:
      'Write a TodoList class. TodoList() starts empty. add(task) stores a task (strip spaces first) and raises ' +
      'ValueError for blank text or a task that is already on the list. complete(task) marks it done and raises ' +
      'KeyError if the task does not exist. pending() returns a list of tasks not yet done, in the order they were ' +
      'added. done_count() returns how many tasks are done. Each TodoList must have its own tasks.',
    starterCode: `class TodoList:
    def __init__(self):
        pass

    def add(self, task):
        pass

    def complete(self, task):
        pass

    def pending(self):
        pass

    def done_count(self):
        pass
`,
    hints: [
      'A dictionary works well: self.tasks = {} mapping each task to True (done) or False (not done). Dictionaries keep insertion order.',
      'add: task = task.strip(); if not task or task in self.tasks: raise ValueError(...)',
      'pending: return [t for t, done in self.tasks.items() if not done]',
    ],
    solution: `class TodoList:
    def __init__(self):
        self.tasks = {}

    def add(self, task):
        task = task.strip()
        if not task:
            raise ValueError("task cannot be blank")
        if task in self.tasks:
            raise ValueError(f"{task!r} is already on the list")
        self.tasks[task] = False

    def complete(self, task):
        if task not in self.tasks:
            raise KeyError(task)
        self.tasks[task] = True

    def pending(self):
        return [t for t, done in self.tasks.items() if not done]

    def done_count(self):
        return sum(1 for done in self.tasks.values() if done)
`,
    testCode: grader(`
todo = TodoList()
todo.add("buy milk")
todo.add("  call Ama ")
todo.add("read")
todo.complete("call Ama")
__check__("pending keeps order", todo.pending(), ["buy milk", "read"])
__check__("done count", todo.done_count(), 1)
__raises__("blank task", lambda: todo.add("   "), ValueError)
__raises__("duplicate task", lambda: todo.add("read"), ValueError)
__raises__("complete unknown", lambda: todo.complete("swim"), KeyError)
other = TodoList()
__check__("lists are separate", other.pending(), [])
`),
  },
  // ── sef-10 · Encapsulation and properties ───────────────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-19',
    title: 'Encapsulation: A Thermostat That Stays Valid',
    difficulty: 'Medium',
    prompt:
      'Write a Thermostat class whose temperature can never be set below absolute zero (-273.15 °C). ' +
      'Thermostat(celsius) creates it. celsius is a property with a setter that raises ValueError for values below ' +
      '-273.15 — including in the constructor. fahrenheit is a read-only property computed from celsius ' +
      '(F = C × 9 / 5 + 32), so assigning to it raises AttributeError. Store the real value in self._celsius.',
    starterCode: `class Thermostat:
    def __init__(self, celsius):
        pass

    # TODO: a celsius property with a validating setter, and a read-only fahrenheit property
`,
    hints: [
      'In __init__ write self.celsius = celsius so the setter validates the first value too.',
      '@property def celsius(self): return self._celsius — then @celsius.setter def celsius(self, value): ...',
      '@property def fahrenheit(self): return self._celsius * 9 / 5 + 32 (no setter means read-only).',
    ],
    solution: `class Thermostat:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self._celsius * 9 / 5 + 32
`,
    testCode: grader(`
t = Thermostat(25)
__check__("celsius", t.celsius, 25)
__check__("fahrenheit", t.fahrenheit, 77.0)
t.celsius = 100
__check__("fahrenheit follows changes", t.fahrenheit, 212.0)
__raises__("setter rejects too cold", lambda: setattr(t, "celsius", -300), ValueError)
__check__("value unchanged after bad set", t.celsius, 100)
__raises__("constructor validates too", lambda: Thermostat(-500), ValueError)
__raises__("fahrenheit is read-only", lambda: setattr(t, "fahrenheit", 50), AttributeError)
__check__("absolute zero allowed", Thermostat(-273.15).celsius, -273.15)
`),
  },
  {
    ...base,
    id: 'se-fnd-20',
    title: 'Encapsulation: A Rectangle That Cannot Go Wrong',
    difficulty: 'Medium',
    prompt:
      'Write a Rectangle class with width and height properties whose setters raise ValueError unless the value is ' +
      'greater than 0 (the constructor must use them too). area and perimeter are read-only properties computed from ' +
      'the current width and height, so they are never out of date. Add a class attribute count that tracks how many ' +
      'Rectangle objects have been created successfully.',
    starterCode: `class Rectangle:
    count = 0

    def __init__(self, width, height):
        pass
`,
    hints: [
      'Validate first, then count: assign self.width and self.height, then Rectangle.count += 1 — a failed constructor never reaches the count.',
      'Each setter: if value <= 0: raise ValueError(...); self._width = value',
      'area: return self._width * self._height; perimeter: return 2 * (self._width + self._height)',
    ],
    solution: `class Rectangle:
    count = 0

    def __init__(self, width, height):
        self.width = width
        self.height = height
        Rectangle.count += 1

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        if value <= 0:
            raise ValueError("width must be positive")
        self._width = value

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        if value <= 0:
            raise ValueError("height must be positive")
        self._height = value

    @property
    def area(self):
        return self._width * self._height

    @property
    def perimeter(self):
        return 2 * (self._width + self._height)
`,
    testCode: grader(`
start = Rectangle.count
r = Rectangle(3, 4)
__check__("area", r.area, 12)
__check__("perimeter", r.perimeter, 14)
r.width = 10
__check__("area follows width", r.area, 40)
__raises__("zero width", lambda: setattr(r, "width", 0), ValueError)
__raises__("negative height in constructor", lambda: Rectangle(2, -1), ValueError)
__raises__("area is read-only", lambda: setattr(r, "area", 5), AttributeError)
Rectangle(1, 1)
__check__("count only valid rectangles", Rectangle.count - start, 2)
`),
  },
  // ── sef-11 · Inheritance, composition, polymorphism ────────────────────────────────────────
  {
    ...base,
    id: 'se-fnd-21',
    title: 'Inheritance: A Family of Shapes',
    difficulty: 'Medium',
    prompt:
      'Write a base class Shape with an area() method that raises NotImplementedError and a describe() method that ' +
      'returns text like "Rectangle with area 6.00" (the class name, then the area with 2 decimal places). Write ' +
      'Circle(radius) and Rectangle(width, height) subclasses that override area(), and Square(side) as a subclass ' +
      'of Rectangle that calls super().__init__(side, side). Finally write total_area(shapes) that adds up the area ' +
      'of any list of shapes — it should not need to know which kinds of shape are in the list.',
    starterCode: `import math


class Shape:
    def area(self):
        raise NotImplementedError("each shape must define area()")

    def describe(self):
        pass


class Circle(Shape):
    pass


class Rectangle(Shape):
    pass


class Square(Rectangle):
    pass


def total_area(shapes):
    pass
`,
    hints: [
      'type(self).__name__ gives the name of the object\'s class, e.g. "Circle".',
      'describe: return f"{type(self).__name__} with area {self.area():.2f}"',
      'Square: def __init__(self, side): super().__init__(side, side) — Rectangle\'s area() is inherited.',
    ],
    solution: `import math


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
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height


class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)


def total_area(shapes):
    return sum(shape.area() for shape in shapes)
`,
    testCode: grader(`
__check__("rectangle area", Rectangle(2, 3).area(), 6)
__check__("circle area", round(Circle(1).area(), 4), 3.1416)
__check__("square area", Square(4).area(), 16)
__check__("square is a rectangle", isinstance(Square(2), Rectangle), True)
__check__("describe rectangle", Rectangle(2, 3).describe(), "Rectangle with area 6.00")
__check__("describe square uses its own name", Square(2).describe(), "Square with area 4.00")
__check__("total area", round(total_area([Rectangle(2, 3), Square(2), Circle(1)]), 2), 13.14)
__check__("total of nothing", total_area([]), 0)
__raises__("base shape has no area", lambda: Shape().area(), NotImplementedError)
`),
  },
  {
    ...base,
    id: 'se-fnd-22',
    title: 'Composition: A Library Made of Books',
    difficulty: 'Medium',
    prompt:
      'Use composition — a Library HAS Books, it is not a kind of Book. Write Book(title, author) with an on_loan ' +
      'attribute (starting False), lend() which raises ValueError if already on loan, and give_back(). Write ' +
      'Library() with add(book), lend(title) and give_back(title), which find the Book by title and ask it to do the ' +
      'work (raise KeyError for an unknown title), available() returning the sorted titles not on loan, and ' +
      '__len__ so len(library) is the number of books. Also give Book an __eq__ so two books with the same title and ' +
      'author compare equal.',
    starterCode: `class Book:
    def __init__(self, title, author):
        pass


class Library:
    def __init__(self):
        pass
`,
    hints: [
      'Library can keep a dictionary: self._books = {} mapping title -> Book.',
      'Library.lend(title): if title not in self._books: raise KeyError(title); then self._books[title].lend()',
      'Book.__eq__: return isinstance(other, Book) and (self.title, self.author) == (other.title, other.author)',
    ],
    solution: `class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author
        self.on_loan = False

    def lend(self):
        if self.on_loan:
            raise ValueError(f"{self.title} is already on loan")
        self.on_loan = True

    def give_back(self):
        self.on_loan = False

    def __eq__(self, other):
        return isinstance(other, Book) and (self.title, self.author) == (other.title, other.author)


class Library:
    def __init__(self):
        self._books = {}

    def add(self, book):
        self._books[book.title] = book

    def _find(self, title):
        if title not in self._books:
            raise KeyError(title)
        return self._books[title]

    def lend(self, title):
        self._find(title).lend()

    def give_back(self, title):
        self._find(title).give_back()

    def available(self):
        return sorted(t for t, b in self._books.items() if not b.on_loan)

    def __len__(self):
        return len(self._books)
`,
    testCode: grader(`
lib = Library()
lib.add(Book("Things Fall Apart", "Chinua Achebe"))
lib.add(Book("Americanah", "Chimamanda Ngozi Adichie"))
lib.add(Book("Ghana Must Go", "Taiye Selasi"))
__check__("len", len(lib), 3)
lib.lend("Americanah")
__check__("available excludes lent", lib.available(), ["Ghana Must Go", "Things Fall Apart"])
__raises__("cannot lend twice", lambda: lib.lend("Americanah"), ValueError)
__raises__("unknown title", lambda: lib.lend("Unknown"), KeyError)
lib.give_back("Americanah")
__check__("returned book available", "Americanah" in lib.available(), True)
__check__("book equality", Book("A", "B") == Book("A", "B"), True)
__check__("different books", Book("A", "B") == Book("A", "C"), False)
b = Book("X", "Y")
b.lend()
__check__("book tracks its own loan", b.on_loan, True)
`),
  },
];
