var Q     = require('q');
var mysql = require('mysql');
var nconf = require('nconf');
var fs    = require('fs');

var NODE_ENV = process.env.NODE_ENV,
    dbConfig,
    pool,
    poolQuery,
    poolEnd,
    fsRead = Q.nfbind(fs.readFile);
    //fifaData,

nconf.argv().env().file({file: './config/'+NODE_ENV+'.config.json'});

dbConfig = nconf.get("data:dbConfig");

pool = mysql.createPool(dbConfig);

poolQuery = Q.nbind(pool.query, pool);
poolEnd = Q.nbind(pool.end, pool);

var loadFifaData = function () {
    return fsRead('./data_not_checked_in/fifa14-all-data.json').then(
        function (fifaJSON) {
            return JSON.parse(fifaJSON);
        }
    );
};

var parallelDbInserts = function (fifaData) {
    var insertPromises = [];

    fifaData.teams.forEach(function (teamData) {
        insertPromises.push(poolQuery("INSERT INTO teams SET ?", {
            codename: teamData.nameShort,
            name: teamData.name,
            countrycode: '',
            fifa_json: JSON.stringify(teamData)
        }));
        //console.log(JSON.stringify(teamData));
        //process.exit();
    });

    return Q.all(insertPromises).then(function (promiseResults) {
        console.log(promiseResults);
    });
};

var reportProblems = function (error) {
    console.error("got error: " + error);
};


loadFifaData()
    .then(parallelDbInserts)
    .catch(reportProblems);

