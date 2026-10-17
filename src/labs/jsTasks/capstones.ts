import type { CodeTask } from '../codeTypes';

/** Capstone-tier JavaScript tasks: real building blocks pulled out of what an actual web framework or
 *  templating library does internally, built from several cooperating pieces rather than one method —
 *  bigger in scope and test surface than the Fundamentals/Crypto/OOP catalogs, still single-file. */
export const JS_CAPSTONE_TASKS: CodeTask[] = [
  {
    id: 'js-capstone-01',
    title: 'Capstone: A Mini HTTP Router',
    difficulty: 'Hard',
    language: 'javascript',
    category: 'Capstone',
    prompt:
      'Build the path-matching core every web framework (Express, Flask, Django — all of them) is ' +
      'actually built on: a Router class that registers routes with named parameters and matches an ' +
      'incoming method + path against them.\n\n' +
      'Write a class Router with:\n\n' +
      '- register(method, pattern, handler) — stores a route. `pattern` looks like "/users/:id" or ' +
      '"/users/:id/posts/:postId", where any segment starting with ":" is a named parameter that ' +
      'matches any single path segment.\n\n' +
      '- match(method, path) — checks every registered route (method must match exactly, case-' +
      'insensitively, and the path must have the SAME NUMBER of segments as the pattern) and returns ' +
      'the FIRST one that matches, as { handler, params }, where params is an object mapping each ' +
      '":name" segment to the actual path segment found in that position. Returns null if nothing ' +
      'matches — including when the path has the right prefix but a different number of segments, or ' +
      'the right segments but the wrong method.\n\n' +
      'This "split into segments, compare position by position, collect :params into an object" ' +
      'approach is genuinely how real routers (Express\'s path-to-regexp included) work under the hood.',
    starterCode:
      'class Router {\n' +
      '  constructor() {\n' +
      '    // TODO: set up storage for registered routes\n' +
      '  }\n' +
      '\n' +
      '  register(method, pattern, handler) {\n' +
      '    // TODO: split pattern into segments (filter out empty strings from leading/trailing "/")\n' +
      '    // and store { method, segments, handler }\n' +
      '  }\n' +
      '\n' +
      '  match(method, path) {\n' +
      '    // TODO: split path into segments the same way, then find the first registered route whose\n' +
      '    // method matches (case-insensitively) and whose segments are the same length and match\n' +
      '    // position-by-position (a ":name" segment matches anything and captures into params).\n' +
      '    // Return { handler, params } or null.\n' +
      '  }\n' +
      '}\n',
    hints: [
      'this.routes = [] in the constructor; register just pushes { method: method.toUpperCase(), segments: pattern.split("/").filter(Boolean), handler }.',
      'In match, split path the same way: path.split("/").filter(Boolean) — filter(Boolean) is what drops the empty strings you\'d otherwise get from a leading or trailing "/".',
      'Skip a route immediately if route.method !== method.toUpperCase() or route.segments.length !== pathSegments.length — no need to compare segments at all in that case.',
      'Otherwise walk both segment arrays together: if a route segment starts with ":", store params[segment.slice(1)] = correspondingPathSegment; otherwise the two segments must be === equal or this route does not match.',
      'Return as soon as you find a fully-matching route — { handler: route.handler, params } — and return null only after checking every route with no match.',
    ],
    solution:
      'class Router {\n' +
      '  constructor() {\n' +
      '    this.routes = [];\n' +
      '  }\n' +
      '\n' +
      '  register(method, pattern, handler) {\n' +
      '    const segments = pattern.split("/").filter(Boolean);\n' +
      '    this.routes.push({ method: method.toUpperCase(), segments, handler });\n' +
      '  }\n' +
      '\n' +
      '  match(method, path) {\n' +
      '    const pathSegments = path.split("/").filter(Boolean);\n' +
      '    for (const route of this.routes) {\n' +
      '      if (route.method !== method.toUpperCase()) continue;\n' +
      '      if (route.segments.length !== pathSegments.length) continue;\n' +
      '      const params = {};\n' +
      '      let matched = true;\n' +
      '      for (let i = 0; i < route.segments.length; i++) {\n' +
      '        const seg = route.segments[i];\n' +
      '        if (seg.startsWith(":")) {\n' +
      '          params[seg.slice(1)] = pathSegments[i];\n' +
      '        } else if (seg !== pathSegments[i]) {\n' +
      '          matched = false;\n' +
      '          break;\n' +
      '        }\n' +
      '      }\n' +
      '      if (matched) return { handler: route.handler, params };\n' +
      '    }\n' +
      '    return null;\n' +
      '  }\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = actual === expected;\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + actual + ", expected " + expected);\n' +
      '}\n\n' +
      'const r = new Router();\n' +
      'r.register("GET", "/users/:id", () => "one user");\n' +
      'r.register("GET", "/users/:id/posts/:postId", () => "one post");\n' +
      'r.register("POST", "/users", () => "create user");\n\n' +
      'const m1 = r.match("GET", "/users/42");\n' +
      'check("simple param match: not null", m1 !== null, true);\n' +
      'check("simple param match: id captured", m1 && m1.params.id, "42");\n\n' +
      'const m2 = r.match("GET", "/users/42/posts/7");\n' +
      'check("two-param match: id captured", m2 && m2.params.id, "42");\n' +
      'check("two-param match: postId captured", m2 && m2.params.postId, "7");\n\n' +
      'const m3 = r.match("post", "/users");\n' +
      'check("method match is case-insensitive", m3 !== null, true);\n' +
      'check("exact route with no params: empty params object", m3 && Object.keys(m3.params).length, 0);\n\n' +
      'check("wrong segment count does not match", r.match("GET", "/users"), null);\n' +
      'check("right path, wrong method does not match", r.match("DELETE", "/users/42"), null);\n' +
      'check("completely unregistered path does not match", r.match("GET", "/nothing/here"), null);\n\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-capstone-02',
    title: 'Capstone: A Mustache-Style Templating Engine',
    difficulty: 'Hard',
    language: 'javascript',
    category: 'Capstone',
    prompt:
      'Build a small templating engine supporting the same three constructs real ones (Mustache, ' +
      'Handlebars) are built on: plain variable interpolation, conditional blocks, and loops.\n\n' +
      'Write function render(template, data) supporting:\n\n' +
      '- {{name}} — replaced with data.name (or the empty string if that key is missing/null/undefined).\n\n' +
      '- {{#if cond}}...{{/if}} — the content between the tags is included only if data.cond is truthy, ' +
      'otherwise the whole block (tags included) is removed.\n\n' +
      '- {{#each items}}...{{/each}} — data.items must be an array; the content between the tags is ' +
      'repeated once per array element, and inside each repetition {{this}} refers to that element.\n\n' +
      'Process {{#each}} blocks first, then {{#if}} blocks, then plain {{var}} interpolation last — in ' +
      'that order, on the same pass, so a variable or condition INSIDE a loop\'s repeated content is ' +
      'still resolved correctly against that specific loop iteration\'s data.',
    starterCode:
      'function render(template, data) {\n' +
      '  // TODO: 1) replace every {{#each key}}...{{/each}} block: for each item in data[key], render\n' +
      '  //         the inner content with a data object that also has `this` set to that item, and\n' +
      '  //         concatenate all the results\n' +
      '  // TODO: 2) replace every {{#if key}}...{{/if}} block: keep (and render) the inner content only\n' +
      '  //         if data[key] is truthy, otherwise remove the whole block\n' +
      '  // TODO: 3) replace every remaining {{key}} with data[key] (or "" if missing/null/undefined)\n' +
      '  return template;\n' +
      '}\n',
    hints: [
      'A regex like /\\{\\{#each (\\w+)\\}\\}([\\s\\S]*?)\\{\\{\\/each\\}\\}/g finds each-blocks: group 1 is the array key, group 2 is the inner content ([\\s\\S]*? matches across newlines, non-greedily so nested blocks in different loops don\'t merge).',
      'template.replace(regex, (match, key, inner) => { ... }) lets you return the replacement for each match — for #each, that\'s data[key].map(item => render(inner, { ...data, this: item })).join("").',
      'The same replace-with-a-function approach handles #if: /\\{\\{#if (\\w+)\\}\\}([\\s\\S]*?)\\{\\{\\/if\\}\\}/g, returning render(inner, data) if data[key] is truthy, or "" otherwise.',
      'Do the #each replacement first, then #if, then finally plain {{key}} interpolation with /\\{\\{(\\w+)\\}\\}/g — each step\'s regex only needs to look for its own tag names, since the previous steps already consumed theirs.',
      'For plain interpolation, watch for null/undefined specifically (not just falsy) — a value of 0 or false should still print as "0"/"false", only missing/null/undefined should become "".',
    ],
    solution:
      'function render(template, data) {\n' +
      '  template = template.replace(/\\{\\{#each (\\w+)\\}\\}([\\s\\S]*?)\\{\\{\\/each\\}\\}/g, (match, key, inner) => {\n' +
      '    const arr = data[key];\n' +
      '    if (!Array.isArray(arr)) return "";\n' +
      '    return arr.map((item) => render(inner, { ...data, this: item })).join("");\n' +
      '  });\n\n' +
      '  template = template.replace(/\\{\\{#if (\\w+)\\}\\}([\\s\\S]*?)\\{\\{\\/if\\}\\}/g, (match, key, inner) => {\n' +
      '    return data[key] ? render(inner, data) : "";\n' +
      '  });\n\n' +
      '  template = template.replace(/\\{\\{(\\w+)\\}\\}/g, (match, key) => {\n' +
      '    const val = data[key];\n' +
      '    return val === undefined || val === null ? "" : String(val);\n' +
      '  });\n\n' +
      '  return template;\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = actual === expected;\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n\n' +
      'check("plain interpolation", render("Hello {{name}}!", { name: "Alice" }), "Hello Alice!");\n' +
      'check("missing key becomes empty string", render("Hi {{name}}", {}), "Hi ");\n' +
      'check("falsy-but-defined value 0 still prints", render("Count: {{n}}", { n: 0 }), "Count: 0");\n\n' +
      'check("#if true keeps content", render("{{#if isAdmin}}Welcome, admin.{{/if}}", { isAdmin: true }), "Welcome, admin.");\n' +
      'check("#if false removes content", render("{{#if isAdmin}}Welcome, admin.{{/if}}", { isAdmin: false }), "");\n\n' +
      'check("#each repeats and resolves {{this}}", render("{{#each items}}[{{this}}]{{/each}}", { items: ["a", "b", "c"] }), "[a][b][c]");\n' +
      'check("#each on empty array produces nothing", render("{{#each items}}[{{this}}]{{/each}}", { items: [] }), "");\n\n' +
      'check(\n' +
      '  "combined: interpolation + #if together",\n' +
      '  render("{{greeting}}, {{name}}! {{#if vip}}VIP access.{{/if}}", { greeting: "Hi", name: "Bob", vip: true }),\n' +
      '  "Hi, Bob! VIP access.",\n' +
      ');\n\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
];
