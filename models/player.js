'use strict';
module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define('Player', {
    name: DataTypes.STRING,
    batting_hand: { type: DataTypes.ENUM, values: ['LEFT', 'RIGHT'] },
    bowling_hand: { type: DataTypes.ENUM, values: ['LEFT', 'RIGHT', 'NONE'] },
    bowling_style: { type: DataTypes.ENUM, values: ['OFF_SPIN', 'ORTHODOX','MEDIUM_SEAM', 'FAST_SEAM', 'LEG_SPIN', 'UNORTHODOX', 'NONE'] },
    dob: DataTypes.DATE,
    nationality: DataTypes.STRING
  }, {
    "freezeTableName": true
  });
  Player.associate = function(models) {
    // associations can be defined here
  };
  return Player;
};
