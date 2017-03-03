var args = require('yargs');
var gulp = require('gulp');
var version = require("./_VersionGenerator.js");

require("es6-promise").polyfill();

gulp.task('version', function () {
    var verbose = args.verbose === undefined || args.verbose === true;
    return version.GetVersionData().then(function (versionData) {
        return Promise.all([
            version.UpdateAssemblyInfo('Properties/AssemblyInfoTemplate.cs', 'Properties/AssemblyInfo.cs', versionData),
        ]);
    });
});