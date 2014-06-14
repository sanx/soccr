var Q     = require('q');
var jsdom = require('jsdom');
var util  = require('util');

var jsdomEnv = Q.nbind(jsdom.env, jsdom);

var NUM_MATCHES = 64;

var MatchesInfo = function () {
};

MatchesInfo.prototype.getMatchesInfo = function (html) {
    return jsdomEnv(html, ['../bower_components/jquery/dist/jquery.js']).then(function (window) {
        var $ = window.$,
            ret = {stages: {}, matches: {}},
            searchedMatchText,
            matchFilter,
            matchStatus,
            matchDivSelector = '.mu.fixture,.mu.result,.mu.live',
            stageElem;

        matchFilter = function (idx, elem) {
            return (new RegExp('\\bMatch '+(i+1)+'\\b')).test(elem.innerHTML);
        };

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
                matchId = matchElem.attr('data-id');

        console.log(util.format("match url: %s, round id: %s", matchUrl, matchRoundId));
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
                stadium: matchElem.find('.mu-i-stadium').text(),
                city: matchElem.find('.mu-i-venue').text(),
                matchUrl: matchUrl
            };
        });
        return ret;
    });
};

matchesInfo = new MatchesInfo();
matchesInfo.getMatchesInfo('./data_not_checked_in/matches_index.html')
    .then(function (info) {
        console.log(JSON.stringify(info, ' ', 4));
        console.log(util.format("there are %d matches", Object.getOwnPropertyNames(info.matches).length));
    })
    .done();

