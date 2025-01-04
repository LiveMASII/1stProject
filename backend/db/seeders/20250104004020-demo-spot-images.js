'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('SpotImages', [
      {
        spotId: 1,  // Assume the spot with id 1 exists
        url: 'https://example.com/spot1-image1.jpg',
        preview: true,  // Set as preview image for this spot
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        spotId: 1,
        url: 'https://example.com/spot1-image2.jpg',
        preview: false,  // Non-preview image
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        spotId: 2,  // Assume the spot with id 2 exists
        url: 'https://example.com/spot2-image1.jpg',
        preview: true,  // Set as preview image for this spot
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        spotId: 3,  // Assume the spot with id 3 exists
        url: 'https://example.com/spot3-image1.jpg',
        preview: false,  // Non-preview image
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('SpotImages', null, {});
  }
};
