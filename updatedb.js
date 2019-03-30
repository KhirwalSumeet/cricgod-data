var fs = require('fs');
const basicDataFolder = './iplt20-db/';
const myDbDataFolder = './mydb/';
var async = require('async');

var models = require("./models");
// models.sequelize.sync().then(function() {
//   console.log("Sync successful");
// }).catch(function(err) {
//   console.log(err);
// })
performActions();
function performActions() {
    async.waterfall([
      (cb) => {
        myData(cb);
        console.log("Step 1 ");
      },
      (cb) => {
        console.log("Step 2");
        var update_teams = false;
        if (update_teams == true) {
          updateTeams((err, res)=>{
            cb(err, res);
          });
        }
         updatePlayers();
        // insertStadium();
        // getStadiumTeamMapping();
      }
    ], function (error, response) {
      if (error)
        throw error;
      console.log(response);
    })
}

var allData = {};
function myData(cb) {
  var tables = ['team', 'player', 'stadium', 'ptm'];
  fetchAllDbData(tables, ()=>{
    cb(null);
  });
}

/**
  * Function to update teams in database
  */

//Step 1 : Updating teams in DB
//updateTeams();
function updateTeams(cb) {
  var teamsColumns = ['name', 'abbreviation'];
  var teamsData = fs.readFileSync(basicDataFolder + 'teams.json', {encoding: 'utf-8'});
  teamsData = JSON.parse(teamsData);
  var teamsMapper = {'name' : 'fullName', 'abbreviation' : 'abbreviation'};
  var teamsDbData = mapper(teamsColumns, teamsMapper, teamsData);
  addData(teamsColumns, ['Gujarat Lions', 'GL'], teamsDbData );
  addData(teamsColumns, ['Rising Pune Supergiants', 'RPSG'], teamsDbData );
  addData(teamsColumns, ['Pune Warriors', 'PW'], teamsDbData );
  insertData('team', teamsDbData, function(error, response) {
    if (error)
      cb(error, null);
    else {
      cb(null, response);
    }
  });
}

//Step 2 : Updating players and there teams in db
//updatePlayers();

function updatePlayers() {
  fetchTeams(function (teams) {
    var teamPlayerMapping = {};
    teams.forEach(function(team) {
      teamPlayerMapping[team['abbreviation']] = team['id'];
    })
    convertPlayers(teamPlayerMapping);
  })
}

function fetchTeams(cb) {
  models.team.findAll({raw: true}).then(function(response) {
    cb(response);
  })
}

function convertPlayers(abbreviationIdMapping) {
  var players = JSON.parse(fs.readFileSync(basicDataFolder + 'squads-db.json', {encoding: 'utf-8'}));
  var playerIds = [];
  var teamPlayerMapping = [];
  var shortNameMapping = {};
  var pid = {};
  var count = 1;
  console.log("Working ....");
  // console.log(abbreviationIdMapping)
  for (i = 0; i < players.length; i++) {
    var player = players[i];
    if (pid[player['id']] == undefined) {
      var obj = {};
      obj['id'] = count;
      obj['name'] = player['fullName'];
      obj['dob'] = player['dateOfBirth'];
      obj['nationality'] = player['nationality'];

      if (player['rightHandedBat'] == true)
        obj['batting_hand'] = 'RIGHT';
      else
        obj['batting_hand'] = 'LEFT';

      if (player['rightArmedBowl'] == true)
        obj['bowling_hand'] = 'RIGHT';
      else if(player['rightArmedBowl'] == false)
        obj['bowling_hand'] = 'LEFT';
      else
        obj['bowling_hand'] = 'NONE';

      if (player['bowlingStyle'] != undefined)
        obj['bowling_style'] = player['bowlingStyle'];
      else
        obj['bowling_style'] = 'NONE';

      pid[player['id']] = count;
      shortNameMapping[player['shortName']] = count;
      playerIds.push(obj);
      count++;
    }

    var mapping = {};
    mapping['player_id'] = pid[player['id']];
    mapping['team_id'] = abbreviationIdMapping[player['team']];
    mapping['year'] = player['year'];
    teamPlayerMapping.push(mapping);

  }
  fs.writeFileSync(basicDataFolder + 'ptm.json', JSON.stringify(teamPlayerMapping, null, 2));
  fs.writeFileSync(basicDataFolder + 'players.json', JSON.stringify(playerIds, null, 2));
  insertData("player", playerIds, (error, response) => {
      if (error)
        throw error;
      insertData("ptm", teamPlayerMapping, (error, response) => {
          if (error)
            throw error;
      })
  })
}


function mapper(columns, columnMapper, data) {
  var mappedData = [];
  for(index = 0; index < data.length; index++) {
    var row = {};
    row['id'] = index + 1;
    columns.forEach(function(column) {
      if (columnMapper[column] != undefined)
        row[column] = data[index][columnMapper[column]];
      else
        row[column] = data[index][column];
    })
    mappedData.push(row);
  }
  return mappedData;
}

//Step 3: Updating Stadium in DB

var matchDataFolder = './json-ipl/';

function getStadium() {
  var fileList = getMatchFileList();
  var stadiumList = [];
  var isStadiumAdded = {};
  var x = {};
  fileList.forEach(function(file) {
    var match = JSON.parse(fs.readFileSync(matchDataFolder + file, {encoding: 'utf-8'}));
    if (match.info.city == undefined)
      match.info.city = match.info.venue.split(" ")[0];

    if (isStadiumAdded[match.info.city] == undefined) {
      var stadium = {};
      stadium['name'] = match.info.venue;
      stadium['city'] = match.info.city;
      stadiumList.push(stadium);
      isStadiumAdded[match.info.city] = 1;
    } else {
      isStadiumAdded[match.info.city] = isStadiumAdded[match.info.city] + 1;
    }

    var date = match.info.dates[0].split("-")[0];
    if (x[date] == undefined)
      x[date] = {};

    var y = x[date];
    y[match.info.city] = true;

  })
  fs.writeFileSync(basicDataFolder + 'stadium.json', JSON.stringify(stadiumList, null, 2));
}

function insertStadium() {
  var data = JSON.parse(fs.readFileSync(basicDataFolder + 'stadium.json', {encoding: 'utf-8'}));
  insertData('stadium', data, (error, response) =>{
    if(error)
      throw error;
    console.log(response);
  })
}
// getStadiumTeamMapping();
function getStadiumTeamMapping() {
  var matches = getMatchFileList();
  var fixtures =[];
  var teamIds = [];
  var teams = allData['team'];
  var teamFullNameId = {};
  teams.forEach(function(team) {
    teamIds.push(team['id']);
    teamFullNameId[team['name']] = team['id'];
  })
  teamFullNameId['Delhi Daredevils'] = teamFullNameId['Delhi Capitals'];

  var stadiums = allData['stadium'];
  var stadiumNameId = {};
  stadiums.forEach(function(stadium) {
    stadiumNameId[stadium['name']] = stadium['id'];
  })
  matches.forEach(function(match) {
    match = JSON.parse(fs.readFileSync(matchDataFolder + match, {encoding: 'utf-8'}));
    var fixture = {};
    var year = match.info.dates[0].split("-")[0];
    fixture["team1_id"] = teamFullNameId[match.info.teams[0]];
    fixture["team2_id"] = teamFullNameId[match.info.teams[1]];
    if (fixture["team2_id"] == undefined)
      fixture["team2_id"] = teamFullNameId[match.info.teams[1]+'s'];
    if (fixture["team1_id"] == undefined)
      fixture["team1_id"] = teamFullNameId[match.info.teams[0]+'s'];
    fixture["venue"] = stadiumNameId[match.info.venue];
    if(fixture["venue"] == undefined)
      console.log(match.info.venue);
    fixture['year'] = year;
    fixtures.push(fixture);
  })
   // console.log(fixtures);
}




// fetchTeams(function(teams) {
//   getFixtures(teams);
// })
function getFixtures() {
  var matches = getMatchFileList();
  var fixtures =[];
  matches.forEach(function(match) {
    match = JSON.parse(fs.readFileSync(matchDataFolder + match, {encoding: 'utf-8'}));

    var fixture = {};
    fixture["date"] = match.info.dates[0].split("T")[0];
    fixture["team1_id"] = match.info.teams[0];
    fixture["team2_id"] = match.info.teams[1];
    if ( fixture["team2_id"] == 'Delhi Daredevils')
      fixture["team2_id"] = 'Delhi Capitals';
      if ( fixture["team1_id"] == 'Delhi Daredevils')
        fixture["team1_id"] = 'Delhi Capitals';
    fixtures.push(fixture);
  })
  return fixtures;
  // console.log(fixtures);
}

/**
  * Function to insert bulk data into db
  */

function insertData(table, data, cb) {
  models[table].bulkCreate(data)
  .then(function() {
    cb(null, "Data updated successfully in table " + table);
  })
  .catch(function(error){
      cb(error, null);
  })
}

function fetchData(tableName, cb) {
  models[tableName].findAll({raw: true}).then(function(response) {
    cb(response);
  })
}

function addData(columns, row, data) {
  var obj = {};
  var index = 0;
  columns.forEach(function(column){
    obj[column] = row[index];
    index+1;
  })
  data.push(obj);
}

function getMatchFileList() {
  var matches = [];
  fs.readdirSync(matchDataFolder).forEach(file => {
    matches.push(file);
  });
  return matches;
}

function updateOldData() {
  var teams = JSON.parse(fs.readFileSync('./iplt20-db/backup/teams-old.json', {encoding: 'utf-8'}));
  var newData = {};
  newData["data"] = teams;

    var fullNameTeamId = {};
    teams.forEach(function(team) {
      fullNameTeamId[team["fullName"]] = team["id"];
    })

    newData["fullNameTeamId"] = fullNameTeamId;
    var abbreviationTeamId = {};
    teams.forEach(function(team) {
      abbreviationTeamId[team["abbreviation"]] = team["id"];
    })

    newData["abbreviationTeamId"] = abbreviationTeamId;
    fs.writeFileSync(basicDataFolder + 'teams-old.json', JSON.stringify(newData, null, 2));
}

//Step1 data fetching

function fetchAllDbData(tables, cb) {
  if (tables.length == 0) {
    cb();
    return;
  }

  fetchAndWriteData(tables.pop(), () => {
    fetchAllDbData(tables, cb);
  })
}

function fetchAndWriteData(tableName, cb) {
  fetchData(tableName, (response) => {

    fs.writeFileSync(myDbDataFolder + tableName + '.json', JSON.stringify(response, null, 2));
    allData[tableName] = response;
    cb();
  })
}
