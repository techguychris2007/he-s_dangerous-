import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'C# Foundations';

/** Preparation-stage tasks, two per lesson (dn0-1 … dn0-10). Every starter compiles and throws
 *  NotImplementedException, so each check fails with a clear message until it is implemented;
 *  scripts/check-csharp-tasks.cjs proves every reference solution passes and every starter fails. */
export const CSHARP_FOUNDATION_TASKS: CodeTask[] = [
  {
    id: 'cs-0-01',
    title: 'Friendly Greeting',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Greeter.Greet(string name). It returns "Hello, <name>!" using the name with surrounding spaces removed. ' +
      'If the name is empty or only spaces, return "Hello, stranger!". This is the shape of every task in the course: a ' +
      'method with inputs and a returned result that the tests check.',
    starterCode: `public static class Greeter
{
    public static string Greet(string name)
    {
        // TODO: trim the name; if nothing is left, greet "stranger"
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'name.Trim() returns a new string without leading and trailing spaces.',
      'string.IsNullOrWhiteSpace(name) is true for "", "   " and null.',
      'Interpolation: $"Hello, {trimmed}!"',
    ],
    solution: `public static class Greeter
{
    public static string Greet(string name)
    {
        string trimmed = name.Trim();
        return trimmed.Length == 0 ? "Hello, stranger!" : $"Hello, {trimmed}!";
    }
}
`,
    testCode: csTests(`
Check("plain name", () => Greeter.Greet("Ama"), "Hello, Ama!");
Check("spaces trimmed", () => Greeter.Greet("  Kofi  "), "Hello, Kofi!");
Check("empty name", () => Greeter.Greet(""), "Hello, stranger!");
Check("only spaces", () => Greeter.Greet("    "), "Hello, stranger!");
Check("inner spaces kept", () => Greeter.Greet("Abena Mensah"), "Hello, Abena Mensah!");
`),
  },
  {
    id: 'cs-0-02',
    title: 'Introduce Yourself',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Profile.Introduce(string name, int age, string city). Return exactly ' +
      '"My name is <name>, I am <age> years old and I live in <city>." — except that an age of 1 must say "1 year old". ' +
      'Small grammar rules like this are the everyday details that separate working software from almost-working software.',
    starterCode: `public static class Profile
{
    public static string Introduce(string name, int age, string city)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Build the "year" or "years" word first with a conditional expression: age == 1 ? "year" : "years".',
      'Then use one interpolated string for the whole sentence.',
    ],
    solution: `public static class Profile
{
    public static string Introduce(string name, int age, string city)
    {
        string unit = age == 1 ? "year" : "years";
        return $"My name is {name}, I am {age} {unit} old and I live in {city}.";
    }
}
`,
    testCode: csTests(`
Check("typical", () => Profile.Introduce("Esi", 24, "Accra"), "My name is Esi, I am 24 years old and I live in Accra.");
Check("one year", () => Profile.Introduce("Kojo", 1, "Ho"), "My name is Kojo, I am 1 year old and I live in Ho.");
Check("zero years", () => Profile.Introduce("Baby", 0, "Tema"), "My name is Baby, I am 0 years old and I live in Tema.");
`),
  },
  {
    id: 'cs-0-03',
    title: 'Units and Durations',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement two methods in Units. CelsiusToFahrenheit(double c) returns c × 9 / 5 + 32, rounded to one decimal place. ' +
      'FormatDuration(int totalMinutes) returns hours and minutes such as "2h 05m" (minutes always two digits) using integer ' +
      'division and the remainder operator — no loops.',
    starterCode: `public static class Units
{
    public static double CelsiusToFahrenheit(double celsius)
    {
        throw new NotImplementedException();
    }

    public static string FormatDuration(int totalMinutes)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Math.Round(value, 1) rounds to one decimal place.',
      'totalMinutes / 60 gives whole hours because both are int; totalMinutes % 60 gives the leftover minutes.',
      'The format :00 pads a number to two digits: $"{minutes:00}".',
    ],
    solution: `public static class Units
{
    public static double CelsiusToFahrenheit(double celsius) => Math.Round(celsius * 9 / 5 + 32, 1);

    public static string FormatDuration(int totalMinutes)
    {
        int hours = totalMinutes / 60;
        int minutes = totalMinutes % 60;
        return $"{hours}h {minutes:00}m";
    }
}
`,
    testCode: csTests(`
Check("boiling", () => Units.CelsiusToFahrenheit(100), 212.0);
Check("freezing", () => Units.CelsiusToFahrenheit(0), 32.0);
Check("body temperature", () => Units.CelsiusToFahrenheit(37), 98.6);
Check("rounded", () => Units.CelsiusToFahrenheit(21.3), 70.3);
Check("125 minutes", () => Units.FormatDuration(125), "2h 05m");
Check("under an hour", () => Units.FormatDuration(45), "0h 45m");
Check("exact hours", () => Units.FormatDuration(180), "3h 00m");
`),
  },
  {
    id: 'cs-0-04',
    title: 'Invoice Total with Tax',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Invoice.Total(decimal unitPrice, int quantity, decimal taxPercent). Compute the subtotal (unitPrice × quantity), ' +
      'add tax at taxPercent of the subtotal, and round the result to 2 decimal places with halves rounded away from zero ' +
      '(MidpointRounding.AwayFromZero). Use decimal throughout — this is money.',
    starterCode: `public static class Invoice
{
    public static decimal Total(decimal unitPrice, int quantity, decimal taxPercent)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'decimal subtotal = unitPrice * quantity;',
      'Tax is subtotal * taxPercent / 100m — keep the m suffix so the arithmetic stays decimal.',
      'Math.Round(value, 2, MidpointRounding.AwayFromZero)',
    ],
    solution: `public static class Invoice
{
    public static decimal Total(decimal unitPrice, int quantity, decimal taxPercent)
    {
        decimal subtotal = unitPrice * quantity;
        decimal tax = subtotal * taxPercent / 100m;
        return Math.Round(subtotal + tax, 2, MidpointRounding.AwayFromZero);
    }
}
`,
    testCode: csTests(`
Check("no tax", () => Invoice.Total(10.00m, 3, 0m), 30.00m);
Check("15 percent", () => Invoice.Total(19.99m, 2, 15m), 45.98m);
Check("halves round up", () => Invoice.Total(0.05m, 1, 10m), 0.06m);
Check("cents exact", () => Invoice.Total(0.10m, 3, 0m), 0.30m);
Check("zero quantity", () => Invoice.Total(5m, 0, 12.5m), 0m);
`),
  },
  {
    id: 'cs-0-05',
    title: 'Initials from a Full Name',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Names.Initials(string fullName). Return the upper-case first letter of each word followed by a full stop, ' +
      'e.g. "ama serwaa owusu" → "A.S.O.". Words may be separated by several spaces, and there may be spaces at either end. ' +
      'An empty or blank name returns "".',
    starterCode: `public static class Names
{
    public static string Initials(string fullName)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Split(\' \', StringSplitOptions.RemoveEmptyEntries) ignores repeated spaces.',
      'char.ToUpper(word[0]) gives the upper-case first letter.',
      'A StringBuilder or string.Concat works for joining the pieces.',
    ],
    solution: `public static class Names
{
    public static string Initials(string fullName)
    {
        var sb = new StringBuilder();
        foreach (string word in fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            sb.Append(char.ToUpper(word[0])).Append('.');
        return sb.ToString();
    }
}
`,
    testCode: csTests(`
Check("three names", () => Names.Initials("ama serwaa owusu"), "A.S.O.");
Check("extra spaces", () => Names.Initials("  kwame   nkrumah "), "K.N.");
Check("already upper", () => Names.Initials("Yaa Asantewaa"), "Y.A.");
Check("single name", () => Names.Initials("esi"), "E.");
Check("blank", () => Names.Initials("   "), "");
`),
  },
  {
    id: 'cs-0-06',
    title: 'Palindrome Checker',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Text.IsPalindrome(string text): true if the text reads the same forwards and backwards when you ignore case ' +
      'and every character that is not a letter or digit. "Never odd or even" and "A man, a plan, a canal: Panama!" are ' +
      'palindromes. A text with no letters or digits counts as a palindrome.',
    starterCode: `public static class Text
{
    public static bool IsPalindrome(string text)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'First build a cleaned string containing only char.IsLetterOrDigit characters, lower-cased.',
      'Then compare from both ends with two indexes moving towards the middle.',
      'Stop when the indexes meet; any mismatch means false.',
    ],
    solution: `public static class Text
{
    public static bool IsPalindrome(string text)
    {
        var cleaned = new StringBuilder();
        foreach (char c in text)
            if (char.IsLetterOrDigit(c)) cleaned.Append(char.ToLowerInvariant(c));

        for (int left = 0, right = cleaned.Length - 1; left < right; left++, right--)
            if (cleaned[left] != cleaned[right]) return false;
        return true;
    }
}
`,
    testCode: csTests(`
Check("simple", () => Text.IsPalindrome("racecar"), true);
Check("mixed case and spaces", () => Text.IsPalindrome("Never odd or even"), true);
Check("punctuation", () => Text.IsPalindrome("A man, a plan, a canal: Panama!"), true);
Check("not a palindrome", () => Text.IsPalindrome("Accra"), false);
Check("digits", () => Text.IsPalindrome("12321"), true);
Check("no letters", () => Text.IsPalindrome("!!"), true);
Check("near miss", () => Text.IsPalindrome("abca"), false);
`),
  },
  {
    id: 'cs-0-07',
    title: 'Letter Grades with a switch Expression',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Grades.Letter(int score) with a switch expression. 80–100 → "A", 70–79 → "B", 60–69 → "C", 50–59 → "D", ' +
      '0–49 → "F". A score below 0 or above 100 must throw ArgumentOutOfRangeException. Check both sides of every boundary.',
    starterCode: `public static class Grades
{
    public static string Letter(int score)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Put the invalid case first: < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(score)),',
      'Then >= 80 => "A", >= 70 => "B" and so on; arms are tried in order.',
      'The last arm _ => "F" catches the rest.',
    ],
    solution: `public static class Grades
{
    public static string Letter(int score) => score switch
    {
        < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(score)),
        >= 80 => "A",
        >= 70 => "B",
        >= 60 => "C",
        >= 50 => "D",
        _ => "F",
    };
}
`,
    testCode: csTests(`
Check("100", () => Grades.Letter(100), "A");
Check("80 boundary", () => Grades.Letter(80), "A");
Check("79", () => Grades.Letter(79), "B");
Check("70 boundary", () => Grades.Letter(70), "B");
Check("60", () => Grades.Letter(60), "C");
Check("59", () => Grades.Letter(59), "D");
Check("49", () => Grades.Letter(49), "F");
Check("0", () => Grades.Letter(0), "F");
Throws<ArgumentOutOfRangeException>("above 100", () => Grades.Letter(101));
Throws<ArgumentOutOfRangeException>("negative", () => Grades.Letter(-1));
`),
  },
  {
    id: 'cs-0-08',
    title: 'Delivery Fee Rules',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Shipping.Fee(decimal orderTotal, bool isMember). Rules: members never pay delivery. Otherwise orders of 200 or ' +
      'more are free, orders from 100 up to (not including) 200 pay 10, and smaller orders pay 25. A negative orderTotal throws ' +
      'ArgumentOutOfRangeException. Use guard clauses rather than nested ifs.',
    starterCode: `public static class Shipping
{
    public static decimal Fee(decimal orderTotal, bool isMember)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'First guard: if (orderTotal < 0) throw ...',
      'Second guard: if (isMember) return 0m;',
      'Then the price bands from highest to lowest.',
    ],
    solution: `public static class Shipping
{
    public static decimal Fee(decimal orderTotal, bool isMember)
    {
        if (orderTotal < 0) throw new ArgumentOutOfRangeException(nameof(orderTotal));
        if (isMember) return 0m;
        if (orderTotal >= 200m) return 0m;
        if (orderTotal >= 100m) return 10m;
        return 25m;
    }
}
`,
    testCode: csTests(`
Check("member small order", () => Shipping.Fee(20m, true), 0m);
Check("200 is free", () => Shipping.Fee(200m, false), 0m);
Check("199.99", () => Shipping.Fee(199.99m, false), 10m);
Check("100 boundary", () => Shipping.Fee(100m, false), 10m);
Check("99.99", () => Shipping.Fee(99.99m, false), 25m);
Check("zero", () => Shipping.Fee(0m, false), 25m);
Throws<ArgumentOutOfRangeException>("negative total", () => Shipping.Fee(-1m, false));
`),
  },
  {
    id: 'cs-0-09',
    title: 'FizzBuzz as Data',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement FizzBuzz.Sequence(int n), returning a List<string> for the numbers 1 to n: "Fizz" for multiples of 3, "Buzz" ' +
      'for multiples of 5, "FizzBuzz" for multiples of both, otherwise the number itself as text. Return the list rather ' +
      'than printing it — returned data can be tested. n = 0 gives an empty list; a negative n throws ArgumentOutOfRangeException.',
    starterCode: `public static class FizzBuzz
{
    public static List<string> Sequence(int n)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Loop with for (int i = 1; i <= n; i++) — this is one of the few loops that starts at 1.',
      'Check the multiple of 15 (both) before 3 and 5, or the "FizzBuzz" case is never reached.',
      'i.ToString() gives the number as text.',
    ],
    solution: `public static class FizzBuzz
{
    public static List<string> Sequence(int n)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(n);
        var result = new List<string>(n);
        for (int i = 1; i <= n; i++)
        {
            result.Add((i % 3, i % 5) switch
            {
                (0, 0) => "FizzBuzz",
                (0, _) => "Fizz",
                (_, 0) => "Buzz",
                _ => i.ToString(),
            });
        }
        return result;
    }
}
`,
    testCode: csTests(`
CheckSeq("first five", () => FizzBuzz.Sequence(5), ["1", "2", "Fizz", "4", "Buzz"]);
Check("15th is FizzBuzz", () => FizzBuzz.Sequence(15)[14], "FizzBuzz");
Check("count", () => FizzBuzz.Sequence(100).Count, 100);
Check("fizz count to 30", () => FizzBuzz.Sequence(30).Count(s => s == "Fizz"), 8);
CheckSeq("zero", () => FizzBuzz.Sequence(0), []);
Throws<ArgumentOutOfRangeException>("negative", () => FizzBuzz.Sequence(-3));
`),
  },
  {
    id: 'cs-0-10',
    title: 'Digit Sum and Running Statistics',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement two loop methods in Numbers. SumOfDigits(int n) adds the decimal digits of n using a while loop with % 10 and ' +
      '/ 10 (no strings); the sign is ignored, so -472 gives 13. LongestRun(int[] values) returns the length of the longest ' +
      'stretch of consecutive equal values, e.g. [1, 2, 2, 2, 3, 3] → 3; an empty array gives 0.',
    starterCode: `public static class Numbers
{
    public static int SumOfDigits(int n)
    {
        throw new NotImplementedException();
    }

    public static int LongestRun(int[] values)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Make n non-negative first with Math.Abs. (Math.Abs(int.MinValue) overflows — use long if you want to be thorough.)',
      'while (n > 0) { sum += n % 10; n /= 10; }',
      'For LongestRun keep two counters: the current run and the best so far. Reset current to 1 when the value changes.',
    ],
    solution: `public static class Numbers
{
    public static int SumOfDigits(int n)
    {
        long rest = Math.Abs((long)n);
        int sum = 0;
        while (rest > 0)
        {
            sum += (int)(rest % 10);
            rest /= 10;
        }
        return sum;
    }

    public static int LongestRun(int[] values)
    {
        if (values.Length == 0) return 0;
        int best = 1, current = 1;
        for (int i = 1; i < values.Length; i++)
        {
            current = values[i] == values[i - 1] ? current + 1 : 1;
            if (current > best) best = current;
        }
        return best;
    }
}
`,
    testCode: csTests(`
Check("472", () => Numbers.SumOfDigits(472), 13);
Check("negative", () => Numbers.SumOfDigits(-472), 13);
Check("zero", () => Numbers.SumOfDigits(0), 0);
Check("int.MinValue", () => Numbers.SumOfDigits(int.MinValue), 47);
Check("run of three", () => Numbers.LongestRun([1, 2, 2, 2, 3, 3]), 3);
Check("run at end", () => Numbers.LongestRun([5, 1, 1, 1, 1]), 4);
Check("no repeats", () => Numbers.LongestRun([1, 2, 3]), 1);
Check("empty", () => Numbers.LongestRun([]), 0);
`),
  },
  {
    id: 'cs-0-11',
    title: 'Prime Numbers',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement MathUtil.IsPrime(int n) and MathUtil.NextPrime(int n). IsPrime is true only for whole numbers above 1 whose ' +
      'only divisors are 1 and themselves; check divisors only up to the square root. NextPrime returns the smallest prime ' +
      'strictly greater than n, reusing IsPrime — decomposition in practice.',
    starterCode: `public static class MathUtil
{
    public static bool IsPrime(int n)
    {
        throw new NotImplementedException();
    }

    public static int NextPrime(int n)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Guard first: numbers below 2 are not prime.',
      'Loop for (int d = 2; (long)d * d <= n; d++) and return false on any n % d == 0.',
      'NextPrime: start at n + 1 and keep adding 1 until IsPrime is true. For n < 2 the answer is 2.',
    ],
    solution: `public static class MathUtil
{
    public static bool IsPrime(int n)
    {
        if (n < 2) return false;
        for (int d = 2; (long)d * d <= n; d++)
            if (n % d == 0) return false;
        return true;
    }

    public static int NextPrime(int n)
    {
        int candidate = Math.Max(n + 1, 2);
        while (!IsPrime(candidate)) candidate++;
        return candidate;
    }
}
`,
    testCode: csTests(`
Check("2 is prime", () => MathUtil.IsPrime(2), true);
Check("1 is not", () => MathUtil.IsPrime(1), false);
Check("negative", () => MathUtil.IsPrime(-7), false);
Check("97", () => MathUtil.IsPrime(97), true);
Check("91 = 7 x 13", () => MathUtil.IsPrime(91), false);
Check("large prime", () => MathUtil.IsPrime(2_147_483_647), true);
Check("next after 13", () => MathUtil.NextPrime(13), 17);
Check("next after 0", () => MathUtil.NextPrime(0), 2);
Check("next after 89", () => MathUtil.NextPrime(89), 97);
`),
  },
  {
    id: 'cs-0-12',
    title: 'The Try Pattern',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Scores.TryParseScore(string? text, out int score). Return true and set score when the text (ignoring ' +
      'surrounding spaces) is a whole number from 0 to 100. Otherwise return false and set score to 0. Never throw — bad ' +
      'input is normal for this method. This is the same contract as int.TryParse.',
    starterCode: `public static class Scores
{
    public static bool TryParseScore(string? text, out int score)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'int.TryParse already handles null and non-numeric text — call it with text?.Trim().',
      'An out parameter must be assigned on every path, including the failure path.',
      'Combine: if (int.TryParse(...) && score is >= 0 and <= 100) return true;',
    ],
    solution: `public static class Scores
{
    public static bool TryParseScore(string? text, out int score)
    {
        if (int.TryParse(text?.Trim(), out score) && score is >= 0 and <= 100) return true;
        score = 0;
        return false;
    }
}
`,
    testCode: csTests(`
Expect("valid 87", () => Scores.TryParseScore("87", out int s) && s == 87, "expected true with score 87");
Expect("spaces", () => Scores.TryParseScore("  42 ", out int s) && s == 42, "expected true with score 42");
Expect("100 boundary", () => Scores.TryParseScore("100", out int s) && s == 100, "100 is valid");
Expect("0 boundary", () => Scores.TryParseScore("0", out int s) && s == 0, "0 is valid");
Expect("101 rejected", () => !Scores.TryParseScore("101", out int s) && s == 0, "101 must fail and set 0");
Expect("text rejected", () => !Scores.TryParseScore("ninety", out int s) && s == 0, "words must fail");
Expect("null rejected", () => !Scores.TryParseScore(null, out int s) && s == 0, "null must fail without throwing");
Expect("decimal rejected", () => !Scores.TryParseScore("88.5", out _), "fractions are not whole scores");
`),
  },
  {
    id: 'cs-0-13',
    title: 'Word Frequencies with a Dictionary',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Words.Frequencies(string text). Split the text into words on any character that is not a letter or apostrophe, ' +
      'lower-case them, and return a Dictionary<string, int> counting each word. "The cat and THE hat." gives the → 2, cat → 1, ' +
      'and → 1, hat → 1. Also implement Words.MostCommon(string text), returning the most frequent word (ties broken ' +
      'alphabetically), or "" for text with no words.',
    starterCode: `public static class Words
{
    public static Dictionary<string, int> Frequencies(string text)
    {
        throw new NotImplementedException();
    }

    public static string MostCommon(string text)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Walk the characters, building the current word in a StringBuilder; when you meet a separator, finish the word.',
      'counts[word] = counts.GetValueOrDefault(word) + 1;',
      'For MostCommon, OrderByDescending(p => p.Value).ThenBy(p => p.Key).FirstOrDefault() handles ties.',
    ],
    solution: `public static class Words
{
    public static Dictionary<string, int> Frequencies(string text)
    {
        var counts = new Dictionary<string, int>();
        var word = new StringBuilder();
        foreach (char c in text + " ")
        {
            if (char.IsLetter(c) || c == '\\'')
            {
                word.Append(char.ToLowerInvariant(c));
            }
            else if (word.Length > 0)
            {
                string w = word.ToString();
                counts[w] = counts.GetValueOrDefault(w) + 1;
                word.Clear();
            }
        }
        return counts;
    }

    public static string MostCommon(string text) =>
        Frequencies(text)
            .OrderByDescending(p => p.Value)
            .ThenBy(p => p.Key, StringComparer.Ordinal)
            .Select(p => p.Key)
            .FirstOrDefault() ?? "";
}
`,
    testCode: csTests(`
Check("the counted twice", () => Words.Frequencies("The cat and THE hat.")["the"], 2);
Check("distinct words", () => Words.Frequencies("The cat and THE hat.").Count, 4);
Check("punctuation splits", () => Words.Frequencies("one,two;two...three").GetValueOrDefault("two"), 2);
Check("apostrophes kept", () => Words.Frequencies("don't stop, don't").GetValueOrDefault("don't"), 2);
Check("empty text", () => Words.Frequencies("  ").Count, 0);
Check("most common", () => Words.MostCommon("b a b c a b"), "b");
Check("tie alphabetical", () => Words.MostCommon("pear apple pear apple"), "apple");
Check("no words", () => Words.MostCommon("123 !!"), "");
`),
  },
  {
    id: 'cs-0-14',
    title: 'Unique Emails in Order',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Lists.UniqueInOrder(IEnumerable<string> emails). Return a List<string> with duplicates removed, keeping the ' +
      'first occurrence and the original order. Comparison ignores case and surrounding spaces, but the returned value is the ' +
      'trimmed first spelling seen. Blank entries are dropped. Use a HashSet to remember what you have seen.',
    starterCode: `public static class Lists
{
    public static List<string> UniqueInOrder(IEnumerable<string> emails)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'new HashSet<string>(StringComparer.OrdinalIgnoreCase) compares without case.',
      'seen.Add(x) returns false when x was already present — use it as the condition.',
      'Trim each entry before checking it.',
    ],
    solution: `public static class Lists
{
    public static List<string> UniqueInOrder(IEnumerable<string> emails)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<string>();
        foreach (string raw in emails)
        {
            string email = raw.Trim();
            if (email.Length > 0 && seen.Add(email)) result.Add(email);
        }
        return result;
    }
}
`,
    testCode: csTests(`
CheckSeq("duplicates removed", () => Lists.UniqueInOrder(["a@x.com", "b@x.com", "a@x.com"]), ["a@x.com", "b@x.com"]);
CheckSeq("case and spaces", () => Lists.UniqueInOrder(["Ama@Mail.com", " ama@mail.com ", "kofi@mail.com"]), ["Ama@Mail.com", "kofi@mail.com"]);
CheckSeq("blanks dropped", () => Lists.UniqueInOrder(["", "  ", "x@y.z"]), ["x@y.z"]);
CheckSeq("order kept", () => Lists.UniqueInOrder(["c@c", "a@a", "b@b", "a@a"]), ["c@c", "a@a", "b@b"]);
CheckSeq("empty input", () => Lists.UniqueInOrder([]), []);
`),
  },
  {
    id: 'cs-0-15',
    title: 'A Bank Account That Protects Itself',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Complete the BankAccount class. The constructor takes an owner name (not blank, else ArgumentException) and an opening ' +
      'balance (not negative, else ArgumentOutOfRangeException). Deposit(amount) requires amount > 0 (else ArgumentOutOfRangeException). ' +
      'TryWithdraw(amount) requires amount > 0 (else ArgumentOutOfRangeException), returns false without changing anything if the ' +
      'balance is too low, otherwise withdraws and returns true. Balance is readable but cannot be set from outside the class.',
    starterCode: `public class BankAccount
{
    public BankAccount(string owner, decimal openingBalance)
    {
        throw new NotImplementedException();
    }

    public string Owner { get; }
    public decimal Balance { get; private set; }

    public void Deposit(decimal amount)
    {
        throw new NotImplementedException();
    }

    public bool TryWithdraw(decimal amount)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Validate in the constructor before assigning anything.',
      'ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount) is a one-line guard.',
      'In TryWithdraw, check the balance before subtracting so a refused withdrawal changes nothing.',
    ],
    solution: `public class BankAccount
{
    public BankAccount(string owner, decimal openingBalance)
    {
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Owner is required.", nameof(owner));
        ArgumentOutOfRangeException.ThrowIfNegative(openingBalance);
        Owner = owner.Trim();
        Balance = openingBalance;
    }

    public string Owner { get; }
    public decimal Balance { get; private set; }

    public void Deposit(decimal amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);
        Balance += amount;
    }

    public bool TryWithdraw(decimal amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);
        if (amount > Balance) return false;
        Balance -= amount;
        return true;
    }
}
`,
    testCode: csTests(`
Check("opening balance", () => new BankAccount("Ama", 100m).Balance, 100m);
Check("deposit", () => { var a = new BankAccount("Ama", 100m); a.Deposit(50m); return a.Balance; }, 150m);
Check("withdraw ok", () => { var a = new BankAccount("Ama", 100m); return a.TryWithdraw(30m) && a.Balance == 70m; }, true);
Check("withdraw all", () => { var a = new BankAccount("Ama", 100m); return a.TryWithdraw(100m) && a.Balance == 0m; }, true);
Check("refused leaves balance", () => { var a = new BankAccount("Ama", 100m); return !a.TryWithdraw(100.01m) && a.Balance == 100m; }, true);
Throws<ArgumentException>("blank owner", () => new BankAccount("  ", 10m));
Throws<ArgumentOutOfRangeException>("negative opening", () => new BankAccount("Kofi", -1m));
Throws<ArgumentOutOfRangeException>("zero deposit", () => new BankAccount("Kofi", 0m).Deposit(0m));
Throws<ArgumentOutOfRangeException>("negative withdraw", () => new BankAccount("Kofi", 5m).TryWithdraw(-5m));
Expect("Balance has no public setter", () => typeof(BankAccount).GetProperty("Balance")!.SetMethod?.IsPublic != true, "Balance must not be publicly settable");
`),
  },
  {
    id: 'cs-0-16',
    title: 'Library Book Copies',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Complete LibraryBook. It is created with an ISBN, a title and a number of copies (at least 1, else ArgumentOutOfRangeException); ' +
      'all copies start available. TryLend() lends one copy if any are available and returns whether it did. Return() puts one copy ' +
      'back, but throws InvalidOperationException if every copy is already on the shelf. Override ToString to return ' +
      '"<Title> (<available>/<total> available)". The invariant: 0 ≤ Available ≤ TotalCopies, always.',
    starterCode: `public class LibraryBook
{
    public LibraryBook(string isbn, string title, int totalCopies)
    {
        throw new NotImplementedException();
    }

    public string Isbn { get; }
    public string Title { get; }
    public int TotalCopies { get; }
    public int Available { get; private set; }

    public bool TryLend() => throw new NotImplementedException();

    public void Return() => throw new NotImplementedException();

    public override string ToString() => throw new NotImplementedException();
}
`,
    hints: [
      'Set Available = TotalCopies in the constructor.',
      'TryLend: if (Available == 0) return false; Available--; return true;',
      'Return: if (Available == TotalCopies) throw new InvalidOperationException("All copies are already returned.");',
    ],
    solution: `public class LibraryBook
{
    public LibraryBook(string isbn, string title, int totalCopies)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(totalCopies, 1);
        Isbn = isbn;
        Title = title;
        TotalCopies = totalCopies;
        Available = totalCopies;
    }

    public string Isbn { get; }
    public string Title { get; }
    public int TotalCopies { get; }
    public int Available { get; private set; }

    public bool TryLend()
    {
        if (Available == 0) return false;
        Available--;
        return true;
    }

    public void Return()
    {
        if (Available == TotalCopies) throw new InvalidOperationException("All copies are already returned.");
        Available++;
    }

    public override string ToString() => $"{Title} ({Available}/{TotalCopies} available)";
}
`,
    testCode: csTests(`
Check("all available at start", () => new LibraryBook("1", "Clean Code", 2).Available, 2);
Check("lend one", () => { var b = new LibraryBook("1", "Clean Code", 2); b.TryLend(); return b.Available; }, 1);
Check("cannot lend when none left", () => { var b = new LibraryBook("1", "X", 1); b.TryLend(); return b.TryLend(); }, false);
Check("return one", () => { var b = new LibraryBook("1", "X", 2); b.TryLend(); b.Return(); return b.Available; }, 2);
Throws<InvalidOperationException>("return when full", () => new LibraryBook("1", "X", 1).Return());
Throws<ArgumentOutOfRangeException>("zero copies", () => new LibraryBook("1", "X", 0));
Check("ToString", () => { var b = new LibraryBook("1", "Refactoring", 3); b.TryLend(); return b.ToString(); }, "Refactoring (2/3 available)");
`),
  },
  {
    id: 'cs-0-17',
    title: 'Validating Input with Exceptions',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Ages.Parse(string? text). Throw ArgumentException if the text is null or blank, FormatException if it is not a ' +
      'whole number, and ArgumentOutOfRangeException if the number is below 0 or above 150. Otherwise return the age. Each exception ' +
      'message should say what was wrong. Also implement Ages.Describe(string? text), which calls Parse and returns ' +
      '"Age: <n>" on success or "Invalid: <exception message>" for those three exception types only.',
    starterCode: `public static class Ages
{
    public static int Parse(string? text)
    {
        throw new NotImplementedException();
    }

    public static string Describe(string? text)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Check IsNullOrWhiteSpace first, then int.TryParse, then the range.',
      'In Describe, catch the specific exception types — ArgumentException also covers ArgumentOutOfRangeException, its subclass.',
      'catch (Exception e) when (e is ArgumentException or FormatException) is one tidy option.',
    ],
    solution: `public static class Ages
{
    public static int Parse(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) throw new ArgumentException("Age is required.", nameof(text));
        if (!int.TryParse(text.Trim(), out int age)) throw new FormatException($"'{text.Trim()}' is not a whole number.");
        if (age is < 0 or > 150) throw new ArgumentOutOfRangeException(nameof(text), age, "Age must be between 0 and 150.");
        return age;
    }

    public static string Describe(string? text)
    {
        try
        {
            return $"Age: {Parse(text)}";
        }
        catch (Exception e) when (e is ArgumentException or FormatException)
        {
            return $"Invalid: {e.Message}";
        }
    }
}
`,
    testCode: csTests(`
Check("valid", () => Ages.Parse(" 34 "), 34);
Check("zero", () => Ages.Parse("0"), 0);
Throws<ArgumentException>("blank", () => Ages.Parse(" "));
Throws<ArgumentException>("null", () => Ages.Parse(null));
Throws<FormatException>("words", () => Ages.Parse("thirty"));
Throws<ArgumentOutOfRangeException>("too old", () => Ages.Parse("151"));
Throws<ArgumentOutOfRangeException>("negative", () => Ages.Parse("-1"));
Check("describe ok", () => Ages.Describe("20"), "Age: 20");
Expect("describe invalid", () => Ages.Describe("abc").StartsWith("Invalid: "), "expected a message starting with 'Invalid: '");
Expect("describe range", () => Ages.Describe("200").StartsWith("Invalid: "), "out-of-range ages are reported, not thrown");
`),
  },
  {
    id: 'cs-0-18',
    title: 'A Custom Exception for a Wallet',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Create InsufficientFundsException, a subclass of Exception with read-only properties Requested and Available (decimal), ' +
      'whose message is "Requested <Requested:N2> but only <Available:N2> is available.". Then complete Wallet.Pay(decimal amount): ' +
      'amount must be positive (ArgumentOutOfRangeException); if it exceeds the balance throw InsufficientFundsException without ' +
      'changing the balance; otherwise subtract it.',
    starterCode: `public class InsufficientFundsException : Exception
{
    public InsufficientFundsException(decimal requested, decimal available)
        : base("TODO: describe the problem")   // TODO: build the required message
    {
        // TODO: store requested and available in the properties
    }

    public decimal Requested { get; }
    public decimal Available { get; }
}

public class Wallet(decimal balance)
{
    public decimal Balance { get; private set; } = balance;

    public void Pay(decimal amount)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Pass the message to the base constructor: : base($"Requested {requested:N2} but only {available:N2} is available.")',
      'Store the values in get-only properties inside the constructor.',
      'In Pay, throw before subtracting so a failed payment changes nothing.',
    ],
    solution: `public class InsufficientFundsException : Exception
{
    public InsufficientFundsException(decimal requested, decimal available)
        : base($"Requested {requested:N2} but only {available:N2} is available.")
    {
        Requested = requested;
        Available = available;
    }

    public decimal Requested { get; }
    public decimal Available { get; }
}

public class Wallet(decimal balance)
{
    public decimal Balance { get; private set; } = balance;

    public void Pay(decimal amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);
        if (amount > Balance) throw new InsufficientFundsException(amount, Balance);
        Balance -= amount;
    }
}
`,
    testCode: csTests(`
Check("pay", () => { var w = new Wallet(50m); w.Pay(20m); return w.Balance; }, 30m);
Throws<InsufficientFundsException>("too much", () => new Wallet(10m).Pay(10.5m));
Check("message", () => { try { new Wallet(10m).Pay(25m); return ""; } catch (InsufficientFundsException e) { return e.Message; } }, "Requested 25.00 but only 10.00 is available.");
Check("properties", () => { try { new Wallet(10m).Pay(25m); return 0m; } catch (InsufficientFundsException e) { return e.Requested - e.Available; } }, 15m);
Check("balance unchanged", () => { var w = new Wallet(10m); try { w.Pay(25m); } catch (InsufficientFundsException) { } return w.Balance; }, 10m);
Throws<ArgumentOutOfRangeException>("zero amount", () => new Wallet(10m).Pay(0m));
Expect("is an Exception", () => typeof(Exception).IsAssignableFrom(typeof(InsufficientFundsException)), "must derive from Exception");
`),
  },
  {
    id: 'cs-0-19',
    title: 'Saving Contacts as JSON',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Contact is a record with Name and Phone. Implement ContactStore.ToJson(List<Contact>) using System.Text.Json, and ' +
      'ContactStore.FromJson(string? json), which returns the contacts — or an empty list when the input is null, blank, the JSON ' +
      'literal null, or not valid JSON. Then implement Save(path, contacts) and Load(path) using File; Load returns an empty list ' +
      'when the file does not exist. The browser runtime has a real in-memory file system, so these calls work here.',
    starterCode: `using System.Text.Json;

public record Contact(string Name, string Phone);

public static class ContactStore
{
    public static string ToJson(List<Contact> contacts) => throw new NotImplementedException();

    public static List<Contact> FromJson(string? json) => throw new NotImplementedException();

    public static void Save(string path, List<Contact> contacts) => throw new NotImplementedException();

    public static List<Contact> Load(string path) => throw new NotImplementedException();
}
`,
    hints: [
      'JsonSerializer.Serialize(contacts) and JsonSerializer.Deserialize<List<Contact>>(json).',
      'Deserialize returns null for the JSON literal null — use ?? [].',
      'Catch JsonException for invalid JSON and return an empty list.',
      'Load: if (!File.Exists(path)) return [];',
    ],
    solution: `using System.Text.Json;

public record Contact(string Name, string Phone);

public static class ContactStore
{
    public static string ToJson(List<Contact> contacts) => JsonSerializer.Serialize(contacts);

    public static List<Contact> FromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<Contact>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static void Save(string path, List<Contact> contacts) => File.WriteAllText(path, ToJson(contacts));

    public static List<Contact> Load(string path) => File.Exists(path) ? FromJson(File.ReadAllText(path)) : [];
}
`,
    testCode: csTests(`
List<Contact> sample = [new("Ama", "024 111 2222"), new("Kofi", "020 333 4444")];
CheckSeq("round trip", () => ContactStore.FromJson(ContactStore.ToJson(sample)), sample);
Expect("json mentions names", () => ContactStore.ToJson(sample).Contains("\\"Ama\\""), "the JSON should contain the name Ama");
Check("null input", () => ContactStore.FromJson(null).Count, 0);
Check("json null", () => ContactStore.FromJson("null").Count, 0);
Check("invalid json", () => ContactStore.FromJson("{not json").Count, 0);
Check("missing file", () => ContactStore.Load("does-not-exist-" + Guid.NewGuid() + ".json").Count, 0);
CheckSeq("save then load", () => { string p = "contacts-" + Guid.NewGuid() + ".json"; ContactStore.Save(p, sample); return ContactStore.Load(p); }, sample);
`),
  },
  {
    id: 'cs-0-20',
    title: 'Parsing a CSV of Results',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Results.Parse(string[] lines) for a CSV export whose first line is the header "name,score". Return a ParseReport ' +
      'record containing the valid rows as a List<StudentScore> (Name trimmed, Score 0–100) and a List<int> of the 1-based line ' +
      'numbers that were invalid: wrong number of fields, blank name, or a score that is not a whole number in range. Blank lines ' +
      'are skipped silently and are not errors. A program that reports what it skipped is far easier to trust than one that ' +
      'quietly drops data.',
    starterCode: `public record StudentScore(string Name, int Score);

public record ParseReport(List<StudentScore> Rows, List<int> BadLines);

public static class Results
{
    public static ParseReport Parse(string[] lines)
    {
        throw new NotImplementedException();
    }
}
`,
    hints: [
      'Start the loop at index 1 to skip the header; the human line number is index + 1.',
      'line.Split(\',\') must give exactly 2 parts.',
      'Reuse the TryParse idea: int.TryParse(parts[1].Trim(), out int score) && score is >= 0 and <= 100.',
    ],
    solution: `public record StudentScore(string Name, int Score);

public record ParseReport(List<StudentScore> Rows, List<int> BadLines);

public static class Results
{
    public static ParseReport Parse(string[] lines)
    {
        var rows = new List<StudentScore>();
        var bad = new List<int>();
        for (int i = 1; i < lines.Length; i++)
        {
            string line = lines[i];
            if (string.IsNullOrWhiteSpace(line)) continue;
            string[] parts = line.Split(',');
            string name = parts.Length == 2 ? parts[0].Trim() : "";
            if (parts.Length == 2 && name.Length > 0
                && int.TryParse(parts[1].Trim(), out int score) && score is >= 0 and <= 100)
                rows.Add(new StudentScore(name, score));
            else
                bad.Add(i + 1);
        }
        return new ParseReport(rows, bad);
    }
}
`,
    testCode: csTests(`
string[] csv = ["name,score", "Ama, 88", "", "Kofi,abc", " ,70", "Esi,101", "Yaw,55,extra", "Akos,0"];
CheckSeq("valid rows", () => Results.Parse(csv).Rows, [new StudentScore("Ama", 88), new StudentScore("Akos", 0)]);
CheckSeq("bad line numbers", () => Results.Parse(csv).BadLines, [4, 5, 6, 7]);
Check("header only", () => Results.Parse(["name,score"]).Rows.Count, 0);
Check("empty file", () => Results.Parse([]).BadLines.Count, 0);
`),
  },
];
