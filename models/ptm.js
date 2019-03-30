'use strict';
module.exports = (sequelize, DataTypes) => {
  const ptm = sequelize.define('ptm', {
    player_id: DataTypes.INTEGER,
    team_id: DataTypes.INTEGER,
    year: DataTypes.INTEGER
  }, {
    "freezeTableName": true
  });
  ptm.associate = function(models) {
    // associations can be defined here
  };
  return ptm;
};
