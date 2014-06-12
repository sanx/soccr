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


var parallelTeamInserts = function (fifaData) {
    var insertTeamsPromises = [];

    fifaData.teams.forEach(function (teamData) {
        insertTeamsPromises.push(poolQuery("INSERT INTO teams SET ? ON DUPLICATE KEY UPDATE ?",
            [{
                codename: teamData.nameShort,
                name: teamData.name,
                countrycode: teamData.nameShort.toLowerCase(),
                fifa_json: JSON.stringify(teamData)
            },
            {
                codename: teamData.nameShort,
                name: teamData.name,
                countrycode: teamData.nameShort.toLowerCase(),
                fifa_json: JSON.stringify(teamData)
            }]
        ));
    });


    return Q.all(insertTeamsPromises);
};

var parallelPlayerInserts = function (teamInserts, fifaData) {
    var insertPlayersPromises = [],
        teamInsertIdx;

    console.log(teamInserts);
    fifaData.players.forEach(function (playerData) {
        console.log('player teamId: ' + playerData.teamId);
        teamInsertIdx = fifaData.teams.reduce(function (prev, curr, idx) {
            if (playerData.teamId.toLowerCase() === curr.nameShort.toLowerCase()) {
                console.log(idx);
                return idx;
            } else {
                //console.log(prev);
                return prev;
            }
        }, undefined);
        console.log('teamInsertIdx: ' + teamInsertIdx);
        var teamId = teamInserts[teamInsertIdx][0].insertId;

        insertPlayersPromises.push(poolQuery("INSERT INTO players SET ? ON DUPLICATE KEY UPDATE ?",
            [{
                name: playerData.name,
                team_id: teamId,
                countrycode: playerData.teamId.toLowerCase(),
                fifa_json: JSON.stringify(playerData)
            },
            {
                name: playerData.name,
                team_id: teamId,
                countrycode: playerData.teamId.toLowerCase(),
                fifa_json: JSON.stringify(playerData)
            }]
        ));
    });

    return Q.all(insertPlayersPromises);
};

var parallelInserts = function (fifaData) {
    return parallelTeamInserts(fifaData)
        .then(function (teamInserts) {
            return parallelPlayerInserts(teamInserts, fifaData);
        });
};

var reportProblems = function (error) {
    console.error("got error: " + error);
};


loadFifaData()
    .then(parallelInserts)
    .done();

