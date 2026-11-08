import type { CodeTask } from '../codeTypes';

const CATEGORY = 'Month 5 · Cloud & DevOps';

/** Shared grader preamble for Dockerfile tasks. Graders avoid backslashes and template strings so
 *  they survive being embedded in these TypeScript template literals unchanged. */
const DOCKER_HELPERS = `import { describe, it, expect } from 'vitest';
import { readFile, parseDockerfile, type DockerInstruction, type DockerStage } from 'dw:project';

const docker = parseDockerfile(readFile('Dockerfile'));
function need<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}
const finalStage = (): DockerStage => need(docker.stages[docker.stages.length - 1], 'The Dockerfile has no FROM instruction.');
const words = (i: DockerInstruction): string[] => i.json ?? i.args.split(' ');
function option(ws: string[], names: string[]): string | undefined {
  for (let k = 0; k < ws.length; k++) {
    for (const n of names) {
      if (ws[k] === n) return ws[k + 1];
      if (ws[k].startsWith(n + '=')) return ws[k].slice(n.length + 1);
    }
  }
  return undefined;
}
const trimSlash = (p: string): string => (p.length > 1 && p.endsWith('/') ? trimSlash(p.slice(0, -1)) : p);
const of = (s: DockerStage, name: string) => s.instructions.filter((i) => i.instruction === name);
const lastIndex = (s: DockerStage, test: (i: DockerInstruction) => boolean) => {
  let at = -1;
  s.instructions.forEach((i, k) => { if (test(i)) at = k; });
  return at;
};
`;

/** Shared grader preamble for Compose tasks: normalises the short and long syntaxes Compose accepts. */
const COMPOSE_HELPERS = `import { describe, it, expect } from 'vitest';
import { readFile, parseYaml } from 'dw:project';

const parsed = parseYaml(readFile('compose.yaml'));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = any;
const doc: Data = parsed.ok && parsed.value && typeof parsed.value === 'object' ? parsed.value : {};
const services: Record<string, Data> = doc.services && typeof doc.services === 'object' ? doc.services : {};
const svc = (name: string): Data => services[name] ?? {};
function envOf(s: Data): Record<string, string> {
  const e = s.environment;
  if (!e) return {};
  if (Array.isArray(e)) {
    return Object.fromEntries(e.map((x: unknown) => {
      const t = String(x);
      const k = t.indexOf('=');
      return k < 0 ? [t, ''] : [t.slice(0, k), t.slice(k + 1)];
    }));
  }
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)]));
}
const names = (v: Data): string[] => (Array.isArray(v) ? v.map((x: Data) => (typeof x === 'string' ? x : String(x.source ?? x.target ?? ''))) : v && typeof v === 'object' ? Object.keys(v) : []);
function dependsOn(s: Data): Record<string, string> {
  const d = s.depends_on;
  if (Array.isArray(d)) return Object.fromEntries(d.map((n: unknown) => [String(n), 'service_started']));
  if (d && typeof d === 'object') return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String((v as Data)?.condition ?? 'service_started')]));
  return {};
}
const ports = (s: Data): string[] => (Array.isArray(s.ports) ? s.ports.map((p: Data) => (typeof p === 'object' && p ? String(p.published ?? '') + ':' + String(p.target ?? '') : String(p))) : []);
const declared = (section: string, name: string): boolean => !!doc[section] && typeof doc[section] === 'object' && Object.prototype.hasOwnProperty.call(doc[section], name);
const testText = (s: Data): string => { const t = s.healthcheck?.test; return Array.isArray(t) ? t.join(' ') : String(t ?? ''); };
`;

/** Month 5, week 17 (lessons dn5-1, dn5-2): container images for .NET, then Compose. */
export const DEVOPS_WEEK_17: CodeTask[] = [
  {
    id: 'ops-5-01',
    title: 'A Multi-Stage Dockerfile for an ASP.NET Core API',
    difficulty: 'Medium',
    language: 'config',
    fileName: 'Dockerfile',
    category: CATEGORY,
    prompt:
      'Containerise the Bookings API. The build context is the repository root: Bookings.sln, src/Bookings.Api/Bookings.Api.csproj ' +
      '(the web project, which publishes Bookings.Api.dll) and src/Bookings.Domain/Bookings.Domain.csproj (a class library it references). ' +
      'The starter Dockerfile works, but it ships the whole SDK and the source code, restores packages again on every code change, runs as ' +
      'root on port 80 and starts dotnet through a shell. Rewrite it as a two-stage build: (1) a build stage FROM mcr.microsoft.com/dotnet/sdk:10.0 ' +
      'that copies only the .sln and .csproj files, runs dotnet restore, then copies the source and runs dotnet publish -c Release -o <folder>; ' +
      '(2) a runtime stage FROM mcr.microsoft.com/dotnet/aspnet:10.0 that copies only the published folder --from the build stage, runs as ' +
      'the image\'s non-root user, EXPOSEs 8080 and starts the app with an exec-form ENTRYPOINT ["dotnet", "Bookings.Api.dll"]. ' +
      'Press Run to see how the grader reads your stages.',
    starterCode: `FROM mcr.microsoft.com/dotnet/sdk:latest
WORKDIR /src
COPY . .
RUN dotnet restore src/Bookings.Api/Bookings.Api.csproj
RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -o /app
WORKDIR /app
EXPOSE 80
ENTRYPOINT dotnet Bookings.Api.dll
`,
    hints: [
      'Name the first stage: FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build — the runtime stage refers to it with COPY --from=build.',
      'Layer caching: COPY Bookings.sln ./ and each .csproj into its own folder (COPY src/Bookings.Api/Bookings.Api.csproj src/Bookings.Api/), then RUN dotnet restore src/Bookings.Api/Bookings.Api.csproj, and only then COPY src/ src/.',
      'RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -c Release -o /app/publish --no-restore, then in the runtime stage: WORKDIR /app and COPY --from=build /app/publish .',
      '.NET 8 and later images include a non-root user whose id is in $APP_UID: USER $APP_UID. They listen on 8080 by default, which a non-root user may bind.',
    ],
    solution: `# syntax=docker/dockerfile:1

# ---- build: the SDK compiles the app; this stage is never shipped ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore from the project files alone: this layer stays cached until a dependency changes.
COPY Bookings.sln ./
COPY src/Bookings.Api/Bookings.Api.csproj src/Bookings.Api/
COPY src/Bookings.Domain/Bookings.Domain.csproj src/Bookings.Domain/
RUN dotnet restore src/Bookings.Api/Bookings.Api.csproj

# Then the source, and a Release publish that reuses the restore above.
COPY src/ src/
RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -c Release -o /app/publish --no-restore

# ---- runtime: the ASP.NET Core runtime only, as the image's non-root user ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Bookings.Api.dll"]
`,
    testCode: DOCKER_HELPERS + `
const build = docker.stages.find((s) => s.image.name === 'mcr.microsoft.com/dotnet/sdk');
const buildStage = () => need(build, 'No stage starts FROM mcr.microsoft.com/dotnet/sdk — add a build stage.');
const publishAt = () => buildStage().instructions.findIndex((i) => i.instruction === 'RUN' && i.args.includes('dotnet publish'));
const publishOutput = (): string => {
  const at = publishAt();
  if (at < 0) return '';
  return option(words(buildStage().instructions[at]), ['-o', '--output']) ?? '';
};

describe('stages', () => {
  it('parses cleanly into a build stage and a runtime stage', () => {
    expect(docker.errors, 'The Dockerfile has problems').toEqual([]);
    expect(docker.stages.length, 'Use a multi-stage build: one FROM to build, one FROM to run').toBeGreaterThanOrEqual(2);
  });
  it('builds with the .NET 10 SDK, pinned and named', () => {
    const b = buildStage();
    expect((b.image.tag ?? '').startsWith('10.0'), 'Pin the SDK image to 10.0, never latest or no tag').toBe(true);
    expect(b.name, 'Name the build stage (FROM ... AS build) so the runtime stage can copy from it').not.toBeNull();
  });
  it('runs on the ASP.NET Core runtime image, not the SDK', () => {
    const f = finalStage();
    expect(f.image.name, 'The last stage must be FROM mcr.microsoft.com/dotnet/aspnet').toBe('mcr.microsoft.com/dotnet/aspnet');
    expect((f.image.tag ?? '').startsWith('10.0'), 'Pin the runtime image to 10.0, matching the SDK').toBe(true);
  });
});

describe('build stage', () => {
  it('restores from the project files before copying the source', () => {
    const ins = buildStage().instructions;
    const restoreAt = ins.findIndex((i) => i.instruction === 'RUN' && i.args.includes('dotnet restore'));
    expect(restoreAt, 'Run dotnet restore as its own step').toBeGreaterThan(-1);
    const sources = ins.slice(0, restoreAt).filter((i) => i.instruction === 'COPY' || i.instruction === 'ADD').flatMap((i) => words(i).slice(0, -1));
    expect(sources.some((s) => s.endsWith('.csproj')), 'Copy the .csproj files before restoring').toBe(true);
    const restoreInputs = ['.csproj', '.sln', '.slnx', '.props', '.targets', 'nuget.config', 'NuGet.Config', 'global.json'];
    expect(sources.filter((s) => !restoreInputs.some((e) => s.endsWith(e))), 'Only project, solution and NuGet files may be copied before restore — anything else invalidates the cached restore on every code change').toEqual([]);
    expect(ins.slice(restoreAt + 1).some((i) => i.instruction === 'COPY'), 'Copy the source after restoring').toBe(true);
  });
  it('publishes a Release build to a known folder after the source is copied', () => {
    const b = buildStage();
    const at = publishAt();
    expect(at, 'Run dotnet publish in the build stage').toBeGreaterThan(-1);
    const w = words(b.instructions[at]);
    expect(option(w, ['-c', '--configuration']), 'Publish with -c Release').toBe('Release');
    expect(publishOutput(), 'Publish with -o <folder> so the runtime stage knows where the output is').not.toBe('');
    expect(at > lastIndex(b, (i) => i.instruction === 'COPY'), 'Publish after copying the source').toBe(true);
  });
});

describe('runtime stage', () => {
  it('copies only the published output, from the build stage', () => {
    const f = finalStage();
    const copies = f.instructions.filter((i) => i.instruction === 'COPY' || i.instruction === 'ADD');
    expect(copies.length, 'Copy the published app into the runtime stage').toBeGreaterThan(0);
    const b = buildStage();
    for (const c of copies) {
      expect(c.instruction, 'Use COPY, not ADD').toBe('COPY');
      expect([b.name, String(b.index)], 'Every COPY in the runtime stage must take files --from the build stage — never source from the build context').toContain(String(c.flags.from ?? ''));
    }
    expect(copies.some((c) => trimSlash(words(c)[0]) === trimSlash(publishOutput())), 'Copy the folder dotnet publish wrote to (its -o path)').toBe(true);
  });
  it('runs as a non-root user', () => {
    const users = of(finalStage(), 'USER');
    const last = need(users[users.length - 1], 'Add USER to the runtime stage — .NET images ship a non-root user: USER $APP_UID');
    expect(['root', '0', '0:0'], 'USER root is the default you are trying to avoid').not.toContain(last.args);
  });
  it('exposes 8080, where ASP.NET Core 8+ images listen', () => {
    const exposed = of(finalStage(), 'EXPOSE').flatMap((i) => i.args.split(' ')).map((p) => p.split('/')[0]);
    expect(exposed, 'EXPOSE 8080').toContain('8080');
    expect(exposed, 'Nothing listens on port 80 any more (a non-root user cannot bind ports below 1024)').not.toContain('80');
  });
  it('starts dotnet with an exec-form ENTRYPOINT', () => {
    const entries = of(finalStage(), 'ENTRYPOINT');
    const e = need(entries[entries.length - 1], 'Add an ENTRYPOINT');
    expect(e.json, 'Use the exec (JSON array) form, so dotnet runs as PID 1 and receives SIGTERM for a graceful shutdown').not.toBeNull();
    expect(e.json).toEqual(['dotnet', 'Bookings.Api.dll']);
  });
});
`,
  },
  {
    id: 'ops-5-02',
    title: 'Harden a Dockerfile Before It Ships',
    difficulty: 'Medium',
    language: 'config',
    fileName: 'Dockerfile',
    category: CATEGORY,
    prompt:
      'A teammate\'s Dockerfile for Notifications.Api (an ASP.NET Core API; project Notifications.Api/Notifications.Api.csproj, output ' +
      'Notifications.Api.dll) is in review. Fix every finding: (1) both stages use unpinned latest images — pin both to .NET 10.0, the same ' +
      'version for SDK and runtime; (2) the runtime stage uses dotnet/runtime, which lacks ASP.NET Core — use dotnet/aspnet; (3) an SMTP ' +
      'password is baked into the image with ENV — remove it (and never use ENV or ARG for passwords, tokens or keys: anyone who can pull ' +
      'the image can read them; they arrive at run time instead); (4) curl is needed for the health check, but it is installed with ' +
      'apt-get update and apt-get install in separate layers and leaves the package lists behind — do it in one RUN with ' +
      '--no-install-recommends, removing /var/lib/apt/lists; (5) add a HEALTHCHECK that fails on an HTTP error from ' +
      'http://localhost:8080/health/live (curl -f); (6) switch to the non-root user after installing packages; (7) start the app with an ' +
      'exec-form ENTRYPOINT so SIGTERM reaches it.',
    starterCode: `FROM mcr.microsoft.com/dotnet/sdk:latest AS build
WORKDIR /src
COPY Notifications.Api/Notifications.Api.csproj Notifications.Api/
RUN dotnet restore Notifications.Api/Notifications.Api.csproj
COPY Notifications.Api/ Notifications.Api/
RUN dotnet publish Notifications.Api/Notifications.Api.csproj -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/runtime:latest
ENV SMTP_PASSWORD=Sup3rS3cret!
RUN apt-get update
RUN apt-get install -y curl
WORKDIR /app
COPY --from=build /out .
EXPOSE 8080
ENTRYPOINT dotnet Notifications.Api.dll
`,
    hints: [
      'FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build … FROM mcr.microsoft.com/dotnet/aspnet:10.0 — same version, different images.',
      'Delete the ENV line. The password is supplied when the container starts (an environment variable or a mounted secret), never at build time.',
      'RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* — split it over lines with a trailing backslash if you like.',
      'HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD curl -fsS http://localhost:8080/health/live || exit 1, then USER $APP_UID and ENTRYPOINT ["dotnet", "Notifications.Api.dll"].',
    ],
    solution: `FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Notifications.Api/Notifications.Api.csproj Notifications.Api/
RUN dotnet restore Notifications.Api/Notifications.Api.csproj
COPY Notifications.Api/ Notifications.Api/
RUN dotnet publish Notifications.Api/Notifications.Api.csproj -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
# One layer: refresh the index, install only what is needed, and drop the index again.
RUN apt-get update \\
    && apt-get install -y --no-install-recommends curl \\
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out .
# Installing needed root; running does not.
USER $APP_UID
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD curl -fsS http://localhost:8080/health/live || exit 1
ENTRYPOINT ["dotnet", "Notifications.Api.dll"]
`,
    testCode: DOCKER_HELPERS + `
const text = readFile('Dockerfile');
const SECRET_WORDS = ['PASSWORD', 'PASSWD', 'SECRET', 'TOKEN', 'API_KEY', 'APIKEY', 'PRIVATE_KEY'];
const keyOf = (i: DockerInstruction) => i.args.split('=')[0].split(' ')[0].toUpperCase();
const aptRuns = () => finalStage().instructions.filter((i) => i.instruction === 'RUN' && i.args.includes('apt-get'));

describe('base images', () => {
  it('pins every image to a version', () => {
    expect(docker.errors).toEqual([]);
    for (const s of docker.stages) {
      const pinned = !!s.image.digest || (s.image.tag !== null && s.image.tag !== 'latest');
      expect(pinned, 'Line ' + s.line + ': ' + s.image.ref + ' is not pinned — latest changes under you').toBe(true);
    }
  });
  it('uses the ASP.NET Core runtime, matching the SDK version', () => {
    const f = finalStage();
    expect(f.image.name, 'An ASP.NET Core app needs mcr.microsoft.com/dotnet/aspnet — dotnet/runtime has no ASP.NET Core').toBe('mcr.microsoft.com/dotnet/aspnet');
    const sdk = need(docker.stages.find((s) => s.image.name === 'mcr.microsoft.com/dotnet/sdk'), 'Keep the SDK build stage');
    expect((sdk.image.tag ?? '').startsWith('10.0') && (f.image.tag ?? '').startsWith('10.0'), 'Pin both the SDK and the runtime to 10.0').toBe(true);
  });
});

describe('secrets', () => {
  it('bakes no passwords, tokens or keys into the image', () => {
    const leaks = docker.instructions.filter((i) => (i.instruction === 'ENV' || i.instruction === 'ARG') && SECRET_WORDS.some((w) => keyOf(i).includes(w)));
    expect(leaks.map((i) => 'line ' + i.line + ': ' + i.instruction + ' ' + keyOf(i)), 'ENV and ARG values are readable by anyone who can pull the image (docker history, docker inspect)').toEqual([]);
    expect(text.includes('Sup3rS3cret'), 'The password text must be gone from the file').toBe(false);
  });
});

describe('packages', () => {
  it('installs curl in one layer that leaves no package lists behind', () => {
    const runs = aptRuns();
    const install = need(runs.find((i) => i.args.includes('apt-get install')), 'curl is still needed for the health check — install it');
    expect(install.args.includes('curl'), 'Install curl').toBe(true);
    expect(install.args.includes('apt-get update'), 'Run apt-get update in the same RUN as apt-get install, or a cached stale index is reused').toBe(true);
    expect(install.args.includes('--no-install-recommends'), 'Add --no-install-recommends').toBe(true);
    expect(install.args.includes('rm -rf /var/lib/apt/lists'), 'Remove /var/lib/apt/lists in the same RUN').toBe(true);
    expect(runs.length, 'Use a single RUN for apt-get').toBe(1);
  });
});

describe('runtime behaviour', () => {
  it('has a HEALTHCHECK that fails on an HTTP error from the liveness endpoint', () => {
    const checks = of(finalStage(), 'HEALTHCHECK');
    const h = need(checks[checks.length - 1], 'Add a HEALTHCHECK');
    const w = h.args.split(' ');
    expect(w[0], 'HEALTHCHECK [options] CMD <command>').toBe('CMD');
    expect(h.args.includes('curl') && h.args.includes('http://localhost:8080/health/live'), 'Probe http://localhost:8080/health/live with curl').toBe(true);
    const fails = w.some((x) => x === '--fail' || (x.startsWith('-') && !x.startsWith('--') && x.includes('f')));
    expect(fails, 'Without curl -f, an HTTP 500 still counts as healthy').toBe(true);
  });
  it('switches to a non-root user after installing packages', () => {
    const f = finalStage();
    const userAt = lastIndex(f, (i) => i.instruction === 'USER');
    expect(userAt, 'Add USER $APP_UID').toBeGreaterThan(-1);
    expect(['root', '0', '0:0']).not.toContain(f.instructions[userAt].args);
    expect(userAt > lastIndex(f, (i) => i.instruction === 'RUN'), 'Install packages first (that needs root), then switch user').toBe(true);
  });
  it('starts dotnet with an exec-form ENTRYPOINT', () => {
    const entries = of(finalStage(), 'ENTRYPOINT');
    const e = need(entries[entries.length - 1], 'Add an ENTRYPOINT');
    expect(e.json, 'Shell form runs /bin/sh as PID 1, which does not forward SIGTERM to dotnet').toEqual(['dotnet', 'Notifications.Api.dll']);
  });
});
`,
  },
  {
    id: 'ops-5-03',
    title: 'Compose an API with Its Database',
    difficulty: 'Medium',
    language: 'config',
    fileName: 'compose.yaml',
    category: CATEGORY,
    prompt:
      'Write the compose.yaml a new teammate runs to get the Bookings API and its PostgreSQL database with one docker compose up. The API ' +
      'image builds from the Dockerfile in this folder (build: .), listens on 8080 and reads ConnectionStrings__Bookings, plus a database ' +
      'password from the file named in Database__PasswordFile (Program.cs already adds it to the connection string). Requirements: ' +
      'service db runs postgres:17 (pinned, never latest) with POSTGRES_DB and POSTGRES_USER of bookings, its password from a Compose secret ' +
      'db_password (file ./secrets/db_password.txt) via POSTGRES_PASSWORD_FILE=/run/secrets/db_password — no password appears anywhere in ' +
      'plain text; its data lives on a named volume db-data mounted at /var/lib/postgresql/data; it has a healthcheck using pg_isready; and it ' +
      'is not published to the host. Service api publishes 8080:8080, connects to the database by its service name, receives the same secret ' +
      '(Database__PasswordFile=/run/secrets/db_password) and starts only once the database is healthy. Drop the obsolete top-level version key.',
    starterCode: `version: "3.8"
services:
  api:
    build: .
    ports:
      - "5000:80"
    environment:
      ConnectionStrings__Bookings: "Host=localhost;Database=bookings;Username=postgres;Password=postgres"
    depends_on:
      - db
  db:
    image: postgres:latest
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
`,
    hints: [
      'Inside the Compose network every service is reachable by its name: Host=db, never localhost (localhost inside the api container is the api container).',
      'depends_on in its long form waits for health: depends_on: { db: { condition: service_healthy } } — and that only works if db has a healthcheck.',
      'healthcheck: test: ["CMD-SHELL", "pg_isready -U bookings -d bookings"], interval: 5s, retries: 10.',
      'Top level: volumes: { db-data: } and secrets: { db_password: { file: ./secrets/db_password.txt } }; each service that needs the secret lists it under secrets:, and Compose mounts it at /run/secrets/db_password.',
    ],
    solution: `services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__Bookings: "Host=db;Port=5432;Database=bookings;Username=bookings"
      Database__PasswordFile: /run/secrets/db_password
    secrets:
      - db_password
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17
    environment:
      POSTGRES_DB: bookings
      POSTGRES_USER: bookings
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bookings -d bookings"]
      interval: 5s
      timeout: 3s
      retries: 10
    # no ports: only the api talks to the database, over the Compose network

volumes:
  db-data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
`,
    testCode: COMPOSE_HELPERS + `
describe('the file', () => {
  it('is valid YAML with an api and a db service and no obsolete version key', () => {
    expect(parsed.ok ? '' : parsed.error, 'compose.yaml must parse').toBe('');
    expect(Object.keys(services).sort()).toEqual(['api', 'db']);
    expect('version' in doc, 'The top-level version key is obsolete in the Compose Specification — remove it').toBe(false);
  });
});

describe('db', () => {
  it('runs a pinned PostgreSQL 17 image', () => {
    expect(String(svc('db').image ?? ''), 'image: postgres:17 (latest would upgrade the database under you)').toMatch(new RegExp('^postgres:17'));
  });
  it('takes its password from a Compose secret, never plain text', () => {
    const env = envOf(svc('db'));
    expect('POSTGRES_PASSWORD' in env, 'Remove POSTGRES_PASSWORD — use POSTGRES_PASSWORD_FILE').toBe(false);
    expect(env.POSTGRES_PASSWORD_FILE, 'POSTGRES_PASSWORD_FILE: /run/secrets/db_password').toBe('/run/secrets/db_password');
    expect(names(svc('db').secrets), 'Give the db service the db_password secret').toContain('db_password');
    expect(String(doc.secrets?.db_password?.file ?? ''), 'Declare secrets: db_password: file: ./secrets/db_password.txt').toMatch(new RegExp('db_password.txt$'));
    expect(env.POSTGRES_DB).toBe('bookings');
    expect(env.POSTGRES_USER).toBe('bookings');
  });
  it('keeps its data on a declared named volume', () => {
    const vols = Array.isArray(svc('db').volumes) ? svc('db').volumes.map((v: Data) => (typeof v === 'string' ? v : String(v.source) + ':' + String(v.target))) : [];
    expect(vols, 'Mount db-data:/var/lib/postgresql/data').toContain('db-data:/var/lib/postgresql/data');
    expect(declared('volumes', 'db-data'), 'Declare db-data under the top-level volumes key').toBe(true);
  });
  it('has a pg_isready healthcheck and is not published to the host', () => {
    expect(testText(svc('db')), 'healthcheck.test must run pg_isready').toContain('pg_isready');
    expect(ports(svc('db')), 'The database needs no host port — only the api talks to it').toEqual([]);
  });
});

describe('api', () => {
  it('publishes 8080 and reaches the database by service name', () => {
    expect(ports(svc('api')).some((p) => p.endsWith('8080:8080')), 'ports: - "8080:8080"').toBe(true);
    const cs = envOf(svc('api')).ConnectionStrings__Bookings ?? '';
    expect(cs, 'Set ConnectionStrings__Bookings').not.toBe('');
    expect(cs.includes('Host=db'), 'Inside Compose the database is Host=db — localhost is the api container itself').toBe(true);
  });
  it('gets the password from the secret, with none in plain text', () => {
    const env = envOf(svc('api'));
    expect(Object.values(env).some((v) => v.toLowerCase().includes('password=')), 'No Password= in any environment value').toBe(false);
    expect(env.Database__PasswordFile, 'Database__PasswordFile: /run/secrets/db_password').toBe('/run/secrets/db_password');
    expect(names(svc('api').secrets)).toContain('db_password');
  });
  it('starts only after the database is healthy', () => {
    expect(dependsOn(svc('api')).db, 'depends_on: db: condition: service_healthy — started is not ready').toBe('service_healthy');
  });
});
`,
  },
  {
    id: 'ops-5-04',
    title: 'Segment a Full Stack and Run Migrations First',
    difficulty: 'Hard',
    language: 'config',
    fileName: 'compose.yaml',
    category: CATEGORY,
    prompt:
      'The starter stack works but is flat: every service shares one network and the API and database are published to the host. Rework it. ' +
      'web (nginx serving the React build and proxying /api to http://api:8080) is the only published service, on 8081:80. Declare two networks: ' +
      'frontend, and backend marked internal: true (no route to the outside world). web is only on frontend; db only on backend; api on both. ' +
      'Add a one-off service migrate that uses the same build as api, runs command ["--migrate-only"] (the API applies EF Core migrations ' +
      'and exits), gets the same connection settings and secret, lives only on backend, waits for db to be healthy and is never restarted. ' +
      'api must wait for db to be healthy and for migrate to complete successfully. The long-running services (web, api, db) restart ' +
      'unless-stopped. Keep the db secret, volume and healthcheck as they are.',
    starterCode: `services:
  web:
    build: ./client
    ports:
      - "8081:80"
    depends_on:
      - api

  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      ConnectionStrings__Bookings: "Host=db;Database=bookings;Username=bookings"
      Database__PasswordFile: /run/secrets/db_password
    secrets:
      - db_password
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: bookings
      POSTGRES_USER: bookings
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bookings -d bookings"]
      interval: 5s
      retries: 10

volumes:
  db-data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
`,
    hints: [
      'networks: { frontend: {}, backend: { internal: true } } at the top level, and networks: [frontend, backend] (or a subset) on each service.',
      'A service that is on no network you list is unreachable: web reaches api over frontend, api reaches db over backend.',
      'depends_on: { db: { condition: service_healthy }, migrate: { condition: service_completed_successfully } } — Compose waits for migrate to exit with code 0.',
      'migrate: build: . (the same as api), command: ["--migrate-only"], restart: "no" — a job that exits must not be restarted.',
    ],
    solution: `services:
  web:
    build: ./client
    ports:
      - "8081:80"          # the only door into the stack
    depends_on:
      - api
    networks: [frontend]
    restart: unless-stopped

  api:
    build: .
    environment:
      ConnectionStrings__Bookings: "Host=db;Database=bookings;Username=bookings"
      Database__PasswordFile: /run/secrets/db_password
    secrets:
      - db_password
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    networks: [frontend, backend]
    restart: unless-stopped

  migrate:
    build: .
    command: ["--migrate-only"]
    environment:
      ConnectionStrings__Bookings: "Host=db;Database=bookings;Username=bookings"
      Database__PasswordFile: /run/secrets/db_password
    secrets:
      - db_password
    depends_on:
      db:
        condition: service_healthy
    networks: [backend]
    restart: "no"

  db:
    image: postgres:17
    environment:
      POSTGRES_DB: bookings
      POSTGRES_USER: bookings
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bookings -d bookings"]
      interval: 5s
      retries: 10
    networks: [backend]
    restart: unless-stopped

networks:
  frontend:
  backend:
    internal: true

volumes:
  db-data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
`,
    testCode: COMPOSE_HELPERS + `
const nets = (name: string) => names(svc(name).networks).sort();

describe('services', () => {
  it('are web, api, migrate and db', () => {
    expect(parsed.ok ? '' : parsed.error, 'compose.yaml must parse').toBe('');
    expect(Object.keys(services).sort()).toEqual(['api', 'db', 'migrate', 'web']);
  });
  it('publish only the web front door', () => {
    expect(ports(svc('web')).some((p) => p.endsWith('8081:80')), 'web keeps 8081:80').toBe(true);
    for (const name of ['api', 'db', 'migrate']) expect(ports(svc(name)), name + ' must not be published to the host').toEqual([]);
  });
});

describe('networks', () => {
  it('declare frontend, and an internal backend', () => {
    expect(declared('networks', 'frontend') && declared('networks', 'backend'), 'Declare networks frontend and backend at the top level').toBe(true);
    expect(doc.networks?.backend?.internal, 'backend: internal: true — the database tier has no route out').toBe(true);
  });
  it('put each tier only where it is needed', () => {
    expect(nets('web'), 'web: frontend only').toEqual(['frontend']);
    expect(nets('api'), 'api: frontend and backend').toEqual(['backend', 'frontend']);
    expect(nets('db'), 'db: backend only').toEqual(['backend']);
    expect(nets('migrate'), 'migrate: backend only').toEqual(['backend']);
  });
});

describe('migrations', () => {
  it('run as a one-off job built like the api', () => {
    const m = svc('migrate');
    expect(JSON.stringify(m.build ?? null), 'migrate uses the same build as api').toBe(JSON.stringify(svc('api').build ?? null));
    const cmd = Array.isArray(m.command) ? m.command.join(' ') : String(m.command ?? '');
    expect(cmd, 'command: ["--migrate-only"]').toContain('--migrate-only');
    expect(envOf(m).ConnectionStrings__Bookings, 'migrate needs the same connection string as api').toBe(envOf(svc('api')).ConnectionStrings__Bookings);
    expect(names(m.secrets), 'and the same secret').toContain('db_password');
    expect(m.restart === undefined || m.restart === 'no', 'A job that exits must not be restarted: restart: "no"').toBe(true);
  });
  it('wait for a healthy database, and gate the api', () => {
    expect(dependsOn(svc('migrate')).db, 'migrate waits for db: service_healthy').toBe('service_healthy');
    const api = dependsOn(svc('api'));
    expect(api.db, 'api waits for db: service_healthy').toBe('service_healthy');
    expect(api.migrate, 'api waits for migrate: service_completed_successfully').toBe('service_completed_successfully');
  });
});

describe('restarts', () => {
  it('keep the long-running services up', () => {
    for (const name of ['web', 'api', 'db']) expect(['unless-stopped', 'always'], name + ': restart: unless-stopped').toContain(String(svc(name).restart ?? ''));
  });
});
`,
  },
];
