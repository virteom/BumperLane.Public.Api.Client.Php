var args = require('yargs');
var gulp = require('gulp');
var gitCommands = require("./_GitCommands.js");
require("es6-promise").polyfill();

gulp.task('merge-check', function (callback) {
    gitCommands.GetCurrentBranch().then(function (buildBranch) {
        console.log('Build branch: ' + buildBranch);
        var destination = args != null && args.length > 0 && args[0] != null ? args[0] : buildBranch;
        gitCommands.ShoudMergeBackDestinationBranch(buildBranch, destination).then(function (shouldMerge) {
            if (shouldMerge) {
                var message = "[ERROR] Looks like you need to merge your destination branch (" + destination + ") back into your current branch (" + buildBranch + ").";
                console.log(message);
                callback(message);
            }
            else {
                console.log("[SUCCESS] Looks like you DO NOT need to merge your destination branch (" + destination + ") back into your current branch (" + buildBranch + ").");
            }
        });
    });
});