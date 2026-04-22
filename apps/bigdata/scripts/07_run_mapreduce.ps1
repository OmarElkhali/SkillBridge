$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$mapreduce = Join-Path $root "mapreduce"
$repoRoot = Resolve-Path -LiteralPath (Join-Path $root "..\..")
$mavenWrapper = Join-Path $repoRoot "mvnw.cmd"

Push-Location $mapreduce
try {
    if (Get-Command mvn -ErrorAction SilentlyContinue) {
        mvn -q package
    } elseif (Test-Path -LiteralPath $mavenWrapper) {
        & $mavenWrapper -q -f (Join-Path $mapreduce "pom.xml") package
    } else {
        throw "Missing Maven. Install mvn or keep mvnw.cmd at the repository root."
    }
}
finally {
    Pop-Location
}

docker compose -f (Join-Path $root "docker-compose.yml") exec namenode bash /opt/skillbridge/scripts/07_run_mapreduce.sh
