'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Reviews', [
      {
        spotId: 1,  // This spot must exist in the Spots table
        userId: 1,  // Match the first user created by the Users seeder
        review: 'Amazing spot!',
        stars: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Reviews', null, {});
  },
};
