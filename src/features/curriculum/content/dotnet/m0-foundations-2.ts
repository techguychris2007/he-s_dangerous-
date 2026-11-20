import type { CurriculumLesson } from '../curriculumDefinition';
import { DN_SOURCES as S } from './sources';

/** Preparation stage, part 2 — methods, collections, classes, exceptions, and persistence with Git.
 *  Ends at the level the six-month programme assumes on day one: able to build a small application
 *  independently. The stage's checkpoint is the Console Library System build project. */
export const DN_FOUNDATIONS_2: CurriculumLesson[] = [
  {
    id: 'dn0-6',
    slug: 'methods',
    title: 'Methods: Naming, Reusing and Testing Small Pieces of Logic',
    summary: 'Write methods with parameters and return values, use overloads, optional, named and out parameters, and understand scope and static.',
    minutes: 40,
    prerequisite: 'Lesson: Repeating Work with Loops.',
    outcomes: [
      'Declare methods with parameters and a return type, and call them with arguments.',
      'Explain local scope and why a method should depend only on its parameters where possible.',
      'Use overloads, optional and named parameters, and out parameters (the TryParse pattern).',
      'Split a long block of code into well-named methods that each do one thing.',
    ],
    introduction:
      'As programs grow, writing everything in one long list of statements becomes unmanageable: the same logic is copied in several places, and nobody can see what a block of twenty lines is for. Methods solve both problems. A method gives a piece of logic a name, takes its inputs as parameters, and hands back a result. Good method names make code read like a description of what it does, and a method that depends only on its inputs can be tested on its own — which is exactly how every task in this course is graded.',
    keyTerms: [
      { term: 'Method', meaning: 'A named block of code that can take inputs (parameters) and return a result.' },
      { term: 'Parameter / argument', meaning: 'A parameter is the input a method declares; an argument is the value passed in a call.' },
      { term: 'Return type', meaning: 'The type of value a method gives back; void means it gives back nothing.' },
      { term: 'Scope', meaning: 'Where a name can be used. A variable declared inside a method exists only inside it.' },
      { term: 'Overload', meaning: 'Two methods with the same name but different parameter lists.' },
      { term: 'out parameter', meaning: 'A parameter the method must assign, used to return an extra value (as in TryParse).' },
      { term: 'Pure method', meaning: 'A method whose result depends only on its inputs and which changes nothing else.' },
    ],
    sections: [
      {
        title: 'Declaring and calling a method',
        paragraphs: [
          'A method declaration states who may call it (public, private), whether it belongs to the type itself (static), its return type, its name in PascalCase, and its parameters in brackets. The body ends by returning a value of the declared type. A method whose return type is void performs an action and returns nothing.',
          'When you call the method, the arguments are matched to parameters by position. The method runs, and the call expression becomes the returned value — so a call can be used anywhere a value of that type can.',
        ],
        code: `static class Pricing
{
    public static decimal ApplyDiscount(decimal price, decimal percent)
    {
        decimal discount = price * percent / 100m;
        return price - discount;
    }

    public static void PrintReceipt(string item, decimal price)   // void: no result
    {
        Console.WriteLine($"{item,-12}{price,8:N2}");
    }
}

decimal final = Pricing.ApplyDiscount(200m, 15m);   // 170.00
Pricing.PrintReceipt("Headphones", final);`,
        label: 'A method that returns a value and one that does not',
      },
      {
        title: 'Expression-bodied methods and early return',
        paragraphs: [
          'When a method is a single expression, => replaces the braces and the return keyword. Use it for short calculations and conversions; use a normal body as soon as you need more than one statement.',
          'A method can return from several places. Returning early for special cases (the guard clauses you met with if statements) keeps the main logic flat.',
        ],
        code: `static double CelsiusToFahrenheit(double c) => c * 9 / 5 + 32;

static bool IsPrime(int n)
{
    if (n < 2) return false;                 // guard: 0, 1 and negatives
    for (int d = 2; d * d <= n; d++)         // only need divisors up to √n
        if (n % d == 0) return false;        // found a divisor: stop early
    return true;
}

Console.WriteLine(CelsiusToFahrenheit(100));  // 212
Console.WriteLine(IsPrime(97));               // True`,
        label: 'Short methods and early exits',
      },
      {
        title: 'Scope: what a method can see',
        paragraphs: [
          'Parameters and variables declared inside a method are local: they are created when the method is called and disappear when it returns. Two methods can both have a variable called total without any conflict. A variable declared inside a loop or if block exists only inside that block.',
          'The most reliable methods use only their parameters and return a result, changing nothing else. Such a method behaves the same every time it is given the same inputs, which makes it easy to understand, reuse and test. Methods that change shared state or print output are sometimes necessary — but keep the calculation separate from the printing so the calculation can be tested.',
        ],
        code: `// Hard to test: computes AND prints
static void ShowAverageBad(int[] marks)
{
    int sum = 0;
    foreach (int m in marks) sum += m;
    Console.WriteLine(sum / marks.Length);   // integer division bug hidden in output
}

// Easy to test: computes only; the caller decides what to do with the result
static double Average(int[] marks)
{
    if (marks.Length == 0) throw new ArgumentException("No marks given.", nameof(marks));
    int sum = 0;
    foreach (int m in marks) sum += m;
    return (double)sum / marks.Length;
}

Console.WriteLine(Average([70, 85, 90]).ToString("0.00"));   // 81.67`,
        label: 'Separate calculation from output',
      },
      {
        title: 'Overloads, optional and named parameters',
        paragraphs: [
          'Overloads let one method name accept different inputs: Math.Max has versions for int, double, decimal and more. The compiler picks the overload whose parameters match the arguments.',
          'An optional parameter has a default value and may be left out. Named arguments let a caller write the parameter name, which makes calls with several values of the same type readable: CreateUser(name: "Esi", isAdmin: false) is far clearer than CreateUser("Esi", false).',
        ],
        code: `static string Format(decimal amount, string currency = "GHS", int decimals = 2)
    => $"{currency} {amount.ToString("N" + decimals)}";

Console.WriteLine(Format(1500m));                    // GHS 1,500.00
Console.WriteLine(Format(1500m, "USD"));             // USD 1,500.00
Console.WriteLine(Format(1500m, decimals: 0));       // GHS 1,500  (skip currency by name)

static int Area(int side) => side * side;            // overload 1
static int Area(int width, int height) => width * height;  // overload 2
Console.WriteLine(Area(4));      // 16
Console.WriteLine(Area(4, 5));   // 20`,
        label: 'One name, several useful shapes',
      },
      {
        title: 'Returning more than one value: out and tuples',
        paragraphs: [
          'int.TryParse returns a bool saying whether it succeeded, and passes the parsed number back through an out parameter. You can write methods in the same style: the method must assign every out parameter before returning. This "Try" pattern is the standard C# way of saying "this may fail, and failing is normal".',
          'When a method naturally produces two or three related values, a tuple is often clearer: return (min, max); and the caller can deconstruct it into separate variables.',
        ],
        code: `static bool TryParseScore(string text, out int score)
{
    if (int.TryParse(text, out score) && score >= 0 && score <= 100) return true;
    score = 0;
    return false;
}

if (TryParseScore("87", out int s)) Console.WriteLine($"Valid: {s}");
if (!TryParseScore("140", out _))   Console.WriteLine("Out of range");  // _ discards

static (int Min, int Max) Range(int[] values)
{
    int min = values[0], max = values[0];
    foreach (int v in values) { if (v < min) min = v; if (v > max) max = v; }
    return (min, max);
}

var (low, high) = Range([4, 9, 1, 7]);
Console.WriteLine($"{low}..{high}");   // 1..9`,
        label: 'The Try pattern and tuples',
      },
      {
        title: 'Decomposing a problem into methods',
        paragraphs: [
          'A useful rule: if you need a comment to explain what a block of code does, that block probably wants to be a method whose name is the comment. Decomposition turns one long procedure into a short sequence of named steps, each small enough to get right and test on its own. You will see this again as the Single Responsibility Principle in Month 1.',
        ],
        code: `// Before: one long block with comments explaining each part.
// After: the top-level method reads like the comments did.
static string ReportCard(string name, int[] marks)
{
    double average = Average(marks);
    string grade = GradeFor(average);
    return $"{name}: {average:0.0} ({grade})";
}

static string GradeFor(double average) => average switch
{
    >= 80 => "A",
    >= 70 => "B",
    >= 60 => "C",
    _ => "F",
};`,
        label: 'Name the steps',
      },
    ],
    table: {
      headers: ['Feature', 'Syntax', 'Use it for'],
      rows: [
        ['Return a value', 'static int Square(int x) => x * x;', 'Calculations'],
        ['No result', 'static void Print(...)', 'Actions such as output'],
        ['Optional parameter', 'int decimals = 2', 'Sensible defaults'],
        ['Named argument', 'Format(x, decimals: 0)', 'Readable calls, skipping optionals'],
        ['out parameter', 'bool TryX(string s, out int v)', 'Operations that may fail normally'],
        ['Tuple return', '(int Min, int Max) Range(...)', 'Two or three related results'],
      ],
    },
    exercise: {
      scenario: 'A 60-line Main method reads marks, computes an average with a loop, picks a letter grade with if statements, and prints a formatted report. A bug report says one class\'s average is wrong.',
      task: 'Describe how you would restructure it so the bug can be found and fixed with confidence.',
      answer: 'Extract pure methods: Average(int[] marks) returning double, GradeFor(double average) returning string, and a Format/report method. Main then only reads input, calls them and prints. Each method can now be called with known inputs — including edge cases such as an empty array or a boundary mark of exactly 70 — to locate the bug. The likely culprit for a wrong average is integer division, which is easy to see once Average stands alone.',
      evidence: 'Separates calculation from input/output and proposes testing each method with edge-case inputs.',
    },
    misconceptions: [
      'Variables from Main are visible in every method. Each method sees only its own locals and parameters.',
      'Printing a result is the same as returning it. Printed values cannot be used by other code or by tests.',
      'Optional parameters must all be given in order. Named arguments let you skip any of them.',
      'Every method needs a comment. A good name usually says it better.',
    ],
    sources: [S.methods, S.parameters, S.yellowBook],
    labs: [],
    questions: [
      { prompt: 'Which return type means a method returns nothing?', answer: 'void' },
      { prompt: 'Which parameter modifier does TryParse use to hand back the parsed value?', answer: 'out' },
    ],
    quiz: [
      { question: 'What is the difference between a parameter and an argument?', options: ['None', 'A parameter is declared by the method; an argument is passed in a call', 'Arguments are optional', 'Parameters are always strings'], answer: 1, explanation: 'Parameters are the declared inputs; arguments are the actual values supplied.' },
      { question: 'Why separate calculation from Console output?', options: ['It runs faster', 'The calculation can then be reused and tested', 'Console is deprecated', 'C# requires it'], answer: 1, explanation: 'Returned values can be checked; printed text cannot.' },
      { question: 'What must a method do with an out parameter before returning?', options: ['Nothing', 'Assign it', 'Print it', 'Make it null'], answer: 1, explanation: 'The compiler requires every out parameter to be assigned.' },
      { question: 'Area(4) and Area(4, 5) both compile. What is this called?', options: ['Overriding', 'Overloading', 'Inheritance', 'Recursion'], answer: 1, explanation: 'Same name, different parameter lists.' },
    ],
  },
  {
    id: 'dn0-7',
    slug: 'collections-arrays-lists-dictionaries',
    title: 'Collections: Arrays, Lists, Dictionaries and Sets',
    summary: 'Store many values in arrays and List<T>, look things up by key in Dictionary<TKey,TValue>, keep unique values in HashSet<T>, and take your first steps with LINQ.',
    minutes: 45,
    prerequisite: 'Lesson: Methods.',
    outcomes: [
      'Choose between an array, List<T>, Dictionary<TKey,TValue> and HashSet<T> for a task.',
      'Add, find, update and remove items, handling missing keys safely with TryGetValue.',
      'Explain what a generic type parameter such as the T in List<T> means.',
      'Use basic LINQ (Where, Select, Count, Sum, OrderBy, Any) and know what it replaces.',
    ],
    introduction:
      'Real programs rarely deal with one value at a time. A library has thousands of books; a shop has a cart of items; a school has a dictionary of students by ID. C# provides collection types for each shape of data, and choosing the right one is one of the most important small decisions you make, because it decides how simple — and how fast — the rest of your code can be. This lesson covers the four collections you will use constantly and introduces LINQ, the query syntax that turns many of the loops you wrote last lesson into a single readable line.',
    keyTerms: [
      { term: 'Array', meaning: 'A fixed-size sequence of values of one type, indexed from 0: int[].' },
      { term: 'List<T>', meaning: 'A growable sequence of values of type T, with Add, Remove and Insert.' },
      { term: 'Generic', meaning: 'A type that takes another type as a parameter: List<string> is a list of strings.' },
      { term: 'Dictionary<TKey,TValue>', meaning: 'A collection of key/value pairs with fast lookup by key.' },
      { term: 'HashSet<T>', meaning: 'An unordered collection of unique values with fast "is it in here?" checks.' },
      { term: 'LINQ', meaning: 'Language Integrated Query: methods such as Where and Select for querying collections.' },
    ],
    sections: [
      {
        title: 'Arrays: fixed size, fast access',
        paragraphs: [
          'An array holds a fixed number of values of one type. You read and write by index. Once created, its length never changes — to "add" an item you must create a new, bigger array. Arrays are ideal when the size is known and fixed, such as the seven days of a week or a grid on a game board.',
          'Collection expressions — values in square brackets — are the modern way to create arrays and lists, available since C# 12.',
        ],
        code: `int[] scores = [72, 88, 95];          // collection expression
string[] days = new string[7];         // 7 slots, each null until assigned
days[0] = "Monday";

Console.WriteLine(scores.Length);       // 3
Console.WriteLine(scores[^1]);          // 95  (last)
Array.Sort(scores);                     // sorts in place
Console.WriteLine(string.Join(", ", scores));`,
        label: 'Creating and using arrays',
      },
      {
        title: 'List<T>: the everyday growable collection',
        paragraphs: [
          'List<T> is what you will use most. The T is a type parameter: List<string> holds strings, List<decimal> holds decimals, and the compiler stops you adding the wrong type. Lists grow and shrink as needed. Count gives the number of items (arrays use Length; lists use Count — a common mix-up).',
          'Remove removes the first matching item and returns whether it found one; RemoveAt removes by position; Contains and IndexOf search. Searching a list checks items one by one, which is fine for hundreds of items and slow for millions — that is when a dictionary or set is the better choice.',
        ],
        code: `List<string> cart = ["bread", "milk"];
cart.Add("eggs");
cart.Insert(0, "rice");          // at the front
bool removed = cart.Remove("milk");

Console.WriteLine(cart.Count);           // 3
Console.WriteLine(cart.Contains("eggs")); // True
Console.WriteLine(string.Join(", ", cart)); // rice, bread, eggs

foreach (string item in cart) Console.WriteLine($"- {item}");`,
        label: 'Adding, inserting, removing and searching',
      },
      {
        title: 'Dictionary<TKey,TValue>: look things up by key',
        paragraphs: [
          'A dictionary maps keys to values, like a phone book maps names to numbers. Looking up a key is fast no matter how many entries there are. Keys must be unique; assigning to an existing key replaces its value.',
          'Reading a key that does not exist with dict[key] throws KeyNotFoundException. When the key might be missing — which is most of the time with real data — use TryGetValue, the same Try pattern you met with TryParse. Counting things is the classic dictionary job: the key is the thing, the value is how many times you have seen it.',
        ],
        code: `var stock = new Dictionary<string, int>
{
    ["bread"] = 12,
    ["milk"] = 0,
};
stock["eggs"] = 30;            // add
stock["bread"] -= 2;           // update

if (stock.TryGetValue("sugar", out int qty))
    Console.WriteLine($"sugar: {qty}");
else
    Console.WriteLine("sugar is not stocked");   // printed, no crash

// Counting words
var counts = new Dictionary<string, int>();
foreach (string w in "the cat and the hat".Split(' '))
    counts[w] = counts.GetValueOrDefault(w) + 1;
Console.WriteLine(counts["the"]);   // 2`,
        label: 'Lookup, update, safe access and counting',
      },
      {
        title: 'HashSet<T>: uniqueness and membership',
        paragraphs: [
          'A HashSet stores each value at most once and answers "is this value present?" almost instantly. Add returns false if the value was already there, which makes duplicate detection a one-liner. Sets also support set operations such as UnionWith and IntersectWith — "students in both clubs" is an intersection.',
          'Sets are unordered: do not rely on the order you get items back. If you need unique values in their original order, combine a set (to remember what you have seen) with a list (to keep the order).',
        ],
        code: `var seen = new HashSet<string>();
var uniqueInOrder = new List<string>();
foreach (string email in new[] { "a@x.com", "b@x.com", "a@x.com" })
{
    if (seen.Add(email))           // false when it was already present
        uniqueInOrder.Add(email);
}
Console.WriteLine(string.Join(", ", uniqueInOrder));   // a@x.com, b@x.com

var chess = new HashSet<string> { "Ama", "Kofi", "Esi" };
var drama = new HashSet<string> { "Esi", "Yaw" };
chess.IntersectWith(drama);
Console.WriteLine(string.Join(", ", chess));   // Esi`,
        label: 'Duplicates and set operations',
      },
      {
        title: 'First steps with LINQ',
        paragraphs: [
          'LINQ adds query methods to every collection. Where keeps items matching a condition, Select transforms each item, OrderBy sorts, and Count, Sum, Average, Min, Max, Any and First summarise. The conditions are written as lambdas: x => x > 50 reads "given x, is x greater than 50?". Each LINQ call replaces one of the accumulator loops you wrote by hand.',
          'Two cautions. First and Max throw on an empty collection; FirstOrDefault returns a default instead. And a LINQ query is not run until you ask for results — calling ToList() runs it and stores the results. Month 1 covers LINQ in depth, including why that deferred execution matters.',
        ],
        code: `List<int> marks = [45, 72, 88, 59, 91];

var passed = marks.Where(m => m >= 60).ToList();       // [72, 88, 91]
var curved = marks.Select(m => Math.Min(m + 5, 100));   // add 5, cap at 100
int countHigh = marks.Count(m => m >= 80);              // 2
double avg = marks.Average();                           // 71
bool anyFail = marks.Any(m => m < 50);                  // True
var top3 = marks.OrderByDescending(m => m).Take(3);     // 91, 88, 72

Console.WriteLine(string.Join(", ", top3));`,
        label: 'Loops you no longer have to write',
      },
    ],
    table: {
      headers: ['Collection', 'Best for', 'Watch out for'],
      rows: [
        ['T[] (array)', 'Fixed-size data, grids, performance-critical code', 'Cannot grow; Length not Count'],
        ['List<T>', 'An ordered, growing sequence', 'Contains/Remove search item by item'],
        ['Dictionary<K,V>', 'Fast lookup by a unique key; counting', 'dict[missingKey] throws — use TryGetValue'],
        ['HashSet<T>', 'Uniqueness and fast membership checks', 'No order; no duplicates'],
        ['LINQ', 'Filtering, transforming, summarising', 'First/Max throw on empty input'],
      ],
    },
    exercise: {
      scenario: 'A library app stores books in a List<Book> and finds a book by ISBN with a foreach loop on every request. With 200,000 books it has become slow, and duplicate ISBNs have crept in.',
      task: 'Propose a better data structure and explain how it fixes both problems.',
      answer: 'Store books in a Dictionary<string, Book> keyed by ISBN. Lookup by key is fast regardless of size instead of scanning every book, and keys are unique, so adding a second book with the same ISBN can be detected (TryAdd returns false) and rejected instead of silently duplicating. Keep a List only if a specific order must be preserved.',
      evidence: 'Chooses a dictionary keyed by ISBN and connects it to both lookup speed and uniqueness.',
    },
    misconceptions: [
      'Arrays can grow with Add. Arrays have fixed length; use List<T>.',
      'dict[key] returns null when the key is missing. It throws KeyNotFoundException; use TryGetValue.',
      'A HashSet keeps insertion order. Order is not guaranteed.',
      'LINQ runs as soon as you write the query. It runs when results are enumerated, for example by ToList().',
    ],
    sources: [S.collections, S.collectionExpressions, S.linq, S.nakov],
    labs: [],
    questions: [
      { prompt: 'Which Dictionary method reads a key safely, returning false if it is missing?', answer: 'TryGetValue' },
      { prompt: 'Which property gives the number of items in a List<T>?', answer: 'Count' },
    ],
    quiz: [
      { question: 'Which collection gives fast lookup by a unique key?', options: ['int[]', 'List<T>', 'Dictionary<TKey,TValue>', 'string'], answer: 2, explanation: 'Dictionaries are built for key lookup.' },
      { question: 'What does set.Add(x) return when x is already in the HashSet?', options: ['true', 'false', 'It throws', 'null'], answer: 1, explanation: 'Add reports whether the value was newly added.' },
      { question: 'What does marks.Where(m => m >= 60) produce?', options: ['The count of passes', 'The marks that are 60 or more', 'True or false', 'The highest mark'], answer: 1, explanation: 'Where filters items by the condition.' },
      { question: 'What is the T in List<T>?', options: ['A variable', 'A type parameter', 'A method', 'A keyword for text'], answer: 1, explanation: 'Generics take a type as a parameter.' },
    ],
  },
  {
    id: 'dn0-8',
    slug: 'classes-and-objects',
    title: 'Classes and Objects: Modelling the Real World',
    summary: 'Define classes with fields, properties, constructors and methods; protect invariants with encapsulation; use records for data and handle null safely.',
    minutes: 50,
    prerequisite: 'Lesson: Collections.',
    outcomes: [
      'Define a class with private fields, properties, a constructor and methods, and create objects from it.',
      'Use encapsulation to keep an object\'s data valid at all times (its invariants).',
      'Explain reference semantics: two variables can refer to the same object.',
      'Choose between a class and a record, and use nullable reference types to handle missing values.',
    ],
    introduction:
      'So far your programs have been data in variables and logic in methods, kept apart. Object-oriented programming puts them together: a class describes a kind of thing — a bank account, a book, an order — by the data it holds and the operations it supports. Each object created from the class is one specific account or book. The real power is not grouping, though; it is protection. A well-designed class makes it impossible to put an object into an invalid state, so the rest of the program can trust it. That idea, encapsulation, is the foundation of the Library Management Engine you will build in Week 1.',
    keyTerms: [
      { term: 'Class', meaning: 'A blueprint describing the data and behaviour of a kind of object.' },
      { term: 'Object / instance', meaning: 'One specific thing created from a class with new.' },
      { term: 'Field', meaning: 'A variable that belongs to an object, usually private.' },
      { term: 'Property', meaning: 'A member that looks like a field to callers but runs code to get or set the value.' },
      { term: 'Constructor', meaning: 'A special method that runs when an object is created and sets up a valid initial state.' },
      { term: 'Encapsulation', meaning: 'Hiding an object\'s data and allowing changes only through methods that keep it valid.' },
      { term: 'Invariant', meaning: 'A rule that must always be true for an object, such as "balance is never negative".' },
      { term: 'Record', meaning: 'A type designed for data, compared by value and usually immutable.' },
    ],
    sections: [
      {
        title: 'A first class',
        paragraphs: [
          'A class groups fields (data), a constructor (setup), properties (controlled access) and methods (behaviour). new BankAccount("Ama", 100m) calls the constructor and gives you a new object; each object has its own copy of the fields. Inside the class, this refers to the current object.',
          'Naming conventions: classes, methods and properties use PascalCase; private fields usually start with an underscore, such as _balance.',
        ],
        code: `public class BankAccount
{
    private decimal _balance;                 // field: hidden data

    public string Owner { get; }              // read-only property, set once

    public BankAccount(string owner, decimal openingBalance)  // constructor
    {
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Owner is required.", nameof(owner));
        if (openingBalance < 0) throw new ArgumentOutOfRangeException(nameof(openingBalance));
        Owner = owner;
        _balance = openingBalance;
    }

    public decimal Balance => _balance;       // callers can read, not write

    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Deposit must be positive.");
        _balance += amount;
    }
}

var account = new BankAccount("Ama", 100m);
account.Deposit(50m);
Console.WriteLine($"{account.Owner}: {account.Balance}");   // Ama: 150
// account.Balance = 1_000_000m;   // error: Balance is read-only`,
        label: 'Fields, properties, a constructor and a method',
      },
      {
        title: 'Encapsulation protects invariants',
        paragraphs: [
          'If _balance were a public field, any code anywhere could set it to -500, and every method that assumes a non-negative balance would silently be wrong. By making the data private and changing it only through Deposit and Withdraw, the class checks every change. The invariant "balance is never negative" then holds for every BankAccount that will ever exist, and nobody else has to check it.',
          'This is what professional object-oriented design is mostly about: deciding which rules an object guarantees and making the wrong thing impossible rather than merely discouraged.',
        ],
        code: `public bool TryWithdraw(decimal amount)
{
    if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));
    if (amount > _balance) return false;   // refuse: invariant would break
    _balance -= amount;
    return true;
}`,
        label: 'The only door to the data checks every visitor',
      },
      {
        title: 'Properties in depth',
        paragraphs: [
          'An auto-property such as public string Title { get; set; } creates a hidden field for you. Use { get; } for values fixed at construction, { get; private set; } for values only the class may change, and { get; init; } for values set once with object-initializer syntax.',
          'When a property needs validation, write the setter yourself. C# 14\'s field keyword refers to the property\'s compiler-generated backing field, so you no longer have to declare one by hand just to add a check.',
        ],
        code: `public class Book
{
    public required string Isbn { get; init; }   // must be set at creation, then fixed
    public string Title
    {
        get;
        set => field = string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("Title is required.")
            : value.Trim();
    } = "";
    public int Copies { get; private set; }       // only Book can change this

    public void AddCopies(int n) => Copies += n > 0 ? n : throw new ArgumentOutOfRangeException(nameof(n));
}

var book = new Book { Isbn = "978-0134494166", Title = "  Clean Architecture " };
Console.WriteLine($"[{book.Title}]");   // [Clean Architecture]`,
        label: 'init, required, private set and the field keyword',
      },
      {
        title: 'Objects are references',
        paragraphs: [
          'A class variable does not hold the object itself; it holds a reference — the object\'s address. Assigning one variable to another copies the reference, so both now point at the same object, and a change made through one is visible through the other. This surprises nearly every beginner and causes real bugs when an object is shared unintentionally.',
          'Numbers, bool and other structs behave differently: assigning copies the value. That is why int a = b; then changing a never affects b.',
        ],
        code: `var first = new BankAccount("Kofi", 10m);
var second = first;          // same object, two names
second.Deposit(5m);
Console.WriteLine(first.Balance);   // 15  — first sees the change

int x = 10;
int y = x;                   // a copy of the value
y++;
Console.WriteLine(x);        // 10 — unchanged`,
        label: 'Reference semantics versus value semantics',
      },
      {
        title: 'Records: types for data',
        paragraphs: [
          'Many types exist only to carry data: a point, an address, a line on a receipt. A record declares one in a single line, gives it a readable ToString, and — unlike a class — compares two records by their contents rather than by reference. Records are immutable by default; with creates a modified copy.',
          'Rule of thumb: use a record for values that are defined by their data (two addresses with the same fields are the same address), and a class for entities with identity and behaviour (two accounts with the same balance are still different accounts).',
        ],
        code: `public record Money(decimal Amount, string Currency);

var a = new Money(10m, "GHS");
var b = new Money(10m, "GHS");
Console.WriteLine(a == b);           // True: same contents
Console.WriteLine(a);                // Money { Amount = 10, Currency = GHS }

var c = a with { Amount = 25m };     // copy with one change
Console.WriteLine(c.Amount);         // 25`,
        label: 'Value equality and non-destructive change',
      },
      {
        title: 'null and nullable reference types',
        paragraphs: [
          'A reference can be null, meaning "no object". Using a member of null throws NullReferenceException, historically one of the most common crashes in C#. With nullable reference types enabled (the default for new projects), string means "never null" and string? means "may be null", and the compiler warns when you use a string? without checking it.',
          'Three operators make handling null concise: ?. calls a member only if the object is not null, ?? supplies a fallback, and ??= assigns only if the variable is null.',
        ],
        code: `string? nickname = null;

int length = nickname?.Length ?? 0;          // 0 instead of a crash
string display = nickname ?? "Anonymous";
nickname ??= "Guest";                        // assign only when null

Book? found = FindBook("unknown-isbn");
if (found is not null)
    Console.WriteLine(found.Title);

static Book? FindBook(string isbn) => null;  // "?" tells callers to check`,
        label: 'Saying "may be missing" in the type',
      },
    ],
    table: {
      headers: ['Member', 'Purpose', 'Typical access'],
      rows: [
        ['Field', 'Stores the object\'s data', 'private'],
        ['Property', 'Controlled read/write access to data', 'public get; private set or init'],
        ['Constructor', 'Creates a valid object', 'public'],
        ['Method', 'Behaviour that may change state', 'public, validating inputs'],
        ['record', 'Data compared by value', 'positional: record Point(int X, int Y)'],
      ],
    },
    exercise: {
      scenario: 'A Library class exposes public List<Book> Books { get; set; } and public int AvailableCopies;. Several places in the code add books directly and decrement AvailableCopies when lending; sometimes copies go negative.',
      task: 'Redesign the class\'s public surface so the invariant "available copies is never negative and never more than total copies" cannot be broken.',
      answer: 'Make the data private: a private Dictionary<string, Book> keyed by ISBN and per-book counts, exposed read-only (IReadOnlyCollection<Book> Books => _books.Values). Remove the public setter and public field. Add methods AddBook(Book), bool TryLend(string isbn) and Return(string isbn) that check the counts before changing them and refuse (return false or throw) when lending would go below zero or returning would exceed the total. All changes now pass through code that enforces the invariant.',
      evidence: 'Hides mutable state, exposes a read-only view, and routes every change through validating methods.',
    },
    misconceptions: [
      'Public fields are fine because properties are just extra typing. Properties and methods let the class enforce its rules.',
      'var b = a; copies the object. For classes it copies the reference; both names share one object.',
      'Two records with the same values are different objects so == is false. Records compare by value.',
      'Nullable reference types stop null at runtime. They give compile-time warnings; you must still handle null.',
    ],
    sources: [S.classes, S.properties, S.records, S.nullable, S.csharp14],
    labs: [],
    questions: [
      { prompt: 'Which keyword creates a new object from a class?', answer: 'new' },
      { prompt: 'What is the name for a rule that must always hold for an object, such as balance >= 0?', answer: 'invariant', accept: ['an invariant', 'class invariant'] },
    ],
    quiz: [
      { question: 'Why make a balance field private?', options: ['To make it faster', 'So it can only change through methods that check the rules', 'Because C# requires it', 'To hide it from the debugger'], answer: 1, explanation: 'Encapsulation lets the class enforce its invariants.' },
      { question: 'After var b = a; b.Deposit(5); where a is a class instance, what happens to a?', options: ['Unchanged', 'It shows the deposit too', 'It becomes null', 'Compiler error'], answer: 1, explanation: 'Both variables reference the same object.' },
      { question: 'When is a record a better choice than a class?', options: ['For entities with identity', 'For data compared by value', 'Never', 'Only for numbers'], answer: 1, explanation: 'Records give value equality and immutability.' },
      { question: 'What does name?.Length ?? 0 evaluate to when name is null?', options: ['null', '0', 'An exception', '-1'], answer: 1, explanation: '?. yields null and ?? supplies 0.' },
    ],
  },
  {
    id: 'dn0-9',
    slug: 'exceptions-and-error-handling',
    title: 'Errors and Exceptions: Failing Safely',
    summary: 'Read exception messages and stack traces, catch specific exceptions, throw your own with clear messages, clean up with finally and using, and choose between exceptions and Try methods.',
    minutes: 40,
    prerequisite: 'Lesson: Classes and Objects.',
    outcomes: [
      'Read an unhandled exception\'s type, message and stack trace to find the cause.',
      'Catch specific exceptions where you can genuinely recover, and let others propagate.',
      'Throw the right built-in exception with a helpful message, and define a custom exception.',
      'Release resources reliably with using, and choose between exceptions and the Try pattern.',
    ],
    introduction:
      'Things go wrong in every real program: a file is missing, a user types letters into a number field, a network call times out, a caller passes a negative quantity. C# reports these as exceptions — objects describing what went wrong, which travel up through the calling methods until something handles them, or the program stops with a report. Good error handling is not about catching everything; it is about catching only what you can actually deal with, failing fast and clearly on everything else, and never leaving data half-changed.',
    keyTerms: [
      { term: 'Exception', meaning: 'An object representing an error, thrown when an operation cannot complete.' },
      { term: 'throw', meaning: 'Raises an exception, stopping the current method.' },
      { term: 'try / catch / finally', meaning: 'Run code, handle named exception types, and always run clean-up.' },
      { term: 'Stack trace', meaning: 'The list of method calls that led to the exception, most recent first.' },
      { term: 'using', meaning: 'Guarantees an object\'s Dispose method runs, releasing files and connections.' },
      { term: 'Custom exception', meaning: 'Your own exception class for a domain-specific failure.' },
    ],
    sections: [
      {
        title: 'Reading an unhandled exception',
        paragraphs: [
          'An unhandled exception prints its type, its message and a stack trace. Read the first line for what happened, then the top of the stack trace for where it happened in your code: the first line mentioning one of your own files and line numbers. The lines below show how the program got there.',
          'The type tells you the category of mistake. ArgumentException and its relatives mean a method was given bad input; NullReferenceException means a member of null was used; InvalidOperationException means the object was in the wrong state for that call; FormatException comes from parsing bad text; KeyNotFoundException from a missing dictionary key.',
        ],
        code: `Unhandled exception. System.ArgumentOutOfRangeException: Deposit must be positive. (Parameter 'amount')
Actual value was -50.
   at BankAccount.Deposit(Decimal amount) in /app/BankAccount.cs:line 21
   at Program.<Main>$(String[] args) in /app/Program.cs:line 4

// What: a negative deposit.  Where: BankAccount.cs line 21.  Who called it: Program.cs line 4.`,
        label: 'What, where and who called it',
      },
      {
        title: 'try / catch: handle only what you can fix',
        paragraphs: [
          'Wrap code that may fail in try, and handle a specific exception type in catch. Catch only exceptions you can do something useful about at that point — ask the user again, use a default, report a friendly message. Catching Exception (everything) and carrying on hides bugs you need to see, and can leave your data in a broken state.',
          'Several catch blocks can follow one try, most specific first. A when filter adds a condition to a catch. finally runs whether or not an exception occurred, which makes it the place for clean-up.',
        ],
        code: `static decimal? ReadPrice(string text)
{
    try
    {
        decimal price = decimal.Parse(text);
        if (price < 0) throw new ArgumentOutOfRangeException(nameof(text), "Price cannot be negative.");
        return price;
    }
    catch (FormatException)
    {
        Console.WriteLine($"'{text}' is not a number.");
        return null;
    }
    catch (OverflowException)
    {
        Console.WriteLine("That number is too large.");
        return null;
    }
    // ArgumentOutOfRangeException is NOT caught here: the caller must handle it.
}`,
        label: 'Specific handlers; everything else propagates',
      },
      {
        title: 'Throwing: fail fast with a clear message',
        paragraphs: [
          'When your method is given input it cannot use, throw immediately with a message that says what was wrong. Returning -1, null or an empty value instead lets the mistake travel silently into the rest of the program, where it surfaces later as a confusing failure far from its cause.',
          'Use the built-in types when they fit: ArgumentNullException.ThrowIfNull(x) and ArgumentOutOfRangeException.ThrowIfNegative(n) are concise helpers for the most common checks. Create a custom exception only when callers need to catch your particular failure and handle it differently.',
        ],
        code: `public class InsufficientFundsException(decimal requested, decimal available)
    : Exception($"Requested {requested:N2} but only {available:N2} is available.")
{
    public decimal Requested { get; } = requested;
    public decimal Available { get; } = available;
}

public void Withdraw(decimal amount)
{
    ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);
    if (amount > _balance) throw new InsufficientFundsException(amount, _balance);
    _balance -= amount;
}`,
        label: 'Built-in guards and a custom domain exception',
      },
      {
        title: 'Never leave data half-changed',
        paragraphs: [
          'Exceptions interrupt a method in the middle. If a transfer has already taken money from one account when the deposit to the other fails, money disappears. The fix is ordering: do all the checks that can fail first, and only then make changes that cannot fail. In Month 2 databases give you transactions for the same guarantee across many rows.',
        ],
        code: `public static void Transfer(BankAccount from, BankAccount to, decimal amount)
{
    // 1. Validate everything first — any exception here changes nothing.
    ArgumentNullException.ThrowIfNull(from);
    ArgumentNullException.ThrowIfNull(to);
    if (ReferenceEquals(from, to)) throw new InvalidOperationException("Cannot transfer to the same account.");
    if (amount > from.Balance) throw new InsufficientFundsException(amount, from.Balance);

    // 2. Then change state.
    from.Withdraw(amount);
    to.Deposit(amount);
}`,
        label: 'Check first, then change',
      },
      {
        title: 'Clean-up with using',
        paragraphs: [
          'Files, network connections and database connections must be closed when you are done, even if an exception occurs. Types that hold such resources implement IDisposable, and a using declaration calls their Dispose method automatically at the end of the enclosing block — the same guarantee as finally, with less code.',
        ],
        code: `using var writer = new StreamWriter("log.txt");   // disposed at end of scope
writer.WriteLine("Started");
// ... even if an exception is thrown here, the file is closed properly`,
        label: 'Guaranteed release of resources',
      },
      {
        title: 'Exception or Try method?',
        paragraphs: [
          'Use exceptions for situations that are genuinely exceptional for the caller — a programming mistake, or a failure the caller cannot reasonably expect. Use a Try method returning bool for failures that are routine, such as parsing user input or looking up a key that may be missing. Exceptions are comparatively expensive and make normal control flow hard to follow, so do not use them to signal ordinary outcomes.',
        ],
      },
    ],
    table: {
      headers: ['Exception', 'Meaning', 'Typical fix'],
      rows: [
        ['ArgumentException / ArgumentNullException / ArgumentOutOfRangeException', 'The caller passed bad input', 'Validate before calling; fix the caller'],
        ['NullReferenceException', 'A member of null was used', 'Check for null, or make it impossible'],
        ['InvalidOperationException', 'Object in the wrong state for this call', 'Check state first (e.g. CanX property)'],
        ['FormatException', 'Text could not be parsed', 'Use TryParse for external input'],
        ['KeyNotFoundException', 'Dictionary key missing', 'Use TryGetValue'],
        ['IOException / FileNotFoundException', 'File system problem', 'Catch where you can report or recover'],
      ],
    },
    exercise: {
      scenario: 'A method SaveOrder catches every Exception, logs "error", and returns true so the user sees "Saved!". Customers report orders that were never stored.',
      task: 'Explain what is wrong and how SaveOrder should handle errors instead.',
      answer: 'Catching Exception and returning success hides every failure — validation errors, disk errors, bugs — and lies to the user. SaveOrder should validate inputs up front and throw ArgumentException for bad data; let unexpected exceptions propagate (or catch only specific, recoverable ones such as IOException, and then report failure accurately). Logging should include the exception itself, not just "error". The caller decides what to show the user based on success or the specific exception.',
      evidence: 'Rejects the catch-all, keeps specific catches for recoverable cases, and reports failure honestly.',
    },
    misconceptions: [
      'Catching Exception makes code robust. It hides bugs and can leave data inconsistent.',
      'Returning null or -1 is gentler than throwing. Silent bad values fail later and further from the cause.',
      'finally only runs when there is an exception. It always runs.',
      'Exceptions should be used for normal outcomes like "user not found". Prefer Try methods or return values for expected cases.',
    ],
    sources: [S.exceptions, S.exceptionBestPractices, S.yellowBook],
    labs: [],
    questions: [
      { prompt: 'Which block always runs, whether or not an exception occurred?', answer: 'finally' },
      { prompt: 'Which exception does int.Parse("abc") throw?', answer: 'FormatException' },
    ],
    quiz: [
      { question: 'Which exceptions should you catch?', options: ['All of them', 'Only those you can meaningfully handle at that point', 'None', 'Only NullReferenceException'], answer: 1, explanation: 'Handle what you can recover from; let the rest propagate.' },
      { question: 'What is the best response to a negative quantity passed to AddItem?', options: ['Ignore it', 'Set it to zero', 'Throw ArgumentOutOfRangeException with a message', 'Return -1'], answer: 2, explanation: 'Fail fast with a clear message.' },
      { question: 'What does using var file = ... guarantee?', options: ['The file is read faster', 'Dispose runs at the end of the scope', 'The file exists', 'No exceptions occur'], answer: 1, explanation: 'using ensures resources are released.' },
      { question: 'A transfer withdraws, then the deposit throws. What principle prevents lost money?', options: ['Catch Exception', 'Validate everything before changing state', 'Use more threads', 'Use static methods'], answer: 1, explanation: 'Do failing checks first, then make changes.' },
    ],
  },
  {
    id: 'dn0-10',
    slug: 'files-json-and-git',
    title: 'Saving Data and Tracking Work: Files, JSON and Git',
    summary: 'Read and write text files, save and reload objects as JSON with System.Text.Json, and track your project with Git from the first commit.',
    minutes: 45,
    prerequisite: 'Lesson: Errors and Exceptions.',
    outcomes: [
      'Read and write text files with File and Path, and handle a missing file correctly.',
      'Serialize objects to JSON and deserialize them back with System.Text.Json.',
      'Use Git to initialise a repository, ignore build output, commit, branch and merge.',
      'Write commit messages that explain why a change was made.',
    ],
    introduction:
      'A program that forgets everything when it closes is a toy. Saving data — and loading it again correctly next time — is what turns your console programs into tools people can use. In this lesson you will save data as text and as JSON, the format used by almost every web API you will build later in this course. You will also start using Git, the version control system every engineering team relies on. From here on, every project you build is a Git repository with a history that explains how it got to where it is.',
    keyTerms: [
      { term: 'Path', meaning: 'The location of a file, such as data/books.json. Path.Combine builds paths portably.' },
      { term: 'JSON', meaning: 'JavaScript Object Notation: a text format for structured data with objects, arrays, strings, numbers and booleans.' },
      { term: 'Serialize / deserialize', meaning: 'Convert an object to text (JSON) and back again.' },
      { term: 'Repository', meaning: 'A project folder tracked by Git, including its full history.' },
      { term: 'Commit', meaning: 'A saved snapshot of the project with a message describing the change.' },
      { term: 'Branch', meaning: 'An independent line of work that can later be merged back.' },
      { term: '.gitignore', meaning: 'A file listing paths Git should not track, such as bin/ and obj/.' },
    ],
    sections: [
      {
        title: 'Reading and writing text files',
        paragraphs: [
          'The static File class covers the common cases. File.WriteAllText replaces a file\'s contents; File.AppendAllText adds to the end; File.ReadAllText returns the whole file as a string; File.ReadAllLines returns an array of lines. Build paths with Path.Combine rather than gluing strings with / or \\, so the code works on every operating system.',
          'A missing file is not exceptional for a program that saves data: it is simply the first run. Check File.Exists and start with empty data, rather than letting FileNotFoundException crash the program.',
        ],
        code: `string folder = "data";
Directory.CreateDirectory(folder);                 // no error if it already exists
string path = Path.Combine(folder, "notes.txt");

File.WriteAllText(path, "First line\\n");
File.AppendAllText(path, "Second line\\n");

foreach (string line in File.ReadAllLines(path))
    Console.WriteLine($"> {line}");

string settingsPath = Path.Combine(folder, "settings.txt");
string settings = File.Exists(settingsPath) ? File.ReadAllText(settingsPath) : "theme=light";`,
        label: 'Text files and a safe first run',
      },
      {
        title: 'JSON: saving objects',
        paragraphs: [
          'Writing your own text format means writing your own parser, with all its edge cases — what if a title contains a comma? JSON solves that: JsonSerializer.Serialize turns an object (including lists and nested objects) into JSON text, and JsonSerializer.Deserialize<T> turns it back. Public properties are included by default.',
          'Deserialize returns null if the JSON is the literal null, so its result type is nullable — handle that with ?? and an empty default. Invalid JSON throws JsonException, which is worth catching when loading a file a user might have edited.',
        ],
        code: `using System.Text.Json;

var books = new List<Book> { new("978-1", "Clean Code", 2), new("978-2", "Refactoring", 1) };
var options = new JsonSerializerOptions { WriteIndented = true };

string json = JsonSerializer.Serialize(books, options);
File.WriteAllText("books.json", json);
// [
//   { "Isbn": "978-1", "Title": "Clean Code", "Copies": 2 },
//   ...

List<Book> loaded = JsonSerializer.Deserialize<List<Book>>(File.ReadAllText("books.json")) ?? [];
Console.WriteLine(loaded.Count);              // 2
Console.WriteLine(loaded[0] == books[0]);     // True: records compare by value

public record Book(string Isbn, string Title, int Copies);   // types go after top-level code`,
        label: 'Round-tripping a list of records',
      },
      {
        title: 'Saving safely',
        paragraphs: [
          'If the program crashes halfway through writing a file, the file is left corrupt and the data is lost. A simple, robust technique is to write to a temporary file first, then replace the real file in one step with File.Move(temp, path, overwrite: true). The checkpoint project for this stage asks you to save and reload data; use this pattern there.',
        ],
        code: `static void SaveAtomically(string path, string contents)
{
    string temp = path + ".tmp";
    File.WriteAllText(temp, contents);       // if this fails, the old file is untouched
    File.Move(temp, path, overwrite: true);  // swap in the complete new file
}`,
        label: 'Write, then swap',
      },
      {
        title: 'Git: your project\'s history',
        paragraphs: [
          'Git records snapshots of your project called commits. Each commit has a message and points to the one before it, so you can see what changed, when and why, and go back if something breaks. git init turns a folder into a repository; git add chooses which changes go into the next commit (the staging area); git commit records them.',
          'Before the first commit, add a .gitignore so generated folders — bin/ and obj/ — and editor settings are never tracked. dotnet new gitignore creates the standard one for .NET projects.',
        ],
        code: `$ git init
$ dotnet new gitignore             # standard .NET ignore rules (bin/, obj/, ...)
$ git add .
$ git commit -m "Create console library app with add and list commands"

$ git status                       # what has changed since the last commit?
$ git log --oneline                # the history, one line per commit
a3f9c21 Create console library app with add and list commands`,
        label: 'The first commit',
      },
      {
        title: 'Branches and good commit messages',
        paragraphs: [
          'A branch lets you work on a feature without disturbing the working version on main. When the feature is finished and tested, you merge it back. In Month 1 you will turn this into the pull-request workflow used by professional teams, even when working alone.',
          'A good commit message has a short summary line in the imperative mood — "Add borrowing limit per member", not "changes" — and, when the reason is not obvious, a body explaining why. Small commits that each do one thing make the history useful: you can find exactly when a bug appeared and undo one change without losing others.',
        ],
        code: `$ git switch -c feature/borrowing          # create and switch to a new branch
# ... edit code, run it, commit in small steps ...
$ git commit -am "Limit members to three borrowed books"
$ git switch main
$ git merge feature/borrowing              # bring the finished feature into main`,
        label: 'Feature branches',
      },
    ],
    table: {
      headers: ['Task', 'C# / Git', 'Note'],
      rows: [
        ['Build a file path', 'Path.Combine("data", "x.json")', 'Portable across operating systems'],
        ['Read / write a whole file', 'File.ReadAllText / File.WriteAllText', 'Check File.Exists on first run'],
        ['Object to JSON and back', 'JsonSerializer.Serialize / Deserialize<T>', 'Deserialize may return null'],
        ['Avoid corrupt saves', 'Write temp file, then File.Move(..., overwrite: true)', 'All-or-nothing replacement'],
        ['Start tracking', 'git init; dotnet new gitignore', 'Ignore bin/ and obj/ first'],
        ['Record a change', 'git add; git commit -m "..."', 'Imperative summary, explain why'],
      ],
    },
    exercise: {
      scenario: 'A student\'s library app saves books by writing each title and copy count separated by a comma. After adding the book "Clean Code, 2nd Edition" the app crashes on every start. Their Git history is one commit titled "stuff" containing bin/ and obj/.',
      task: 'Identify the two problems and fix both.',
      answer: 'The hand-made comma format breaks when a title contains a comma, so loading misreads the line and crashes. Switch to JSON with System.Text.Json, which escapes such characters, and handle JsonException plus a missing file on load. For Git: add a .gitignore (dotnet new gitignore), remove the tracked build output with git rm -r --cached bin obj, and commit in small steps with descriptive imperative messages.',
      evidence: 'Replaces the ad-hoc format with JSON and repairs the repository with .gitignore and meaningful commits.',
    },
    misconceptions: [
      'A missing data file is an error. On first run it is expected; start with empty data.',
      'Writing straight over the data file is fine. A crash mid-write corrupts it; write a temp file and swap.',
      'Git is only for teams. A personal history lets you undo mistakes and understand your own past decisions.',
      'Committing bin/ and obj/ preserves the build. They are regenerated and only create noise and conflicts.',
    ],
    sources: [S.fileIo, S.json, S.proGit, S.dotnetGitignore],
    labs: [],
    questions: [
      { prompt: 'Which System.Text.Json class converts objects to JSON?', answer: 'JsonSerializer' },
      { prompt: 'Which file tells Git which paths to ignore?', answer: '.gitignore', accept: ['gitignore'] },
    ],
    quiz: [
      { question: 'Why use Path.Combine instead of "data/" + name?', options: ['It is shorter', 'It uses the right separator on every OS', 'It creates the folder', 'It reads the file'], answer: 1, explanation: 'Path.Combine handles separators portably.' },
      { question: 'What does JsonSerializer.Deserialize<List<Book>>("null") return?', options: ['An empty list', 'null', 'It throws', 'A list with one null'], answer: 1, explanation: 'JSON null deserializes to null, hence the nullable result.' },
      { question: 'Which command records staged changes as a snapshot?', options: ['git add', 'git commit', 'git status', 'git init'], answer: 1, explanation: 'Commit records the staged snapshot.' },
      { question: 'Which is the best commit summary?', options: ['fix', 'stuff', 'Add per-member borrowing limit', 'changes to Program.cs'], answer: 2, explanation: 'Imperative, specific and meaningful.' },
    ],
  },
];
