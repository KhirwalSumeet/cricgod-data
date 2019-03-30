'use strict';
module.exports = (sequelize, DataTypes) => {
  const Stadium = sequelize.define('Stadium', {
    name: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    country: DataTypes.STRING,
    city: DataTypes.STRING
  }, {
    "freezeTableName": true
  });
  Stadium.associate = function(models) {
    // associations can be defined here
  };
  return Stadium;
};
