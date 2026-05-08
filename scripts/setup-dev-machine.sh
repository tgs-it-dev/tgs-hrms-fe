#!/usr/bin/env bash
# One-shot script to set up a dev machine for TGS HRMS frontend work
# Usage: bash scripts/setup-dev-machine.sh

set -e

REPO_URL="https://github.com/tgs-it-dev/tgs-hrms-fe.git"
PROJECT_DIR="$HOME/Documents/GitHub/tgs-hrms-fe"

echo "=============================="
echo " TGS HRMS Dev Machine Setup"
echo "=============================="

# ── 1. Homebrew ──────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "→ Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✓ Homebrew already installed"
fi

# ── 2. Core tools ────────────────────────────────────────────
echo "→ Installing core tools..."
brew install git gh node

# ── 3. VS Code ───────────────────────────────────────────────
if ! command -v code &>/dev/null; then
  echo "→ Installing VS Code..."
  brew install --cask visual-studio-code
else
  echo "✓ VS Code already installed"
fi

# VS Code extensions for this project
echo "→ Installing VS Code extensions..."
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension PKief.material-icon-theme
code --install-extension eamodio.gitlens

# ── 4. Claude Code CLI ───────────────────────────────────────
if ! command -v claude &>/dev/null; then
  echo "→ Installing Claude Code CLI..."
  npm install -g @anthropic-ai/claude-code
else
  echo "✓ Claude Code CLI already installed"
fi

# ── 5. GitHub authentication ─────────────────────────────────
echo "→ Authenticating with GitHub..."
gh auth status &>/dev/null || gh auth login

# ── 6. Clone repo ────────────────────────────────────────────
if [ ! -d "$PROJECT_DIR" ]; then
  echo "→ Cloning repository..."
  mkdir -p "$(dirname "$PROJECT_DIR")"
  gh repo clone tgs-it-dev/tgs-hrms-fe "$PROJECT_DIR"
else
  echo "✓ Repository already cloned at $PROJECT_DIR"
fi

# ── 7. Install dependencies ──────────────────────────────────
echo "→ Installing npm dependencies..."
cd "$PROJECT_DIR"
npm ci

# ── 8. Set up .env ───────────────────────────────────────────
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "→ Creating .env from example..."
  cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env" 2>/dev/null || \
    echo "⚠ No .env.example found — create .env manually"
else
  echo "✓ .env already exists"
fi

# ── 9. Open in VS Code ───────────────────────────────────────
echo "→ Opening project in VS Code..."
code "$PROJECT_DIR"

echo ""
echo "=============================="
echo " Setup complete!"
echo "=============================="
echo ""
echo "Next steps:"
echo "  1. Fill in .env with API base URL and credentials"
echo "  2. Set ANTHROPIC_API_KEY in your shell profile:"
echo "     echo 'export ANTHROPIC_API_KEY=sk-...' >> ~/.zshrc"
echo "  3. Add ANTHROPIC_API_KEY to GitHub repo secrets for CI"
echo "  4. Run: cd $PROJECT_DIR && npm run dev"
echo "  5. Start Claude agent: claude (inside the project folder)"
