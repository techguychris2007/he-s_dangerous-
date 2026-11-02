/** Wraps C# check statements in the TestRunner class every C# task's test code uses. Each check runs
 *  in its own try/catch, so an exception thrown by the learner's code fails that one check with the
 *  exception's message instead of stopping the run, and the final line is always the
 *  "__RESULT__ passed/total" summary the result parser reads.
 *
 *  Available inside `body`:
 *    Check("name", () => actual, expected)            equality (Equals)
 *    CheckSeq("name", () => actualSequence, expected)  element-by-element equality
 *    Expect("name", () => condition, "what was wrong") any boolean condition
 *    Throws<TException>("name", () => action)          the action must throw TException
 *    await CheckAsync("name", async () => actual, expected)     the same, for async code
 *    await ExpectAsync("name", async () => condition, "what was wrong")
 *    await ThrowsAsync<TException>("name", async () => await action)
 *  Main is async, so tests may await; blocking with .Result is impossible on the browser runtime.
 */
export function csTests(body: string): string {
  return `static class TestRunner
{
    static int passed, total;

    static string Show(object? value) => value switch
    {
        null => "null",
        string s => "\\"" + s + "\\"",
        System.Collections.IEnumerable items => "[" + string.Join(", ", items.Cast<object?>().Select(Show)) + "]",
        _ => value.ToString() ?? "",
    };

    static void Record(string name, bool ok, string detail)
    {
        total++;
        if (ok) passed++;
        Console.WriteLine((ok ? "[PASS] " : "[FAIL] ") + name + (detail.Length > 0 ? ": " + detail : ""));
    }

    static string Crash(Exception e) => "threw " + e.GetType().Name + ": " + e.Message;

    static void Check<T>(string name, Func<T> actual, T expected)
    {
        try
        {
            var value = actual();
            var ok = EqualityComparer<T>.Default.Equals(value, expected);
            Record(name, ok, ok ? "" : "got " + Show(value) + ", expected " + Show(expected));
        }
        catch (Exception e) { Record(name, false, Crash(e)); }
    }

    static void CheckSeq<T>(string name, Func<IEnumerable<T>?> actual, IEnumerable<T> expected)
    {
        try
        {
            var value = actual()?.ToList();
            var ok = value is not null && value.SequenceEqual(expected);
            Record(name, ok, ok ? "" : "got " + Show(value) + ", expected " + Show(expected.ToList()));
        }
        catch (Exception e) { Record(name, false, Crash(e)); }
    }

    static void Expect(string name, Func<bool> condition, string whenFalse)
    {
        try { var ok = condition(); Record(name, ok, ok ? "" : whenFalse); }
        catch (Exception e) { Record(name, false, Crash(e)); }
    }

    static void Throws<TException>(string name, Action action) where TException : Exception
    {
        try { action(); Record(name, false, "expected " + typeof(TException).Name + " but nothing was thrown"); }
        catch (TException) { Record(name, true, ""); }
        catch (Exception e) { Record(name, false, "expected " + typeof(TException).Name + " but " + Crash(e)); }
    }

    static async Task CheckAsync<T>(string name, Func<Task<T>> actual, T expected)
    {
        try
        {
            var value = await actual();
            var ok = EqualityComparer<T>.Default.Equals(value, expected);
            Record(name, ok, ok ? "" : "got " + Show(value) + ", expected " + Show(expected));
        }
        catch (Exception e) { Record(name, false, Crash(e)); }
    }

    static async Task ExpectAsync(string name, Func<Task<bool>> condition, string whenFalse)
    {
        try { var ok = await condition(); Record(name, ok, ok ? "" : whenFalse); }
        catch (Exception e) { Record(name, false, Crash(e)); }
    }

    static async Task ThrowsAsync<TException>(string name, Func<Task> action) where TException : Exception
    {
        try { await action(); Record(name, false, "expected " + typeof(TException).Name + " but nothing was thrown"); }
        catch (TException) { Record(name, true, ""); }
        catch (Exception e) { Record(name, false, "expected " + typeof(TException).Name + " but " + Crash(e)); }
    }

    public static async Task Main()
    {
${body.trim().split('\n').map(line => '        ' + line).join('\n')}
        await Task.CompletedTask;
        Console.WriteLine($"__RESULT__ {passed}/{total}");
    }
}
`;
}
