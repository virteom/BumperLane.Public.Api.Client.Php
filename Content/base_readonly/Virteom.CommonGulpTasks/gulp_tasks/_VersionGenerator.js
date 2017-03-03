var fs = require('fs');
require('date-utils');

function versionSelector() { }

versionSelector.GetVersionData = function (applicationLifeBeginDateString, majorVersionBeginDateString, majorVersionNumber) {
    var exec = require('child_process').exec;

    var today;
    var updateTime;
    var applicationLifeBeginDate, majorVersionBeginDate, beginningOfCurrentSprint;
    var subVersion = 0, totalRevisionCount = 0, sprintRevisionCount = 0, numberOfProjectDays = 0, currentSprint = 0, daysSinceThebeginningOfCurrentSprint = 0, endOfCurrentSprint = 0;
    var latestRevisionHash = "", currentBranch = "";

    function execute(command, callback) {
        exec(command, function (error, stdout, stderr) { callback(stdout); });
    }

    function getNumberString(number, paddingLength) {
        var result = 0;
        var value = number.toString();
        if (number != undefined) {
            result = (number || 0);
        }

        var numberToPad = value.length > paddingLength ? value.slice(-paddingLength) : result.toString();
        return paddingLength ? paddingRight(numberToPad, "0", paddingLength) : result.toString();
    }

    function majorVersionString(number, withPadding) {
        return getNumberString(number, withPadding ? 2 : false);
    }

    function minorVersionString(number, withPadding) {
        return getNumberString(number, withPadding ? 2 : false);
    }

    function buildVersionString(number, withPadding) {
        return getNumberString(number, withPadding ? 2 : false);
    }

    function patchVersionString(number, withPadding) {
        return getNumberString(number, withPadding ? 3 : false);
    }

    function getStringValue(value) {
        if (value == undefined || value.trim().length <= 0) {
            return "missing";
        }

        return value;
    }

    function paddingLeft(value, pad, length) {
        if (!value || !pad || value.length >= length) {
            return value;
        }
        var max = (length - value.length) / pad.length;
        for (var i = 0; i < max; i++) {
            value = pad + value;
        }
        return value;
    }

    function paddingRight(value, pad, length) {
        if (!value || !pad || value.length >= length) {
            return value;
        }
        var max = (length - value.length) / pad.length;
        for (var i = 0; i < max; i++) {
            value += pad;
        }
        return value;
    }

    function getMonday(date) {
        date = new Date(date);
        var day = date.getDay(),
            diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        return new Date(date.setDate(diff));
    }

    function getPrereleaseMarker(branchName) {
        return currentBranch != "master" ? "-prerelease" : "";
    }

    var getThisCommitDatetime = function () {
        return new Promise(function (resolve, reject) {
            execute("git show -s --format=%cd", function (dateString) {
                today = new Date(dateString.trim());
                updateTime = today.toFormat("YYYY/MM/DD HH:MI:SS");
                resolve(today);
            });
        });
    }

    var getFirstCommitDateAction = function () {
        return new Promise(function (resolve, reject) {
            if (applicationLifeBeginDateString != undefined) {
                applicationLifeBeginDate = new Date(applicationLifeBeginDateString.trim());
                resolve(applicationLifeBeginDate);
            } else {
                execute('git log --max-parents=0 HEAD --format=%cd', function (consoleDate) {
                    var date = new Date(consoleDate.trim());
                    applicationLifeBeginDate = getMonday(date);
                    resolve(applicationLifeBeginDate);
                });
            }
        });
    }

    var getCurrentBranch = function () {
        return new Promise(function (resolve, reject) {
            execute("git name-rev --name-only HEAD", function (consoleBranch) {
                var branchPath = consoleBranch.trim().split('/');
                currentBranch = branchPath[branchPath.length - 1];
                resolve(currentBranch);
            });
        });
    }

    var getLatestMajorVersionAction = function () {
        return new Promise(function (resolve, reject) {
            if (majorVersionNumber != undefined && majorVersionBeginDateString != undefined) {
                majorVersionBeginDate = new Date(majorVersionBeginDateString.trim());
                resolve(majorVersionBeginDate);
            }
            else {
                execute('git tag', function (allTagsOutput) {
                    var version = 0;
                    var date = applicationLifeBeginDate;
                    var allTags = allTagsOutput.split(/[\s\r\n]+/gmi);
                    var highestVersionFound = 0;
                    var highestTagFound = '';
                    for (var tagIndex in allTags) {
                        var tagMajorVersionRegex = /^v\.([0-9]+)$/gmi;
                        var tag = allTags[tagIndex];
                        var tagMatch;
                        if ((tagMatch = tagMajorVersionRegex.exec(tag)) !== null) {
                            var tagValue = parseInt(tagMatch[1]);
                            if (highestVersionFound < tagValue) {
                                highestVersionFound = tagValue;
                                highestTagFound = tag;
                            }
                        }
                    }

                    var result = function () {
                        majorVersionBeginDate = date;
                        majorVersionNumber = highestVersionFound;
                        resolve(majorVersionBeginDate);
                    };

                    if (highestVersionFound > 0) {
                        execute('git log -1 --format=%cd ' + highestTagFound, function (consoleDate) {
                            date = new Date(consoleDate.trim());
                            result();
                        });
                    } else {
                        result();
                    }
                });
            }
        });
    }

    return getThisCommitDatetime().then(function () {
        console.log("This commit's date: " + today);
    }).then(getFirstCommitDateAction).then(function () {
        console.log("First revision date found: " + applicationLifeBeginDate);
    }).then(getLatestMajorVersionAction).then(function () {
        console.log("Latest Major Version: " + majorVersionNumber + " (" + majorVersionBeginDate + ")");
    }).then(getCurrentBranch).then(function () {
        console.log("Currently on '" + currentBranch + "' branch");
    }).then(function () {
        numberOfProjectDays = majorVersionBeginDate.getDaysBetween(today);
        currentSprint = Math.floor(numberOfProjectDays / 14);
        daysSinceThebeginningOfCurrentSprint = (numberOfProjectDays % 14);
        beginningOfCurrentSprint = today.clone().removeDays(daysSinceThebeginningOfCurrentSprint);
        endOfCurrentSprint = beginningOfCurrentSprint.clone().addDays(13);

        console.log("Update Time: " + updateTime);
        console.log("Number Of Project Days: " + numberOfProjectDays);
        console.log("Current Sprint: " + currentSprint);
        console.log("Days Since the Beginning Of the Current Sprint: " + daysSinceThebeginningOfCurrentSprint);
        console.log("Application Life Begin Date: " + applicationLifeBeginDate.toYMD('/'));
        console.log("Major Version (v." + majorVersionNumber + ") Begin Date: " + majorVersionBeginDate.toYMD('/'));
        console.log("Beginning of the Current Sprint: " + beginningOfCurrentSprint.toYMD('/'));
        console.log("End of the Current Sprint: " + endOfCurrentSprint.toYMD('/'));

        subVersion = currentSprint;
        var countTotalRevisionsAction = new Promise(function (resolve, reject) {
            execute('git rev-list HEAD --count --since="' + applicationLifeBeginDate.clone().removeDays(1).toYMD('/') + ' 00:00"', function (count) {
                resolve(parseInt(count.trim()));
            })
        });

        var countSprintRevisionsAction = new Promise(function (resolve, reject) {
            execute('git rev-list HEAD --count --since="' + beginningOfCurrentSprint.clone().removeDays(1).toYMD('/') + ' 00:00"', function (count) {
                resolve(parseInt(count.trim()));
            })
        });

        var getLatestHashAction = new Promise(function (resolve, reject) {
            execute('git rev-parse --short HEAD', function (hash) {
                resolve(hash);
            })
        });

        return Promise.all([
            countTotalRevisionsAction.then(function (count) {
                totalRevisionCount = count;
                console.log("Total Revisions Since the Beginning of the Application Life: " + getNumberString(totalRevisionCount));
            }),
            countSprintRevisionsAction.then(function (count) {
                sprintRevisionCount = count;
                console.log("Total Revisions Since the Beginning of the Sprint: " + getNumberString(sprintRevisionCount));
            }),
            getLatestHashAction.then(function (hash) {
                latestRevisionHash = hash;
                console.log("Latest Revision Hash: " + getStringValue(hash));
            })
        ]);
    }).then(function () {
        console.log("Major: " + majorVersionString(majorVersionNumber));
        console.log("Major (padded): " + majorVersionString(majorVersionNumber, true));

        console.log("Minor: " + minorVersionString(subVersion));
        console.log("Minor (padded): " + minorVersionString(subVersion, true));

        console.log("Build: " + buildVersionString(sprintRevisionCount));
        console.log("Build (padded): " + buildVersionString(sprintRevisionCount, true));

        console.log("Build: " + patchVersionString(totalRevisionCount));
        console.log("Build (padded): " + patchVersionString(totalRevisionCount, true));

        var commitId = getStringValue(latestRevisionHash).trim();
        var version = majorVersionString(majorVersionNumber) + "." + minorVersionString(subVersion) + "." + buildVersionString(sprintRevisionCount) + "." + patchVersionString(totalRevisionCount);
        var versionMin = majorVersionString(majorVersionNumber) + "." + minorVersionString(subVersion) + "." + patchVersionString(totalRevisionCount);
        var paddedVersion = parseInt(majorVersionString(majorVersionNumber, true) + minorVersionString(subVersion, true) + buildVersionString(sprintRevisionCount, true) + patchVersionString(totalRevisionCount, true)).toString();
        var paddedMinVersion = parseInt(majorVersionString(majorVersionNumber, true) + minorVersionString(subVersion, true) + patchVersionString(totalRevisionCount, true)).toString();
        var versionString = "v." + version + " (" + commitId + ")";
        var versionPaddedString = "v." + paddedVersion + " (" + commitId + ")";
        var nugetVersion = version + getPrereleaseMarker(currentBranch);
        var nugetVersionPadded = paddedVersion + getPrereleaseMarker(currentBranch);
        console.log("Version: " + version);
        console.log("Version (padded): " + paddedVersion);
        console.log("Version String: " + versionString);
        console.log("Version (padded) String: " + versionPaddedString);
        console.log("Version NuGet: " + nugetVersion);
        console.log("##vso[build.updatebuildnumber]" + version);

        var versionObject = {
            "majorVersionBeginDate": majorVersionBeginDate.toYMD('/'),
            "SprintStartDate": beginningOfCurrentSprint.toYMD('/'),
            "SprintEndDate": endOfCurrentSprint.toFormat('YYYY/MM/DD'),
            "UpdatedDateTime": updateTime,
            "SprintNumber": currentSprint,
            "Version": {
                "NameSimple": "v." + version,
                "NameFull": versionString,
                "Number": version,
                "NumberMin": versionMin,
                "Commit": commitId,
                "NumberOfCommitsInTheRelease": totalRevisionCount,
                "NumberOfCommitsInTheSprint": sprintRevisionCount,
                "VersionMajor": majorVersionString(majorVersionNumber),
                "VersionMinor": minorVersionString(subVersion),
                "VersionBuild": buildVersionString(sprintRevisionCount),
                "VersionPatch": patchVersionString(totalRevisionCount),
                "VersionNuget": nugetVersion,
            },
            "VersionPadded": {
                "NameSimple": "v." + paddedVersion,
                "NameFull": versionPaddedString,
                "Number": paddedVersion,
                "NumberMin": paddedMinVersion,
                "Commit": commitId,
                "NumberOfCommitsInTheRelease": totalRevisionCount,
                "NumberOfCommitsInTheSprint": sprintRevisionCount,
                "VersionMajor": majorVersionString(majorVersionNumber, true),
                "VersionMinor": minorVersionString(subVersion, true),
                "VersionBuild": buildVersionString(sprintRevisionCount, true),
                "VersionPatch": patchVersionString(totalRevisionCount, true),
                "VersionNuget": nugetVersionPadded,
            },
        };

        return versionObject;
    });
};

versionSelector.CreateVersionFile = function (file, versionData, verbose) {
    if (versionData == null) {
        return null;
    }

    return new Promise(function (resolve, reject) {
        if (verbose) {
            console.log("Creating Version File '" + file + "' with the following data:");
            console.log(versionData);
        }

        var writeFile = function () {
            fs.writeFileSync(file, JSON.stringify(versionData, null, '\t'));
            console.log("File Written");
        };

        if (fs.existsSync(file)) {
            fs.unlink(file, writeFile);
        }
        else {
            writeFile();
        }

        resolve(versionData);
    });
};

versionSelector.UpdateAssemblyInfo = function (templateFile, configFile, versionData) {
    return new Promise(function (resolve, reject) {
        if (!fs.existsSync(templateFile)) {
            reject();
        }

        var writeCallback = function () {
            fs.readFile(templateFile, function (err, data) {
                data += '\n[assembly: AssemblyVersion("' + versionData.Version.Number + '")]'
                      + '\n[assembly: AssemblyFileVersion("' + versionData.Version.Number + '")]'
                      + '\n[assembly: AssemblyInformationalVersion("' + versionData.Version.VersionNuget + '")]';
                fs.writeFile(configFile, data);
                console.log("Version added to AssemblyInfo.cs");
                resolve();
            });
        }

        if (fs.existsSync(configFile)) {
            fs.unlink(configFile, writeCallback);
        } else {
            writeCallback();
        }
    });
};

versionSelector.GetVersionFromAssemblyInfo = function (infoPath) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(infoPath)) {
            var data = fs.readFileSync(infoPath);

            var version = '0.0.0.1';
            if (data !== undefined) {
                var versionExpression = /.*\[assembly\:\s?assemblyversion\s?\(\s?\"([0-9\.]+)\"\s?\)\s?\].*/igm;
                while ((matches = versionExpression.exec(data)) !== null) {
                    if (matches !== undefined && matches.length > 1) {
                        version = matches[1];
                    }
                }
            }

            resolve(version);
        }
    });
}

module.exports = versionSelector;