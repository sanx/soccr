var Q  = require('q');
var shelljs = require('shelljs');


var getPlayersDataFromPdf = function (filename) {
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

//export.modules = getPlayersDataFromPdf;

getPlayersDataFromPdf('/Users/germoad/soccr/data_not_checked_in/downloaded_match_18_cmr.pdf')
    .then(function (text) {
        console.log(text.substr(0, 1000) + '...');
    })
    .done();
