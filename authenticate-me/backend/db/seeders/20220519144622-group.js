'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Groups',[
      {
      organizerId: 1,
      name: 'Academic Writing Group',
      about: 'lorem ipsum',
      type: 'In-Person',
      private: true,
      city: 'New Orleans',
      state: 'Louisiana'
    },
    {
      organizerId: 2,
      name: 'Outdoor Adventures',
      about: 'we go outside',
      type: 'In-Person',
      private: true,
      city: 'Seattle',
      state: 'Washington'
    }
  ]);

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Groups', {
      name: ['Academic Writing Group', 'Outdoor Adventures']
    });
  }
};
