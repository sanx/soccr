var Q       = require('q');
var request = require('request');
var shelljs = require('shelljs');
var mysql = require('mysql');
var nconf = require('nconf');
var fs    = require('fs');
var util  = require('util');
var _     = require('lodash');
var matchParser = require('./lib/matches_info_from_html');
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

var download = function (url, save_as) {
    return requestGet({url: url, encoding: 'binary'})
        .then(function (reqRes) {
            var response = reqRes.shift(),
                body     = reqRes.shift();

            if (200 !== response.statusCode) {
                throw new Error(util.format("got http code '%d' when GETting '%s'", response.statusCode, fifaAllMatchesUrl));
            }
            return body;
        })
        .then(function (body){
            return fsWrite(save_as, body, {encoding: 'binary'})
                .then(function () {
                    return body;
                });
        }).then(function (body) {
            return body;
        });
};

var downloadDetailedMatchesHtml = function (url) {
};

var fifaAllMatchesUrl = util.format("http://%s%s", nconf.get("sources:fifa:domain"), nconf.get("sources:fifa:all_matches_path"));

download(fifaAllMatchesUrl, downloadedFiles.matches_index)
    .then(matchParser.getMatchesInfo)
    .then(function (matchesInfo) {
        //console.log("matchesInfo is: " + JSON.stringify(matchesInfo, ' ', 4));
        var matches = _(matchesInfo.matches).toArray(matchesInfo.matches).filter('matchUrl').filter(function (elem, idx) {return elem.matchStatus.match(/(live|final)/)}).value(),
            matchPromises = [];

        _(matches).forEach(function (match, matchId) {
            matchPromises.push(function () {
                var fifaMatchUrl = util.format("http://%s%s", nconf.get("sources:fifa:domain"), match.matchUrl),
                    filename = util.format("%s/%s%d%s",
                        downloadedFiles.other_matches_path,
                        downloadedFiles.other_matches_prefix,
                        match.matchNum,
                        downloadedFiles.other_matches_suffix);
                return download(fifaMatchUrl, filename);
            }());
            console.log("on match num: " + match.matchNum);
            return false; // do it only once
        });
        console.log(matchPromises[0]);
        return Q.all(matchPromises)
            .then(function (htmls) {
                console.log('htmls.length: ' + htmls.length);
                var pdfPromises = [];
                _(htmls).forEach(function (html, idx) {
                    //console.log('an html of length: ' + html.length);
                    //pdfPromises.push(function () {
                        matchParser.getMatchInfo(html)
                            .then(function (matchInfo) {
                                //console.log("match num: " + matchInfo.matchNum);
                                _(matchInfo).forOwn(function (matchInfoForTeam) {
                                    var filename = util.format("%s/%s%d%s%s%s",
                                        downloadedFiles.pdfs_path,
                                        downloadedFiles.pdfs_prefix,
                                        matches[idx].matchNum,
                                        downloadedFiles.pdfs_team_prefix,
                                        matchInfoForTeam.teamShort.toLowerCase(),
                                        downloadedFiles.pdfs_suffix);

                                    console.log("match num: %d, team: %s", matches[idx].matchNum, matchInfoForTeam.teamShort);
                                    pdfPromises.push(download(matchInfoForTeam.pdfUrl, filename));
                                });
                            });
                    //}());
                });
                console.log('returning a pdfPromises this big: ' + pdfPromises.length);
                return Q.all(pdfPromises);
            })
            .then(function (pdfs) {
                console.log('have this many pdfs: ' + pdfs.length);
            });
}).done();

