var args = require('yargs');
var gulp = require('gulp');
var gitCommands = require("./_GitCommands.js");
require("es6-promise").polyfill();

gulp.task('merge-back', function () {
    gitCommands.GetCurrentBranch().then(function (buildBranch) {
        console.log('Build branch: ' + buildBranch);
        return new Promise(function (resolve, reject) {
            gitCommands.FilterRemoteBranches(args).then(function (branches) {
                var processNextBranch = function () {
                    var alternateBranch = branches != null && branches.length > 0 ? branches.pop() : null;
                    if (alternateBranch != null) {
                        var mergeBranch = "merge-back-" + alternateBranch.replace("/", "-");
                        var message = 'Merging branch ' + buildBranch + ' into branch ' + alternateBranch;
                        var mergeStep = function () { return gitCommands.MergeBranch(buildBranch); };
                        var commitStep = function () { return gitCommands.Commit("merge-back task: " + message); };
                        var pushStep = function () { return gitCommands.PushBranch(gitCommands.ExtractRemoteName(alternateBranch)); };
                        var deleteStep = function () { return gitCommands.DeleteBranch(mergeBranch); };
                        var checkoutSourceBranch = function () { return gitCommands.CheckoutBranch(buildBranch); };

                        console.log(message);

                        gitCommands.CheckoutNewBranch(alternateBranch, mergeBranch)
                        .then(mergeStep)
                        .then(commitStep)
                        .then(pushStep)
                        .then(deleteStep)
                        .then(checkoutSourceBranch)
                        .then(processNextBranch)
                    }
                    else {
                        resolve();
                    }
                };

                processNextBranch();
            });
        });
    });
});