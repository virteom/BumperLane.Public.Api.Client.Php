function getGulpDependencies([String] $gulpFilesPath){
   $returnDependenciesArray = @()
   If(Test-Path $gulpFilesPath){
		Foreach($gulpfile in (Get-ChildItem $gulpFilesPath -Filter *.js)) {
			$dependencies = Get-Content $gulpfile.FullName | Select-String -Pattern "require(['`"\w'`"]*)"
			If ($dependencies){
				$tempDep = $dependencies -split ";" -replace '\s',''
				Foreach($dep in $tempDep){
					If($dep.Length -gt 0){
						$depName = (($dep -split "require\(['`"]")[1] -split "['`"]\)")[0]
						if(!($returnDependenciesArray.Contains($depName))){
							$returnDependenciesArray += $depName
						}
					}
				}
			}
		}
	}
	return $returnDependenciesArray
}

$packageGulpFilesDir = Join-Path (Join-Path (Join-Path (Join-Path (Join-Path (Split-Path -path $toolsPath -parent) "Content") "Content") "base_readonly") $package.Id) "gulp_tasks"
$packageJsonPath = Join-Path $packageGulpFilesDir "package.json"
$packageJson = Get-Content $packageJsonPath -Encoding Default | ConvertFrom-Json

$projectJsonPath = Join-Path (Split-Path -path $project.fullname -parent) "package.json"
If (-not (Test-Path $projectJsonPath)){
	# add package.json if it doesn't exist
	Write-Host "package.json does not exist. Creating and adding it to" $project.Name
	$startDevDependencies = New-Object System.Object
	$startDevDependencies | Add-Member -Type NoteProperty -Name require-dir -Value "^0.3.0"

	$projectJson = New-Object System.Object
	$projectJson | Add-Member -Type NoteProperty -Name devDependencies -Value $startDevDependencies
	$projectJson | Add-Member -Type NoteProperty -Name name -Value $project.Name.ToLower()
	$projectJson | Add-Member -Type NoteProperty -Name private -Value $true
	$projectJson | Add-Member -Type NoteProperty -Name version -Value "1.0.0"

	$projectJson | ConvertTo-Json -Depth 100 | Out-file $projectJsonPath -Encoding Default
	$project.ProjectItems.AddFromFile($projectJsonPath)
}

$projectJson = Get-Content $projectJsonPath -Encoding Default | ConvertFrom-Json

# Get dependencies from package's gulp files
$packageDependenciesArray = getGulpDependencies($packageGulpFilesDir)