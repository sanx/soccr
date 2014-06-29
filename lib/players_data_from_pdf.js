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
    return {full: blob, herp: 'derp', players: []};
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
