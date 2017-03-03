/// <binding BeforeBuild='version' />

var gulp = require('gulp');
var install = require("gulp-install");
var tap = require("gulp-tap");
var argv = require("yargs").argv;
var xml2js = require('xml2js');
var fs = require('fs');
var path = require('path');
var requireDir = require("require-dir");
requireDir("Content/base_readonly/Virteom.CommonGulpTasks/gulp_tasks");
require('es6-promise').polyfill();

gulp.task('npm-install', function () {
    return gulp.src(["./*/package.json"])
        .pipe(install());
});

gulp.task('run-projects-tasks', function () {
    var taskName = (argv.taskName === undefined || argv.taskName === null || argv.taskName.trim() === "") ? "production" : argv.taskName.trim().toLowerCase();
    var environment = (argv.environment === undefined || argv.environment === null || argv.environment.trim() === "") ? "develop" : argv.environment.trim().toLowerCase();

    var gulpCommand = (argv.gulpCommand === undefined || argv.gulpCommand === null || argv.gulpCommand.trim() === "") ? "gulp" : argv.gulpCommand.trim();
    var exec = require('child_process').exec;

    gulp.src(["./*/gulpfile.js"])
        .pipe(tap(function (file) {
            if (file.contents.toString().indexOf(taskName) !== -1) {
                exec(gulpCommand + " " + taskName + " --gulpfile \"" + file.path + "\"" + " --environment=" + environment, function (error, stdout, stderr) {
                    console.log(stdout);
                });
            }
        }));
});

gulp.task('run-solution-version', function () {
    gulp.start('version');
});

gulp.task('run-solution-copy-project-libs-to-plugin', function () {
    argv = { taskName: 'copy-project-libs-to-plugin' };
    gulp.start('run-projects-tasks');
});

gulp.task('run-solution-microservice-version', function () {
    var parser = new xml2js.Parser();
    var xmlBuilder = new xml2js.Builder();
    var fabricVersionTask = new Promise(function (fulfill, reject) {
        gulp.src(["./*/gulpfile.js"])
            .pipe(tap(function (file) {
                var versionGenerator = require(path.dirname(file.path) + '\\Content\\base_readonly\\Virteom.CommonGulpTasks\\gulp_tasks\\_VersionGenerator.js');
                var infoPath = path.dirname(file.path) + "\\Properties\\AssemblyInfo.cs";

                try {
                    versionGenerator.GetVersionFromAssemblyInfo(infoPath).then(function (versionNumber) {
                        fulfill(versionNumber);
                    });
                } catch (err) {
                    console.log(err.message + " in " + path.dirname(file.path));
                }
            }));
    });

    fabricVersionTask.then(function (versionNumber) {
        console.log("Microservice Version: " + versionNumber);
        gulp.src(["./*/ApplicationPackageRoot/ApplicationManifest.xml"])
            .pipe(tap(function (configFile, t) {
                console.log("Service Fabric **app** manifest file file found: " + configFile.path);
                fs.readFile(configFile.path, function (err, data) {
                    parser.parseString(data, function (err, json) {
                        if (argv.verbose !== undefined) {
                            console.log("Service Fabric **app** manifest file data prior to change:");
                            console.log(JSON.stringify(json));
                        }

                        json.ApplicationManifest.$['ApplicationTypeVersion'] = versionNumber;
                        for (var i = 0; i < json.ApplicationManifest.ServiceManifestImport.length; i++) {
                            var serviceManifest = json.ApplicationManifest.ServiceManifestImport[i].ServiceManifestRef[0];
                            serviceManifest.$['ServiceManifestVersion'] = versionNumber;
                        }

                        if (argv.verbose !== undefined) {
                            console.log("Service Fabric **app** manifest file data after change:");
                            console.log(JSON.stringify(json));
                        }

                        var xml = xmlBuilder.buildObject(json);
                        fs.writeFile(configFile.path, xml);
                        console.log("Service Fabric **app** manifest file written");
                    });
                });
            }));

        gulp.src(["./*/PackageRoot/ServiceManifest.xml"])
            .pipe(tap(function (configFile, t) {
                console.log("Service Fabric **service** manifest file file found: " + configFile.path);
                fs.readFile(configFile.path, function (err, data) {
                    parser.parseString(data, function (err, json) {
                        if (argv.verbose !== undefined) {
                            console.log("Service Fabric **service** manifest file data prior to change:");
                            console.log(JSON.stringify(json));
                        }

                        json.ServiceManifest.$['Version'] = versionNumber;

                        var codePackage = json.ServiceManifest.CodePackage[0];
                        codePackage.$['Version'] = versionNumber;

                        var configPackage = json.ServiceManifest.ConfigPackage[0];
                        configPackage.$['Version'] = versionNumber;

                        if (argv.verbose !== undefined) {
                            console.log("Service Fabric **service** manifest file data after change:");
                            console.log(JSON.stringify(json));
                        }

                        var xml = xmlBuilder.buildObject(json);
                        fs.writeFile(configFile.path, xml);
                        console.log("Service Fabric **service** manifest file written");
                    });
                });
            }));
    });
});