module.exports = (function () {
    var exec = require('child_process').exec;
    var self = {};
    function execute(command, callback, waitTime) {
        exec(command, function (error, stdout, stderr) {
            if (waitTime == null) {
                waitTime = 0;
            }
            wait(waitTime).then(function () { callback(error == null ? stdout : stderr); });
        });
    }

    function splitByLine(data, removeBlankLines) {
        removeBlankLines = removeBlankLines == null ? true : removeBlankLines;
        var lines = data.split(/[\s\r\n]+/gmi);
        var finalLines = [];
        for (var lineIndex in lines) {
            if (lines[lineIndex].length > 0) {
                finalLines.push(lines[lineIndex]);
            }
        }

        return finalLines;
    }

    function test(filter, stringValue) {
        if (typeof filter === 'string') {
            filter = new RegExp(filter);
        }

        if (!(filter instanceof RegExp)) {
            return false;
        }

        return filter.test(stringValue);
    }

    function makeArray(value) {
        if (!Array.isArray(value)) {
            value = Array(1).fill(value);
        }

        return value;
    }

    function filterAny(filters, data) {
        var results = [];
        data = makeArray(data);
        filters = makeArray(filters);
        for (var dataIndex in data) {
            var valueToCheck = data[dataIndex];
            for (var filterIndex in filters) {
                if (test(filters[filterIndex], valueToCheck)) {
                    results.push(valueToCheck);
                    break;
                }
            }
        }

        return results;
    }

    function wait(time) {
        return new Promise(function (resolve, reject) {
            setTimeout(resolve, time);
        });
    }

    self.ExtractRemoteName = function (branch) {
        var parts = branch.split('/');
        var result = "";
        for (var partIndex = 1; partIndex < parts.length; partIndex++) {
            result += parts[partIndex];
        }

        return result;
    }

    self.RemoteBranches = function () {
        return new Promise(function (resolve, reject) {
            execute("git branch -r", function (branchesOutput) {
                var branches = splitByLine(branchesOutput);
                resolve(branches);
            });
        })
    };

    self.FilterRemoteBranches = function (filters) {
        return self.RemoteBranches().then(function (branches) {
            var filtered = filterAny(filters, branches);
            return filtered;
        });
    };

    self.GetCurrentBranch = function () {
        return new Promise(function (resolve, reject) {
            execute("git name-rev --name-only HEAD", function (currentBranch) {
                resolve(currentBranch.trim());
            });
        });
    };

    self.CheckoutBranch = function (branch) {
        return new Promise(function (resolve, reject) {
            var command = "git checkout " + branch;
            console.log("checkout command: " + command);
            execute(command, function (result) {
                console.log("checkout result: " + result);
                resolve(branch);
            });
        });
    };

    self.CheckoutNewBranch = function (branch, alias) {
        return new Promise(function (resolve, reject) {
            var localBranch = (alias != null && alias.length > 0 ? alias + " " : "");
            var command = "git checkout --track -b " + localBranch + branch;
            console.log("checkout command: " + command);
            execute(command, function (result) {
                console.log("checkout result: " + result);
                resolve(branch);
            });
        });
    };

    self.FetchBranch = function (origin) {
        return new Promise(function (resolve, reject) {
            var command = "git fetch " + origin;
            console.log("fetch command: " + command);
            execute(command, function (result) {
                console.log("fetch result: " + result);
                resolve(origin);
            });
        });
    };

    self.MergeBranch = function (branch) {
        return new Promise(function (resolve, reject) {
            var command = "git merge " + branch;
            console.log("merge command: " + command);
            execute(command, function (result) {
                console.log("merge result: " + result);
                resolve(branch);
            });
        });
    };

    self.Commit = function (message) {
        return new Promise(function (resolve, reject) {
            var command = "git commit -m \"" + message.replace("\"", "\\\"") + "\"";
            console.log("commit command: " + command);
            execute(command, function (result) {
                console.log("commit result: " + result);
                resolve(message);
            });
        });
    };

    self.PushBranch = function (branch) {
        return new Promise(function (resolve, reject) {
            var command = "git push origin HEAD:" + branch;
            console.log("push command: " + command);
            execute(command, function (result) {
                console.log("push result: " + result);
                resolve(branch);
            });
        });
    };

    self.DeleteBranch = function (branch) {
        return new Promise(function (resolve, reject) {
            var command = "git branch -D " + branch;
            console.log("delete command: " + command);
            execute(command, function (result) {
                console.log("delete result: " + result);
                resolve(branch);
            });
        });
    };

    self.ShoudMergeBackDestinationBranch = function (source, destination) {
        return new Promise(function (resolve, reject) {
            var command = "git log --format='%H' " + source + ".." + destination;
            console.log("should merge dest branch? command: " + command);
            execute(command, function (result) {
                console.log("should merge dest branch? result: " + result);
                resolve(result.trim().length > 0);
            });
        });
    }

    return self;
}());