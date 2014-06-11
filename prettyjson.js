var nopt = require('nopt');
var path = require('path');
var util = require('util');
var Q    = require('q');
var fs   = require('fs');

var argv = process.argv,
    knownOpts = {
        'filename': path,
        'blankcharacter': [String, null],
        'indentnumber': [String, null]
    },
    parsed = nopt(knownOpts, null, process.argv, 2),
    filename,
    blankcharacter,
    indentnumber;

var getUsage = function () {
    ret = "Usage: " + argv[0] + " " + argv[1] + " --filename path/to/json/file/to/pretty/print";
    return ret;
}

if (undefined === parsed.filename) {
    console.error(util.format("Error: missing required --filename option\n\n%s", getUsage()));
    process.exit(1);
}

filename = parsed.filename;
blankcharacter = parsed.blankcharacter || ' ';
indentnumber = parsed.indentnumber || 4;

var fsReadFile = Q.nbind(fs.readFile, fs);

fsReadFile(filename).then(
    function (filecontents) {
        console.log(JSON.stringify(JSON.parse(filecontents), blankcharacter, indentnumber));
    }, function (error) {
        console.error("something went wrong: " + error);
    }
);


console.log(parsed);


