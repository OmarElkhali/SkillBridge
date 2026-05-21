$ErrorActionPreference = "Stop"

$ReportRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PlantUmlDir = Join-Path $ReportRoot "plantuml"
$DiagramDir = Join-Path $ReportRoot "diagrams"
$JarPath = Join-Path $ReportRoot "plantuml.jar"
$PlantUmlUrl = "https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar"

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Java is required to run PlantUML, but 'java' was not found in PATH."
}

if (-not (Test-Path $PlantUmlDir)) {
    throw "PlantUML source folder not found: $PlantUmlDir"
}

New-Item -ItemType Directory -Force -Path $DiagramDir | Out-Null

if (-not (Test-Path $JarPath)) {
    Write-Host "Downloading PlantUML jar..."
    Invoke-WebRequest -Uri $PlantUmlUrl -OutFile $JarPath
}

Write-Host "Rendering PlantUML diagrams..."
& java -jar $JarPath -tpng -o "../diagrams" (Join-Path $PlantUmlDir "*.puml")

Write-Host "Done. Diagrams written to: $DiagramDir"
