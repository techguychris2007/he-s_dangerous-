import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  dockerOverview: { title: 'Docker docs — What is a container?', url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/' },
  dockerfileRef: { title: 'Docker docs — Dockerfile reference', url: 'https://docs.docker.com/reference/dockerfile/' },
  bestPractices: { title: 'Docker docs — Building best practices', url: 'https://docs.docker.com/build/building/best-practices/' },
  multiStage: { title: 'Docker docs — Multi-stage builds', url: 'https://docs.docker.com/build/building/multi-stage/' },
  buildCache: { title: 'Docker docs — Docker build cache', url: 'https://docs.docker.com/build/cache/' },
  buildSecrets: { title: 'Docker docs — Build secrets', url: 'https://docs.docker.com/build/building/secrets/' },
  dotnetBuildContainer: { title: 'Microsoft Learn — Containerize a .NET app', url: 'https://learn.microsoft.com/en-us/dotnet/core/docker/build-container' },
  dotnetImages: { title: 'Microsoft Learn — .NET container images', url: 'https://learn.microsoft.com/en-us/dotnet/core/docker/container-images' },
  sdkPublish: { title: 'Microsoft Learn — Containerize a .NET app with dotnet publish', url: 'https://learn.microsoft.com/en-us/dotnet/core/containers/sdk-publish' },
  aspnetPort: { title: 'Microsoft Learn — Default ASP.NET Core port changed to 8080 (.NET 8)', url: 'https://learn.microsoft.com/en-us/dotnet/core/compatibility/containers/8.0/aspnet-port' },
  rootless: { title: '.NET Blog — Secure your .NET cloud apps with rootless Linux containers', url: 'https://devblogs.microsoft.com/dotnet/securing-containers-with-rootless/' },
  aspnetDocker: { title: 'Microsoft Learn — ASP.NET Core in Docker containers', url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/docker/' },
  microservicesBook: { title: '.NET Microservices: Architecture for Containerized .NET Applications (free e-book)', url: 'https://learn.microsoft.com/en-us/dotnet/architecture/microservices/' },
  owaspDocker: { title: 'OWASP — Docker Security Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html' },
  compose: { title: 'Docker docs — Docker Compose overview', url: 'https://docs.docker.com/compose/' },
  composeRef: { title: 'Compose file reference (the Compose Specification)', url: 'https://docs.docker.com/reference/compose-file/' },
  composeStartup: { title: 'Docker docs — Control startup order in Compose', url: 'https://docs.docker.com/compose/how-tos/startup-order/' },
  composeSecrets: { title: 'Docker docs — Secrets in Compose', url: 'https://docs.docker.com/compose/how-tos/use-secrets/' },
  composeNetworking: { title: 'Docker docs — Networking in Compose', url: 'https://docs.docker.com/compose/how-tos/networking/' },
  composeEnv: { title: 'Docker docs — Environment variables in Compose', url: 'https://docs.docker.com/compose/how-tos/environment-variables/' },
  composeWatch: { title: 'Docker docs — Compose Watch', url: 'https://docs.docker.com/compose/how-tos/file-watch/' },
  postgresImage: { title: 'Docker Hub — the official postgres image (environment variables, _FILE secrets)', url: 'https://hub.docker.com/_/postgres' },
  aspnetConfig: { title: 'Microsoft Learn — Configuration in ASP.NET Core (environment variables and __)', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/' },
  twelveFactor: { title: 'The Twelve-Factor App — III. Config', url: 'https://12factor.net/config' },
  organize: { title: 'Cloud Adoption Framework — Organize your Azure resources', url: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-setup-guide/organize-resources' },
  computeTree: { title: 'Azure Architecture Center — Choose an Azure compute service', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/compute-decision-tree' },
  compareContainers: { title: 'Microsoft Learn — Comparing Container Apps with other Azure container options', url: 'https://learn.microsoft.com/en-us/azure/container-apps/compare-options' },
  managedIdentity: { title: 'Microsoft Entra — What are managed identities for Azure resources?', url: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview' },
  rbac: { title: 'Microsoft Learn — What is Azure role-based access control (RBAC)?', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview' },
  kvRbac: { title: 'Microsoft Learn — Key Vault access with Azure RBAC', url: 'https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide' },
  credentialChains: { title: 'Microsoft Learn — Credential chains in the Azure Identity library for .NET', url: 'https://learn.microsoft.com/en-us/dotnet/azure/sdk/authentication/credential-chains' },
  cliBash: { title: 'Microsoft Learn — Use the Azure CLI in a Bash scripting language', url: 'https://learn.microsoft.com/en-us/cli/azure/azure-cli-learn-bash' },
  acrIdentity: { title: 'Microsoft Learn — Container Apps image pull with managed identity', url: 'https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull' },
  pgEntra: { title: 'Microsoft Learn — Microsoft Entra authentication for Azure Database for PostgreSQL', url: 'https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-configure-sign-in-azure-ad-authentication' },
  wellArchitected: { title: 'Azure Well-Architected Framework', url: 'https://learn.microsoft.com/en-us/azure/well-architected/' },
  acaOverview: { title: 'Microsoft Learn — Azure Container Apps overview', url: 'https://learn.microsoft.com/en-us/azure/container-apps/overview' },
  acaRevisions: { title: 'Microsoft Learn — Revisions in Azure Container Apps', url: 'https://learn.microsoft.com/en-us/azure/container-apps/revisions' },
  acaTraffic: { title: 'Microsoft Learn — Traffic splitting in Azure Container Apps', url: 'https://learn.microsoft.com/en-us/azure/container-apps/traffic-splitting' },
  acaProbes: { title: 'Microsoft Learn — Health probes in Azure Container Apps', url: 'https://learn.microsoft.com/en-us/azure/container-apps/health-probes' },
  acaScale: { title: 'Microsoft Learn — Set scaling rules in Azure Container Apps', url: 'https://learn.microsoft.com/en-us/azure/container-apps/scale-app' },
  acaSecrets: { title: 'Microsoft Learn — Manage secrets in Azure Container Apps', url: 'https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets' },
  acaYaml: { title: 'Microsoft Learn — Container Apps ARM and YAML template specifications', url: 'https://learn.microsoft.com/en-us/azure/container-apps/azure-resource-manager-api-spec' },
  acaContainers: { title: 'Microsoft Learn — Containers in Azure Container Apps (CPU and memory)', url: 'https://learn.microsoft.com/en-us/azure/container-apps/containers' },
  forwardedHeaders: { title: 'Microsoft Learn — Configure ASP.NET Core to work with proxy servers and load balancers', url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer' },
} as const;

/** Month 5, weeks 17–18: containers (assignment: Containerize Everything), then Azure (assignment:
 *  Cloud Deployment). Every configuration file the learner writes is parsed and checked in the
 *  browser; the lessons say plainly where a real tool would go further. */
export const DN_MONTH5_A: CurriculumLesson[] = [
  {
    id: 'dn5-1',
    slug: 'containers-for-dotnet',
    title: 'Containers for .NET: Images, Layers and a Production Dockerfile',
    summary: 'What a container really is, how images are built from cached layers, and how to write a multi-stage Dockerfile for ASP.NET Core that is small, fast to rebuild, runs as a non-root user, keeps secrets out, and shuts down cleanly.',
    minutes: 60,
    prerequisite: 'Months 1–4. A terminal you are comfortable in. Install Docker Desktop (or Docker Engine on Linux) to try the commands locally; the graded tasks run in your browser.',
    outcomes: [
      'Explain what a container isolates, what it shares with the host, and how an image differs from a container.',
      'Order Dockerfile instructions so the build cache makes rebuilds fast, and explain what invalidates a layer.',
      'Write a multi-stage Dockerfile for an ASP.NET Core API that ships only the runtime and the published output.',
      'Apply the production baseline: pinned images, non-root user, port 8080, no secrets in layers, a .dockerignore, an exec-form ENTRYPOINT.',
      'Explain how signals reach a containerised process and why that decides whether shutdown is graceful.',
    ],
    introduction:
      'Months 1–4 produced a working system: a C# API with a database and a React client. On your machine it runs because your machine has the right SDK, the right environment variables and a database you set up by hand. Month 5 is about making it run anywhere, repeatably, and without a person typing commands. The first step is the container: a package holding your published app and everything it needs, built from a recipe checked into the repository. This lesson is about writing that recipe — the Dockerfile — the way a team that runs containers in production would.',
    keyTerms: [
      { term: 'Image', meaning: 'A read-only, layered file system plus metadata (entrypoint, user, ports, environment) — the package you build and ship.' },
      { term: 'Container', meaning: 'A running process started from an image, isolated by the kernel, with a thin writable layer on top.' },
      { term: 'Layer', meaning: 'The file-system change made by one build instruction; layers are cached and shared between images.' },
      { term: 'Build context', meaning: 'The files sent to the builder — usually the repository folder — filtered by .dockerignore.' },
      { term: 'Multi-stage build', meaning: 'A Dockerfile with several FROM stages, where a later stage copies only selected files from an earlier one.' },
      { term: 'Registry', meaning: 'A server that stores and serves images by name and tag (Docker Hub, Microsoft Artifact Registry, Azure Container Registry).' },
      { term: 'Digest', meaning: 'The content hash of an image (sha256:…); unlike a tag, it can never point at different contents.' },
    ],
    sections: [
      {
        title: 'What a container is, and what it is not',
        paragraphs: [
          'A container is an ordinary Linux process that the kernel has been told to isolate. Namespaces give it its own view of the system — its own process tree (it is PID 1 inside), its own network interfaces, its own mount table and hostname — and control groups (cgroups) cap the CPU and memory it may use. It is not a virtual machine: there is no second operating system and no hardware emulation. Every container on a host shares that host\'s kernel, which is why containers start in milliseconds and why a Linux image needs a Linux kernel (Docker Desktop on Windows and macOS runs a small Linux VM for you).',
          'An image is what the process sees as its file system: a stack of read-only layers plus metadata saying which program to start, as which user, with which environment variables. Starting a container adds a thin writable layer on top; anything written there disappears when the container is removed. That is a feature. A container should be disposable — replaceable at any moment by a fresh one from the same image — so anything that must survive (database files, uploads) belongs in a volume or, in the cloud, a managed service. Images are stored in registries and addressed by name and tag (mcr.microsoft.com/dotnet/aspnet:10.0) or by digest (…@sha256:…).',
        ],
        code: `docker build -t bookings-api:dev .          # build an image from ./Dockerfile
docker run --rm -p 8080:8080 bookings-api:dev # start a container; host 8080 -> container 8080
docker ps                                     # running containers
docker logs -f <container>                    # stdout and stderr of PID 1
docker exec -it <container> sh                # a shell inside (if the image has one)
docker image history bookings-api:dev         # the layers, and the instruction that made each`,
        label: 'The everyday commands',
      },
      {
        title: 'Layers and the build cache',
        paragraphs: [
          'Each instruction in a Dockerfile produces a layer, and the builder caches every layer. On the next build it reuses a cached layer for as long as the instruction and its inputs are unchanged; the first instruction whose inputs differ — a changed file under COPY, an edited RUN line — is rebuilt, and so is every instruction after it. Order therefore matters enormously. Put the things that change least often first, and the things that change on every commit (your source code) last.',
          'For .NET the expensive step is dotnet restore, which downloads NuGet packages. Its inputs are the project files, not the source. Copy only the .sln and .csproj files (and Directory.Packages.props, nuget.config or global.json if you have them), restore, and only then copy the source. Now an edit to a .cs file invalidates the COPY of the source and the publish, but the restore layer — often the slowest — is reused. Copy everything first and every one-line change re-downloads every package.',
          'The build context is everything in the folder you pass to docker build. Without a .dockerignore, that includes bin/ and obj/ (which break restores and bloat the context), .git, local appsettings with secrets, and node_modules. Treat .dockerignore as part of the Dockerfile: it decides what COPY . . can even see.',
        ],
        code: `# .dockerignore — what the builder never sees
**/bin/
**/obj/
**/node_modules/
.git/
.vs/
*.user
**/appsettings.*.local.json
secrets/`,
        label: 'A .dockerignore for a .NET repository',
      },
      {
        title: 'A multi-stage Dockerfile for ASP.NET Core',
        paragraphs: [
          'Microsoft publishes several images for each .NET version. sdk contains the compiler and the whole toolchain — what you need to build. aspnet contains the ASP.NET Core runtime — what an API needs to run. runtime is the same without ASP.NET Core (console apps and workers), and runtime-deps contains only the native libraries, for self-contained and Native AOT apps that carry their own runtime. The SDK image is several hundred megabytes larger than aspnet and includes tools an attacker would love to find, so it must never be what you ship.',
          'A multi-stage build gets the best of both. The first stage starts FROM the SDK, restores, and publishes. The second starts FROM aspnet — a fresh, small file system — and copies across only the published folder with COPY --from=build. Everything else from the first stage, including the source code and the SDK, is simply not in the final image. Name your stages (AS build) so the copy is readable and survives reordering.',
          '.NET 10 images are also available as chiseled variants (tags such as 10.0-noble-chiseled): Ubuntu-based images stripped to the files .NET needs, with no shell and no package manager, running as a non-root user by default. They are smaller and have far less to patch. The trade-off is debuggability — there is no shell to exec into, and no apt-get to install curl for a health check — so teams typically adopt them once health checks come from the orchestrator rather than from inside the image.',
        ],
        code: `# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. Restore from project files only — cached until a dependency changes
COPY Bookings.sln ./
COPY src/Bookings.Api/Bookings.Api.csproj src/Bookings.Api/
COPY src/Bookings.Domain/Bookings.Domain.csproj src/Bookings.Domain/
RUN dotnet restore src/Bookings.Api/Bookings.Api.csproj

# 2. Source and publish — rebuilt on every code change, but the restore is reused
COPY src/ src/
RUN dotnet publish src/Bookings.Api/Bookings.Api.csproj -c Release -o /app/publish --no-restore

# 3. The image you ship: runtime + published output, nothing else
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Bookings.Api.dll"]`,
        label: 'Build with the SDK, ship the runtime',
      },
      {
        title: 'The production baseline',
        paragraphs: [
          'Pin your base images. latest means "whatever was pushed most recently", so the same Dockerfile builds a different image next month — possibly a new major version. Pin at least the version (aspnet:10.0, which still receives patch updates under the same tag) and, where builds must be exactly reproducible, the digest. Rebuild regularly so the pinned tag\'s security patches reach you; a pinned image that is never rebuilt goes stale.',
          'Run as a non-root user. Since .NET 8, Microsoft\'s images include a user named app (its numeric id is in the APP_UID environment variable), and ASP.NET Core in those images listens on port 8080 by default instead of 80 precisely so that a non-root user can bind it. USER $APP_UID costs nothing and means a remote code execution bug lands as an unprivileged user. Using the numeric id rather than the name lets platforms that enforce "must not run as root" verify it.',
          'Never put secrets in an image. Every ENV and ARG value and every file you COPY is stored in the image and can be read by anyone who can pull it — docker image history and docker inspect show them, and deleting a file in a later layer does not remove it from the earlier one. Connection strings, API keys and passwords arrive at run time, as environment variables or mounted files injected by Compose, Kubernetes or Azure. When a build genuinely needs a credential (a private NuGet feed), use a BuildKit secret mount, which is available to one RUN instruction and never written to a layer.',
          'Finally, keep the final image lean: do not install debugging tools "just in case", install what you need with apt-get update and apt-get install --no-install-recommends in one RUN and delete /var/lib/apt/lists in the same instruction (a deletion in a later layer saves nothing), and scan images for known vulnerabilities in CI with a tool such as Docker Scout or Trivy.',
        ],
        code: `# A private feed token for restore only: never stored in a layer
RUN --mount=type=secret,id=nuget_token \\
    NUGET_TOKEN=$(cat /run/secrets/nuget_token) \\
    dotnet restore src/Bookings.Api/Bookings.Api.csproj

# docker build --secret id=nuget_token,env=NUGET_TOKEN -t bookings-api .`,
        label: 'Build-time credentials, done safely',
      },
      {
        title: 'PID 1, signals and graceful shutdown',
        paragraphs: [
          'When an orchestrator stops a container — docker stop, a Kubernetes rollout, Azure scaling in — it sends SIGTERM to PID 1, waits for a grace period (ten seconds for docker stop by default), and then sends SIGKILL, which cannot be caught. The ASP.NET Core host handles SIGTERM properly: it stops accepting new connections, lets in-flight requests finish within HostOptions.ShutdownTimeout, runs IHostedService.StopAsync, and flushes logs. That only happens if dotnet actually receives the signal.',
          'The shell form ENTRYPOINT dotnet Bookings.Api.dll is run as /bin/sh -c "dotnet Bookings.Api.dll", making the shell PID 1. A plain sh does not forward SIGTERM to its child, so your app never hears it and is killed mid-request when the grace period ends. The exec form, a JSON array, starts dotnet directly as PID 1. Use it for ENTRYPOINT and CMD, always.',
          'Health is the other half of the conversation with the orchestrator. Expose a liveness endpoint (the process is not wedged) and a readiness endpoint (dependencies are reachable and the app can take traffic) with ASP.NET Core health checks; Docker\'s HEALTHCHECK instruction, Compose and every cloud platform can probe them. Next week Azure Container Apps uses exactly these probes to decide when a new revision may receive traffic.',
        ],
        code: `// Program.cs — health endpoints the platform can probe
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddNpgSql(builder.Configuration.GetConnectionString("Bookings")!, tags: ["ready"]);

app.MapHealthChecks("/health/live", new() { Predicate = c => c.Tags.Contains("live") });
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });`,
        label: 'Liveness and readiness',
      },
      {
        title: 'Images without a Dockerfile, and knowing which to choose',
        paragraphs: [
          'The .NET SDK can build an OCI image itself: dotnet publish -t:PublishContainer infers a base image (aspnet for a web project), applies non-root and port defaults, and pushes to a local daemon or straight to a registry, all configured with MSBuild properties such as ContainerRepository, ContainerImageTags and ContainerFamily (set it to noble-chiseled for chiseled images). It needs no Docker daemon to build for a registry, which makes it attractive in CI.',
          'A Dockerfile remains the more general tool: it is the lingua franca every platform, scanner and teammate understands, it can build the React client and run tests in a stage, and it handles anything outside the .NET world. This course uses Dockerfiles so you understand what is in your image; knowing that, adopting SDK container publishing later is a small step.',
        ],
        code: `<!-- Bookings.Api.csproj — SDK container publishing -->
<PropertyGroup>
  <ContainerRepository>bookings-api</ContainerRepository>
  <ContainerFamily>noble-chiseled</ContainerFamily>
</PropertyGroup>

dotnet publish src/Bookings.Api -c Release -t:PublishContainer`,
        label: 'dotnet publish as an image builder',
      },
    ],
    table: {
      headers: ['Image', 'Contains', 'Use it for'],
      rows: [
        ['dotnet/sdk:10.0', 'Compiler, CLI, NuGet, full toolchain', 'Build stages only — never the final image'],
        ['dotnet/aspnet:10.0', 'ASP.NET Core and .NET runtimes', 'Web APIs and web apps'],
        ['dotnet/runtime:10.0', '.NET runtime without ASP.NET Core', 'Console apps and worker services'],
        ['dotnet/runtime-deps:10.0', 'Native dependencies only', 'Self-contained and Native AOT apps'],
        ['…:10.0-noble-chiseled', 'Minimal files, no shell, non-root', 'Hardened production images'],
      ],
    },
    exercise: {
      scenario: 'A team\'s API image is 900 MB, every one-line change takes four minutes to build in CI, a penetration test found the database password with docker inspect, and Kubernetes logs show the app being SIGKILLed during every deployment with requests in flight.',
      task: 'Explain the most likely cause of each problem and the Dockerfile change that fixes it.',
      answer: 'The size comes from shipping the SDK image (and probably the source): use a multi-stage build that publishes FROM sdk and copies only the publish output into FROM aspnet. The slow builds come from COPY . . before dotnet restore, so any change invalidates the restore layer: copy the .sln and .csproj files, restore, then copy the source; add a .dockerignore for bin/obj/.git. The password is in an ENV (or ARG, or a copied appsettings file) and therefore stored in the image: remove it and inject it at run time as an environment variable or mounted secret, rotating the leaked password. The SIGKILLs mean SIGTERM never reached dotnet — a shell-form ENTRYPOINT makes /bin/sh PID 1 — so switch to the exec form ENTRYPOINT ["dotnet", "Api.dll"] and let the host drain requests.',
      evidence: 'Multi-stage build; restore before source copy; secrets at run time only; exec-form ENTRYPOINT.',
    },
    misconceptions: [
      'A container is a lightweight virtual machine. It is an isolated process sharing the host kernel; there is no guest operating system.',
      'Deleting a secret file in a later RUN removes it from the image. Earlier layers still contain it; it must never be copied in.',
      'Pinning to aspnet:10.0 freezes the image forever. That tag receives patch releases; you still need to rebuild to pick them up.',
      'latest is the safest tag because it is the newest. It is unpredictable: the same Dockerfile can build a new major version tomorrow.',
      'Exec form and shell form ENTRYPOINT behave the same. Shell form makes /bin/sh PID 1, which does not forward SIGTERM to your app.',
      'Running as root inside a container is harmless because the container is isolated. A container escape or a mounted volume turns that root into real damage.',
    ],
    sources: [R.dotnetBuildContainer, R.dotnetImages, R.multiStage, R.bestPractices, R.buildCache, R.dockerfileRef, R.aspnetPort, R.rootless, R.buildSecrets, R.sdkPublish, R.owaspDocker, R.dockerOverview, R.microservicesBook],
    labs: [],
    questions: [
      { prompt: 'Which Dockerfile flag on COPY takes files from an earlier build stage instead of the build context? (one word, without dashes)', answer: 'from' },
      { prompt: 'Which signal does an orchestrator send first when it stops a container? (one word)', answer: 'SIGTERM', accept: ['sigterm', 'term'] },
    ],
    quiz: [
      { question: 'Why copy the .csproj files and run dotnet restore before copying the source?', options: ['restore needs an empty folder', 'So the restore layer stays cached when only source code changes', 'It makes the image smaller', 'COPY . . does not work with .NET'], answer: 1, explanation: 'A layer is rebuilt when its inputs change; restore depends only on project files.' },
      { question: 'Which base image belongs in the final stage of an ASP.NET Core API?', options: ['dotnet/sdk', 'dotnet/aspnet', 'dotnet/runtime', 'ubuntu:latest'], answer: 1, explanation: 'aspnet contains the ASP.NET Core runtime and no build tools.' },
      { question: 'Why do .NET 8+ images listen on port 8080 by default?', options: ['8080 is faster', 'So a non-root user can bind the port', 'Port 80 is reserved by Docker', 'For HTTPS'], answer: 1, explanation: 'Ports below 1024 need extra privileges on Linux.' },
      { question: 'A password is set with ENV in a Dockerfile. Who can read it?', options: ['Nobody — ENV is encrypted', 'Only the container process', 'Anyone who can pull the image', 'Only root on the host'], answer: 2, explanation: 'ENV values are stored in the image metadata.' },
      { question: 'What does the shell form ENTRYPOINT dotnet App.dll change compared with the exec form?', options: ['Nothing', 'The shell becomes PID 1 and SIGTERM does not reach dotnet', 'The app runs as root', 'Logs are lost'], answer: 1, explanation: 'Use the JSON-array exec form for ENTRYPOINT and CMD.' },
    ],
  },
  {
    id: 'dn5-2',
    slug: 'docker-compose-for-dotnet',
    title: 'Docker Compose: Your Whole System on One Command',
    summary: 'Describe the API, client and database as one Compose application: service discovery and network segmentation, start-up order with health checks and one-off migration jobs, volumes for state, configuration and secrets without plain-text passwords, and override files for development.',
    minutes: 55,
    prerequisite: 'Lesson dn5-1 (images and Dockerfiles).',
    outcomes: [
      'Write a compose.yaml that builds and runs an API, a React client and PostgreSQL together.',
      'Use service names for discovery and separate tiers with networks, including an internal network.',
      'Control start-up order with health checks, depends_on conditions and a one-off migration service, and explain why the app must still retry.',
      'Keep state on named volumes and secrets out of the file, using Compose secrets and the _FILE convention.',
      'Map configuration onto ASP.NET Core with environment variables, and separate development overrides from the base file.',
    ],
    introduction:
      'One container is a package; a system is several containers that must find each other, start in the right order, keep their data and share configuration safely. Docker Compose describes all of that in one declarative file, compose.yaml, so that "clone the repository and run docker compose up" is the entire onboarding guide. Compose is the standard tool for local development and CI test environments, and the concepts — services, networks, volumes, health, secrets — carry straight over to Azure Container Apps next week and to Kubernetes after that.',
    keyTerms: [
      { term: 'Service', meaning: 'One container definition in compose.yaml (image or build, environment, ports, networks…); it can be scaled to several replicas.' },
      { term: 'Project', meaning: 'The set of containers, networks and volumes Compose manages for one compose.yaml, named after its folder by default.' },
      { term: 'Service discovery', meaning: 'Compose\'s built-in DNS: a service is reachable from its networks by its service name.' },
      { term: 'Named volume', meaning: 'Storage managed by Docker that outlives any container; used for database files.' },
      { term: 'Health check', meaning: 'A command Docker runs inside the container to decide whether it is healthy, not merely running.' },
      { term: 'Compose secret', meaning: 'A file Compose mounts read-only at /run/secrets/<name> in the services that are granted it.' },
    ],
    sections: [
      {
        title: 'One file, one command',
        paragraphs: [
          'compose.yaml (the preferred name; docker-compose.yml still works) has a top-level services map and, optionally, networks, volumes, secrets and configs. Each service either names an image or builds one (build: . uses the Dockerfile in that folder). docker compose up --build builds what is needed, creates a network for the project, and starts every service; docker compose down stops and removes the containers and networks but keeps named volumes, so your database survives. down -v removes the volumes too — useful for a clean slate, catastrophic if you meant to keep the data.',
          'The file follows the Compose Specification, which merged the old version 2 and version 3 formats. The top-level version: key is obsolete and ignored; current Compose prints a warning when it sees one. Older tutorials also use the docker-compose command (with a hyphen) — that was Compose v1, now replaced by the docker compose plugin.',
        ],
        code: `docker compose up --build -d     # build, create, start in the background
docker compose ps                # services, state and health
docker compose logs -f api       # follow one service's logs
docker compose exec db psql -U bookings   # a command inside a running service
docker compose run --rm migrate  # run a one-off service
docker compose down              # stop and remove (named volumes are kept)`,
        label: 'The Compose workflow',
      },
      {
        title: 'Service discovery and networks',
        paragraphs: [
          'Compose puts every service on a default project network with built-in DNS, so the api reaches the database at Host=db — the service name. The most common mistake when moving an app into Compose is keeping Host=localhost: inside the api container, localhost is the api container itself, and nothing is listening there on 5432. Similarly, ports: publishes a container port on the host, for you and your browser; containers talk to each other on the container port over the network and need no ports entry at all.',
          'That makes ports a security decision. Publishing the database (5432:5432) exposes it to anything that can reach your machine; on a shared server it exposes it to the network. Publish only the front door. For more structure, declare networks yourself: a frontend network for the web server and the API, a backend network for the API and the database. A service is only reachable from the networks it joins, so the web tier cannot reach the database even if compromised. Mark the backend network internal: true and its services also have no route out to the internet.',
        ],
        code: `services:
  web:
    networks: [frontend]
    ports: ["8081:80"]         # the only published port
  api:
    networks: [frontend, backend]
  db:
    networks: [backend]          # unreachable from web

networks:
  frontend:
  backend:
    internal: true               # no outbound internet either`,
        label: 'Segment by tier',
      },
      {
        title: 'Start-up order, health and migrations',
        paragraphs: [
          'depends_on: [db] only waits for the db container to start, not for PostgreSQL to accept connections, which takes a few seconds. The long form waits for a condition: service_healthy waits until the dependency\'s healthcheck passes (so the dependency must define one — pg_isready for PostgreSQL), and service_completed_successfully waits until a one-off container has exited with code 0. That second condition is how to run database migrations: a migrate service built from the same image runs the migrations and exits, and the API depends on it completing. One migration runner avoids several API replicas racing to migrate the same database.',
          'Health-gated start-up is a convenience, not a guarantee. depends_on is only consulted when Compose starts the stack; if the database restarts later, nothing waits. The application must still treat dependencies as unreliable — the retries, timeouts and readiness checks from Month 3 — and in the cloud there is no depends_on at all. Compose makes local start-up smooth; resilience keeps production up.',
        ],
        code: `  db:
    image: postgres:17
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bookings -d bookings"]
      interval: 5s
      retries: 10

  migrate:
    build: .
    command: ["--migrate-only"]   # appended to the image's ENTRYPOINT
    depends_on:
      db: { condition: service_healthy }
    restart: "no"

  api:
    build: .
    depends_on:
      db: { condition: service_healthy }
      migrate: { condition: service_completed_successfully }
    restart: unless-stopped`,
        label: 'Wait for health, run migrations once',
      },
      {
        title: 'State: volumes and bind mounts',
        paragraphs: [
          'A container\'s writable layer disappears with the container, so the database files must live elsewhere. A named volume (db-data:/var/lib/postgresql/data, declared under the top-level volumes key) is storage Docker manages; it survives docker compose down and container upgrades. Check each image\'s documentation for its data path — the official postgres image documents it, and the path can change between major versions, which is one more reason to pin the image.',
          'A bind mount (./src:/app/src) maps a host folder into the container instead. It is the right tool for development workflows such as live reload, and the wrong tool for database files, where host file-system differences (permissions, Windows paths, performance) cause trouble. For development, Compose Watch (docker compose watch with a develop: section) can sync or rebuild on file changes without hand-written bind mounts.',
        ],
      },
      {
        title: 'Configuration and secrets',
        paragraphs: [
          'Configuration that varies between environments belongs in the environment, not in the image (the twelve-factor rule). ASP.NET Core reads environment variables over appsettings.json, with a double underscore standing for the section separator: ConnectionStrings__Bookings sets ConnectionStrings:Bookings, and Payments__TimeoutSeconds sets Payments:TimeoutSeconds. Compose sets variables with environment: or env_file:, and interpolates ${VARIABLE} from your shell or a .env file next to compose.yaml; ${VARIABLE:?message} makes Compose refuse to start when it is missing, instead of silently passing an empty string.',
          'Passwords should not be environment variables in a committed file at all. Compose secrets are files — declared at the top level from a file that is git-ignored, granted to individual services, and mounted read-only at /run/secrets/<name>. Many official images accept _FILE variants of their variables for exactly this: POSTGRES_PASSWORD_FILE=/run/secrets/db_password. In ASP.NET Core, read the file into configuration with AddKeyPerFile (each file name becomes a key) or read the one file you need at start-up. Secrets as files are also harder to leak by accident than environment variables, which show up in crash dumps, docker inspect and child processes.',
        ],
        code: `services:
  api:
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__Bookings: "Host=db;Database=bookings;Username=bookings"
      Payments__ApiKey: \${PAYMENTS_API_KEY:?set PAYMENTS_API_KEY in .env}
      Database__PasswordFile: /run/secrets/db_password
    secrets: [db_password]
  db:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets: [db_password]

secrets:
  db_password:
    file: ./secrets/db_password.txt   # git-ignored; created by each developer

// Program.cs: fold the secret file into the connection string
var cs = new NpgsqlConnectionStringBuilder(builder.Configuration.GetConnectionString("Bookings"));
if (builder.Configuration["Database:PasswordFile"] is { } file)
    cs.Password = File.ReadAllText(file).Trim();`,
        label: 'Environment for settings, files for secrets',
      },
      {
        title: 'Development versus everything else',
        paragraphs: [
          'docker compose up automatically merges compose.override.yaml over compose.yaml. Keep the base file close to how the system really runs (pinned images, health checks, no published database) and put development conveniences in the override: a published database port for your SQL client, ASPNETCORE_ENVIRONMENT=Development, a bind mount or watch configuration. Profiles (profiles: [tools]) keep optional services such as pgAdmin or a mail catcher out of the default start. CI can run docker compose -f compose.yaml -f compose.ci.yaml up to get an exact, repeatable integration-test environment.',
          'Compose runs containers on one machine. It does not schedule across a cluster, replace failed hosts, roll out new versions without downtime, or manage certificates and scaling — those are the job of a platform such as Azure Container Apps or Kubernetes. The good news is that everything you have expressed in compose.yaml — images, environment, secrets, health probes, which services are public — maps directly onto those platforms, as you will see next week.',
        ],
      },
    ],
    table: {
      headers: ['Need', 'Compose feature', 'Common mistake'],
      rows: [
        ['API reaches database', 'Service name DNS (Host=db)', 'Host=localhost inside a container'],
        ['Start after the database is ready', 'depends_on with service_healthy', 'Short depends_on, which only waits for start'],
        ['Run migrations once', 'One-off service + service_completed_successfully', 'Every API replica migrating at start-up'],
        ['Keep database files', 'Named volume', 'Relying on the container layer, or down -v'],
        ['Supply a password', 'secrets + _FILE variables', 'Plain-text password in environment'],
        ['Expose the app', 'ports on the front door only', 'Publishing the database to the host'],
      ],
    },
    exercise: {
      scenario: 'A new teammate runs docker compose up and the API crashes with "connection refused" on start, then works after docker compose restart api. Their connection string is Host=localhost, and the database service is published on 5432:5432 so that "the API can reach it".',
      task: 'Explain both problems and give the corrected compose.yaml fragments.',
      answer: 'Inside the api container, localhost is the api container, so the connection only "worked" for a host process; the API must use the service name: Host=db. Publishing 5432 is unnecessary for container-to-container traffic (they share the project network) and needlessly exposes the database, so remove ports from db. The crash on first start is a race: short-form depends_on waits only for the db container to start, not for PostgreSQL to accept connections. Add a healthcheck to db (pg_isready) and use depends_on: db: condition: service_healthy, and keep connection retries in the API because depends_on is not consulted after start-up.',
      evidence: 'Service-name discovery; no published database port; health-gated depends_on plus application retries.',
    },
    misconceptions: [
      'ports: is needed for containers to talk to each other. It only publishes a port on the host; containers use the network.',
      'depends_on waits for a service to be ready. The short form waits only for the container to start; use service_healthy with a healthcheck.',
      'docker compose down deletes my database. It keeps named volumes; down -v deletes them.',
      'The version: key selects the Compose file format. It is obsolete; the Compose Specification has no versions.',
      'Environment variables are a safe place for passwords. They leak through inspect output, logs and child processes; prefer secret files.',
      'Compose is a production orchestrator. It runs containers on one host; platforms such as Container Apps or Kubernetes handle the rest.',
    ],
    sources: [R.compose, R.composeRef, R.composeNetworking, R.composeStartup, R.composeSecrets, R.composeEnv, R.composeWatch, R.postgresImage, R.aspnetConfig, R.twelveFactor, R.aspnetDocker, R.microservicesBook],
    labs: [],
    questions: [
      { prompt: 'Which depends_on condition waits for a one-off container to exit with code 0? (underscores between words)', answer: 'service_completed_successfully', accept: ['service completed successfully'] },
      { prompt: 'In an ASP.NET Core environment variable name, which characters stand for the ":" section separator? (two characters, name them as one word)', answer: 'double underscore', accept: ['two underscores', 'double underscores', 'underscores'] },
    ],
    quiz: [
      { question: 'Inside the api container, what does Host=localhost refer to?', options: ['The Docker host', 'The db service', 'The api container itself', 'The Compose network gateway'], answer: 2, explanation: 'Use the service name to reach another service.' },
      { question: 'What does depends_on: db: condition: service_healthy require?', options: ['Nothing extra', 'A healthcheck on the db service', 'A published port on db', 'restart: always'], answer: 1, explanation: 'Health is only known if the dependency defines a healthcheck.' },
      { question: 'Why run migrations in a separate one-off service?', options: ['Migrations need root', 'So exactly one runner migrates before any API replica starts', 'EF Core cannot run inside the API', 'It makes the image smaller'], answer: 1, explanation: 'Several replicas migrating at once can race; a gated job runs once.' },
      { question: 'What does internal: true on a network do?', options: ['Hides it from docker ps', 'Removes the route from its containers to outside networks', 'Encrypts traffic', 'Makes it the default network'], answer: 1, explanation: 'Services on an internal network can talk to each other but not to the internet.' },
      { question: 'Where should a database password come from in compose.yaml?', options: ['environment: POSTGRES_PASSWORD: secret', 'A Compose secret file via POSTGRES_PASSWORD_FILE', 'An ARG in the Dockerfile', 'A label'], answer: 1, explanation: 'Secrets are mounted files, kept out of the committed file.' },
    ],
  },
  {
    id: 'dn5-3',
    slug: 'azure-foundations-identity-secrets',
    title: 'Azure Foundations: Resources, Identity and Secrets Without Passwords',
    summary: 'How Azure is organised and controlled, how to choose where a .NET service runs, and how workloads prove who they are: Microsoft Entra ID, managed identities, role-based access control at the narrowest scope, Key Vault, and repeatable Azure CLI scripts.',
    minutes: 60,
    prerequisite: 'Lessons dn5-1 and dn5-2. An Azure account is optional: the free account and student credits cover everything here, and the graded tasks run in your browser.',
    outcomes: [
      'Describe Azure\'s hierarchy (tenant, management group, subscription, resource group, resource) and how Azure Resource Manager applies every change.',
      'Choose between App Service, Container Apps, AKS and Functions for a .NET workload, and justify the choice.',
      'Explain managed identities, the difference between system- and user-assigned ones, and how DefaultAzureCredential uses them.',
      'Grant access with Azure RBAC at the narrowest useful scope, distinguishing control-plane and data-plane roles.',
      'Store the secrets that remain in Key Vault, and write Azure CLI scripts that are safe to re-run.',
    ],
    introduction:
      'Your containers run anywhere Docker runs. Production needs more than that: a place that runs them when your laptop is closed, scales them, renews their certificates, and gives them access to a database without anyone pasting a password into a portal. This lesson covers the parts of Azure every .NET engineer needs before deploying anything — how resources are organised, where code can run, and above all identity: how a running service proves who it is and gets exactly the access it needs. Get identity right and most secrets simply disappear.',
    keyTerms: [
      { term: 'Subscription', meaning: 'A billing and access boundary that contains resource groups; policies and roles can be assigned at this level.' },
      { term: 'Resource group', meaning: 'A container for resources that share a lifecycle — deployed, secured and deleted together.' },
      { term: 'Azure Resource Manager (ARM)', meaning: 'The single control-plane API behind the portal, CLI, PowerShell, Bicep and Terraform.' },
      { term: 'Microsoft Entra ID', meaning: 'Azure\'s identity provider (formerly Azure Active Directory): users, groups, applications and service principals.' },
      { term: 'Managed identity', meaning: 'An Entra identity for an Azure resource whose credentials Azure creates, rotates and never shows you.' },
      { term: 'Role assignment', meaning: 'Who (a principal) gets which role (a set of permissions) at which scope (a resource, group or subscription).' },
      { term: 'Key Vault', meaning: 'A managed store for secrets, keys and certificates, with access control, auditing and versioning.' },
    ],
    sections: [
      {
        title: 'How Azure is organised',
        paragraphs: [
          'Everything lives in a Microsoft Entra tenant — your organisation\'s directory. Inside it, subscriptions are the billing and access boundaries (teams usually separate production from non-production subscriptions), management groups above them apply policy to many subscriptions at once, and resource groups inside a subscription hold the actual resources. Put things in one resource group when they share a lifecycle: the registry, Container Apps environment, app and vault for one system in one environment belong together; a shared database used by several systems may not. Deleting a resource group deletes everything in it, which is wonderful for a test environment and the reason production groups get delete locks.',
          'Every change — from the portal, the az CLI, a Bicep file or Terraform — becomes a request to Azure Resource Manager, which authenticates the caller, checks authorisation and policy, and applies it. Most ARM operations are declarative PUTs of a resource\'s desired state, so creating a resource that already exists with the same settings succeeds without changing anything. That idempotency is what makes a provisioning script (this week) and infrastructure as code (next week) safe to re-run.',
          'Choose a region close to your users and check that it offers the services you need; use availability zones for anything that must survive a data-centre failure. Tag resources (env=prod, app=bookings, owner=platform-team): cost reports, budgets and policies group by tags, and an untagged resource is one nobody can say they own.',
        ],
      },
      {
        title: 'Where should the API run?',
        paragraphs: [
          'Azure offers several places to run a containerised .NET API, trading control for convenience. App Service runs web apps (from code or a container) with deployment slots, autoscale and managed certificates; it is mature and simple, and priced per always-on plan. Azure Container Apps runs containers on a managed Kubernetes platform you never see — KEDA for event-driven scaling (including to zero), Envoy for ingress, built-in revisions and traffic splitting — priced per second of CPU and memory used, with a free monthly grant. Azure Kubernetes Service gives you a real Kubernetes cluster: maximum control, maximum responsibility (upgrades, node pools, ingress controllers, policies). Azure Functions runs event-triggered code with per-execution pricing.',
          'For a team that has containerised an API, a client and a worker and does not want to operate Kubernetes, Container Apps is the usual answer, and it is what this course deploys to. The skills transfer: images, environment variables, secrets, probes and revisions mean the same thing on AKS.',
        ],
      },
      {
        title: 'Identity: how does a service prove who it is?',
        paragraphs: [
          'When your API calls Key Vault, the registry or a database, the other side must know who is calling. The traditional answer — a username and password, or a client secret, stored somewhere the app can read — creates the problem it solves: a secret that must be stored, rotated, kept out of logs and repositories, and that works for anyone who steals it. A managed identity removes it. Azure creates an identity in Entra ID for your resource and makes short-lived tokens available to code running on that resource only; there is no secret for you to see, store or leak, and Azure rotates the underlying credentials.',
          'A system-assigned identity is created with a resource and deleted with it; it is simple, but it does not exist until the resource does. A user-assigned identity is a resource in its own right that you create first and attach to one or more apps. For Container Apps pulling from a private registry, a user-assigned identity is the better fit: you can grant it AcrPull before the app exists, so the first revision can pull its image.',
          'In .NET, the Azure SDK clients take a TokenCredential. DefaultAzureCredential tries a chain of sources — environment variables, workload identity, managed identity, then developer tools such as the Azure CLI and Visual Studio — so the same code works on your laptop (using your az login) and in Azure (using the managed identity). In production prefer a specific credential such as ManagedIdentityCredential, or restrict the chain: it starts faster, and it cannot silently pick up an unexpected identity.',
        ],
        code: `// Program.cs — the same code locally (az login) and in Azure (managed identity)
TokenCredential credential = builder.Environment.IsDevelopment()
    ? new DefaultAzureCredential()
    : new ManagedIdentityCredential(ManagedIdentityId.FromUserAssignedClientId(
          builder.Configuration["AZURE_CLIENT_ID"]));

builder.Services.AddSingleton(new SecretClient(
    new Uri("https://kv-bookings-prod.vault.azure.net/"), credential));
builder.Services.AddSingleton(new BlobServiceClient(
    new Uri("https://stbookingsprod.blob.core.windows.net/"), credential));`,
        label: 'Azure SDK clients authenticate with an identity, not a key',
      },
      {
        title: 'Authorisation: least privilege with Azure RBAC',
        paragraphs: [
          'An identity proves who you are; a role assignment says what you may do. Each assignment joins three things: a principal (user, group, service principal or managed identity), a role (a named set of permitted actions, such as AcrPull or Key Vault Secrets User), and a scope (a single resource, a resource group, a subscription or a management group). Assignments are inherited downwards, so a role at subscription scope applies to every resource in it. Grant the narrowest role at the narrowest scope that works: the API needs to pull from one registry and read secrets from one vault, so it gets AcrPull on that registry and Key Vault Secrets User on that vault — nothing more.',
          'Distinguish the control plane (managing resources: create a vault, change its settings) from the data plane (using them: read a secret, push an image). Contributor is a control-plane role that can change almost anything in its scope; handing it to an application "to fix a permissions error" turns any bug in that app into a way to delete or reconfigure your infrastructure. The right fix for a 403 is to find the specific data-plane role the operation needs. New role assignments can take a few minutes to take effect, which explains many "it fails, then works" first deployments.',
        ],
        code: `ID_PRINCIPAL=$(az identity show -g "$RG" -n "$ID_NAME" --query principalId -o tsv)
ACR_ID=$(az acr show --name "$ACR" --query id -o tsv)

az role assignment create \\
  --assignee-object-id "$ID_PRINCIPAL" --assignee-principal-type ServicePrincipal \\
  --role AcrPull --scope "$ACR_ID"       # one registry, pull only`,
        label: 'Who, what, where',
      },
      {
        title: 'The secrets that remain: Key Vault',
        paragraphs: [
          'Prefer passwordless connections wherever the service supports Entra authentication: Azure Storage, Service Bus, Key Vault itself, Azure SQL and Azure Database for PostgreSQL can all accept the managed identity\'s token, so there is no database password to manage at all. Some secrets remain — a third-party payment API key, a webhook signing secret, a password for a database that does not support Entra sign-in. Those go in Key Vault.',
          'Create vaults with the Azure RBAC permission model (--enable-rbac-authorization true), so vault access is governed by the same role assignments as everything else, rather than the older per-vault access policies. Grant applications Key Vault Secrets User — read secret values only. Keep soft delete (on by default) and turn on purge protection for production, so a deleted secret can be recovered. Reference secrets by their versionless URI (…/secrets/db-password) so a rotated value is picked up without a redeploy, and never copy a secret value into an environment variable definition, a script or a pipeline log.',
        ],
      },
      {
        title: 'Scripts you can run twice',
        paragraphs: [
          'Clicking in the portal is fine for exploring and dreadful for production: nobody can review it, repeat it or tell what changed. Next week replaces scripts with Terraform, but a good Azure CLI script is already a big step up, and the same habits apply. Start with set -euo pipefail so the first failure stops the script; put names in variables defined once at the top; quote every expansion; capture ids with --query and -o tsv rather than copying them from the portal; and prefer create commands, which ARM applies idempotently, over sequences that assume nothing exists yet.',
          'Tag the image with the commit that produced it (git rev-parse --short HEAD), never latest: a commit-tagged image tells you exactly what is running, and rolling back means pointing at an older tag that still exists. Building with az acr build runs the Docker build in Azure, which needs no local Docker daemon and keeps the image inside the registry\'s network.',
        ],
        code: `#!/usr/bin/env bash
set -euo pipefail
RG=rg-bookings-prod
LOCATION=westeurope
ACR=acrbookingsprod
GIT_SHA=$(git rev-parse --short HEAD)

az group create --name "$RG" --location "$LOCATION" --tags env=prod app=bookings
az acr create --resource-group "$RG" --name "$ACR" --sku Basic --admin-enabled false
az acr build --registry "$ACR" --image "bookings-api:$GIT_SHA" .`,
        label: 'A provisioning script with the safety catches on',
      },
    ],
    table: {
      headers: ['Need', 'Do this', 'Not this'],
      rows: [
        ['App pulls its image', 'Managed identity with AcrPull on the registry', 'Registry admin user and password'],
        ['App reads a secret', 'Key Vault Secrets User on that vault', 'Secret pasted into app settings'],
        ['App reaches a database', 'Entra (passwordless) authentication', 'Password in a connection string'],
        ['Fix a 403 error', 'Find the specific data-plane role', 'Grant Contributor on the subscription'],
        ['Identify a running build', 'Image tagged with the commit', 'latest'],
        ['Make changes repeatable', 'Reviewed scripts or IaC, re-runnable', 'Portal clicks'],
      ],
    },
    exercise: {
      scenario: 'A deployment fails because the Container App cannot pull its image. A colleague "fixes" it by enabling the registry admin user and passing its password to the app, and then, when the app gets a 403 from Key Vault, assigns the app\'s identity Contributor on the subscription.',
      task: 'Explain what each fix exposes and describe the least-privilege configuration.',
      answer: 'The admin user is a single shared credential with push and pull rights to every repository in the registry; stored in app configuration, it can be leaked and used to push malicious images. Contributor on the subscription lets the app — and anyone who compromises it — create, change or delete any resource; it also does not grant data-plane access to secrets in an RBAC vault, so it did not even fix the right problem. Instead: create a user-assigned managed identity, grant it AcrPull scoped to the registry\'s resource id and Key Vault Secrets User scoped to the vault\'s resource id, attach it to the app as both its identity and its registry identity, reference the secret from Key Vault with that identity, and disable the admin user. Remove the Contributor assignment.',
      evidence: 'A managed identity, two narrowly scoped data-plane roles, no stored credentials.',
    },
    misconceptions: [
      'A managed identity is a secret Azure stores for you. There is no secret you can see; code on the resource obtains short-lived tokens.',
      'Contributor is a safe default for applications. It can change almost anything in its scope and still does not grant data-plane access to RBAC-protected secrets.',
      'Role assignments apply instantly. They can take a few minutes to propagate.',
      'Key Vault makes every secret safe. The best secret is one you do not need: use passwordless authentication where the service supports it.',
      'latest is fine in a private registry. Without a commit tag you cannot tell what is running or roll back reliably.',
    ],
    sources: [R.organize, R.computeTree, R.compareContainers, R.managedIdentity, R.credentialChains, R.rbac, R.kvRbac, R.acrIdentity, R.pgEntra, R.cliBash, R.wellArchitected],
    labs: [],
    questions: [
      { prompt: 'Which built-in role lets an identity pull images from Azure Container Registry? (one word)', answer: 'AcrPull' },
      { prompt: 'Which kind of managed identity can be created before the app that uses it? (two words, hyphenated or not)', answer: 'user assigned', accept: ['user-assigned', 'userassigned'] },
    ],
    quiz: [
      { question: 'Which three things make up an Azure role assignment?', options: ['User, password, region', 'Principal, role, scope', 'Subscription, tag, policy', 'Identity, secret, vault'], answer: 1, explanation: 'Who, what, and where.' },
      { question: 'Why use a user-assigned identity for a Container App that pulls from a private registry?', options: ['It is cheaper', 'AcrPull can be granted before the app\'s first revision pulls', 'System-assigned identities cannot pull images', 'It needs no role assignment'], answer: 1, explanation: 'A system-assigned identity does not exist until the app is created.' },
      { question: 'An app gets 403 reading a Key Vault secret (RBAC model). What is the right fix?', options: ['Contributor on the vault', 'Key Vault Secrets User on the vault', 'Owner on the subscription', 'Enable the admin user'], answer: 1, explanation: 'Reading secret values is a data-plane permission.' },
      { question: 'What does DefaultAzureCredential do?', options: ['Stores a default password', 'Tries a chain of credential sources, including managed identity and developer logins', 'Creates a service principal', 'Disables authentication locally'], answer: 1, explanation: 'One code path for local development and Azure.' },
      { question: 'Why tag images with the commit SHA?', options: ['Registries require it', 'You know exactly what is running and can roll back to a specific build', 'It makes images smaller', 'It enables caching'], answer: 1, explanation: 'latest is ambiguous; a SHA is not.' },
    ],
  },
  {
    id: 'dn5-4',
    slug: 'azure-container-apps-releases',
    title: 'Running .NET on Azure Container Apps: Revisions, Probes, Scaling and Safe Releases',
    summary: 'Deploy the API to Azure Container Apps and run it properly: environments, apps, revisions and replicas; HTTPS ingress and forwarded headers; secrets from Key Vault; startup, liveness and readiness probes; scaling rules and sizing; and canary and blue-green releases with traffic splitting and labels.',
    minutes: 60,
    prerequisite: 'Lesson dn5-3 (identity, RBAC and Key Vault).',
    outcomes: [
      'Explain the Container Apps model — environment, app, revision, replica — and which changes create a new revision.',
      'Configure ingress, forwarded headers, environment variables and Key Vault-backed secrets for an ASP.NET Core API.',
      'Define startup, liveness and readiness probes that match the app\'s health endpoints, and size containers correctly.',
      'Set scaling rules and minimum replicas, weighing cold starts against cost.',
      'Release with multiple revisions, traffic splitting and labels, and roll back by moving traffic.',
    ],
    introduction:
      'Container Apps takes the container you built in Week 17 and runs it behind HTTPS, scales it with load, restarts it when it fails, and lets you release new versions gradually. Everything is declared in one resource definition — which can be written as YAML and reviewed in a pull request — so the platform\'s behaviour is part of your codebase rather than a set of portal settings someone once clicked. This lesson goes through that definition section by section, then uses revisions to make releasing boring.',
    keyTerms: [
      { term: 'Environment', meaning: 'A secure boundary around a group of container apps: shared network, logging (Log Analytics) and internal DNS.' },
      { term: 'Revision', meaning: 'An immutable snapshot of an app\'s template (image, containers, scale rules); each template change creates a new one.' },
      { term: 'Replica', meaning: 'One running instance of a revision; scaling changes the number of replicas.' },
      { term: 'Ingress', meaning: 'The platform\'s HTTPS front door for an app — external (internet) or internal (environment only).' },
      { term: 'Probe', meaning: 'A periodic check (startup, liveness, readiness) the platform uses to decide whether a replica is started, alive and ready for traffic.' },
      { term: 'Traffic splitting', meaning: 'Dividing an app\'s requests between active revisions by percentage weight.' },
      { term: 'Canary release', meaning: 'Sending a small share of traffic to a new version and widening it only while it stays healthy.' },
    ],
    sections: [
      {
        title: 'Environments, apps, revisions and replicas',
        paragraphs: [
          'A Container Apps environment is the boundary several apps share: a virtual network, a Log Analytics workspace for their logs, and an internal DNS zone so apps can call each other by name — the cloud counterpart of a Compose project. Inside it, a container app has two kinds of settings. Application-scope settings live under properties.configuration: ingress, secrets, registries, revision mode. Revision-scope settings live under properties.template: containers and their images, environment variables, probes, resources and scale rules.',
          'Every change to the template creates a new revision — an immutable snapshot — named <app>--<suffix>. Changing configuration does not; a changed secret, for example, reaches running replicas only when the revision restarts or a new revision is created. Each revision runs one or more replicas. Keeping this split in mind explains most surprises: "I updated the secret and nothing happened" (restart the revision) and "I changed an environment variable and got a new revision" (environment variables are part of the template).',
        ],
        code: `az containerapp update --name bookings-api --resource-group rg-bookings-prod \\
  --yaml containerapp.yaml               # declarative: the whole definition, reviewed in a PR

az containerapp revision list -n bookings-api -g rg-bookings-prod -o table
az containerapp logs show -n bookings-api -g rg-bookings-prod --follow`,
        label: 'Deploy from a reviewed file',
      },
      {
        title: 'Ingress, HTTPS and forwarded headers',
        paragraphs: [
          'External ingress gives the app a public HTTPS endpoint on the environment\'s domain with a managed certificate; internal ingress makes it reachable only inside the environment — right for a worker API that only other apps call. targetPort is the port your container listens on: 8080 for the aspnet images. Set allowInsecure: false so plain HTTP requests are redirected to HTTPS.',
          'TLS ends at the platform\'s proxy, so your app receives plain HTTP from it. ASP.NET Core therefore sees the scheme as http and the client address as the proxy\'s, which breaks generated links, redirect URLs, cookies marked Secure and rate limiting by client IP. Enable the forwarded headers middleware so the app trusts X-Forwarded-Proto and X-Forwarded-For from the platform — the setting ASPNETCORE_FORWARDEDHEADERS_ENABLED=true does this for the common case. Do not also call UseHttpsRedirection expecting it to work behind the proxy without forwarded headers; it will redirect forever.',
        ],
      },
      {
        title: 'Configuration and secrets',
        paragraphs: [
          'Plain settings are environment variables in the container definition, mapped onto ASP.NET Core configuration with double underscores exactly as in Compose. Secrets are declared once at application scope — either with a value (avoid in files you commit) or, better, with a keyVaultUrl and the identity used to read it — and referenced from environment variables with secretRef. The app sees an ordinary environment variable; the definition contains only a reference, so it can be committed, reviewed and diffed safely.',
          'Pull the image the same way: list the registry with identity instead of a username and passwordSecretRef. With the user-assigned identity from the previous lesson attached to the app, both the registry pull and the secret read happen with tokens, and the YAML holds no credentials at all.',
        ],
        code: `properties:
  configuration:
    registries:
      - server: acrbookingsprod.azurecr.io
        identity: <user-assigned identity resource id>
    secrets:
      - name: db-password
        keyVaultUrl: https://kv-bookings-prod.vault.azure.net/secrets/db-password
        identity: <user-assigned identity resource id>
  template:
    containers:
      - name: api
        image: acrbookingsprod.azurecr.io/bookings-api:3f9c2ab
        env:
          - name: ASPNETCORE_FORWARDEDHEADERS_ENABLED
            value: "true"
          - name: Database__Password
            secretRef: db-password`,
        label: 'References, not values',
      },
      {
        title: 'Probes, sizing and shutdown',
        paragraphs: [
          'The platform decides what to do with each replica using three probes. A startup probe gives a slow-starting app time to boot before the other probes begin. A liveness probe restarts a replica that has stopped responding — keep it shallow (is the process serving requests?) so a database outage does not make the platform restart every replica in a loop. A readiness probe decides whether the replica receives traffic — this is where dependency checks belong, and it is what makes rollouts safe: a new revision gets no requests until its replicas are ready. Point them at the /health/live and /health/ready endpoints from Week 17.',
          'Each container requests CPU and memory. On the Consumption plan they come in fixed pairs, with memory twice the CPU in Gi (0.25 CPU with 0.5Gi, 0.5 with 1Gi, 1 with 2Gi, and so on). Measure before raising them; a .NET API often runs comfortably in 0.5 CPU and 1Gi. When a replica is removed — scaling in or replacing a revision — it receives SIGTERM and a grace period before being killed, so the exec-form ENTRYPOINT and graceful shutdown from Week 17 decide whether in-flight requests complete.',
        ],
      },
      {
        title: 'Scaling, and the cost of zero',
        paragraphs: [
          'Scale rules say when to add replicas: an http rule scales on concurrent requests per replica, and KEDA-based custom rules scale on things like queue length (an Azure Service Bus queue for the Week 11 workers) or CPU. minReplicas and maxReplicas bound the result. With minReplicas: 0 an idle app costs nothing, but the first request after a quiet period waits while a replica starts — a cold start of seconds that users notice on an API and nobody notices on a queue worker. Keep at least one replica for user-facing APIs (two if you want a replica to survive a restart without a gap) and let workers scale to zero.',
          'maxReplicas is a safety limit as much as a scaling one: it caps cost under a traffic spike or a retry storm, and it protects downstream dependencies — a database with a connection limit does not care how quickly your API can scale out.',
        ],
        code: `  template:
    scale:
      minReplicas: 1
      maxReplicas: 5
      rules:
        - name: http-scaling
          http:
            metadata:
              concurrentRequests: "50"   # add a replica beyond ~50 in-flight requests each`,
        label: 'Bounded, load-based scaling',
      },
      {
        title: 'Releasing safely with revisions',
        paragraphs: [
          'In single revision mode, deploying a new template starts a new revision, waits until it is ready, then moves all traffic to it and deactivates the old one — a zero-downtime rolling release, provided your readiness probe is honest. Multiple revision mode lets several revisions stay active and divides traffic between them by weight, which enables two release patterns. A canary sends a small share (say 10%) to the new revision, watches error rates and latency, and widens the share only while it stays healthy. Blue-green keeps the new revision at 0% while you test it through its own address, then switches all traffic in one step.',
          'Labels give a revision a stable URL of its own (the app name, three hyphens, the label), so you can test "green" directly before any user reaches it. Name revisions explicitly with revisionSuffix and refer to them by revisionName in traffic rules; latestRevision: true quietly moves traffic to whatever is deployed next, which defeats the point of a canary. Rolling back is then a traffic change, not a rebuild: set the old revision back to 100%. Deactivate old revisions once you no longer need them.',
        ],
        code: `  configuration:
    activeRevisionsMode: Multiple
    ingress:
      traffic:
        - revisionName: bookings-api--v42
          weight: 90
          label: blue
        - revisionName: bookings-api--v43
          weight: 10
          label: green          # https://bookings-api---green.<environment domain>
  template:
    revisionSuffix: v43`,
        label: 'A 90/10 canary',
      },
    ],
    table: {
      headers: ['Setting', 'Where it lives', 'Creates a new revision?'],
      rows: [
        ['Image, env vars, probes, resources', 'properties.template', 'Yes'],
        ['Scale rules and replica limits', 'properties.template.scale', 'Yes'],
        ['Ingress and traffic weights', 'properties.configuration', 'No'],
        ['Secrets and registries', 'properties.configuration', 'No — restart to pick up changes'],
        ['Revision mode', 'properties.configuration', 'No'],
      ],
    },
    exercise: {
      scenario: 'After moving to Container Apps, three things go wrong: login redirects send users to http:// URLs and loop; during a database outage every replica restarts repeatedly; and a release with a startup bug briefly served errors to every user before anyone noticed.',
      task: 'Diagnose each problem and give the configuration change that prevents it.',
      answer: 'TLS terminates at the platform proxy, so ASP.NET Core sees http and builds http redirect URLs; enable forwarded headers (ASPNETCORE_FORWARDEDHEADERS_ENABLED=true or UseForwardedHeaders) so it honours X-Forwarded-Proto. The liveness probe checks the database, so a dependency outage makes the platform kill healthy processes; make liveness shallow (/health/live) and put dependency checks in the readiness probe (/health/ready), which only removes replicas from traffic. The bad release reached everyone because traffic moved without a gate; keep an honest readiness probe so a revision that cannot start receives no traffic, and release with multiple revision mode — a small canary weight on a named revision, widened only while errors and latency stay normal, with rollback by moving traffic back.',
      evidence: 'Forwarded headers; shallow liveness, dependency-aware readiness; canary traffic splitting on named revisions.',
    },
    misconceptions: [
      'Updating a secret immediately changes running replicas. Secrets are application-scope; restart the revision or create a new one.',
      'Liveness probes should check every dependency. That turns a dependency outage into a restart loop; dependency checks belong in readiness.',
      'minReplicas: 0 is always the cheapest good choice. For a user-facing API, cold starts cost users seconds.',
      'latestRevision: true is fine for a canary. It moves traffic to whatever is deployed next; name revisions explicitly.',
      'Rollback means rebuilding the previous version. With revisions it is a traffic change to a revision that is still there.',
      'HTTPS at the platform means the app sees HTTPS. The app sees plain HTTP from the proxy unless it honours forwarded headers.',
    ],
    sources: [R.acaOverview, R.acaRevisions, R.acaTraffic, R.acaProbes, R.acaScale, R.acaSecrets, R.acaYaml, R.acaContainers, R.acrIdentity, R.forwardedHeaders, R.wellArchitected],
    labs: [],
    questions: [
      { prompt: 'Which probe type decides whether a replica receives traffic? (one word)', answer: 'readiness' },
      { prompt: 'Which activeRevisionsMode value lets two revisions share traffic? (one word)', answer: 'Multiple' },
    ],
    quiz: [
      { question: 'Which change creates a new revision?', options: ['Changing a secret', 'Changing the container image', 'Changing traffic weights', 'Changing the registry'], answer: 1, explanation: 'Template (revision-scope) changes create revisions.' },
      { question: 'Where should a database connectivity check go?', options: ['Liveness probe', 'Readiness probe', 'Startup probe only', 'Nowhere'], answer: 1, explanation: 'Readiness removes the replica from traffic without restarting it.' },
      { question: 'Which CPU/memory pair is valid on the Consumption plan?', options: ['0.5 CPU / 2Gi', '0.5 CPU / 1Gi', '1 CPU / 1Gi', '0.25 CPU / 1Gi'], answer: 1, explanation: 'Memory is twice the CPU in Gi.' },
      { question: 'Why do login redirects use http:// behind Container Apps ingress?', options: ['allowInsecure is true', 'TLS ends at the proxy and the app ignores X-Forwarded-Proto', 'The certificate expired', 'Port 8080 is HTTP-only'], answer: 1, explanation: 'Enable forwarded headers.' },
      { question: 'How do you roll back a canary that misbehaves?', options: ['Rebuild the old image', 'Set the stable revision\'s weight back to 100', 'Delete the environment', 'Scale to zero'], answer: 1, explanation: 'Rollback is a traffic change.' },
    ],
  },
];
