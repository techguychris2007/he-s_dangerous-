/** C# source for a `Dependencies` helper that architecture tests prepend to their test code.
 *
 *    Dependencies.Of(type)        every type `type` uses: fields, properties, constructor and method signatures,
 *                                 base type, interfaces, locals, and each type/method/field token in its IL —
 *                                 so `new Concrete().Call()` inside an async method body is caught too
 *    Dependencies.Outer(type)     the outermost declaring type (maps closures and state machines to their owner)
 *    Dependencies.Named(type)     a readable name for messages
 *
 *  Nested compiler-generated types share their owner's namespace, so scanning every type in a namespace covers
 *  lambdas and async methods. Uses only fully qualified names, so the test file needs no using directives. */
export const CS_DEPENDENCY_SCAN = `static class Dependencies
{
    const System.Reflection.BindingFlags All = System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic |
        System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.DeclaredOnly;

    static readonly Dictionary<short, System.Reflection.Emit.OpCode> Codes = typeof(System.Reflection.Emit.OpCodes)
        .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
        .Select(f => (System.Reflection.Emit.OpCode)f.GetValue(null)!).ToDictionary(o => o.Value);

    public static Type Outer(Type t) => t.DeclaringType is null ? t : Outer(t.DeclaringType);

    public static string Named(Type t) => t.FullName ?? t.Name;

    public static IEnumerable<Type> Of(Type t) =>
        t.GetFields(All).Select(f => f.FieldType)
            .Concat(t.GetProperties(All).Select(p => p.PropertyType))
            .Concat(t.GetConstructors(All).SelectMany(c => c.GetParameters().Select(p => p.ParameterType).Concat(Body(c))))
            .Concat(t.GetMethods(All).SelectMany(m => m.GetParameters().Select(p => p.ParameterType).Append(m.ReturnType).Concat(Body(m))))
            .Concat(t.GetInterfaces())
            .Append(t.BaseType ?? typeof(object))
            .SelectMany(Expand)
            .Distinct();

    static IEnumerable<Type> Expand(Type t)
    {
        if (t.HasElementType) { foreach (var x in Expand(t.GetElementType()!)) yield return x; yield break; }
        yield return t;
        if (t.IsGenericType) foreach (var arg in t.GetGenericArguments()) foreach (var x in Expand(arg)) yield return x;
    }

    static List<Type> Body(System.Reflection.MethodBase m)
    {
        var found = new List<Type>();
        try
        {
            var body = m.GetMethodBody();
            if (body is null) return found;
            found.AddRange(body.LocalVariables.Select(v => v.LocalType));
            byte[] il = body.GetILAsByteArray() ?? [];
            for (int i = 0; i < il.Length;)
            {
                short value = il[i] == 0xFE ? (short)(0xFE00 | il[i + 1]) : il[i];
                i += il[i] == 0xFE ? 2 : 1;
                if (!Codes.TryGetValue(value, out var op)) break;
                switch (op.OperandType)
                {
                    case System.Reflection.Emit.OperandType.InlineMethod or System.Reflection.Emit.OperandType.InlineField
                        or System.Reflection.Emit.OperandType.InlineType or System.Reflection.Emit.OperandType.InlineTok:
                        try
                        {
                            var member = m.Module.ResolveMember(BitConverter.ToInt32(il, i),
                                m.DeclaringType?.GetGenericArguments(), m.IsGenericMethod ? m.GetGenericArguments() : null);
                            if (member is Type type) found.Add(type);
                            else if (member?.DeclaringType is { } owner) found.Add(owner);
                            if (member is System.Reflection.FieldInfo field) found.Add(field.FieldType);
                        }
                        catch (Exception) { }
                        i += 4;
                        break;
                    case System.Reflection.Emit.OperandType.InlineSwitch: i += 4 + 4 * BitConverter.ToInt32(il, i); break;
                    case System.Reflection.Emit.OperandType.InlineI8 or System.Reflection.Emit.OperandType.InlineR: i += 8; break;
                    case System.Reflection.Emit.OperandType.InlineNone: break;
                    case System.Reflection.Emit.OperandType.ShortInlineBrTarget or System.Reflection.Emit.OperandType.ShortInlineI
                        or System.Reflection.Emit.OperandType.ShortInlineVar: i += 1; break;
                    case System.Reflection.Emit.OperandType.InlineVar: i += 2; break;
                    default: i += 4; break;
                }
            }
        }
        catch (Exception) { }
        return found;
    }
}
`;
