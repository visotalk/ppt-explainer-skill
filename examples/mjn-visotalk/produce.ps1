$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
foreach ($command in @('validate', 'prepare', 'qa')) {
  npx --yes visotalk@latest $command doc.tsx
  if ($LASTEXITCODE) { throw "VisoTalk $command failed" }
}
npx --yes visotalk@latest build doc.tsx --artifact --out dist
if ($LASTEXITCODE) { throw 'VisoTalk build failed' }
