$ErrorActionPreference='Stop'
$projectRoot=(Resolve-Path (Split-Path $PSScriptRoot -Parent)).Path
$processFile=Join-Path $projectRoot 'runtime\processes.json'
if(!(Test-Path -LiteralPath $processFile)){return}
$saved=Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json
if($saved.root -ne $projectRoot){throw 'Recorded root does not match this project'}
foreach($entry in $saved.processes.PSObject.Properties){$recordedProcessId=[int]$entry.Value;$process=Get-CimInstance Win32_Process -Filter "ProcessId=$recordedProcessId" -ErrorAction SilentlyContinue;if($process -and $process.CommandLine -and $process.CommandLine.Contains($projectRoot)){Stop-Process -Id $recordedProcessId -Force}}
Write-Output 'Stopped only matching TRACE processes. Databases and other projects remain running.'
