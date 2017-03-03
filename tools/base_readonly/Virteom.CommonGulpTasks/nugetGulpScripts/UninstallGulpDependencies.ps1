Write-Host "Removing gulp dev dependencies..."
. (Join-Path (Split-Path $MyInvocation.MyCommand.Path) "_shared.ps1")

$contentPath = Join-Path (Split-Path -path $project.FullName -Parent) "Content"
$gulpFilePath = Join-Path $contentPath "gulp_tasks"

# Get project's gulp dependencies
$projectDependenciesArray = getGulpDependencies($gulpFilePath)

# Get project's dependencies' gulp dependencies (but not this package's)
$readOnlyPath = Join-Path $contentPath "base_readonly"
If(Test-Path $readOnlyPath){
	Foreach($packageDir in (Get-ChildItem $readOnlyPath)) {
		if($packageDir.Name -ne $project.Name){
			$projectDependenciesArray += getGulpDependencies($packageDir.FullName)
		}
	}
}

# Remove if not needed
foreach($packageName in $packageDependenciesArray){
	if($projectDependenciesArray -eq $null -or !($projectDependenciesArray.Contains($packageName))){
		$projectJson.devDependencies.PSObject.Properties.Remove($packageName)
	}
}

$projectJson | ConvertTo-Json -Depth 100 | Out-file $projectJsonPath -Encoding Default
Write-Host "...removed"