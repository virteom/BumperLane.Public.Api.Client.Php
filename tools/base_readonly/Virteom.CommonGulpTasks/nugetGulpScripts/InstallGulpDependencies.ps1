Write-Host "Adding gulp dev dependencies..."
. (Join-Path (Split-Path $MyInvocation.MyCommand.Path) "_shared.ps1")

# add gulpfile.js if it doesn't exist
$gulpfileName = "gulpfile.js"
$gulpfilePath = Join-Path (Split-Path -path $project.FullName -Parent) $gulpfileName
If (-not (Test-Path $gulpfilePath)){
	Write-Host "gulpfile.js does not exist. Creating and adding it to" $project.Name
	$gulpfileContent =
@'
/// <binding BeforeBuild='version' />

var requireDir = require("require-dir");
requireDir("Content/base_readonly/Virteom.CommonGulpTasks/gulp_tasks");
'@

	Add-Content $gulpfilePath $gulpfileContent
	$project.ProjectItems.AddFromFile($gulpfilePath)
	# Build Action = None
	$project.ProjectItems.Item($gulpfileName).Properties.Item("BuildAction").Value = 0
}

# add to project's dependencies if not already added
$packageDependencies = $($packageJson.devDependencies | Get-Member -MemberType *Property).Name
If($packageDependencies -ne $null){
	For($i = 0; $i -lt $packageDependenciesArray.Length; $i++){
		$dependencyName = $packageDependenciesArray[$i]
		$projectDependencies = $($projectJson.devDependencies | Get-Member -MemberType *Property).Name
		If($projectDependencies -eq $null -or ($packageDependencies.Contains($dependencyName) -and !($projectDependencies.Contains($dependencyName)))){
			$projectJson.devDependencies | Add-Member  -PassThru NoteProperty $dependencyName $packageJson.devDependencies.$dependencyName
		}
	}
}

$projectJson | ConvertTo-Json -Depth 100 | Out-file $projectJsonPath -Encoding Default
Write-Host "...added"