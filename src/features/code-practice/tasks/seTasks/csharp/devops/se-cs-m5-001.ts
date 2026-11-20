import { pf, type ProjectTask } from '../../../projectTypes';
import { PROJECT_GRADER_HELPERS } from '../../../devopsTasks/graderHelpers';

const README = `# Week 17 Assignment: Containerize Everything

The Booking system you built in Months 1–4 runs on your laptop because your laptop is set up for it. Make it run
**anywhere, from a clean clone, with one command**:

\`\`\`bash
mkdir -p secrets && openssl rand -base64 24 > secrets/db_password.txt
docker compose up --build
# open http://localhost:8081
\`\`\`

The C# and React source is given (read-only). You write the files that package and wire it.

## What to build

1. **\`Dockerfile\`** (build context: the repository root) — a two-stage build of \`src/Bookings.Api\`:
   \`mcr.microsoft.com/dotnet/sdk:10.0\` restores from the \`.sln\` and \`.csproj\` files *only*, then copies \`src/\` and
   publishes \`-c Release -o <folder>\`; \`mcr.microsoft.com/dotnet/aspnet:10.0\` copies only that folder from the build
   stage, runs as \`$APP_UID\`, exposes 8080 and starts \`["dotnet", "Bookings.Api.dll"]\`. No secrets in \`ENV\`/\`ARG\`.
2. **\`.dockerignore\`** — the API's context is the whole repository: exclude \`bin\`, \`obj\`, \`.git\`, \`node_modules\` and \`secrets\`.
3. **\`client/Dockerfile\`** (build context: \`client/\`) — a pinned \`node:22\` build stage that copies \`package.json\` and
   \`package-lock.json\`, runs \`npm ci\` (reproducible, lock-file exact — not \`npm install\`), then copies the source and runs
   \`npm run build\`; a final stage on a pinned \`nginxinc/nginx-unprivileged\` image (nginx as a non-root user, listening on
   8080) that copies \`/app/dist\` from the build stage to \`/usr/share/nginx/html\` and the given \`nginx.conf\` to
   \`/etc/nginx/conf.d/default.conf\`, and exposes 8080. Node must not be in the final image.
4. **\`client/.dockerignore\`** — exclude \`node_modules\` and \`dist\` (the build makes its own).
5. **\`compose.yaml\`** — services **web** (\`build: ./client\`, the only published service: \`8081:8080\`), **api**
   (\`build: .\`), **migrate** (same build as api, \`command: ["--migrate-only"]\`, never restarted) and **db**
   (\`postgres:17\`):
   - networks \`frontend\` and \`backend\` (\`internal: true\`): web on frontend, api on both, migrate and db on backend;
   - db: \`POSTGRES_DB\`/\`POSTGRES_USER\` = \`bookings\`, \`POSTGRES_PASSWORD_FILE=/run/secrets/db_password\`, named volume
     \`db-data\` at \`/var/lib/postgresql/data\`, a \`pg_isready\` healthcheck, no host ports;
   - api and migrate: \`ConnectionStrings__Bookings=Host=db;Database=bookings;Username=bookings\` and
     \`Database__PasswordFile=/run/secrets/db_password\` (see \`Program.cs\`), plus the \`db_password\` secret;
   - migrate waits for a healthy db; api waits for a healthy db **and** a successfully completed migrate;
   - web, api and db restart \`unless-stopped\`; secret \`db_password\` comes from \`./secrets/db_password.txt\`.
6. **\`.gitignore\`** — the secret file must never be committed: ignore \`secrets/\` (keep the existing entries).

**Run** prints what the grader's parsers make of your files. **Run tests** checks them. The checks read structure —
they cannot build the images — so finish by running \`docker compose up --build\` on your own machine.
`;

const SLN = `Microsoft Visual Studio Solution File, Format Version 12.00
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Bookings.Api", "src\\Bookings.Api\\Bookings.Api.csproj", "{6D0C9A57-0B9C-4C1E-9E33-7C7F3D3E2A11}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Bookings.Domain", "src\\Bookings.Domain\\Bookings.Domain.csproj", "{B0E1F4A2-3C5D-4E6F-8A9B-0C1D2E3F4A5B}"
EndProject
`;

const API_CSPROJ = `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
    <PackageReference Include="AspNetCore.HealthChecks.NpgSql" Version="9.0.0" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\\Bookings.Domain\\Bookings.Domain.csproj" />
  </ItemGroup>
</Project>
`;

const DOMAIN_CSPROJ = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
`;

const PROGRAM = `using Bookings.Api;
using Microsoft.EntityFrameworkCore;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// The connection string comes from the environment (ConnectionStrings__Bookings); the password from
// a mounted secret file named by Database__PasswordFile — never from an image or a committed file.
var cs = new NpgsqlConnectionStringBuilder(builder.Configuration.GetConnectionString("Bookings"));
if (builder.Configuration["Database:PasswordFile"] is { Length: > 0 } passwordFile)
    cs.Password = File.ReadAllText(passwordFile).Trim();

builder.Services.AddDbContext<BookingsDb>(o => o.UseNpgsql(cs.ConnectionString));
builder.Services.AddHealthChecks().AddNpgSql(cs.ConnectionString, tags: ["ready"]);

var app = builder.Build();

// docker compose's migrate service runs the same image with --migrate-only, applies EF Core
// migrations once, and exits 0 — the api service waits for that.
if (args.Contains("--migrate-only"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<BookingsDb>().Database.MigrateAsync();
    return;
}

app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });
app.MapBookingEndpoints();   // the Month 2 API: /api/bookings ...

app.Run();   // listens on 8080 (ASPNETCORE_HTTP_PORTS in the aspnet image)
`;

const BOOKING = `namespace Bookings.Domain;

public sealed record Booking(Guid Id, string Guest, DateOnly CheckIn, int Nights, BookingStatus Status);

public enum BookingStatus { Pending, Confirmed, Cancelled }
`;

const PACKAGE_JSON = `{
  "name": "bookings-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.9.0",
    "vite": "^7.1.0",
    "vitest": "^3.2.0"
  }
}
`;

const PACKAGE_LOCK = `{
  "name": "bookings-client",
  "lockfileVersion": 3,
  "requires": true,
  "packages": { "": { "name": "bookings-client" } }
}
`;

const NGINX_CONF = `# Serves the React build and forwards /api to the api service over the Compose network.
server {
    listen 8080;
    root /usr/share/nginx/html;

    location /api/ {
        proxy_pass http://api:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Client-side routes (/bookings/42) fall back to the app shell.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

const INSPECT = `// Run: shows how the grader's parsers read your files (the tests use the same parsers).
import { readFile, fileExists, parseDockerfile, parseYaml } from 'dw:project';

for (const path of ['Dockerfile', 'client/Dockerfile']) {
  const d = parseDockerfile(fileExists(path) ? readFile(path) : '');
  console.log(path + ': ' + d.stages.length + ' stage(s)' + (d.errors.length ? ' — problems: ' + d.errors.join('; ') : ''));
  for (const s of d.stages) console.log('  ' + (s.name ?? 'stage ' + s.index) + ' FROM ' + s.image.ref + ': ' + s.instructions.map((i) => i.instruction).join(' '));
}
const compose = parseYaml(readFile('compose.yaml'));
if (!compose.ok) console.log('compose.yaml: ' + compose.error);
else {
  const services = (compose.value?.services ?? {}) as Record<string, { networks?: unknown; ports?: unknown }>;
  console.log('compose.yaml services:');
  for (const [name, svc] of Object.entries(services)) console.log('  ' + name + ' networks=' + JSON.stringify(svc.networks ?? 'default') + ' ports=' + JSON.stringify(svc.ports ?? []));
}
`;

const GITIGNORE_STARTER = `bin/
obj/
node_modules/
`;

const GITIGNORE_SOLUTION = `bin/
obj/
node_modules/
# Local secrets: each developer creates their own; never committed.
secrets/
`;

const API_DOCKERFILE_STARTER = `# TODO: a two-stage build of src/Bookings.Api — see README step 1.
FROM mcr.microsoft.com/dotnet/sdk:latest
WORKDIR /src
COPY . .
RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -o /app
ENTRYPOINT dotnet /app/Bookings.Api.dll
`;

const API_DOCKERFILE_SOLUTION = `# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore from the project files alone, so the layer is reused until a dependency changes.
COPY Bookings.sln ./
COPY src/Bookings.Api/Bookings.Api.csproj src/Bookings.Api/
COPY src/Bookings.Domain/Bookings.Domain.csproj src/Bookings.Domain/
RUN dotnet restore src/Bookings.Api/Bookings.Api.csproj

COPY src/ src/
RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Bookings.Api.dll"]
`;

const DOCKERIGNORE_SOLUTION = `# The API's build context is the whole repository.
**/bin/
**/obj/
**/node_modules/
.git/
.vs/
secrets/
*.user
`;

const CLIENT_DOCKERFILE_STARTER = `# TODO: build with Node, serve dist/ with unprivileged nginx — see README step 3.
FROM node:latest
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npx", "vite", "preview", "--host"]
`;

const CLIENT_DOCKERFILE_SOLUTION = `# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first: npm ci installs exactly what package-lock.json records, and the layer is
# reused until the lock file changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Static files only; nginx runs as a non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
`;

const CLIENT_DOCKERIGNORE_SOLUTION = `node_modules/
dist/
.vite/
`;

const COMPOSE_STARTER = `version: "3.8"
services:
  web:
    build: ./client
    ports:
      - "3000:3000"
  api:
    build: .
    ports:
      - "8080:8080"
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
`;

const COMPOSE_SOLUTION = `services:
  web:
    build: ./client
    ports:
      - "8081:8080"        # the only door into the system
    depends_on:
      - api
    networks: [frontend]
    restart: unless-stopped

  api:
    build: .
    environment:
      ConnectionStrings__Bookings: "Host=db;Database=bookings;Username=bookings"
      Database__PasswordFile: /run/secrets/db_password
    secrets: [db_password]
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
    secrets: [db_password]
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
    secrets: [db_password]
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bookings -d bookings"]
      interval: 5s
      timeout: 3s
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
`;

const TESTS = PROJECT_GRADER_HELPERS + `
// ======================================================================== API image
const api = dockerfile('Dockerfile');
const apiBuild = () => need(api.stages.find((s) => s.image.name === 'mcr.microsoft.com/dotnet/sdk'), 'Dockerfile: no stage starts FROM mcr.microsoft.com/dotnet/sdk');
const apiFinal = () => lastStage(api, 'Dockerfile');
const publishOut = (): string => {
  const p = apiBuild().instructions.find((i) => i.instruction === 'RUN' && i.args.includes('dotnet publish'));
  return p ? option(words(p), ['-o', '--output']) ?? '' : '';
};

describe('API image (Dockerfile)', () => {
  it('builds on sdk:10.0 and ships on aspnet:10.0', () => {
    expect(api.errors, 'Dockerfile problems').toEqual([]);
    expect((apiBuild().image.tag ?? '').startsWith('10.0'), 'Pin the SDK to 10.0').toBe(true);
    expect(apiFinal().image.name, 'The last stage must be mcr.microsoft.com/dotnet/aspnet').toBe('mcr.microsoft.com/dotnet/aspnet');
    expect((apiFinal().image.tag ?? '').startsWith('10.0'), 'Pin the runtime to 10.0').toBe(true);
  });
  it('restores from project files before copying the source', () => {
    const ins = apiBuild().instructions;
    const at = ins.findIndex((i) => i.instruction === 'RUN' && i.args.includes('dotnet restore'));
    expect(at, 'Run dotnet restore as its own step').toBeGreaterThan(-1);
    const copied = ins.slice(0, at).filter((i) => i.instruction === 'COPY').flatMap((i) => words(i).slice(0, -1));
    expect(copied.some((s) => s.endsWith('.csproj')), 'Copy the .csproj files before restore').toBe(true);
    expect(copied.filter((s) => !['.csproj', '.sln', '.slnx', '.props', '.targets', 'nuget.config', 'global.json'].some((e) => s.endsWith(e))), 'Only restore inputs may be copied before restore').toEqual([]);
    const later = ins.slice(at + 1).filter((i) => i.instruction === 'COPY').flatMap((i) => words(i).slice(0, -1));
    expect(later.some((s) => trimSlash(s) === 'src' || trimSlash(s) === '.'), 'After restoring, copy the source (COPY src/ src/)').toBe(true);
  });
  it('publishes Release output after the source is copied', () => {
    const b = apiBuild();
    const at = indexWhere(b, (i) => i.instruction === 'RUN' && i.args.includes('dotnet publish'));
    expect(at, 'Run dotnet publish').toBeGreaterThan(-1);
    expect(option(words(b.instructions[at]), ['-c', '--configuration']), 'dotnet publish -c Release').toBe('Release');
    expect(publishOut(), 'dotnet publish -o <folder>').not.toBe('');
    expect(at > lastIndexWhere(b, (i) => i.instruction === 'COPY'), 'Publish after copying the source').toBe(true);
  });
  it('copies only the published folder into the runtime stage', () => {
    const copies = ofType(apiFinal(), 'COPY').concat(ofType(apiFinal(), 'ADD'));
    const b = apiBuild();
    expect(copies.length).toBeGreaterThan(0);
    for (const c of copies) expect([b.name, String(b.index)], 'Runtime-stage COPY must use --from=<build stage>').toContain(String(c.flags.from ?? ''));
    expect(copies.some((c) => trimSlash(words(c)[0]) === trimSlash(publishOut())), 'Copy the folder dotnet publish wrote').toBe(true);
  });
  it('runs as a non-root user on port 8080 with an exec-form ENTRYPOINT', () => {
    const users = ofType(apiFinal(), 'USER');
    const user = need(users[users.length - 1], 'Add USER $APP_UID to the runtime stage');
    expect(['root', '0', '0:0']).not.toContain(user.args);
    expect(ofType(apiFinal(), 'EXPOSE').flatMap((i) => i.args.split(' ')), 'EXPOSE 8080').toContain('8080');
    const entries = ofType(apiFinal(), 'ENTRYPOINT');
    expect(need(entries[entries.length - 1], 'Add an ENTRYPOINT').json, 'ENTRYPOINT ["dotnet", "Bookings.Api.dll"]').toEqual(['dotnet', 'Bookings.Api.dll']);
  });
  it('bakes in no secrets', () => {
    expect(secretLeaks(api), 'No passwords, tokens or keys in ENV or ARG').toEqual([]);
  });
});

describe('API build context (.dockerignore)', () => {
  it('keeps build output, dependencies, history and secrets out', () => {
    for (const name of ['bin', 'obj', '.git', 'node_modules', 'secrets']) {
      expect(ignores('.dockerignore', name), '.dockerignore must exclude ' + name).toBe(true);
    }
  });
});

// ======================================================================== client image
const client = dockerfile('client/Dockerfile');
const clientBuild = () => need(client.stages.find((s) => s.image.name === 'node'), 'client/Dockerfile: no stage starts FROM node');
const clientFinal = () => lastStage(client, 'client/Dockerfile');

describe('client image (client/Dockerfile)', () => {
  it('builds on a pinned Node 22 image', () => {
    expect(client.errors, 'client/Dockerfile problems').toEqual([]);
    expect((clientBuild().image.tag ?? '').startsWith('22'), 'Pin the build stage to node:22 (for example node:22-alpine)').toBe(true);
    expect(clientBuild().name, 'Name the build stage (AS build)').not.toBeNull();
  });
  it('installs dependencies with npm ci from the manifest and lock file alone', () => {
    const ins = clientBuild().instructions;
    const ci = ins.findIndex((i) => i.instruction === 'RUN' && i.args.includes('npm ci'));
    expect(ci, 'Use npm ci — it installs exactly what package-lock.json records').toBeGreaterThan(-1);
    expect(ins.some((i) => i.instruction === 'RUN' && i.args.includes('npm install')), 'Not npm install: it can change the lock file during the build').toBe(false);
    const copied = ins.slice(0, ci).filter((i) => i.instruction === 'COPY').flatMap((i) => words(i).slice(0, -1));
    expect(copied.includes('package.json') && copied.includes('package-lock.json'), 'COPY package.json package-lock.json before npm ci').toBe(true);
    expect(copied.filter((s) => s !== 'package.json' && s !== 'package-lock.json'), 'Copy only the manifest and lock file before npm ci, so the install layer is cached').toEqual([]);
  });
  it('builds after copying the source', () => {
    const b = clientBuild();
    const at = indexWhere(b, (i) => i.instruction === 'RUN' && i.args.includes('npm run build'));
    expect(at, 'RUN npm run build').toBeGreaterThan(-1);
    expect(at > lastIndexWhere(b, (i) => i.instruction === 'COPY'), 'Build after copying the source').toBe(true);
  });
  it('serves static files from a pinned, unprivileged nginx — no Node', () => {
    const f = clientFinal();
    expect(f.image.name, 'The final stage must be nginxinc/nginx-unprivileged').toBe('nginxinc/nginx-unprivileged');
    expect(pinned(f), 'Pin the nginx image to a version').toBe(true);
    expect(f.instructions.some((i) => i.instruction === 'RUN' && i.args.includes('npm')), 'No npm in the final image').toBe(false);
    expect(ofType(f, 'EXPOSE').flatMap((i) => i.args.split(' ')), 'EXPOSE 8080').toContain('8080');
  });
  it('copies the build output and the nginx configuration', () => {
    const copies = ofType(clientFinal(), 'COPY');
    const b = clientBuild();
    const dist = copies.find((c) => [b.name, String(b.index)].includes(String(c.flags.from ?? '')));
    const d = need(dist, 'COPY --from=build the built files');
    expect(trimSlash(words(d)[0]), 'Copy /app/dist — where vite build writes').toBe('/app/dist');
    expect(trimSlash(words(d)[1]), 'into /usr/share/nginx/html').toBe('/usr/share/nginx/html');
    const conf = need(copies.find((c) => !c.flags.from && words(c)[0] === 'nginx.conf'), 'COPY nginx.conf /etc/nginx/conf.d/default.conf');
    expect(words(conf)[1], 'nginx reads its site configuration from /etc/nginx/conf.d/default.conf').toBe('/etc/nginx/conf.d/default.conf');
  });
});

describe('client build context (client/.dockerignore)', () => {
  it('excludes node_modules and dist', () => {
    expect(ignores('client/.dockerignore', 'node_modules'), 'exclude node_modules').toBe(true);
    expect(ignores('client/.dockerignore', 'dist'), 'exclude dist').toBe(true);
  });
});

// ======================================================================== compose
const compose = yamlFile('compose.yaml');
const services: Record<string, Data> = compose.value.services ?? {};
const svc = (name: string): Data => services[name] ?? {};
const nets = (name: string) => namesOf(svc(name).networks).sort();

describe('compose.yaml', () => {
  it('defines web, api, migrate and db without the obsolete version key', () => {
    expect(compose.error, 'compose.yaml must parse').toBe('');
    expect(Object.keys(services).sort()).toEqual(['api', 'db', 'migrate', 'web']);
    expect(hasKey(compose.value, 'version'), 'Remove the obsolete version key').toBe(false);
  });
  it('builds web from ./client and api and migrate from the repository root', () => {
    expect(JSON.stringify(svc('web').build ?? null), 'web: build: ./client').toBe(JSON.stringify('./client'));
    expect(JSON.stringify(svc('api').build ?? null), 'api: build: .').toBe(JSON.stringify('.'));
    expect(JSON.stringify(svc('migrate').build ?? null), 'migrate: the same build as api').toBe(JSON.stringify('.'));
    expect(String(svc('db').image ?? ''), 'db: image: postgres:17').toMatch(new RegExp('^postgres:17'));
  });
  it('publishes only web, on 8081 to nginx on 8080', () => {
    expect(portsOf(svc('web')).some((p) => p.endsWith('8081:8080')), 'web: ports: - "8081:8080"').toBe(true);
    for (const name of ['api', 'migrate', 'db']) expect(portsOf(svc(name)), name + ' must not be published').toEqual([]);
  });
  it('segments the tiers, with an internal backend', () => {
    expect(compose.value.networks?.backend?.internal, 'networks: backend: internal: true').toBe(true);
    expect(hasKey(compose.value.networks, 'frontend'), 'declare the frontend network').toBe(true);
    expect(nets('web'), 'web: frontend').toEqual(['frontend']);
    expect(nets('api'), 'api: frontend and backend').toEqual(['backend', 'frontend']);
    expect(nets('migrate'), 'migrate: backend').toEqual(['backend']);
    expect(nets('db'), 'db: backend').toEqual(['backend']);
  });
  it('keeps every password in the db_password secret', () => {
    expect(String(compose.value.secrets?.db_password?.file ?? ''), 'secrets: db_password: file: ./secrets/db_password.txt').toMatch(new RegExp('secrets/db_password.txt$'));
    for (const name of ['api', 'migrate', 'db']) {
      expect(namesOf(svc(name).secrets), name + ' needs the db_password secret').toContain('db_password');
      expect(Object.entries(envOf(svc(name))).filter(([k, v]) => k === 'POSTGRES_PASSWORD' || v.toLowerCase().includes('password=')).map(([k]) => k), name + ': no plain-text password').toEqual([]);
    }
    expect(envOf(svc('db')).POSTGRES_PASSWORD_FILE).toBe('/run/secrets/db_password');
  });
  it('connects api and migrate to the database by service name', () => {
    for (const name of ['api', 'migrate']) {
      const env = envOf(svc(name));
      expect((env.ConnectionStrings__Bookings ?? '').includes('Host=db'), name + ': ConnectionStrings__Bookings with Host=db').toBe(true);
      expect(env.Database__PasswordFile, name + ': Database__PasswordFile=/run/secrets/db_password').toBe('/run/secrets/db_password');
    }
  });
  it('stores database files on a named volume and checks database health', () => {
    const vols = Array.isArray(svc('db').volumes) ? svc('db').volumes.map((v: Data) => (typeof v === 'string' ? v : String(v.source) + ':' + String(v.target))) : [];
    expect(vols, 'db: volumes: - db-data:/var/lib/postgresql/data').toContain('db-data:/var/lib/postgresql/data');
    expect(hasKey(compose.value.volumes, 'db-data'), 'declare the db-data volume').toBe(true);
    expect(healthTest(svc('db')), 'db: a pg_isready healthcheck').toContain('pg_isready');
  });
  it('runs migrations once, before the api', () => {
    const cmd = Array.isArray(svc('migrate').command) ? svc('migrate').command.join(' ') : String(svc('migrate').command ?? '');
    expect(cmd, 'migrate: command: ["--migrate-only"]').toContain('--migrate-only');
    expect(dependsOn(svc('migrate')).db, 'migrate waits for a healthy db').toBe('service_healthy');
    expect(dependsOn(svc('api')).db, 'api waits for a healthy db').toBe('service_healthy');
    expect(dependsOn(svc('api')).migrate, 'api waits for migrate to complete successfully').toBe('service_completed_successfully');
  });
  it('restarts long-running services but never the migration job', () => {
    for (const name of ['web', 'api', 'db']) expect(['unless-stopped', 'always'], name + ': restart: unless-stopped').toContain(String(svc(name).restart ?? ''));
    const m = svc('migrate').restart;
    expect(m === undefined || m === 'no', 'migrate: restart: "no"').toBe(true);
  });
});

describe('repository hygiene', () => {
  it('never commits the secret file', () => {
    expect(ignores('.gitignore', 'secrets'), '.gitignore must ignore secrets/').toBe(true);
    for (const name of ['bin', 'obj', 'node_modules']) expect(ignores('.gitignore', name), 'keep ignoring ' + name).toBe(true);
  });
});
`;

const given = [
  pf('README.md', README, { editable: false }),
  pf('Bookings.sln', SLN, { editable: false }),
  pf('src/Bookings.Api/Bookings.Api.csproj', API_CSPROJ, { editable: false }),
  pf('src/Bookings.Api/Program.cs', PROGRAM, { editable: false }),
  pf('src/Bookings.Domain/Bookings.Domain.csproj', DOMAIN_CSPROJ, { editable: false }),
  pf('src/Bookings.Domain/Booking.cs', BOOKING, { editable: false }),
  pf('client/package.json', PACKAGE_JSON, { editable: false }),
  pf('client/package-lock.json', PACKAGE_LOCK, { editable: false }),
  pf('client/nginx.conf', NGINX_CONF, { editable: false, language: 'plaintext' }),
  pf('inspect.ts', INSPECT, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m5-001',
  title: 'Week 17: Containerize Everything',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 5 · Cloud, DevOps & Delivery',
  tags: ['Docker', 'Compose', 'multi-stage builds', 'secrets'],
  prompt:
    'Package the Booking system so a clean clone runs with one docker compose up: a cached, multi-stage, non-root Dockerfile for the ' +
    'ASP.NET Core API; a Node-build, unprivileged-nginx Dockerfile for the React client; .dockerignore files for both build contexts; ' +
    'and a compose.yaml with segmented networks, a health-gated database on a named volume, a one-off migration job, and every ' +
    'password in a Compose secret that .gitignore keeps out of the repository. About 20 checks read the structure of each file.',
  hints: [
    'Start with the API Dockerfile — it is Code Portal task ops-5-01 with this repository\'s paths.',
    'The client build context is client/, so client/Dockerfile copies package.json and package-lock.json (not client/package.json), and the root .dockerignore does not apply to it.',
    'nginxinc/nginx-unprivileged runs nginx as a non-root user on port 8080; the given nginx.conf already listens there and proxies /api to http://api:8080.',
    'compose.yaml is ops-5-04 plus the client: web publishes 8081:8080 and builds from ./client.',
    'An ignore pattern such as **/bin/, bin/ or bin all exclude bin; the grader accepts any of them.',
  ],
  files: [
    ...given,
    pf('Dockerfile', API_DOCKERFILE_STARTER),
    pf('.dockerignore', '# TODO: see README step 2\n', { language: 'plaintext' }),
    pf('client/Dockerfile', CLIENT_DOCKERFILE_STARTER),
    pf('client/.dockerignore', '# TODO: see README step 4\n', { language: 'plaintext' }),
    pf('compose.yaml', COMPOSE_STARTER),
    pf('.gitignore', GITIGNORE_STARTER, { language: 'plaintext' }),
  ],
  solutionFiles: [
    ...given,
    pf('Dockerfile', API_DOCKERFILE_SOLUTION),
    pf('.dockerignore', DOCKERIGNORE_SOLUTION, { language: 'plaintext' }),
    pf('client/Dockerfile', CLIENT_DOCKERFILE_SOLUTION),
    pf('client/.dockerignore', CLIENT_DOCKERIGNORE_SOLUTION, { language: 'plaintext' }),
    pf('compose.yaml', COMPOSE_SOLUTION),
    pf('.gitignore', GITIGNORE_SOLUTION, { language: 'plaintext' }),
  ],
  targets: [{ id: 'config', label: 'Containers & Compose', kind: 'typescript', entry: 'inspect.ts', testCode: TESTS }],
};

export default task;
