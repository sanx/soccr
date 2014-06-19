var Q     = require('q');
var jsdom = require('jsdom');
var util  = require('util');

var jsdomEnv = Q.nbind(jsdom.env, jsdom);

var getMatchesInfo = function (html) {
    return jsdomEnv(html, ['../bower_components/jquery/dist/jquery.js']).then(function (window) {
        var $ = window.$,
            ret = {stages: {}, matches: {}},
            searchedMatchText,
            matchStatus,
            matchDivSelector = '.mu.fixture,.mu.result,.mu.live',
            stageElem;

        $('.match-list-round').each(function (roundIdx) {
            var roundId = $(this).attr('data-roundid');
            ret.stages[roundId] = {
                id: roundId,
                name: $(this).text()
            };
        });
        $(matchDivSelector).each(function (matchIdx) {
            var matchElem = $(this),
                matchUrl  = $(this).find('.mu-m-link').attr('href');
                matchRoundId = (matchUrl && matchUrl.match(new RegExp("/round=(\\d+)/"))[1]) || null,
                matchId = matchElem.attr('data-id'),
                scoreMatches = matchElem.find('.s-scoreText').text().match(/(\d+)-(\d+)/);

            console.log("match num: " + matchElem.find('.mu-i-matchnum').text().match(/Match\s+(\d+)\b/)[1]);
            //console.log(util.format("match url: %s, round id: %s", matchUrl, matchRoundId));
            if (matchElem.is('.fixture')) {
                matchStatus = 'coming';
            } else if (matchElem.is('.result')) {
                matchStatus = 'final';
            } else if (matchElem.is('.live')) {
                matchStatus = 'live';
            }
            ret.matches[matchId] = {
                roundId: matchRoundId,
                matchId: matchId,
                matchStatus: matchStatus,
                stadium: matchElem.find('.mu-i-stadium').text(),
                city: matchElem.find('.mu-i-venue').text(),
                matchNum: matchElem.find('.mu-i-matchnum').text().match(/Match\s+(\d+)\b/)[1],
                matchUrl: matchUrl,
                homeTeamName: matchElem.find('.t.home .t-nText').text(),
                homeTeamShort: matchElem.find('.t.home .t-nTri').text(),
                awayTeamName: matchElem.find('.t.away .t-nText').text(),
                awayTeamShort: matchElem.find('.t.away .t-nTri').text(),
                scoreStatus: matchElem.find('.s-status-abbr').text(),
                homeTeamScore: scoreMatches && scoreMatches[1],
                awayTeamScore: scoreMatches && scoreMatches[2]
            };
        });
        //return Q.fcall(function () {
            return ret;
        //});
    });
};


/**
 * gets match metadata from the match page html
 */
var getMatchInfo = function (html) {
    return jsdomEnv(html, ['../bower_components/jquery/dist/jquery.js']).then(function (window) {
        var $ = window.$,
            ret,
            playerStatsFilter;

        console.log('on getMatchInfo');
        playerStatsFilter = function (idx) {
            //console.log("args to playerStatsFilter: " + JSON.stringify(arguments));
            //console.log("1st arg: " + idx);
            return $(this).text().match(/Player Statistics \(\w+\)/);
        };

        console.log('this many matching <a>s: ' + $('.dcm-title a').filter(playerStatsFilter).length);

        $('.dcm-title a').filter(playerStatsFilter).each(function (idx) {
            console.log('a link we want');
            var teamShort = $(this).text().match(new RegExp("\\((\\w+)\\)"))[1].toLowerCase(),
                pdfUrl = $(this).attr('href');
            //console.log("team: " + teamShort);
            //console.log("url: " + pdfUrl);
            ret[teamShort] = {
                teamShort: teamShort,
                pdfUrl: pdfUrl
            };
        });
        return ret;
    });
};

module.exports = {
    getMatchesInfo: getMatchesInfo,
    getMatchInfo: getMatchInfo
};
/*getMatchesInfo('./data_not_checked_in/matches_index.html')
    .then(function (info) {
        console.log(JSON.stringify(info, ' ', 4));
        console.log(util.format("there are %d matches", Object.getOwnPropertyNames(info.matches).length));
    })
    .done();
*/

/*getMatchesInfo('./data_not_checked_in/matches_index.html')
    .then(function (info) {
        console.log(JSON.stringify(info, ' ', 4));
        console.log(util.format("there are %d matches", Object.getOwnPropertyNames(info.matches).length));
    })
    .done();*/
