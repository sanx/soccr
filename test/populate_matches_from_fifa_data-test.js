var _              = require('lodash');
var chai           = require('chai');
var chaiAsPromised = require('chai-as-promised');
var rewire         = require('rewire');
var Q              = require('q');
var fs             = require('fs');
var PopulateMatchesFromFifaData = require('../populate_matches_from_fifa_data');

chai.use(chaiAsPromised);
chai.should();

var fsRead = Q.denodeify(fs.readFile);
/*var download = PopulateMatchesFromFifaData.download,
    fsRead = PopulateMatchesFromFifaData.fsRead,
    downloadNoCache = PopulateMatchesFromFifaData.downloadNoCache,
    downloadMatchesWithScores = PopulateMatchesFromFifaData.downloadMatchesWithScores,
    downloadPdfs = PopulateMatchesFromFifaData.downloadPdfs,
    enrichMatchesInfoWithLinks = PopulateMatchesFromFifaData.enrichMatchesInfoWithLinks;*/

beforeEach(function () {
});

describe("populate_matches_from_fifa_data", function () {
    it("download() should call fsRead() if options.useCache", function () {
        var PopulateMatchesFromFifaData = rewire('../populate_matches_from_fifa_data');
        PopulateMatchesFromFifaData.__set__("fsRead", function (save_as, fsOptions) {
            return Q("would read from disk");
        });
        return PopulateMatchesFromFifaData
            .download("http://dummy.com", "test/data/blah.html", {useCache: true, encoding: "binary"}).should.become("would read from disk");
    });
    it("download() should fallback to using downloadNoCache() if options.useCache and fsRead() throws an Error", function () {
        var PopulateMatchesFromFifaData = rewire('../populate_matches_from_fifa_data');
        PopulateMatchesFromFifaData.__set__("fsRead", function (save_as, fsOptions) {
            return Q.reject("couldn't read from local filesystem");
        });
        PopulateMatchesFromFifaData.__set__("downloadNoCache", function (url, save_as, fsOptions) {
            return Q("would read from network");
        });
        return PopulateMatchesFromFifaData
            .download("http://dummy.com", "test/blah.html", {useCache: true, encoding: "binary"}).should.become("would read from network");
    });
    it("download() shouldn't attempt to read from file system if !options.useCache", function () {
        var PopulateMatchesFromFifaData = rewire('../populate_matches_from_fifa_data'),
            fsReadCalls = 0,
            downloadNoCacheCalls = 0;
        PopulateMatchesFromFifaData.__set__("fsRead", function (save_as, fsOptions) {
            fsReadCalls++;
            return Q("whatever");
        });
        PopulateMatchesFromFifaData.__set__("downloadNoCache", function (url, save_as, fsOptions) {
            downloadNoCacheCalls++;
            return Q("would read from network");
        });
        return PopulateMatchesFromFifaData
            .download("http://dummy.com", "test/blah.html", {useCache: false, encoding: "binary"})
                .then(function () {
                    return Q.all([
                        fsReadCalls.should.equal(0),
                        downloadNoCacheCalls.should.equal(1)
                    ]);
                });
    });
    it("downloadMatchesWithScores() should attempt to download html of match pages for matches that have scores", function () {
        var PopulateMatchesFromFifaData = rewire('../populate_matches_from_fifa_data'),
            downloadCalls = [];
        PopulateMatchesFromFifaData.__set__("download", function (url, filename, options) {
            downloadCalls.push({
                url: url,
                filename: filename,
                options: options
            });
            return "dummy document returned";
        });
        return fsRead("test/data/main_matches_data.json", {encoding: 'utf8'})
            .then(function (matchesDataText) {
                var matchesInfo = JSON.parse(matchesDataText);
                matchesInfo.should.have.keys(['stages', 'matches']);
                return PopulateMatchesFromFifaData.downloadMatchesWithScores(matchesInfo)
                    .then(function (matchesInfoWithHtmls) {
                        var matchesWithScores = _(matchesInfo.matches).filter('matchUrl').filter(function (elem, idx) {return elem.matchStatus.match(/(final)/)}).value(),
                            matchesWithHtml   = _(matchesInfoWithHtmls.matches).filter('matchHtml').value();
                        matchesWithHtml.should.have.length(matchesWithScores.length);
                    });
            });
    });
    it("downloadMatchesWithScores() should enrich matchesInfo by adding a matchHtml properties to matches containing match pages html", function () {
        var PopulateMatchesFromFifaData = rewire('../populate_matches_from_fifa_data'),
            downloadCalls = [];
        PopulateMatchesFromFifaData.__set__("download", function (url, filename, options) {
            downloadCalls.push({
                url: url,
                filename: filename,
                options: options
            });
            return "dummy document returned";
        });
        /*PopulateMatchesFromFifaData.__set__("matchParser", {
            getMatchInf
        });*/
        return fsRead("test/data/main_matches_data.json", {encoding: 'utf8'})
            .then(function (matchesDataText) {
                var matchesInfo = JSON.parse(matchesDataText);
                matchesInfo.should.have.keys(['stages', 'matches']);
                return PopulateMatchesFromFifaData.downloadMatchesWithScores(matchesInfo)
                    .then(function (matchesInfoWithHtmls) {
                        var matchesWithScores = _(matchesInfo.matches).filter('matchUrl').filter(function (elem, idx) {return elem.matchStatus.match(/(final)/)}).value(),
                            matchesWithHtml   = _(matchesInfoWithHtmls.matches).filter('matchHtml').value();
                        matchesWithHtml.should.have.length(matchesWithScores.length);
                    });
            });
    });
    it("enrichMatchesInfoWithLinks() should try to put homeTeamPlayerPdfUrl and awayTeamPlayerPdfUrl in matchesInfo", function () {
        return fsRead("test/data/downloaded_match_1.html", {encoding: 'utf8'})
            .then(function (match1Html) {
                return {
                    stages: {},
                    matches: [
                        {
                            "roundId": "255931",
                            "matchId": "300186456",
                            "matchStatus": "final",
                            "stadium": "Arena de Sao Paulo",
                            "city": "Sao Paulo ",
                            "matchNum": 1,
                            "matchUrl": "/worldcup/matches/round=255931/match=300186456/index.html#nosticky",
                            "homeTeamName": "brazil",
                            "homeTeamShort": "bra",
                            "awayTeamName": "croatia",
                            "awayTeamShort": "cro",
                            "scoreStatus": "ft ",
                            "homeTeamScore": "3",
                            "awayTeamScore": "1",
                            "matchHtml": match1Html
                        }
                    ]
                }
            })
            .then(PopulateMatchesFromFifaData.enrichMatchesInfoWithLinks)
            .then(function (matchesInfo) {
                matchesInfo.should.have.keys(['stages', 'matches']);
                matchesInfo.matches.length.should.equal(1);
                matchesInfo.matches[0].should.not.contain.key('matchHtml');
                matchesInfo.matches[0].should.contain.keys('homeTeamPlayerPdfUrl', 'awayTeamPlayerPdfUrl');
            });
    });
    it("downloadPdfs() should try to download pdfs for matches that have pdf info in their matchInfo entries", function () {
        var matchesInfo = {
                stages: {},
                matches: [
                    {
                        "roundId": "255931",
                        "matchId": "300186456",
                        "matchStatus": "final",
                        "stadium": "Arena de Sao Paulo",
                        "city": "Sao Paulo ",
                        "matchNum": 1,
                        "matchUrl": "/worldcup/matches/round=255931/match=300186456/index.html#nosticky",
                        "homeTeamName": "brazil",
                        "homeTeamShort": "bra",
                        "awayTeamName": "croatia",
                        "awayTeamShort": "cro",
                        "scoreStatus": "ft ",
                        "homeTeamScore": "3",
                        "awayTeamScore": "1",
                        "homeTeamPlayerPdfUrl": "http://home.team.player.pdf.url/",
                        "awayTeamPlayerPdfUrl": "http://away.team.player.pdf.url/"
                    }
                ]
            },
            PopulateMatchesFromFifaData = rewire('../populate_matches_from_fifa_data'),
            downloadCalls = [],
            playersPdfParserCalls = [];
        PopulateMatchesFromFifaData.__set__("download", function (url, filename, options) {
            downloadCalls.push({
                url: url,
                filename: filename,
                options: options
            });
        });
        PopulateMatchesFromFifaData.__set__("playersPdfParser", function (filename, options) {
            playersPdfParserCalls.push({
                filename: filename,
                options: options
            });
            return {
                made: {
                    up: {
                        object: true
                    }
                }
            };
        });
        return PopulateMatchesFromFifaData.downloadPdfs(matchesInfo, {useCache: true})
            .then(function (pdfMatchesInfo) {
                pdfMatchesInfo[0].homePlayersInfo.made.up.object.should.equal(true);
                pdfMatchesInfo[0].awayPlayersInfo.made.up.object.should.equal(true);
                downloadCalls.length.should.equal(2);
                playersPdfParserCalls.length.should.equal(2);
            });
    });
});

