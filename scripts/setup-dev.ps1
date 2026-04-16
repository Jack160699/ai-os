Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Installing monorepo Node dependencies (root workspaces)..."
npm install

Write-Host "Setting up backend virtual environment..."
if (!(Test-Path "backend/.venv")) {
    python -m venv backend/.venv
}

& "backend/.venv/Scripts/python.exe" -m pip install --upgrade pip wheel
& "backend/.venv/Scripts/pip.exe" install -r backend/requirements.txt

Write-Host "Setup complete. Run: npm run dev"
