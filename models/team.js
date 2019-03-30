'use strict';
module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    abbreviation: DataTypes.STRING
  }, {
    "freezeTableName": true
  });
  Team.associate = function(models) {
    // associations can be defined here
  };
  return Team;
};
