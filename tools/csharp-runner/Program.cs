using System.Reflection;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Loader;
using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

// The WebAssembly host needs an entry point; all real work happens through the JSExport below.
Console.WriteLine("csharp-runner ready");

public sealed record SourceFile(string Path, string Content);

public sealed record RunRequest(SourceFile[] Files, string? MainType, string Stdin);

public sealed record Diagnostic(string Path, int Line, int Column, string Severity, string Id, string Message);

public sealed record RunResponse(bool Compiled, bool Ok, string Stdout, string Stderr, Diagnostic[] Diagnostics);

public static partial class Runner
{
    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    // Framework assemblies learner code may compile against. They are loaded once, and their
    // in-memory metadata becomes Roslyn's reference set (no files exist on disk in the browser).
    static readonly string[] ReferenceAssemblies =
    [
        "System.Private.CoreLib", "System.Runtime", "netstandard", "System.Console",
        "System.Collections", "System.Collections.Concurrent", "System.Collections.Immutable",
        "System.Linq", "System.Linq.Expressions", "System.Text.RegularExpressions",
        "System.Text.Json", "System.Text.Encodings.Web", "System.Memory", "System.Runtime.Numerics",
        "System.ComponentModel.Primitives", "System.ComponentModel.Annotations",
        "System.Threading", "System.Threading.Tasks", "System.Threading.Channels", "System.IO",
        "System.Diagnostics.Debug", "System.ObjectModel", "System.Runtime.InteropServices",
        "System.Security.Cryptography", "System.Private.Uri", "System.Net.Primitives",
        "System.Security.Claims", "System.Web.HttpUtility", "System.Collections.Specialized",
    ];

    static List<MetadataReference>? references;

    static unsafe List<MetadataReference> References()
    {
        if (references is not null) return references;
        var list = new List<MetadataReference>();
        foreach (var name in ReferenceAssemblies)
        {
            Assembly assembly;
            try { assembly = Assembly.Load(name); } catch { continue; }
            if (System.Reflection.Metadata.AssemblyExtensions.TryGetRawMetadata(assembly, out var blob, out var length))
            {
                var module = ModuleMetadata.CreateFromMetadata((nint)blob, length);
                list.Add(AssemblyMetadata.Create(module).GetReference(display: name));
            }
        }
        return references = list;
    }

    static readonly string[] GlobalUsings =
    [
        "System", "System.Collections.Generic", "System.IO", "System.Linq",
        "System.Threading", "System.Threading.Tasks", "System.Text",
    ];

    /// <summary>Compiles every file into one console program and runs its entry point with the
    /// console redirected. Never throws: compile errors and exceptions come back in the response.</summary>
    [JSExport]
    public static async Task<string> RunAsync(string requestJson)
    {
        var request = JsonSerializer.Deserialize<RunRequest>(requestJson, Json)!;
        var parse = new CSharpParseOptions(LanguageVersion.Latest);
        var usings = CSharpSyntaxTree.ParseText(
            string.Join('\n', GlobalUsings.Select(u => $"global using {u};")), parse, "GlobalUsings.g.cs");
        var trees = request.Files
            .Select(f => CSharpSyntaxTree.ParseText(f.Content, parse, f.Path, Encoding.UTF8))
            .Prepend(usings)
            .ToList();

        var options = new CSharpCompilationOptions(
            OutputKind.ConsoleApplication,
            mainTypeName: request.MainType,
            nullableContextOptions: NullableContextOptions.Enable,
            optimizationLevel: OptimizationLevel.Debug,
            concurrentBuild: false);
        var compilation = CSharpCompilation.Create("Learner", trees, References(), options);

        using var peStream = new MemoryStream();
        var emit = compilation.Emit(peStream);
        var diagnostics = emit.Diagnostics
            .Where(d => d.Severity is DiagnosticSeverity.Error or DiagnosticSeverity.Warning)
            // Nullable warnings drown out real problems for learners; keep errors and other warnings.
            .Where(d => d.Severity == DiagnosticSeverity.Error || !d.Id.StartsWith("CS86"))
            .Select(ToDiagnostic)
            .OrderBy(d => d.Severity == "error" ? 0 : 1)
            .Take(50)
            .ToArray();
        if (!emit.Success && emit.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error).All(d => d.Id == "CS5001"))
        {
            // Only "no Main method": the learner wrote classes for the tests to call. That is a
            // successful build of a library, not an error.
            var library = compilation.WithOptions(options.WithOutputKind(OutputKind.DynamicallyLinkedLibrary));
            using var libraryStream = new MemoryStream();
            if (library.Emit(libraryStream).Success)
                return Serialize(new RunResponse(true, true,
                    "Build succeeded. This code has no Main method, so there is nothing to run on its own — press Run tests to check it.\n",
                    "", diagnostics.Where(d => d.Id != "CS5001").ToArray()));
        }
        if (!emit.Success)
            return Serialize(new RunResponse(false, false, "", "", diagnostics));

        var stdout = new StringWriter();
        var originalOut = Console.Out;
        var originalError = Console.Error;
        Console.SetOut(stdout);
        Console.SetError(stdout);
        SetStdin(request.Stdin ?? "");
        var context = new AssemblyLoadContext("learner", isCollectible: true);
        string stderr = "";
        bool ok = true;
        try
        {
            peStream.Position = 0;
            var assembly = context.LoadFromStream(peStream);
            var entry = AwaitableEntryPoint(assembly.EntryPoint ?? throw new InvalidOperationException("The program has no entry point."));
            object?[]? args = entry.GetParameters().Length == 0 ? null : [Array.Empty<string>()];
            var returned = entry.Invoke(null, args);
            if (returned is Task task) await task;
            if (returned is int code && code != 0) { ok = false; stderr = $"Process exited with code {code}."; }
            if (returned is Task<int> codeTask && codeTask.Result != 0) { ok = false; stderr = $"Process exited with code {codeTask.Result}."; }
        }
        catch (Exception ex)
        {
            ok = false;
            var inner = ex is TargetInvocationException { InnerException: { } e } ? e : ex;
            stderr = FormatException(inner);
        }
        finally
        {
            Console.SetOut(originalOut);
            Console.SetError(originalError);
            SetStdin("");
            context.Unload();
        }
        return Serialize(new RunResponse(true, ok, stdout.ToString(), stderr, diagnostics));
    }

    /// <summary>For `async Task Main` and top-level `await`, the compiler's entry point is a
    /// synthesized `&lt;Main&gt;` that blocks on the task — impossible on the single-threaded browser
    /// runtime. Return the async method it wraps so the runner can await it instead.</summary>
    static MethodInfo AwaitableEntryPoint(MethodInfo entry)
    {
        if (entry.Name != "<Main>" || entry.DeclaringType is null) return entry;
        const BindingFlags all = BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
        return entry.DeclaringType.GetMethods(all).FirstOrDefault(m =>
                   m.Name is "<Main>$" or "Main" && typeof(Task).IsAssignableFrom(m.ReturnType))
               ?? entry;
    }

    /// <summary>Compiles and runs a trivial program so Roslyn's first, slow JIT pass happens while
    /// the runtime boots rather than on the learner's first click.</summary>
    [JSExport]
    public static Task<string> WarmUpAsync() =>
        RunAsync("""{"files":[{"path":"WarmUp.cs","content":"System.Console.WriteLine(new[] { 1 }.Sum());"}],"stdin":""}""");

    /// <summary>Feeds Console.ReadLine from the text the learner typed into the input box. The browser
    /// host has no interactive terminal, so standard input is always supplied up front.</summary>
    static void SetStdin(string text)
    {
        try { Console.SetIn(new StringReader(text)); } catch (PlatformNotSupportedException) { }
    }

    static Diagnostic ToDiagnostic(Microsoft.CodeAnalysis.Diagnostic d)
    {
        var span = d.Location.GetMappedLineSpan();
        return new Diagnostic(
            span.Path ?? "",
            span.StartLinePosition.Line + 1,
            span.StartLinePosition.Character + 1,
            d.Severity == DiagnosticSeverity.Error ? "error" : "warning",
            d.Id,
            d.GetMessage());
    }

    /// <summary>"Unhandled exception" plus the learner's own frames only — runtime and reflection
    /// frames add nothing a beginner can act on.</summary>
    static string FormatException(Exception ex)
    {
        var lines = new List<string> { $"Unhandled exception. {ex.GetType().FullName}: {ex.Message}" };
        foreach (var line in (ex.StackTrace ?? "").Split('\n'))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.Contains("System.Reflection") || trimmed.Contains("System.Runtime")) continue;
            lines.Add("   " + trimmed);
        }
        return string.Join('\n', lines);
    }

    static string Serialize(RunResponse response) => JsonSerializer.Serialize(response, Json);
}
