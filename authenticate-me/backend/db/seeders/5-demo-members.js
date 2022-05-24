'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Members', [
      {
        userId: 1,
        groupId: 1,
        status: 'host'
      },

      {
        userId: 2,
        groupId: 2,
        status:'co-host'
      },

      {
        userId: 3,
        groupId: 1,
        status: 'member'
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Members', null, {});

  }
};
