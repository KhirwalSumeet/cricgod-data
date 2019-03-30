
const fs = require('fs');
const basicDataFolder = './iplt20-db/';

//convertSquad();
function convertSquad() {
  var squad = fs.readFileSync(basicDataFolder + 'squad.json', {encoding: 'utf-8'});
  var dbSquad = [];
  squad = JSON.parse(squad);
  Object.keys(squad).forEach(function(year) {
    var data = squad[year];
    Object.keys(data).forEach(function(key) {

      for (i = 0; i < data[key].length; i++) {
        // console.log(data[key][0])
        var newData = {};
        newData['year'] = year;
        newData['team'] = key;
        Object.keys(data[key][i]['player']).forEach(function(playerKey) {

          newData[playerKey] = data[key][i]['player'][playerKey];
        })
        dbSquad.push(newData);
      }
    })
  })
  fs.writeFileSync(basicDataFolder + 'squads-db.json', JSON.stringify(dbSquad, null, 2));
}
