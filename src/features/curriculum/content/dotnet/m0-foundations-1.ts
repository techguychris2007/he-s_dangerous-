import type { CurriculumLesson } from '../curriculumDefinition';
import { DN_SOURCES as S } from './sources';

/** Preparation stage, part 1 — C# from zero. Written for someone who has never programmed: every idea
 *  starts with a plain-language picture, then a small program that runs exactly as shown, then the
 *  mistakes beginners actually make. Each lesson pairs with two graded C# tasks in the Code Portal. */
export const DN_FOUNDATIONS_1: CurriculumLesson[] = [
  {
    id: 'dn0-1',
    slug: 'your-first-csharp-program',
    title: 'Your First C# Program: .NET, the CLI and the Compiler',
    summary: 'Install the .NET SDK, create and run a console app, understand what each file is for, and read your first compiler error.',
    minutes: 35,
    prerequisite: 'None. This is the first lesson of the course.',
    outcomes: [
      'Explain what a program, source code, a compiler and the .NET runtime each are.',
      'Create, build and run a console application with the dotnet command-line tool.',
      'Describe the purpose of Program.cs, the .csproj file and the bin and obj folders.',
      'Read a compiler error message and find the file, line and cause it points to.',
    ],
    introduction:
      'A program is a list of instructions a computer follows exactly — no more, no less. You write those instructions as text, called source code, in a programming language designed to be readable by people. The computer cannot run that text directly, so a tool called a compiler first checks it and translates it into a form the computer can execute. In this course the language is C#, the compiler is Roslyn, and the platform that runs the result is .NET. By the end of this lesson you will have written, built and run a real program, and — just as importantly — you will have broken it on purpose and learned to read what the compiler tells you.',
    keyTerms: [
      { term: 'Source code', meaning: 'The human-readable instructions you write, saved in .cs files.' },
      { term: 'Compiler', meaning: 'The tool that checks source code and translates it into an executable form. C#\'s compiler is called Roslyn.' },
      { term: '.NET', meaning: 'The free, open-source platform that runs C# programs on Windows, macOS and Linux, plus its large standard library.' },
      { term: 'SDK', meaning: 'Software Development Kit: the compiler, runtime and dotnet command-line tool you install to build programs.' },
      { term: 'Console application', meaning: 'A program that reads and writes text in a terminal window rather than drawing a graphical interface.' },
      { term: 'Statement', meaning: 'One complete instruction, ending with a semicolon in C#, such as Console.WriteLine("Hi");' },
      { term: 'Compiler error', meaning: 'A message saying the code breaks the language rules, so it cannot be built until it is fixed.' },
    ],
    sections: [
      {
        title: 'From text to a running program',
        paragraphs: [
          'Think of a recipe written in English for a cook who only reads French. Someone must translate it first, and that translator will refuse a recipe with a sentence that makes no sense. In programming, the recipe is your source code, the translator is the compiler, and the cook is the computer.',
          'C# compiles in two steps. The compiler turns your .cs files into Intermediate Language (IL) stored in a .dll file. When the program starts, the .NET runtime translates that IL into the machine instructions of whatever processor you are using. This two-step design is why the same compiled program runs on Windows, macOS and Linux.',
          'The practical consequence for you: many mistakes are caught before the program ever runs. A missing semicolon or a misspelled name is reported by the compiler, with the exact line, in seconds. Treat the compiler as a patient reviewer, not an enemy.',
        ],
      },
      {
        title: 'Installing the tools and creating a project',
        paragraphs: [
          'Install the .NET SDK (version 10 at the time of writing) from dotnet.microsoft.com. Then open a terminal and check it worked with dotnet --version. Any editor works; Visual Studio Code with the C# Dev Kit extension and Visual Studio Community are both free.',
          'dotnet new console creates a new console project in a folder. dotnet run builds it and runs it in one step. While you are in this course you can also run every exercise directly in the browser, but you should be comfortable doing it on your own machine too — professional work happens there.',
        ],
        code: `$ dotnet --version
10.0.100

$ dotnet new console -o HelloApp     # create a project in a new folder
$ cd HelloApp
$ dotnet run                         # build, then run
Hello, World!`,
        label: 'Creating and running a console app',
      },
      {
        title: 'What is in the project folder',
        paragraphs: [
          'Program.cs holds your code. HelloApp.csproj is the project file: a small XML document that tells the build which version of .NET to target and which settings and packages to use. You rarely edit it by hand at first, but you should know it exists, because every build starts there.',
          'The bin folder holds the built output and obj holds temporary files the build uses. Both are generated: delete them and the next build recreates them. That is why they never go into version control, which you will set up in the last lesson of this stage.',
        ],
        code: `<!-- HelloApp.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>              <!-- a program you can run -->
    <TargetFramework>net10.0</TargetFramework> <!-- which .NET it targets -->
    <ImplicitUsings>enable</ImplicitUsings>    <!-- common namespaces imported for you -->
    <Nullable>enable</Nullable>                <!-- warnings about possible null values -->
  </PropertyGroup>
</Project>`,
        label: 'The project file, line by line',
      },
      {
        title: 'Reading Program.cs: statements, strings and Console',
        paragraphs: [
          'A new project contains a single line: Console.WriteLine("Hello, World!"); Console is a class from .NET\'s standard library that represents the terminal. WriteLine is a method — a named action — that writes text followed by a new line. The text in double quotes is a string. The semicolon ends the statement, the way a full stop ends a sentence.',
          'This style, with statements written directly in the file, is called top-level statements. The compiler wraps them in a Main method for you — the official starting point of every C# program. Larger programs and many books still write Main explicitly, so you should recognise both forms; they do exactly the same thing.',
          'C# is case-sensitive: Console and console are different names, and only the first exists. Lines starting with // are comments — notes for people that the compiler ignores.',
        ],
        code: `// Program.cs — top-level statements
Console.WriteLine("Hello, World!");
Console.WriteLine("My first C# program");
Console.Write("No new line after this... ");
Console.WriteLine("so this continues on the same line.");

// The same program written with an explicit Main method:
// class Program
// {
//     static void Main()
//     {
//         Console.WriteLine("Hello, World!");
//     }
// }`,
        label: 'Two equivalent ways to write the entry point',
      },
      {
        title: 'Breaking it on purpose: reading compiler errors',
        paragraphs: [
          'Every error message has the same shape: the file, the line and column in brackets, the word error, an error code such as CS1002, and a description. Start with the first error in the list. One mistake often causes several messages after it, and fixing the first frequently makes the rest disappear.',
          'The error code is searchable: typing "CS0103" into a search engine leads straight to Microsoft\'s explanation with examples. Get into the habit of reading the message slowly rather than guessing.',
        ],
        code: `Console.WriteLine("Hello")      // forgot the semicolon
console.WriteLine("Hello");     // lower-case c

// Program.cs(1,27): error CS1002: ; expected
// Program.cs(2,1):  error CS0103: The name 'console' does not exist in the current context
//            ^ line, column     ^ code     ^ what is wrong`,
        label: 'Two classic mistakes and what the compiler says',
      },
      {
        title: 'Methods you write yourself',
        paragraphs: [
          'Most of your work in this course will be writing methods: small named pieces of code that take inputs and give back a result. A method that returns a value names that value\'s type before its name, and uses return to hand the result back. You will study methods properly later; for now, recognise the shape, because every coding task in this course asks you to fill in a method like this.',
        ],
        code: `static class Greeter
{
    // returns a string; takes one string input called name
    public static string Greet(string name)
    {
        return "Hello, " + name + "!";
    }
}

Console.WriteLine(Greeter.Greet("Ama"));   // Hello, Ama!`,
        label: 'The shape of every task in this course',
      },
    ],
    table: {
      headers: ['Command or file', 'What it does', 'When you use it'],
      rows: [
        ['dotnet new console -o Name', 'Creates a console project in a new folder', 'Starting any new program'],
        ['dotnet build', 'Compiles the project and reports errors', 'Checking your code compiles'],
        ['dotnet run', 'Builds and runs the project', 'Trying your program'],
        ['Program.cs', 'Your source code', 'Every time you write code'],
        ['*.csproj', 'Project settings: target framework, packages', 'Adding packages or changing settings'],
        ['bin/ and obj/', 'Generated build output', 'Never edited; never committed to Git'],
      ],
    },
    exercise: {
      scenario: 'A classmate\'s program will not build. The terminal shows: Program.cs(3,5): error CS0103: The name \'Consle\' does not exist in the current context, followed by four more errors on later lines.',
      task: 'Explain what the first error means, where to look, and why you should fix it before reading the other four.',
      answer: 'CS0103 means a name was used that the compiler does not know. Line 3, column 5 is where the name Consle appears — a misspelling of Console. Fix that first: one misspelling or missing symbol often confuses the compiler about everything after it, so later errors are frequently consequences of the first. Rebuild and read the list again from the top.',
      evidence: 'Reads the location (3,5), identifies the misspelt name, and explains why errors are fixed from the first one down.',
    },
    misconceptions: [
      'The computer runs the .cs file directly. It runs compiled IL, which is why a build step exists and why errors appear before running.',
      'A compiler error means you are bad at programming. Professionals see them constantly; the skill is reading them.',
      'Top-level statements and a Main method are different kinds of program. The compiler turns top-level statements into a Main method.',
      'bin and obj are part of your project. They are generated output and are recreated on every build.',
    ],
    sources: [S.csharpTour, S.dotnetCli, S.topLevel, S.yellowBook],
    labs: [],
    questions: [
      { prompt: 'Which dotnet command builds a project and then runs it?', answer: 'dotnet run', accept: ['run'] },
      { prompt: 'Which punctuation mark ends a statement in C#? Type its name.', answer: 'semicolon', accept: ['a semicolon'] },
    ],
    quiz: [
      { question: 'What does the C# compiler produce from your .cs files?', options: ['Machine code for one processor only', 'Intermediate Language (IL) in a .dll', 'A text file', 'A web page'], answer: 1, explanation: 'Roslyn emits IL; the .NET runtime turns IL into machine code when the program runs.' },
      { question: 'Why are bin and obj never committed to version control?', options: ['They are secret', 'They are generated by every build', 'Git cannot store them', 'They contain your source code'], answer: 1, explanation: 'Build output is recreated from source, so storing it only adds noise and conflicts.' },
      { question: 'console.WriteLine("Hi"); gives CS0103. Why?', options: ['Missing semicolon', 'C# is case-sensitive; the class is Console', 'Strings need single quotes', 'WriteLine needs two arguments'], answer: 1, explanation: 'Names are case-sensitive, so console is an unknown name.' },
      { question: 'Several compiler errors appear at once. Which should you fix first?', options: ['The last one', 'The first one', 'Any of them', 'The longest message'], answer: 1, explanation: 'Later errors are often side-effects of the first.' },
    ],
  },
  {
    id: 'dn0-2',
    slug: 'values-types-and-variables',
    title: 'Values, Types and Variables',
    summary: 'Store values in typed variables, choose between int, double, decimal, bool and string, do arithmetic correctly, and convert text into numbers safely.',
    minutes: 40,
    prerequisite: 'Lesson: Your First C# Program.',
    outcomes: [
      'Declare variables with an explicit type or var, and explain what static typing prevents.',
      'Choose int, long, double, decimal, bool, char or string for a given piece of data.',
      'Predict the result of integer division, the remainder operator and mixed arithmetic.',
      'Convert text to numbers with int.Parse and int.TryParse, and explain when each is appropriate.',
    ],
    introduction:
      'Programs remember things: a price, a name, whether a door is locked. Each of those is a value, and a variable is a named box that holds one. C# is statically typed: every box has a label saying what kind of value it may hold, and the compiler refuses to put the wrong kind in. That can feel strict at first, but it is the reason a whole category of bugs — adding a name to a price, say — is caught before your program runs. This lesson covers the types you will use every day and the small arithmetic surprises that catch out every beginner.',
    keyTerms: [
      { term: 'Variable', meaning: 'A named storage location holding a value that can change, such as int age = 30;' },
      { term: 'Type', meaning: 'The kind of value a variable can hold — whole number, decimal number, text, true/false.' },
      { term: 'Static typing', meaning: 'Types are checked by the compiler before the program runs.' },
      { term: 'var', meaning: 'Lets the compiler infer the type from the value: var count = 3; is still an int.' },
      { term: 'decimal', meaning: 'A base-10 number type that represents amounts like 0.10 exactly; used for money.' },
      { term: 'Integer division', meaning: 'Dividing two whole numbers gives a whole number, discarding the remainder: 7 / 2 is 3.' },
      { term: 'Parse', meaning: 'Convert text such as "42" into a value of another type such as the int 42.' },
    ],
    sections: [
      {
        title: 'Declaring variables',
        paragraphs: [
          'A declaration names a type, then the variable\'s name, and usually gives it a starting value. After that, you use the name to read the value or assign a new one. Names in C# use camelCase for local variables: totalPrice, not total_price or TotalPrice.',
          'var asks the compiler to work out the type from the value on the right. It does not make the variable untyped: var count = 3; declares an int forever, and assigning "three" to it later is still an error. Use var when the type is obvious from the right-hand side, and write the type when it helps a reader.',
          'const declares a value that can never change, such as the number of days in a week. Using named constants instead of bare numbers makes code self-explaining.',
        ],
        code: `int age = 30;                 // whole number
string name = "Kofi";         // text
bool isMember = true;         // true or false
var city = "Accra";           // compiler infers string
const int DaysInWeek = 7;     // can never change

age = age + 1;                // read, then assign a new value
Console.WriteLine($"{name} is {age} and lives in {city}.");
// age = "thirty-one";        // error CS0029: Cannot implicitly convert type 'string' to 'int'`,
        label: 'Declaring, reading and changing variables',
      },
      {
        title: 'The everyday types and how to choose',
        paragraphs: [
          'int holds whole numbers from about minus 2.1 billion to plus 2.1 billion; long holds far larger ones. double holds numbers with fractions using binary floating point — fast, with about 15–16 significant digits, ideal for measurements and science. decimal holds base-10 numbers with 28–29 significant digits and no binary rounding surprises, which is why money is always decimal. bool holds true or false. char holds a single character in single quotes, and string holds text in double quotes.',
          'The reason money must not be double: binary floating point cannot store 0.1 exactly, just as a decimal fraction cannot store one third exactly. Add enough of those tiny errors and your invoice is off by a cent. decimal values are written with an m suffix, such as 19.99m.',
        ],
        code: `double a = 0.1 + 0.2;
Console.WriteLine(a == 0.3);        // False  (a is 0.30000000000000004)

decimal price = 0.1m + 0.2m;
Console.WriteLine(price == 0.3m);   // True

long worldPopulation = 8_100_000_000;  // too big for int; _ is a readable separator
char grade = 'A';
Console.WriteLine(int.MaxValue);    // 2147483647`,
        label: 'Why money uses decimal',
      },
      {
        title: 'Arithmetic and its surprises',
        paragraphs: [
          'The operators are + - * / and % (the remainder). The surprise is division: when both sides are int, the result is an int and the fraction is thrown away. 7 / 2 is 3, not 3.5. If either side is a double or decimal, you get the fraction. The remainder operator % gives what is left over: 7 % 2 is 1, which is how programs test whether a number is even.',
          'Multiplication and division happen before addition and subtraction, as in maths; use brackets to make your intent explicit. Shortcuts such as total += 5 and count++ mean total = total + 5 and count = count + 1.',
          'An int that grows past its maximum silently wraps around to a large negative number. In code where that would be a disaster — balances, counters of money — wrap the calculation in checked so it throws an error instead of producing a wrong answer.',
        ],
        code: `Console.WriteLine(7 / 2);       // 3     both ints: fraction discarded
Console.WriteLine(7 / 2.0);     // 3.5   one double: real division
Console.WriteLine(7 % 2);       // 1     remainder
Console.WriteLine(2 + 3 * 4);   // 14
Console.WriteLine((2 + 3) * 4); // 20

int big = int.MaxValue;
Console.WriteLine(big + 1);            // -2147483648  silent wrap-around
// Console.WriteLine(checked(big + 1)); // throws OverflowException instead

int score = 10;
score += 5;   // 15
score++;      // 16`,
        label: 'Integer division, remainder and overflow',
      },
      {
        title: 'Converting between types',
        paragraphs: [
          'Converting a smaller type to a larger one is automatic, because nothing can be lost: an int fits in a long or a double. Going the other way needs a cast, written as the target type in brackets, and the fraction is cut off rather than rounded: (int)9.99 is 9. Use Math.Round when you mean rounding — and know that by default it rounds a value exactly halfway (8.5) to the nearest even number, which avoids a systematic upward bias in large sums. Pass MidpointRounding.AwayFromZero when a rule says "round halves up".',
          'Text typed by a user or read from a file is always a string, even if it looks like a number. int.Parse("42") converts it, but throws an exception if the text is not a valid number. int.TryParse returns true or false instead and puts the result in an out variable — the right choice whenever the text comes from outside your program, because bad input is normal there, not exceptional.',
        ],
        code: `int whole = 42;
double wide = whole;               // automatic: no information lost
int cut = (int)9.99;               // 9  — cast truncates
// Math.Round sends a .5 to the nearest EVEN number by default ("banker's rounding"):
Console.WriteLine(Math.Round(8.5));                                 // 8
Console.WriteLine(Math.Round(9.5));                                 // 10
Console.WriteLine(Math.Round(8.5, MidpointRounding.AwayFromZero));  // 9  (school rounding)

int fromText = int.Parse("42");    // 42
// int.Parse("forty-two");         // throws FormatException

if (int.TryParse("forty-two", out int value))
    Console.WriteLine($"Number: {value}");
else
    Console.WriteLine("That is not a whole number.");   // printed`,
        label: 'Casts, Parse and TryParse',
      },
      {
        title: 'Reading input from the user',
        paragraphs: [
          'Console.ReadLine() waits for the user to type a line and press Enter, then returns it as a string. Combine it with TryParse and a loop and you have a program that never crashes on bad input — a pattern you will reuse in the Library Management project.',
          'In this course\'s browser workspace, a program\'s input is supplied in advance rather than typed live; the behaviour of ReadLine is otherwise identical.',
        ],
        code: `Console.Write("How old are you? ");
string? text = Console.ReadLine();        // string? : it may be null at end of input

if (int.TryParse(text, out int age) && age >= 0)
    Console.WriteLine($"Next year you will be {age + 1}.");
else
    Console.WriteLine("Please enter a whole number like 25.");`,
        label: 'Safe input handling',
      },
    ],
    table: {
      headers: ['Type', 'Holds', 'Typical use'],
      rows: [
        ['int', 'Whole numbers, about ±2.1 billion', 'Counts, ages, quantities'],
        ['long', 'Very large whole numbers', 'Populations, file sizes, ids'],
        ['double', 'Binary floating point, ~15–16 digits', 'Measurements, physics, statistics'],
        ['decimal', 'Base-10, 28–29 digits, exact for 0.1', 'Money and prices'],
        ['bool', 'true or false', 'Flags and conditions'],
        ['char / string', 'One character / text', 'Grades, names, messages'],
      ],
    },
    exercise: {
      scenario: 'A shop computes a bill as double total = 3 * 0.10; and prints a discount as int percent = 15 / 100 * total;. Customers report wrong totals and a discount that is always zero.',
      task: 'Find both bugs and rewrite the two lines correctly.',
      answer: 'Money must be decimal: decimal total = 3 * 0.10m; avoids binary rounding error. 15 / 100 is integer division and equals 0, so the discount is always 0; write decimal discount = total * 15 / 100; or total * 0.15m, keeping everything in decimal so no fraction is lost.',
      evidence: 'Switches money to decimal and identifies 15 / 100 as integer division producing 0.',
    },
    misconceptions: [
      'var makes a variable untyped. The type is inferred once and fixed.',
      'double is fine for money. Binary floating point cannot represent most decimal fractions exactly.',
      '7 / 2 is 3.5. With two ints it is 3; the fraction is discarded.',
      'Casting rounds. (int)9.99 truncates to 9; use Math.Round to round.',
      'int.Parse is safe for user input. It throws on bad text; prefer TryParse for anything from outside the program.',
    ],
    sources: [S.builtInTypes, S.numerics, S.csharpDocs, S.nakov],
    labs: [],
    questions: [
      { prompt: 'What does 17 / 5 evaluate to in C# when both are int?', answer: '3' },
      { prompt: 'Which numeric type should hold money?', answer: 'decimal' },
    ],
    quiz: [
      { question: 'What does var total = 10; declare?', options: ['An untyped variable', 'An int', 'A double', 'A string'], answer: 1, explanation: 'The compiler infers int from the literal 10.' },
      { question: 'What is 17 % 5?', options: ['3', '2', '3.4', '0'], answer: 1, explanation: '17 = 3 × 5 + 2, so the remainder is 2.' },
      { question: 'Why use int.TryParse for user input?', options: ['It is faster', 'Bad input is normal; it returns false instead of throwing', 'It rounds numbers', 'Parse does not exist'], answer: 1, explanation: 'TryParse reports failure through its bool result rather than an exception.' },
      { question: 'What is (int)7.9?', options: ['8', '7', '7.9', 'An error'], answer: 1, explanation: 'A cast to int truncates toward zero.' },
    ],
  },
  {
    id: 'dn0-3',
    slug: 'working-with-text',
    title: 'Working with Text: Strings, Characters and Interpolation',
    summary: 'Build strings with interpolation, use the common string methods, understand immutability, and use StringBuilder when building text in a loop.',
    minutes: 35,
    prerequisite: 'Lesson: Values, Types and Variables.',
    outcomes: [
      'Build messages with string interpolation and format numbers and dates inside them.',
      'Use Length, indexing, Substring, Trim, ToUpper, Contains, Replace and Split correctly.',
      'Explain why strings are immutable and what that means for methods such as ToUpper.',
      'Compare strings correctly, including case-insensitive comparison.',
    ],
    introduction:
      'Almost every real program handles text: names, search terms, file contents, messages to users. C# strings are sequences of characters with a rich set of methods for searching, cutting and reshaping them. Two ideas unlock most of what you need. First, interpolation lets you build text by writing the result you want with gaps for the values. Second, strings never change once created — every method that seems to modify one actually returns a new string, and forgetting that is the single most common beginner bug with text.',
    keyTerms: [
      { term: 'String', meaning: 'A sequence of characters, written in double quotes: "Accra".' },
      { term: 'char', meaning: 'One character, written in single quotes: \'A\'.' },
      { term: 'Interpolation', meaning: 'Writing $"Hello {name}" so the value of name is inserted into the text.' },
      { term: 'Immutable', meaning: 'Cannot be changed after creation. String methods return new strings.' },
      { term: 'Index', meaning: 'A character\'s position, counting from 0: in "cat", \'c\' is at index 0.' },
      { term: 'StringBuilder', meaning: 'A mutable text buffer for building a string efficiently in many steps.' },
    ],
    sections: [
      {
        title: 'Building text with interpolation',
        paragraphs: [
          'Put a $ before the opening quote and any expression inside curly braces is evaluated and inserted. It reads like the output you want, which is why it replaced joining strings with + in modern C#. After a colon you can add a format: :C for currency, :N2 for two decimal places with thousands separators, :0.0 for a custom pattern, :yyyy-MM-dd for dates.',
          'Because this course runs with invariant culture, currency appears as ¤; on your own machine :C uses your regional settings (for example GH₵ or $). When output must be identical everywhere — files, logs, tests — prefer explicit formats such as :N2.',
        ],
        code: `string name = "Abena";
int items = 3;
decimal total = 1234.5m;

Console.WriteLine($"{name} bought {items} items.");
Console.WriteLine($"Total: {total:N2}");          // Total: 1,234.50
Console.WriteLine($"Average: {total / items:0.00}"); // Average: 411.50
Console.WriteLine($"Next year: {items * 2} items"); // any expression works

// Raw string literals keep quotes and new lines as written:
string json = """
    { "name": "Abena", "items": 3 }
    """;`,
        label: 'Interpolation and formatting',
      },
      {
        title: 'Looking inside a string',
        paragraphs: [
          'Length gives the number of characters. Square brackets read one character by position, counting from 0, so the last character is at Length - 1; asking for a position that does not exist throws IndexOutOfRangeException. The hat operator ^1 counts from the end, so text[^1] is the last character. Ranges such as text[0..3] give a new string with the characters from index 0 up to, but not including, index 3.',
          'IndexOf finds where something first appears, returning -1 if it is absent; Contains, StartsWith and EndsWith answer yes-or-no questions.',
        ],
        code: `string word = "Kumasi";
Console.WriteLine(word.Length);          // 6
Console.WriteLine(word[0]);              // K
Console.WriteLine(word[^1]);             // i  (last character)
Console.WriteLine(word[0..3]);           // Kum
Console.WriteLine(word.Substring(2, 3)); // mas  (start 2, length 3)
Console.WriteLine(word.IndexOf("mas"));  // 2
Console.WriteLine(word.IndexOf("z"));    // -1  not found
Console.WriteLine(word.Contains("uma")); // True`,
        label: 'Length, indexing, ranges and searching',
      },
      {
        title: 'Strings never change — methods return new ones',
        paragraphs: [
          'Calling name.ToUpper() does not change name. It creates and returns an upper-case copy, and if you do not store that copy it is simply thrown away. The same is true of Trim, Replace, Insert and every other method that seems to modify text. Immutability makes strings safe to share between parts of a program — nobody can change a string out from under you — at the cost of this one rule you must remember.',
        ],
        code: `string name = "  ama owusu  ";
name.Trim().ToUpper();                // result discarded: name is unchanged!
Console.WriteLine($"[{name}]");       // [  ama owusu  ]

string clean = name.Trim().ToUpper(); // store the new string
Console.WriteLine($"[{clean}]");      // [AMA OWUSU]

string csv = "apples,bananas,,mangoes";
string[] parts = csv.Split(',', StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(parts.Length);      // 3
Console.WriteLine(string.Join(" | ", parts)); // apples | bananas | mangoes`,
        label: 'Store the result, or it is lost',
      },
      {
        title: 'Comparing strings correctly',
        paragraphs: [
          '== compares the characters, so "Accra" == "Accra" is true and "accra" == "Accra" is false. For a case-insensitive comparison — usernames, file extensions, search — use string.Equals with StringComparison.OrdinalIgnoreCase rather than lower-casing both sides, which allocates new strings and can behave unexpectedly in some languages.',
          'string.IsNullOrWhiteSpace is the standard check for "the user typed nothing useful": it is true for null, an empty string, and a string of spaces.',
        ],
        code: `string input = "ACCRA";
Console.WriteLine(input == "Accra");                                              // False
Console.WriteLine(string.Equals(input, "Accra", StringComparison.OrdinalIgnoreCase)); // True
Console.WriteLine("report.PDF".EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)); // True

Console.WriteLine(string.IsNullOrWhiteSpace("   "));  // True`,
        label: 'Equality and case-insensitive comparison',
      },
      {
        title: 'Characters and StringBuilder',
        paragraphs: [
          'Looping over a string with foreach gives you its characters one at a time. The char type has helpful static methods: char.IsDigit, char.IsLetter, char.IsWhiteSpace, char.ToUpper.',
          'Because strings are immutable, adding to one in a loop creates a brand-new string every time; for thousands of pieces that becomes slow. StringBuilder is a mutable buffer designed for exactly this: append as often as you like, then call ToString once at the end.',
        ],
        code: `int digits = 0;
foreach (char c in "Room 42B, Floor 3")
{
    if (char.IsDigit(c)) digits++;
}
Console.WriteLine(digits);   // 3

var sb = new System.Text.StringBuilder();
for (int i = 1; i <= 5; i++)
    sb.Append(i).Append(i < 5 ? ", " : "");
Console.WriteLine(sb.ToString());   // 1, 2, 3, 4, 5`,
        label: 'Inspecting characters and building text efficiently',
      },
    ],
    table: {
      headers: ['Need', 'Use', 'Example result'],
      rows: [
        ['Insert values into text', '$"..." with {expr:format}', '$"{12.5m:N2}" → 12.50'],
        ['Remove surrounding spaces', 'Trim()', '"  hi ".Trim() → "hi"'],
        ['Split into pieces', 'Split(\',\')', '"a,b" → ["a","b"]'],
        ['Case-insensitive equality', 'string.Equals(a, b, OrdinalIgnoreCase)', 'ACCRA equals Accra'],
        ['Is the input empty?', 'string.IsNullOrWhiteSpace(s)', 'true for null, "", "  "'],
        ['Build text in a loop', 'StringBuilder', 'One allocation instead of thousands'],
      ],
    },
    exercise: {
      scenario: 'A sign-up form normalises usernames with: username.Trim(); username.ToLower(); if (username == "") ... Users with spaces around their names are being accepted as different accounts.',
      task: 'Explain the bug and rewrite the normalisation.',
      answer: 'Trim and ToLower return new strings; the results are discarded, so username never changes. Write username = username.Trim().ToLowerInvariant(); and test with string.IsNullOrWhiteSpace(username). For comparisons with existing accounts, string.Equals(a, b, StringComparison.OrdinalIgnoreCase) avoids lower-casing at all.',
      evidence: 'Identifies discarded return values (immutability) and assigns the result back.',
    },
    misconceptions: [
      'ToUpper changes the string. It returns a new one; store it.',
      'The first character is at index 1. Indexes start at 0.',
      'Lower-casing both sides is the right way to ignore case. Use StringComparison.OrdinalIgnoreCase.',
      '+ in a loop is fine for building large text. Each + makes a new string; use StringBuilder.',
    ],
    sources: [S.strings, S.interpolation, S.yellowBook],
    labs: [],
    questions: [
      { prompt: 'What index does the first character of a string have?', answer: '0', accept: ['zero'] },
      { prompt: 'Which class builds a string efficiently in a loop?', answer: 'StringBuilder' },
    ],
    quiz: [
      { question: 'What does "hello".ToUpper(); on its own line do to the original string?', options: ['Changes it to HELLO', 'Nothing — the returned copy is discarded', 'Throws an error', 'Deletes it'], answer: 1, explanation: 'Strings are immutable; the upper-case copy must be stored.' },
      { question: 'What is "Kumasi"[^1]?', options: ['K', 'i', 's', 'An error'], answer: 1, explanation: '^1 is the last element.' },
      { question: 'What does "Accra".IndexOf("z") return?', options: ['0', '-1', 'null', 'An exception'], answer: 1, explanation: 'IndexOf returns -1 when the value is absent.' },
      { question: 'What prints for $"{3.14159:0.00}"?', options: ['3.14159', '3.14', '3.1', '3'], answer: 1, explanation: 'The format 0.00 keeps two decimal places.' },
    ],
  },
  {
    id: 'dn0-4',
    slug: 'making-decisions',
    title: 'Making Decisions: Conditions, if and switch',
    summary: 'Combine conditions with &&, || and !, branch with if/else, and replace long chains with switch expressions and patterns.',
    minutes: 35,
    prerequisite: 'Lesson: Working with Text.',
    outcomes: [
      'Write boolean expressions with comparison and logical operators and predict their result.',
      'Structure if / else if / else chains so exactly one branch runs and boundaries are correct.',
      'Use switch expressions with constant, relational and logical patterns.',
      'Use guard clauses to keep decision code flat and readable.',
    ],
    introduction:
      'A program that always does the same thing is not very useful. Decisions let it react: charge shipping only for small orders, refuse a withdrawal larger than the balance, award a grade from a score. In this lesson you will learn to express conditions precisely, to choose between if statements and the more modern switch expression, and to avoid the boundary mistakes — is it greater than, or greater than or equal to? — that cause a surprising share of real-world bugs.',
    keyTerms: [
      { term: 'Boolean expression', meaning: 'An expression that is either true or false, such as age >= 18.' },
      { term: '&& / || / !', meaning: 'Logical AND, OR and NOT for combining conditions.' },
      { term: 'Short-circuit', meaning: '&& stops if the left side is false; || stops if the left side is true.' },
      { term: 'switch expression', meaning: 'An expression that picks a value by matching an input against patterns.' },
      { term: 'Pattern', meaning: 'A test applied to a value, such as >= 90, "admin", or null.' },
      { term: 'Guard clause', meaning: 'An early return that handles an invalid case first, so the main logic is not nested.' },
    ],
    sections: [
      {
        title: 'Conditions: comparisons and logic',
        paragraphs: [
          'The comparison operators are == (equal), != (not equal), <, <=, > and >=. Note the double equals: a single = assigns. Combine conditions with && (both must be true), || (at least one must be true) and ! (not).',
          '&& and || short-circuit: in a && b, if a is false, b is never evaluated. That is useful — name != null && name.Length > 0 is safe because Length is only read when name is not null — and it means the order of conditions can matter.',
        ],
        code: `int age = 20;
bool hasTicket = true;

bool canEnter = age >= 18 && hasTicket;    // True
bool isChildOrSenior = age < 12 || age >= 65; // False
bool noTicket = !hasTicket;                // False

string? name = null;
bool hasName = name != null && name.Length > 0;  // False, and no crash`,
        label: 'Comparison and logical operators',
      },
      {
        title: 'if, else if and else',
        paragraphs: [
          'if runs a block only when its condition is true. else if adds more conditions, checked in order, and else catches everything left. Exactly one branch of the chain runs: the first whose condition is true. That ordering is a tool — check the most specific or highest case first — and a trap if you get it backwards.',
          'Always use braces around the blocks, even for one line. Code without braces is easy to break when someone adds a second line that looks like it belongs to the if but does not.',
        ],
        code: `int score = 74;
string grade;

if (score >= 80)      { grade = "A"; }
else if (score >= 70) { grade = "B"; }   // only reached when score < 80
else if (score >= 60) { grade = "C"; }
else                  { grade = "F"; }

Console.WriteLine(grade);   // B

// Backwards order is a bug: every score >= 60 would get "C"
// if (score >= 60) grade = "C"; else if (score >= 70) grade = "B"; ...`,
        label: 'Order matters: the first true branch wins',
      },
      {
        title: 'Getting boundaries right',
        paragraphs: [
          'Most decision bugs live at the edges. If free shipping starts "at" 100 cedis, the condition is total >= 100, and an order of exactly 100 must get it. When you write a rule, write down the values on each side of every boundary — 99.99, 100, 100.01 — and check each one. You will turn exactly this habit into automated tests in Month 1.',
        ],
        code: `static decimal Shipping(decimal orderTotal)
{
    if (orderTotal >= 100m) return 0m;     // free at exactly 100
    if (orderTotal >= 50m)  return 5m;
    return 10m;
}

Console.WriteLine(Shipping(99.99m));  // 5
Console.WriteLine(Shipping(100m));    // 0  boundary included
Console.WriteLine(Shipping(49.99m));  // 10`,
        label: 'Test both sides of every boundary',
      },
      {
        title: 'switch expressions and patterns',
        paragraphs: [
          'When you are choosing a value based on one input, a switch expression is shorter and safer than a chain of ifs. Each arm is pattern => result, tried in order; the discard _ matches anything and acts as the default. The compiler warns you if some inputs match no arm.',
          'Patterns can be constants ("admin"), relational (>= 90), combined with and, or and not, or type tests. This is the modern C# way of expressing decisions, and you will see it throughout professional code.',
        ],
        code: `static string Grade(int score) => score switch
{
    < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(score)),
    >= 80 => "A",
    >= 70 => "B",
    >= 60 => "C",
    _     => "F",
};

static string RoleLabel(string role) => role switch
{
    "admin"            => "Administrator",
    "editor" or "author" => "Content team",
    _                  => "Reader",
};

Console.WriteLine(Grade(74));          // B
Console.WriteLine(RoleLabel("author")); // Content team`,
        label: 'Relational, logical and constant patterns',
      },
      {
        title: 'Guard clauses keep code flat',
        paragraphs: [
          'Deeply nested ifs are hard to read because the reader must hold every outer condition in their head. Handle the invalid or special cases first and return immediately; what remains is the normal path, unindented. This guard-clause style is common in professional C# and in every project in this course.',
        ],
        code: `// Nested: hard to follow
static string WithdrawNested(decimal balance, decimal amount)
{
    if (amount > 0)
    {
        if (amount <= balance) { return "Approved"; }
        else { return "Insufficient funds"; }
    }
    else { return "Amount must be positive"; }
}

// Guard clauses: invalid cases first, happy path last
static string Withdraw(decimal balance, decimal amount)
{
    if (amount <= 0) return "Amount must be positive";
    if (amount > balance) return "Insufficient funds";
    return "Approved";
}`,
        label: 'Same behaviour, much easier to read',
      },
    ],
    table: {
      headers: ['Situation', 'Prefer', 'Why'],
      rows: [
        ['Run code only sometimes', 'if', 'Clearest for actions with side effects'],
        ['Several ranges or cases', 'else if chain or switch expression', 'Exactly one branch runs'],
        ['Choose a value from one input', 'switch expression', 'Short, exhaustive, warns about gaps'],
        ['Reject bad input', 'Guard clause with early return/throw', 'Keeps the main path unindented'],
        ['Safely use a value that may be null', 'x != null && x.Prop ...', 'Short-circuit protects the second test'],
      ],
    },
    exercise: {
      scenario: 'A ticket price rule says: children under 12 pay 5, adults pay 20, seniors aged 65 and over pay 10. The code is: if (age < 12) price = 5; if (age > 65) price = 10; else price = 20;',
      task: 'Find the two bugs and rewrite it as a switch expression.',
      answer: 'The second if is not else if, so a child also falls into the else and gets 20. And age > 65 excludes exactly 65. Correct: decimal price = age switch { < 0 => throw new ArgumentOutOfRangeException(nameof(age)), < 12 => 5m, >= 65 => 10m, _ => 20m };',
      evidence: 'Spots the missing else (two independent ifs) and the >= boundary for 65.',
    },
    misconceptions: [
      'if (x = 5) compares. = assigns; == compares (and C# refuses to compile the assignment version for ints).',
      'Each if in a list is tried and the last one wins. In an else-if chain only the first true branch runs; separate ifs all run.',
      'Braces are optional so they do not matter. Omitting them invites bugs when lines are added.',
      'switch only works with constants. Modern switch supports relational and logical patterns.',
    ],
    sources: [S.selection, S.switchExpression, S.patterns],
    labs: [],
    questions: [
      { prompt: 'The && operator is logical AND, || is OR. Which one requires both conditions to be true? Type AND or OR.', answer: 'AND' },
      { prompt: 'The catch-all arm _ in a switch expression is called the what pattern?', answer: 'discard', accept: ['discard pattern'] },
    ],
    quiz: [
      { question: 'In an if / else if / else chain, how many branches run?', options: ['All true ones', 'Exactly one', 'At least two', 'None'], answer: 1, explanation: 'The first true condition wins and the rest are skipped.' },
      { question: 'Why is name != null && name.Length > 0 safe?', options: ['Length never throws', '&& stops before Length when name is null', 'null has a Length of 0', 'It is not safe'], answer: 1, explanation: 'Short-circuit evaluation skips the right side.' },
      { question: 'Free delivery applies "from 100". Which condition is right?', options: ['total > 100', 'total >= 100', 'total == 100', 'total < 100'], answer: 1, explanation: '"From 100" includes 100 itself.' },
      { question: 'What does a guard clause do?', options: ['Adds nesting', 'Handles invalid cases early and returns', 'Catches exceptions', 'Repeats code'], answer: 1, explanation: 'It removes nesting by exiting early on special cases.' },
    ],
  },
  {
    id: 'dn0-5',
    slug: 'repeating-work-with-loops',
    title: 'Repeating Work: Loops',
    summary: 'Repeat work with for, foreach, while and do-while, accumulate results, stop early with break and continue, and avoid off-by-one and infinite loops.',
    minutes: 40,
    prerequisite: 'Lesson: Making Decisions.',
    outcomes: [
      'Choose between for, foreach, while and do-while for a given repetition.',
      'Write the accumulator pattern to compute totals, counts, maximums and filtered results.',
      'Use break and continue deliberately, and explain how a loop terminates.',
      'Spot and fix off-by-one errors and infinite loops.',
    ],
    introduction:
      'Computers are valuable because they repeat work tirelessly: adding a thousand prices, checking every line of a file, retrying a request until it succeeds. Loops are how you ask for repetition. C# has four kinds, each suited to a different situation, and nearly every loop you will ever write follows one of a handful of patterns: count, total, find the best, filter, or search and stop. Learn those patterns here and most loops become easy to write and, more importantly, easy to get right.',
    keyTerms: [
      { term: 'Iteration', meaning: 'One pass through the body of a loop.' },
      { term: 'for loop', meaning: 'Repeats with a counter: start, condition, step.' },
      { term: 'foreach loop', meaning: 'Visits every item of a collection in order.' },
      { term: 'while loop', meaning: 'Repeats as long as a condition stays true; may run zero times.' },
      { term: 'Accumulator', meaning: 'A variable that builds up a result across iterations, such as a running total.' },
      { term: 'Off-by-one error', meaning: 'A loop that runs one time too many or too few, usually from < versus <=.' },
    ],
    sections: [
      {
        title: 'for: counting a known number of times',
        paragraphs: [
          'A for loop has three parts in its brackets: a starting statement, a condition checked before each iteration, and a step run after each iteration. for (int i = 0; i < 5; i++) runs with i equal to 0, 1, 2, 3 and 4 — five times. Counting from 0 and using < with the count is the convention in C#, because it matches how indexes work.',
        ],
        code: `for (int i = 0; i < 5; i++)
{
    Console.Write(i + " ");     // 0 1 2 3 4
}
Console.WriteLine();

for (int i = 10; i > 0; i -= 3)
{
    Console.Write(i + " ");     // 10 7 4 1
}`,
        label: 'Counting up and counting down',
      },
      {
        title: 'foreach: every item, no index needed',
        paragraphs: [
          'When you want each item of a collection and do not care about positions, foreach is clearer and cannot go out of bounds. It works on arrays, lists, strings (character by character) and any other collection. You cannot add to or remove from a collection while foreach is walking it — doing so throws an exception — which is a design choice that prevents subtle bugs.',
        ],
        code: `string[] cities = ["Accra", "Kumasi", "Tamale"];

foreach (string city in cities)
{
    Console.WriteLine(city.ToUpper());
}

// Need the position too? Use for with the index:
for (int i = 0; i < cities.Length; i++)
{
    Console.WriteLine($"{i + 1}. {cities[i]}");
}`,
        label: 'Item by item, or with positions',
      },
      {
        title: 'The accumulator patterns',
        paragraphs: [
          'Nearly every loop that computes something follows one pattern: create a result variable before the loop, update it inside, use it after. A total starts at 0 and adds. A count starts at 0 and increments when a condition holds. A maximum starts at the first item (not at 0 — what if every value is negative?) and replaces itself when something bigger appears.',
          'Later you will learn LINQ, which writes these as one-liners such as prices.Sum(). Write them by hand first, so you understand what LINQ does for you and can handle the cases it does not cover.',
        ],
        code: `int[] temperatures = [-3, -7, -1, -12];

int total = 0;
int belowMinusFive = 0;
int warmest = temperatures[0];       // start from real data, not 0

foreach (int t in temperatures)
{
    total += t;                       // total
    if (t < -5) belowMinusFive++;     // count
    if (t > warmest) warmest = t;     // maximum
}

double average = (double)total / temperatures.Length;  // avoid integer division
Console.WriteLine($"{average:0.0} {belowMinusFive} {warmest}");  // -5.8 2 -1`,
        label: 'Total, count and maximum in one pass',
      },
      {
        title: 'while and do-while: repeat until something happens',
        paragraphs: [
          'Use while when you do not know in advance how many iterations you need: keep asking until the input is valid, keep halving until a value is small enough. The condition is checked before each iteration, so the body may run zero times. do-while checks after, so the body always runs at least once — natural for menus and "ask, then check" input.',
          'Every while loop needs something inside it that eventually makes the condition false. If nothing does, the loop never ends: an infinite loop. In this course\'s browser workspace a run that does not finish is stopped after 15 seconds and reported.',
        ],
        code: `int value = 1000;
int steps = 0;
while (value > 1)
{
    value /= 2;      // moves toward the exit condition
    steps++;
}
Console.WriteLine(steps);   // 9

string? choice;
do
{
    Console.Write("Continue? (y/n) ");
    choice = Console.ReadLine();
} while (choice != "y" && choice != "n" && choice != null);`,
        label: 'Unknown repetition counts',
      },
      {
        title: 'break, continue and searching',
        paragraphs: [
          'break leaves the loop immediately — ideal once you have found what you were searching for. continue skips the rest of the current iteration and moves to the next — useful for ignoring invalid items without nesting. Use both sparingly: a loop with several exits is harder to reason about than one with a clear condition.',
        ],
        code: `string[] names = ["Esi", "", "Yaw", "Akos", "Kwame"];
string? firstLong = null;

foreach (string n in names)
{
    if (n.Length == 0) continue;   // skip blanks
    if (n.Length > 3)
    {
        firstLong = n;
        break;                      // found it: stop searching
    }
}
Console.WriteLine(firstLong);   // Akos`,
        label: 'Skip and stop',
      },
      {
        title: 'Off-by-one errors',
        paragraphs: [
          'Off-by-one errors are so common they have a name. for (int i = 0; i <= items.Length; i++) runs one time too many and the last iteration reads past the end of the array, throwing IndexOutOfRangeException. The defence is a habit: for a loop over n items, check the first iteration, the last iteration, and the case n = 0. If all three are right, the loop is almost certainly right.',
        ],
        code: `int[] items = [10, 20, 30];

// Bug: i reaches 3, and items[3] does not exist
// for (int i = 0; i <= items.Length; i++) Console.WriteLine(items[i]);

for (int i = 0; i < items.Length; i++)   // i = 0, 1, 2
    Console.WriteLine(items[i]);

// Check the edges: first i = 0 ✓, last i = 2 ✓, empty array runs 0 times ✓`,
        label: 'First, last and empty',
      },
    ],
    table: {
      headers: ['Loop', 'Use when', 'Runs at least once?'],
      rows: [
        ['for', 'You know the count or need the index', 'No'],
        ['foreach', 'You want every item of a collection', 'No'],
        ['while', 'Repeat until a condition changes; count unknown', 'No'],
        ['do-while', 'The body must run before the first check (menus, prompts)', 'Yes'],
      ],
    },
    exercise: {
      scenario: 'A function to find the highest mark is: int best = 0; for (int i = 1; i <= marks.Length; i++) if (marks[i] > best) best = marks[i]; return best;',
      task: 'List every bug and write a correct version.',
      answer: 'Three bugs: starting best at 0 is wrong if all marks could be negative (or simply hides empty input); i starts at 1 so marks[0] is never checked unless best is initialised from it; i <= Length reads past the end. Correct: if (marks.Length == 0) throw new ArgumentException("No marks"); int best = marks[0]; for (int i = 1; i < marks.Length; i++) if (marks[i] > best) best = marks[i]; return best;',
      evidence: 'Initialises from the first element, uses < Length, and handles the empty array explicitly.',
    },
    misconceptions: [
      'A maximum should start at 0. Start from the first item, or negative-only data gives a wrong answer.',
      'foreach lets you remove items as you go. Modifying a collection during foreach throws an exception.',
      'while and do-while are the same. do-while always runs its body once.',
      'i <= items.Length is a safe loop bound. It reads one element past the end.',
    ],
    sources: [S.iteration, S.yellowBook, S.nakov],
    labs: [],
    questions: [
      { prompt: 'Which loop always runs its body at least once?', answer: 'do-while', accept: ['do while', 'do'] },
      { prompt: 'Which keyword exits a loop immediately?', answer: 'break' },
    ],
    quiz: [
      { question: 'How many times does for (int i = 0; i < 4; i++) run?', options: ['3', '4', '5', 'Forever'], answer: 1, explanation: 'i takes the values 0, 1, 2 and 3.' },
      { question: 'What does continue do?', options: ['Ends the loop', 'Skips to the next iteration', 'Restarts the program', 'Nothing'], answer: 1, explanation: 'It skips the rest of the current pass only.' },
      { question: 'Why might a while loop never end?', options: ['It has too many lines', 'Nothing in the body makes the condition false', 'It uses break', 'It uses an int'], answer: 1, explanation: 'Something must move the loop toward its exit condition.' },
      { question: 'Which bound is correct for indexing an array with i?', options: ['i <= a.Length', 'i < a.Length', 'i < a.Length - 1', 'i <= a.Length + 1'], answer: 1, explanation: 'The last valid index is Length - 1.' },
    ],
  },
];
