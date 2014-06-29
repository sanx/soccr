var chai           = require('chai');
var chaiAsPromised = require('chai-as-promised');
var rewire         = require('rewire');
var Q              = require('q');
var fs             = require('fs');
var _              = require('lodash');
var MatchesInfoFromHtml = require('../lib/matches_info_from_html');

chai.use(chaiAsPromised);
chai.should();

var fsRead = Q.denodeify(fs.readFile);

describe("lib/matches_info_from_html", function () {
    it("getMatchesInfo() should correctly extract basic match data from html", function () {
        return fsRead("test/data/downloaded_matches_index.html", {encoding: 'utf8'})
            .then(function (indexHtml) {
                return fsRead("test/data/main_matches_data.json", {encoding: 'utf8'})
                    .then(function (basicMatchesInfo) {
                        var expectedMatchesInfo;

                        indexHtml.should.be.a('string');
                        indexHtml.length.should.be.at.least(1000);
                        basicMatchesInfo.should.be.a('string');
                        expectedMatchesInfo = JSON.parse(basicMatchesInfo);
                        return MatchesInfoFromHtml.getMatchesInfo(indexHtml)
                            .then(function (computedMatchesInfo) {
                                computedMatchesInfo.stages.should.deep.equal(expectedMatchesInfo.stages);
                                JSON.stringify(computedMatchesInfo.matches).should.equal(JSON.stringify(expectedMatchesInfo.matches));
                            });
                    });
            });
    });
    it("getMatchInfo() should correctly extract links to team stats pdfs from html", function () {
        return fsRead("test/data/downloaded_match_1.html", {encoding: 'utf8'})
            .then(MatchesInfoFromHtml.getMatchInfo)
            .then(function (matchInfo) {
                var teams = _.keys(matchInfo);
                teams.length.should.equal(2);
                _.forEach(matchInfo, function (teamInfo) {
                    teamInfo.should.have.keys(['teamShort', 'pdfUrl']);
                    teamInfo.teamShort.length.should.equal(3);
                    teamInfo.pdfUrl.length.should.be.at.least(10);
                    teamInfo.pdfUrl.should.match(/.pdf$/);
                });
            });
    });
});
