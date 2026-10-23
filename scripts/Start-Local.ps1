param([switch]$Build)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$runtimePath=Join-Path $projectRoot 'runtime'
New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
Get-Content -LiteralPath (Join-Path $projectRoot '.env') | ForEach-Object {if($_ -match '^([A-Z_]+)=(.*)$'){[Environment]::SetEnvironmentVariable($matches[1],$matches[2],'Process')}}
if($Build){Push-Location (Join-Path $projectRoot 'backend');try{& .\mvnw.cmd -B package;if($LASTEXITCODE -ne 0){throw 'Maven build failed'}}finally{Pop-Location};Push-Location (Join-Path $projectRoot 'frontend');try{& npm.cmd ci;if($LASTEXITCODE -ne 0){throw 'Dependency install failed'};& npm.cmd run build;if($LASTEXITCODE -ne 0){throw 'Frontend build failed'}}finally{Pop-Location}}
foreach($port in @(8091,8090,5190)){if(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue){throw "Port $port already in use"}}
$started=@{}
try{
 foreach($module in @('coach-core','coach-gateway')){
  $jarPath=Join-Path $projectRoot ('backend\'+$module+'\target\'+$module+'-0.1.0.jar')
  if(!(Test-Path -LiteralPath $jarPath)){throw 'Build missing. Run Start-Local.ps1 -Build'}
  $p=Start-Process -FilePath 'java' -ArgumentList @('-Xms64m','-Xmx256m','-XX:+UseG1GC','-jar',('"'+$jarPath+'"')) -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimePath ($module+'.log')) -RedirectStandardError (Join-Path $runtimePath ($module+'-error.log')) -PassThru
  $started[$module]=$p.Id
 }
 $vitePath=Join-Path $projectRoot 'frontend\node_modules\vite\bin\vite.js'
 $front=Start-Process -FilePath 'node' -ArgumentList @(('"'+$vitePath+'"'),'--host','127.0.0.1','--port','5190','--strictPort') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimePath 'frontend.log') -RedirectStandardError (Join-Path $runtimePath 'frontend-error.log') -PassThru
 $started['frontend']=$front.Id
}finally{@{root=$projectRoot;processes=$started}|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $runtimePath 'processes.json') -Encoding utf8}
$ready=$false
for($attempt=0;$attempt -lt 50;$attempt++){
 try{$web=Invoke-WebRequest 'http://127.0.0.1:5190' -UseBasicParsing -TimeoutSec 2;$health=Invoke-WebRequest 'http://127.0.0.1:8090/api/health' -UseBasicParsing -TimeoutSec 2;if($web.StatusCode -eq 200 -and $health.StatusCode -eq 200){$ready=$true;break}}catch{}
 Start-Sleep -Milliseconds 500
}
if(!$ready){throw 'Services not ready. Check runtime logs and stop recorded processes before restarting.'}
Write-Output 'TRACE ready: http://127.0.0.1:5190'
