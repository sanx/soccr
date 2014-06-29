var chai           = require('chai');
var chaiAsPromised = require('chai-as-promised');
var Q              = require('q');
var PlayersDataFromPdf = require('../lib/players_data_from_pdf');

chai.use(chaiAsPromised);
chai.should();

describe("lib/players_data_from_pdf", function () {
    it("should fail if no filename provided", function () {
        return PlayersDataFromPdf().should.be.rejected;
    });

    it("should succeed if a valid pdf is provided", function () {
        return PlayersDataFromPdf('test/data/downloaded_match_1_bra.pdf').should.be.fulfilled;
    });

    it("should fail if a made up (non existing) pdf filename is provided", function () {
        return PlayersDataFromPdf('test/data/blahhh_blaaaaah.pdf').should.be.rejected;
    });

    it.only("should return meaningful data given a proper pdf", function () {
        return PlayersDataFromPdf('test/data/downloaded_match_1_bra.pdf')
            .then(function (playersStats) {
                console.log(playersStats);
            });
    });
});
