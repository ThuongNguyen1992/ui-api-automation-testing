#!/usr/bin/env bash
# ==============================
# One-command setup on macOS — tools via Homebrew → npm packages + Husky hooks → Playwright browser → type check
#   bash scripts/setup-macos.sh               everything
#   bash scripts/setup-macos.sh --skip-java   no Java (only needed to build the Allure report locally)
#   bash scripts/setup-macos.sh --skip-k6     no k6 (only needed for performance tests)
# Tools already installed are kept as they are.
# ==============================
set -euo pipefail
cd "$(dirname "$0")/.."

SKIP_JAVA=false
SKIP_K6=false
for arg in "$@"; do
  case "$arg" in
    --skip-java) SKIP_JAVA=true ;;
    --skip-k6) SKIP_K6=true ;;
    *) echo "❌ Unknown option: $arg" && exit 1 ;;
  esac
done

step() { printf '\n🔹 %s\n' "$1"; }

# 1️⃣ Homebrew — installs the other tools
if ! command -v brew >/dev/null 2>&1; then
  echo "❌ Homebrew is required: https://brew.sh — install it, then run this script again."
  exit 1
fi

# 2️⃣ Node.js ≥ 20
step "Node.js"
if command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ]; then
  echo "✅ Node $(node -v)"
else
  brew install node
  echo "✅ Node $(node -v)"
fi

# 3️⃣ Java 11+ — Allure CLI (macOS has a /usr/bin/java stub, so ask java_home for a real JDK)
step "Java (Allure report)"
if $SKIP_JAVA; then
  echo "⏭ skipped"
elif /usr/libexec/java_home -v 11+ >/dev/null 2>&1; then
  echo "✅ Java $(/usr/libexec/java_home -v 11+)"
else
  brew install --cask temurin
  echo "✅ Java installed"
fi

# 4️⃣ k6 — performance tests
step "k6 (performance tests)"
if $SKIP_K6; then
  echo "⏭ skipped"
elif command -v k6 >/dev/null 2>&1; then
  echo "✅ $(k6 version | head -1)"
else
  brew install k6
  echo "✅ $(k6 version | head -1)"
fi

# 5️⃣ Project
step "npm packages + Husky git hooks"
npm ci

step "Playwright browser (Chromium)"
npx playwright install chromium

step "Type check"
npm run lint

printf '\n✅ Setup done. Next: npm test   (or npm run test:smoke)\n'
