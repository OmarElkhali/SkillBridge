$ErrorActionPreference = "Stop"

function Test-CommandAvailable {
    param([Parameter(Mandatory = $true)][string] $Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing command: $Name"
    }
    Write-Host "OK: $Name"
}

function Read-EnvFile {
    param([Parameter(Mandatory = $true)][string] $Path)
    $values = @{}
    if (-not (Test-Path -LiteralPath $Path)) {
        return $values
    }
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }
        $parts = $line.Split("=", 2)
        $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
    }
    return $values
}

function Test-EnvFile {
    param(
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string[]] $RequiredKeys
    )
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing env file: $Path. Copy the matching .env.example first."
    }
    $envValues = Read-EnvFile -Path $Path
    foreach ($key in $RequiredKeys) {
        if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
            throw "Missing key $key in $Path"
        }
    }
    Write-Host "OK: $Path"
    return $envValues
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Host "=== SkillBridge friend setup check ==="

Test-CommandAvailable git
Test-CommandAvailable java
Test-CommandAvailable node
Test-CommandAvailable npm
Test-CommandAvailable python
Test-CommandAvailable docker

$backendEnv = Test-EnvFile -Path "apps\backend\.env" -RequiredKeys @(
    "SERVER_PORT",
    "DB_URL",
    "DB_USERNAME",
    "DB_PASSWORD",
    "JWT_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "CORS_ALLOWED_ORIGINS"
)

$frontendEnv = Test-EnvFile -Path "apps\frontend\.env" -RequiredKeys @("VITE_API_BASE_URL")
$bigdataEnv = Test-EnvFile -Path "apps\bigdata\.env" -RequiredKeys @(
    "BIGDATA_DB_HOST",
    "BIGDATA_DB_PORT",
    "BIGDATA_DB_NAME",
    "BIGDATA_DB_USER",
    "BIGDATA_DB_PASSWORD",
    "SKILLBRIDGE_DATASET_FINAL_ZIP",
    "SKILLBRIDGE_DATASET_ALL_COURSES_ZIP",
    "SKILLBRIDGE_DATASET_RICH_ZIP"
)

foreach ($key in @("SKILLBRIDGE_DATASET_FINAL_ZIP", "SKILLBRIDGE_DATASET_ALL_COURSES_ZIP", "SKILLBRIDGE_DATASET_RICH_ZIP")) {
    $path = $bigdataEnv[$key]
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Dataset not found for ${key}: $path"
    }
    Write-Host "OK: $key"
}

$backendPort = $backendEnv["SERVER_PORT"]
$frontendApi = $frontendEnv["VITE_API_BASE_URL"]
if ($frontendApi -notmatch ":$backendPort($|/)") {
    Write-Host "WARNING: frontend API URL ($frontendApi) does not appear to target backend port $backendPort"
}

Write-Host ""
Write-Host "Setup check passed. You can run backend, frontend, and Big Data commands from SETUP_FOR_FRIEND.md."
