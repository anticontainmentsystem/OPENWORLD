
# OpenWorld Reliable Deployment Script
# Usage: .\deploy.ps1 "Commit Message"

param (
    [string]$Message = "chore: update openworld"
)

Write-Host "[INFO] Starting Deployment..." -ForegroundColor Cyan

# 1. Add all changes
Write-Host "[1/4] Staging changes..."
git add -A

# 2. Check status
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[INFO] No changes to commit." -ForegroundColor Yellow
}
else {
    # 3. Commit
    Write-Host "[2/4] Committing: $Message"
    git commit -m "$Message"
}

# 4. Push
Write-Host "[3/4] Pushing to origin/main..."
$pushResult = git push origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Deployment Successful!" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Push Failed:" -ForegroundColor Red
    Write-Host $pushResult
    exit 1
}
