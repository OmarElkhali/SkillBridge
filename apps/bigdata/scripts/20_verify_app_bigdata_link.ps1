param(
    [string] $BackendUrl = "http://localhost:8081",
    [int] $MinimumCourses = 1000
)

$ErrorActionPreference = "Stop"

Write-Host "=== SkillBridge app <-> Big Data catalog link check ==="
Write-Host "Backend URL: $BackendUrl"

try {
    $courses = Invoke-RestMethod -Uri "$BackendUrl/api/courses" -Method Get
} catch {
    throw "Backend API is not reachable at $BackendUrl. Start apps/backend first."
}

$count = @($courses).Count
Write-Host "Courses visible through backend API: $count"

if ($count -lt $MinimumCourses) {
    throw "Catalog link looks incomplete. Expected at least $MinimumCourses courses, got $count."
}

$first = @($courses | Select-Object -First 1)
$result = [ordered]@{
    backend_url = $BackendUrl
    courses_visible = $count
    minimum_expected = $MinimumCourses
    first_course_title = $first.title
    first_course_provider = $first.provider.name
    status = "OK"
}

$output = Split-Path -Parent $PSScriptRoot
$reportPath = Join-Path $output "output\app_bigdata_link_report.json"
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $reportPath -Encoding UTF8

Write-Host "Link check report:"
Get-Content -LiteralPath $reportPath
