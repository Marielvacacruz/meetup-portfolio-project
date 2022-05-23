'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Images', [
      {
        groupId: 1,
        eventId: null,
        imageableType: 'Group',
        url: 'image url'
      },
      {
        groupId: null,
        eventId: 2,
        imageableType: 'Event',
        url: 'image url'
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.bulkDelete('Images', null, {});
  }
};
