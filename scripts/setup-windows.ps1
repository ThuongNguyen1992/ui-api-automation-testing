# ==============================
# One-command setup on Windows — tools via winget → npm packages + Husky hooks → Playwright browser → type check
#   powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1              everything
#   powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1 -SkipJava    no Java (only needed to build the Allure report locally)
#   powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1 -SkipK6      no k6 (only needed for performance tests)
# Tools already installed are kept as they are.
# ==============================
param(
  [switch]$SkipJava,
  [switch]$SkipK6
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

function Step($text) { Write-Host "`n🔹 $text" }
function Has($command) { [bool](Get-Command $command -ErrorAction SilentlyContinue) }

# winget installs into a new PATH entry → reload PATH so this session sees the new tool
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Install($id) {
  winget install --id $id --exact --silent --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { throw "winget could not install $id" }
  Refresh-Path
}

# 1️⃣ winget — installs the other tools (built into Windows 10 1809+ / 11 as "App Installer")
if (-not (Has 'winget')) {
  Write-Host '❌ winget is required: install "App Installer" from the Microsoft Store, then run this script again.'
  exit 1
}

# 2️⃣ Node.js ≥ 20
Step 'Node.js'
if ((Has 'node') -and [int]((node -v).TrimStart('v').Split('.')[0]) -ge 20) {
  Write-Host "✅ Node $(node -v)"
} else {
  Install 'OpenJS.NodeJS.LTS'
  Write-Host "✅ Node $(node -v)"
}

# 3️⃣ Java 11+ — Allure CLI
Step 'Java (Allure report)'
if ($SkipJava) {
  Write-Host '⏭ skipped'
} elseif (Has 'java') {
  Write-Host '✅ Java found'
} else {
  Install 'EclipseAdoptium.Temurin.21.JRE'
  Write-Host '✅ Java installed'
}

# 4️⃣ k6 — performance tests
Step 'k6 (performance tests)'
if ($SkipK6) {
  Write-Host '⏭ skipped'
} elseif (Has 'k6') {
  Write-Host "✅ $(k6 version)"
} else {
  Install 'GrafanaLabs.k6'
  Write-Host "✅ $(k6 version)"
}

# 5️⃣ Project
Step 'npm packages + Husky git hooks'
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }

Step 'Playwright browser (Chromium)'
npx playwright install chromium
if ($LASTEXITCODE -ne 0) { throw 'Playwright install failed' }

Step 'Type check'
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Type check failed' }

Write-Host "`n✅ Setup done. Next: npm test   (or npm run test:smoke)"
