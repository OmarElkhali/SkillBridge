[CmdletBinding()]
param(
    [int]$FrontendPort = 5173,
    [int]$Datanodes = 2,
    [switch]$RunBigDataPipeline
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$backendDir = Join-Path $repoRoot "apps\backend"
$frontendDir = Join-Path $repoRoot "apps\frontend"
$bigDataDir = Join-Path $repoRoot "apps\bigdata"
$mavenWrapper = Join-Path $repoRoot "mvnw.cmd"

function ConvertTo-SingleQuotedPowerShell {
    param([Parameter(Mandatory = $true)][string]$Value)

    "'" + $Value.Replace("'", "''") + "'"
}

function Start-SkillBridgeTerminal {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Command
    )

    $quotedTitle = ConvertTo-SingleQuotedPowerShell $Title
    $quotedWorkingDirectory = ConvertTo-SingleQuotedPowerShell $WorkingDirectory

    $terminalScript = @"
`$Host.UI.RawUI.WindowTitle = $quotedTitle
Set-Location -LiteralPath $quotedWorkingDirectory
Write-Host "=== $Title ===" -ForegroundColor Cyan
Write-Host "Working directory: $WorkingDirectory"
Write-Host ""
$Command
Write-Host ""
Write-Host "$Title stopped. You can close this window." -ForegroundColor Yellow
"@

    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($terminalScript))

    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        $encodedCommand
    )
}

if (-not (Test-Path -LiteralPath $mavenWrapper)) {
    throw "Missing Maven wrapper: $mavenWrapper"
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendDir "package.json"))) {
    throw "Missing frontend package.json: $frontendDir"
}

if (-not (Test-Path -LiteralPath (Join-Path $bigDataDir "docker-compose.yml"))) {
    throw "Missing Big Data docker-compose.yml: $bigDataDir"
}

$backendCommand = "& " + (ConvertTo-SingleQuotedPowerShell $mavenWrapper) + " -f " + (ConvertTo-SingleQuotedPowerShell (Join-Path $backendDir "pom.xml")) + " spring-boot:run"

$frontendCommand = @"
if (-not (Test-Path -LiteralPath ".\node_modules")) {
    Write-Host "node_modules not found. Running npm install first..." -ForegroundColor Yellow
    npm install
    if (`$LASTEXITCODE -ne 0) { exit `$LASTEXITCODE }
}
npm run dev -- --host localhost --port $FrontendPort
"@

if ($RunBigDataPipeline) {
    $bigDataCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\10_run_mvp_pipeline.ps1 -Datanodes $Datanodes"
} else {
    $bigDataCommand = @"
docker compose up -d --scale datanode=$Datanodes
if (`$LASTEXITCODE -ne 0) { exit `$LASTEXITCODE }
Write-Host ""
docker compose ps
"@
}

Start-SkillBridgeTerminal -Title "SkillBridge Backend" -WorkingDirectory $repoRoot -Command $backendCommand
Start-SkillBridgeTerminal -Title "SkillBridge Frontend" -WorkingDirectory $frontendDir -Command $frontendCommand
Start-SkillBridgeTerminal -Title "SkillBridge Big Data" -WorkingDirectory $bigDataDir -Command $bigDataCommand

Write-Host "Started SkillBridge in three terminals."
Write-Host "Backend:  Spring Boot"
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Big Data: Docker Compose with $Datanodes datanode(s)"

if ($RunBigDataPipeline) {
    Write-Host "Big Data mode: MVP pipeline"
} else {
    Write-Host "Big Data mode: daily Docker services"
}
