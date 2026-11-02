# Publishes the in-browser C# runner into public/csharp-runtime/_framework.
# Requires the .NET 10 SDK. Run from anywhere: powershell -File tools/csharp-runner/build.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $here '..\..')
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
$dotnetPath = if ($dotnet) { $dotnet.Source } else { Join-Path $env:LOCALAPPDATA 'Microsoft\dotnet\dotnet.exe' }
$staging = Join-Path $here 'bin\publish'
$target = Join-Path $root 'public\csharp-runtime\_framework'

$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_NOLOGO = '1'
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
& $dotnetPath publish (Join-Path $here 'CSharpRunner.csproj') -c Release -o $staging
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed with exit code $LASTEXITCODE" }

if (Test-Path $target) { Remove-Item -Recurse -Force $target }
New-Item -ItemType Directory -Force $target | Out-Null
Copy-Item -Recurse (Join-Path $staging 'wwwroot\_framework\*') $target
$size = (Get-ChildItem -Recurse $target | Measure-Object Length -Sum).Sum / 1MB
Write-Host ("C# runtime published to {0} ({1:N1} MB)" -f $target, $size)
