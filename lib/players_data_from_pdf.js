var _  = require('lodash');
var Q  = require('q');
var shelljs = require('shelljs');
var fs = require('fs');


var fsRead = Q.denodeify(fs.readFile);

var getRawPlayersDataFromPdf = function (filename) {
    var deferred = Q.defer();

    shelljs.exec(
        'gs    -dBATCH    -dNOPAUSE    -sDEVICE=txtwrite    -dFirstPage=1    -dLastPage=50    -sOutputFile=- ' + filename,
        {silent: true},
        function (code, output) {
            if (0 == code) {
                deferred.resolve(output);
            } else {
                deferred.reject(new Error("gs command exited with error return code: " + code));
            }
        }
    );
    return deferred.promise;
};

var parsePlayersDataBlob = function(blob) {
    var pages = blob.split(/\nPage \d+\n/),
        playersInfo = [];
    _.forEach(pages, function (page) {
        var docTopMatches = page.match(/Time played ([\d'"]+)[.\r\n]*(\d+)\s+([^\r]+)\r\s+([^\r]+)\s+1st half/);
        if (!docTopMatches) {
            return true;
        }
        var tableHeader = page.match(/^.*1st half\s+2nd half\s+Total\s+Team total\s+Team avg \*.*$/mi)[0],
            firstHalfBound = [tableHeader.search(/1st half/i), "1st half".length],
            secondHalfBound = [tableHeader.search(/2nd half/i), "2nd half".length],
            totalBound = [tableHeader.search(/Total/i), "Total".length],
            teamTotalBound = [tableHeader.search(/Team total/i), "Team total".length],
            teamAvgBound = [tableHeader.search(/Team avg \*/i), "Team avg *".length],
            playerInfo = {
                timePlayed: docTopMatches[1],
                playerNumber: docTopMatches[2],
                playerName: docTopMatches[3],
                playerPosition: docTopMatches[4]
            };
        _.forEach(page.split(/\n/), function (line) {
            _.forEach([
                ['goals', /\s+Goal\(s\) scored.*/i],
                ['shots', /\s+Shots.*/i],
                ['assists', /\s+Assist\(s\)/i],
                ['offsides', /\s+Offside\(s\)/i],
                ['saves', /\s+Save\(s\)/i],
                ['yellowCard', /\s+Yellow card/i],
                ['secondYellow', /\s+2Y\+R/i],
                ['redCard', /\s+Red card/i],
                ['foulsCommitted', /\s+Foul\(s\) committed/i]
            ], function (section) {
                var sectionName = section[0],
                    sectionRegex = section[1];
                if (line.match(sectionRegex)) {
                    playerInfo[sectionName] = {
                        firstHalf: line.substr(firstHalfBound[0], firstHalfBound[1]).trim(),
                        secondHalf: line.substr(secondHalfBound[0], secondHalfBound[1]).trim(),
                        total: line.substr(totalBound[0], totalBound[1]).trim(),
                        teamTotal: line.substr(teamTotalBound[0], teamTotalBound[1]).trim(),
                        teamAvg: line.substr(teamAvgBound[0], teamAvgBound[1]).trim()
                    };
                }
            });
            if (line.match(/.*Goal\(s\) scored.*/i)) {
                playerInfo.goals = {
                    firstHalf: line.substr(firstHalfBound[0], firstHalfBound[1]).trim(),
                    secondHalf: line.substr(secondHalfBound[0], secondHalfBound[1]).trim(),
                    total: line.substr(totalBound[0], totalBound[1]).trim(),
                    teamTotal: line.substr(teamTotalBound[0], teamTotalBound[1]).trim(),
                    teamAvg: line.substr(teamAvgBound[0], teamAvgBound[1]).trim()
                };
                //playerInfo.
            }
        });
        playersInfo.push(playerInfo);
        //return false;
    });

    return {full: '', herp: 'derp', players: [], what: playersInfo, numPages: playersInfo.length};
};

var getPlayersDataFromPdf = function (filename) {
    return getRawPlayersDataFromPdf(filename)
        .then(function (blob) {
            return parsePlayersDataBlob(blob);
        });
};

module.exports = getPlayersDataFromPdf;

/*getPlayersDataFromPdf('/Users/germoad/soccr/data_not_checked_in/downloaded_match_18_cmr.pdf')
    .then(function (info) {
        console.log(JSON.stringify(info, ' ', 4));
    })
    .done();*/
