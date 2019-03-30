const express = require('express')
const app = express()
const port = 3000

const inputFolder = './ipl/';
const outputFolder = './json-ipl/';
const fs = require('fs');
const yaml = require('js-yaml');
const http = require('http');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
var bowlingStyle = {};
var players = fs.readFileSync('./iplt20-db/squads-db.json', {encoding: 'utf-8'});
players= JSON.parse(players);
players.forEach(function(player){

  bowlingStyle[player['bowlingStyle']]=true;
})
console.log(bowlingStyle);
/**
  * Get all file names in a folder
  */

function convertBallByBallDataFromYamlToJson() {
  fs.readdirSync(inputFolder).forEach(file => {
    convertFile(file);
  });
}

/**
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  * Convert YAML to JSON
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  */

var file = "981019.yaml";
// convertFile(file);
function convertFile (inputfile) {
    var outputfile = inputfile.split(".")[0] + '.json';
    var obj = yaml.load(fs.readFileSync(inputFolder + inputfile, {encoding: 'utf-8'}));
    fs.writeFileSync(outputFolder + outputfile, JSON.stringify(obj, null, 2));
}
var url = 'http://cricketapi.platform.iplt20.com/stats/players?teamIds=1&tournamentIds=7749&scope=TOURNAMENT';

var request = require('request');

function getPlayers() {
  request(url, function (error, response, data) {
    if (!error && response.statusCode == 200) {
        data = JSON.parse(data);
        var content = data.stats.content;

    }
  })
}

/**
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  * Fetching Squad detail from www.iplt20.com
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  */

/**
  * Tournament Ids List is hardcoded currently
  */

var squadJson = './iplt20-db/squad.json';

var tid = {};
tid["2008"] = 78;
tid["2009"] = 79;
tid["2010"] = 80;
tid["2011"] = 81;
tid["2012"] = 1;
tid["2013"] = 605;
tid["2014"] = 2374;
tid["2015"] = 2785;
tid["2016"] = 3957;
tid["2017"] = 5815;
tid["2018"] = 7749;
tid["2019"] = 10192;

/**
  * Function to fetch squad and write it in a file
  */
// updateSquad();

function updateSquad() {
  fetchSquad((data) => {
    fs.writeFileSync(squadJson, JSON.stringify(data, null, 2));
  })
}

/**
  * Function to fetch squad for all IPL Season
  */

function fetchSquad(cb) {
  console.log("Fetching squad ....")
  fetchSquadForAllIPLSeason(2008, {}, (data) => {
    cb(data);
  })
}

/**
  * Function to fetch squad data for all IPL Seasons
  */

function fetchSquadForAllIPLSeason(year, squad, cb) {
  if (year == 2019) {
    cb(squad);
  } else {
    console.log("Year : " + year)
    var teamIds = generateIplTeamId();
    var tournamentId = tid[year];
    fetchSquadOfAllTeamsByTournamentId(tournamentId, teamIds, {}, (data) => {
      console.log("Squad fetched successfully...")
      squad[year] = data;
      fetchSquadForAllIPLSeason(year + 1, squad, cb);
    })
  }
}

/**
  * Function to fetch squad of all teams for a particular Season
  */

function fetchSquadOfAllTeamsByTournamentId(tournamentId, teamIds, data, cb) {
  if (teamIds.length != 0) {
    var teamId = teamIds.pop();
      console.log("Team : " + teamId)
    fetchSquadByTeamAndTournamentId(tournamentId, teamId, (name, squad) => {
      data[name] = squad;
        console.log("Squad for this team fetched successfully....")
        fetchSquadOfAllTeamsByTournamentId(tournamentId, teamIds, data, cb);
    })
  } else {
    cb(data);
  }
}

/**
  * Function to fetch squad by team list of a particular IPL Season
  */

function fetchSquadByTeamAndTournamentId(tournamentId, teamId, cb) {
  request('http://cricketapi.platform.iplt20.com/stats/players?teamIds='+teamId+'&tournamentIds='+tournamentId+'&scope=TOURNAMENT&pageSize=50', function (error, response, data) {
    if (!error && response.statusCode == 200) {
        data = JSON.parse(data);
        var content = data.stats.content;
        console.log(content.length + " players fetched of team " + data.team.fullName);
        cb(data.team.abbreviation, content);
    }
  })
}

/**
  * Genrating list of team ids of teams participated in IPL
  */

function generateIplTeamId() {
  var teamids = [];
  for(i = 1; i < 11; i++)
    teamids.push(i);
   teamids.push(62);
  return teamids;
}

/**
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  * Fetching Teams detail from www.iplt20.com
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  */

var teamsJSON = './iplt20-db/teams.json';

function fetchTeams() {
  var teamids = generateIplTeamId();
  getTeamIds(0, [], teamids);
}

function getTeamIds(count, teamData, teamids) {
  request('http://cricketapi.platform.iplt20.com/stats/players?teamIds='+teamids[count]+'&tournamentIds=7749&scope=TOURNAMENT', function (error, response, data) {
    if (!error && response.statusCode == 200) {
        data = JSON.parse(data);
        var content = data.stats.content;
        console.log(data.team.fullName + " " + teamids[count] + " " + count + " " + teamids.length);
        teamData.push(data.team);
        if (count + 1 < teamids.length)
          getTeamIds(count+1, teamData, teamids);
        else {
          console.log("Teams Updated in teams.json");
          fs.writeFileSync(teamsJSON, JSON.stringify(teamData, null, 2));
        }

    }
  })
}

/**
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  * Fetching Tournament Ids of IPL from www.iplt20.com
  * Note : FOr now, tournament ids are being hardcoded above
  * -----------------------------------------------------------
  * -----------------------------------------------------------
  */

var tournamentJSON = './iplt20-db/tournament.json';

//createTournamentIds();
function createTournamentIds() {
  var contents = {};
  try {
    contents = fs.readFileSync(tournamentJSON, {encoding: 'utf-8'});
  } catch (error) {
    var ids = [];
    fetchTournamentIds(2008, 1, ids, () => {
      for (i = 0; i < ids.length; i++) {
        contents[2008 + i ] = ids[i];
      }
    });
  }
  console.log(contents);
}

function fetchTournamentIds(year, tournamentId, ids, cb) {
  console.log("Trying for year : " + year + " && Tournament Id : " + tournamentId);
  request(url, function (error, response, data) {
    if (!error && response.statusCode == 200) {
        data = JSON.parse(data);
        url = 'http://cricketapi.platform.iplt20.com/stats/players?teamIds=1&tournamentIds='+tournamentId+'&scope=TOURNAMENT';
        if (data.tournament != undefined && data.tournament.name == 'ipl' + year) {
          console.log("Tournament id for " + year + " is " + data.tournament.id);
          ids.push(data.tournament.id);
          if (year < 2019) {
            fetchTournamentIds(year+1, tournamentId + 1, ids, cb)
          } else {
            cb();
          }
        } else {
          if (tournamentId < 15000) {
            fetchTournamentIds(year, tournamentId + 1, ids, cb);
          } else {
            cb();
          }
        }
    } else {
      if (tournamentId < 15000) {
        fetchTournamentIds(year, tournamentId + 1);
      }
    }
  })
}
// app.listen(port, () => console.log(`Example app listening on port ${port}!`))
