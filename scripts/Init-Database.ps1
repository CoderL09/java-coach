$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
Get-Content -LiteralPath (Join-Path $projectRoot '.env') | ForEach-Object {if($_ -match '^([A-Z_]+)=(.*)$'){[Environment]::SetEnvironmentVariable($matches[1],$matches[2],'Process')}}
$env:MYSQL_PWD=$env:DB_PASSWORD
try{& mysql.exe '--host=127.0.0.1' '--port=3306' ('--user='+$env:DB_USER) '--execute=CREATE DATABASE IF NOT EXISTS trace_coach CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci';if($LASTEXITCODE -ne 0){throw 'Database creation failed'}}finally{Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue}
