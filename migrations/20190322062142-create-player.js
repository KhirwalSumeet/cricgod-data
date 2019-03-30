'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('player', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      batting_hand: { type: Sequelize.ENUM, values: ['LEFT', 'RIGHT'] },
      bowling_hand: { type: Sequelize.ENUM, values: ['LEFT', 'RIGHT', 'NONE'] },
      bowling_style: { type: Sequelize.ENUM, values: ['OFF_SPIN', 'ORTHODOX','MEDIUM_SEAM', 'FAST_SEAM', 'LEG_SPIN', 'UNORTHODOX', 'NONE'] },
      dob: { type: Sequelize.DATE },
      nationality: { type: Sequelize.STRING },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('player');
  }
};
