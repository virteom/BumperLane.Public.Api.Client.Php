var del = require("del");
var fs = require('fs');
var gulp = require("gulp");

/*
 * for additional files to copy to the Plugin dir, create/use pluginConfig.json at the project level
 * don't include the filename extension for the additional files
 *
 * pluginConfig.json example format:
 *
 * {
 *     "additionalFiles": [
 *         "test",
 *         "fakeFileName"
 *     ]
 * }
*/

gulp.task("copy-project-libs-to-plugin", function () {
    var destPath = "./Plugin";
    del.sync(destPath);

    // get project name
    var projectName;
    var extension = ".csproj";
    var files = fs.readdirSync('./');
    for (ind = 0; ind < files.length; ind++) {
        var file = files[ind];
        if (file.endsWith(extension)) {
            projectName = file.substring(0, file.length - extension.length);
            break;
        }
    }

    // get directories with files containing the project's name
    function getProjectFiles(directory) {
        var libs = [];
        var allLibFiles = fs.readdirSync("./" + directory);

        allLibFiles.forEach(function (file) {
            if (libs.indexOf(directory) > -1) {
                return;
            }

            var filepath = directory + "/" + file;
            var stat = fs.statSync(filepath);

            if (stat.isDirectory()) {
                libs = libs.concat(getProjectFiles(filepath));
            } else {
                if (file.indexOf(projectName) > -1) {
                    libs.push(directory);
                    return;
                }
            }
        });

        return libs;
    }

    var projectLibs = getProjectFiles("bin");

    // determine newest lib file directory
    var newestDir = null;
    var projectLib = "/" + projectName + ".dll";
    projectLibs.forEach(function (libDir) {
        if (newestDir === null) {
            newestDir = libDir;
            return;
        }

        var newStat = fs.statSync(libDir + projectLib);
        var existingStat = fs.statSync(newestDir + projectLib);
        if (newStat.mtime > existingStat.mtime) {
            newestDir = libDir;
        }
    });

    var newestDirPath = "./" + newestDir + "/";
    var sourceFiles = []

    // get additional files (if there are any)
    var pluginConfig;
    try {
        // path will never work in CommonGulpTasks project, only works when it's a nuget
        pluginConfig = require("./../../../../pluginConfig.json");
    } catch (err) {
        pluginConfig = null;
    }
    if (pluginConfig !== null) {
        pluginConfig.additionalFiles.forEach(function (filename) {
            sourceFiles.push(newestDirPath + filename + ".*");
        });
    }

    // newest project's files
    sourceFiles.push(newestDirPath + projectName + ".*");

    // copy files
    return gulp.src(sourceFiles)
        .pipe(gulp.dest(destPath));
});