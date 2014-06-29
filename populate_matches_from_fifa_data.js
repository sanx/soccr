var Q       = require('q');
var request = require('request');
var shelljs = require('shelljs');
var mysql = require('mysql');
var nconf = require('nconf');
var fs    = require('fs');
var util  = require('util');
var _     = require('lodash');
var matchParser = require('./lib/matches_info_from_html');
var playersPdfParser = require('./lib/players_data_from_pdf');
/**
 * 1. download main matches html
 * 2. parse matches data out from html
 * 3. download additional matches stats pdfs if needed
 * 4. convert downloaded pdfs to text, and parse stats out
 * 5. save all match + stats data
 */
var NODE_ENV = process.env.NODE_ENV,
    dbConfig,
    pool,
    poolQuery,
    poolEnd,
    fsRead = Q.denodeify(fs.readFile),
    fsWrite = Q.denodeify(fs.writeFile), //takes: fileName, data
    requestGet = Q.denodeify(request),
    downloadedFiles = {
        matches_index: './data_not_checked_in/downloaded_matches_index.html',
        other_matches_path: './data_not_checked_in',
        other_matches_prefix: 'downloaded_match_',
        other_matches_suffix: '.html',
        pdfs_path: './data_not_checked_in',
        pdfs_prefix: 'downloaded_match_',
        pdfs_team_prefix: '_',
        pdfs_suffix: '.pdf'
    };


nconf.argv().env().file({file: './config/'+NODE_ENV+'.config.json'});
dbConfig = nconf.get("data:dbConfig");
useCacheMatchesPage = nconf.get("sources:fifa:useCacheMatchesPage");
useCacheMatchPages = nconf.get("sources:fifa:useCacheMatchPages");
useCachePdfs = nconf.get("sources:fifa:useCachePdfs");

var download = exports.download = function (url, save_as, fsOptions) {
    var fsOptions = fsOptions || {encoding: 'binary', useCache: true},
        encoding = fsOptions.encoding || 'binary',
        useCache = (fsOptions.useCache === undefined) ? true : fsOptions.useCache;
    if (useCache) {
        return fsRead(save_as, fsOptions)
            .fail(function (readFileError) {
                // we're discarding readFileError and go straight into attempting to fetch from original source
                return downloadNoCache(url, save_as, fsOptions);
            });
    } else {
        return downloadNoCache(url, save_as, fsOptions);
    }
};

var downloadNoCache = function (url, save_as, fsOptions) {
    var fsOptions = fsOptions || {encoding: 'binary'},
        encoding = fsOptions.encoding;
    console.log("requesting url: " + url);
    return requestGet({url: url, encoding: encoding})
    .then(function (reqRes) {
        var response = reqRes.shift(),
            body     = reqRes.shift();

        if (200 !== response.statusCode) {
            throw new Error(util.format("got http code '%d' when GETting '%s'", response.statusCode, fifaAllMatchesUrl));
        }
        return body;
    })
    .then(function (body){
        return fsWrite(save_as, body, {encoding: encoding})
            .then(function () {
                return body;
            });
    }).then(function (body) {
        return body;
    });
};

var downloadMatchesWithScores = function (matchesInfo, options) {
    var options = options || {useCache: true},
        matchPromises = [],
        matchesWithScores = _(matchesInfo.matches).filter('matchUrl').filter(function (elem, idx) {return elem.matchStatus.match(/(final)/)}).value();

    _(matchesWithScores).forEach(function (match) {
        matchPromises.push(function () {
            var fifaMatchUrl = util.format("http://%s%s", nconf.get("sources:fifa:domain"), match.matchUrl),
                filename = util.format("%s/%s%d%s",
                    downloadedFiles.other_matches_path,
                    downloadedFiles.other_matches_prefix,
                    match.matchNum,
                    downloadedFiles.other_matches_suffix);
            return download(fifaMatchUrl, filename, {encoding: 'utf8', useCache: options.useCache});
        }());
        console.log("on match num: " + match.matchNum);
    });
    console.log(matchPromises[0]);
    return Q.all(matchPromises)
        .then(function (matchesHtml) {
            // matchesHtml has the same indexes as matchesWithScores.
            _.map(matchesWithScores, function (match, idx) {
                match.matchHtml = matchesHtml[idx];
            });
            return matchesInfo;
        });
};

var downloadPdfs = function (matchesInfo, options) {
    var options = options || {useCache: true};
    var matchesWithPdfsBasicInfo = _(matchesInfo.matches).filter('homeTeamPlayerPdfUrl').filter('awayTeamPlayerPdfUrl').map(function (fullMatchInfo) {
        var homeTeamFilename = util.format("%s/%s%d%s%s%s",
            downloadedFiles.pdfs_path,
            downloadedFiles.pdfs_prefix,
            fullMatchInfo.matchNum,
            downloadedFiles.pdfs_team_prefix,
            fullMatchInfo.homeTeamShort.toLowerCase(),
            downloadedFiles.pdfs_suffix);
        var awayTeamFilename = util.format("%s/%s%d%s%s%s",
            downloadedFiles.pdfs_path,
            downloadedFiles.pdfs_prefix,
            fullMatchInfo.matchNum,
            downloadedFiles.pdfs_team_prefix,
            fullMatchInfo.awayTeamShort.toLowerCase(),
            downloadedFiles.pdfs_suffix);
        return {
            matchId: fullMatchInfo.matchId,
            homeTeamPlayerPdfUrl: fullMatchInfo.homeTeamPlayerPdfUrl,
            awayTeamPlayerPdfUrl: fullMatchInfo.awayTeamPlayerPdfUrl,
            homeTeamPlayerPdfFilename: homeTeamFilename,
            awayTeamPlayerPdfFilename: awayTeamFilename
        };
    }).value();
    console.log("matchesWithPdfsBasicInfo: " + JSON.stringify(matchesWithPdfsBasicInfo, ' ', 4));
    var downloadPdfPromises = _.map(matchesWithPdfsBasicInfo, function (basicMatchInfo) {
        return Q.all([
            download(basicMatchInfo.homeTeamPlayerPdfUrl, basicMatchInfo.homeTeamPlayerPdfFilename, {encoding: 'binary', useCache: options.useCache}),
            download(basicMatchInfo.awayTeamPlayerPdfUrl, basicMatchInfo.awayTeamPlayerPdfFilename, {encoding: 'binary', useCache: options.useCache})
        ]);
    });
    var parsePdfPromises = _.map(matchesWithPdfsBasicInfo, function (basicMatchInfo) {
        return Q.all([
            playersPdfParser(basicMatchInfo.homeTeamPlayerPdfFilename, {useCache: options.useCache}),
            playersPdfParser(basicMatchInfo.awayTeamPlayerPdfFilename, {useCache: options.useCache})
        ]);
    });
    return Q.all(downloadPdfPromises)
        .then(function () {
            // all pdfs are downloaded at this point.
            return Q.all(parsePdfPromises)
                .then(function (pdfsInfo) {
                    var pdfMatchesInfo = [];
                    // put the pdfs info into new objects in array
                    _.forEach(matchesWithPdfsBasicInfo, function (basicMatchInfo) {
                        var pdfInfo = pdfsInfo.shift();
                        pdfMatchesInfo.push({
                            homePlayersInfo: pdfInfo[0],
                            awayPlayersInfo: pdfInfo[1]
                        });
                    })
                    return pdfMatchesInfo;
                });
            /*matchesWithPdfsBasicInfo.forEach(function (basicMatchInfo) {
                matchesInfo.find({matchInfo: basicMatchInfo.matchInfo}).map(function (matchInfo) {
                    _.merge(matchInfo, basicMatchInfo);
                });
            });
            return matchesInfo;*/
        });
};

var enrichMatchesInfoWithLinks = function (matchesInfo) {
    var matchesDetailsPromises = [],
        matchesWithHtml = _.filter(matchesInfo.matches, 'matchHtml');
    matchesWithHtml.forEach(function (match) {
        matchesDetailsPromises.push(matchParser.getMatchInfo(match.matchHtml));
    });
    return Q.all(matchesDetailsPromises)
        .then(function (matchesDetails) {
            _(matchesDetails).forEach(function (details, idx) {
                var matchInfo = matchesInfo.matches[idx],
                    homeTeamShort = matchInfo.homeTeamShort,
                    awayTeamShort = matchInfo.awayTeamShort;

                delete matchInfo.matchHtml;

                if (undefined === details[homeTeamShort] || undefined === details[homeTeamShort]) {
                    //throw new Error(util.format("homeTeamShort (%s) not one of details keys (%s)", homeTeamShort, _.keys(details).toString()));
                    return true;
                }
                /*if (undefined === details[awayTeamShort]) {
                    throw new Error(util.format("awayTeamShort (%s) not one of details keys (%s)", awayTeamShort, _.keys(details).toString()));
                }*/
                matchInfo.homeTeamPlayerPdfUrl = details[homeTeamShort].pdfUrl;
                matchInfo.awayTeamPlayerPdfUrl = details[awayTeamShort].pdfUrl;
            });
            return matchesInfo;
        });
};


/*var fifaAllMatchesUrl = util.format("http://%s%s", nconf.get("sources:fifa:domain"), nconf.get("sources:fifa:all_matches_path"));

download(fifaAllMatchesUrl, downloadedFiles.matches_index, {encoding: 'utf8', useCache: useCacheMatchesPage})
    .then(matchParser.getMatchesInfo)
    .then(function (matchesInfo) {
        return downloadMatchesWithScores(matchesInfo, {useCache: useCacheMatchPages});
    })
    .then(enrichMatchesInfoWithLinks)
    .then(function (matchesInfo) {
        return downloadPdfs(matchesInfo, {useCache: useCachePdfs});
    })
    .then(function (pdfsInfo) {
        console.log("pdfsInfo: " + JSON.stringify(pdfsInfo));
    })
    .done();*/


//module.exports.download = download;
module.exports.fsRead = fsRead;
module.exports.downloadNoCache = downloadNoCache;
module.exports.downloadMatchesWithScores = downloadMatchesWithScores;
module.exports.downloadPdfs = downloadPdfs;
module.exports.enrichMatchesInfoWithLinks = enrichMatchesInfoWithLinks;

//download = exports.download;
