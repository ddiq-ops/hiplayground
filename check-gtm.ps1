param(
  [string]$Root = ".",
  [string]$ContainerId = "GTM-KCC2XSD9"
)

$ErrorActionPreference = "Stop"

$headPattern = "gtm\.start[\s\S]*googletagmanager\.com/gtm\.js\?id='\+i"
$noscriptPattern = [regex]::Escape("googletagmanager.com/ns.html?id=$ContainerId")

$htmlFiles = Get-ChildItem -Path $Root -Recurse -Filter *.html | Sort-Object FullName

if (-not $htmlFiles -or $htmlFiles.Count -eq 0) {
  Write-Host "No HTML files found under: $Root" -ForegroundColor Yellow
  exit 1
}

$issues = @()

foreach ($file in $htmlFiles) {
  $raw = Get-Content -Path $file.FullName -Raw

  $headCount = ([regex]::Matches($raw, $headPattern)).Count
  $noscriptCount = ([regex]::Matches($raw, $noscriptPattern)).Count

  if ($headCount -ne 1 -or $noscriptCount -ne 1) {
    $issues += [pscustomobject]@{
      File = $file.FullName
      HeadCount = $headCount
      NoscriptCount = $noscriptCount
    }
  }
}

if ($issues.Count -eq 0) {
  Write-Host "PASS: GTM snippet is present exactly once in all HTML files." -ForegroundColor Green
  Write-Host "Checked files: $($htmlFiles.Count)"
  exit 0
}

Write-Host "FAIL: GTM snippet issues found." -ForegroundColor Red
Write-Host ""
$issues | Format-Table -AutoSize
Write-Host ""
Write-Host "Expected per HTML file:" -ForegroundColor Yellow
Write-Host "  - gtm.js snippet count: 1"
Write-Host "  - noscript iframe count: 1"
exit 2
