// /routes/api/spots.js
const express = require('express');
const { Spot, Review, SpotImage } = require('../../db/models');
const router = express.Router();

// Get all Spots
router.get('/', async (req, res) => {
  try {
    const spots = await Spot.findAll({
      include: [
        {
          model: Review,
          attributes: ['stars'],
        },
        {
          model: SpotImage,
          where: { preview: true },  // Only get preview images
          required: false,
        },
      ],
    });

    const formattedSpots = spots.map((spot) => {
      const avgRating =
        spot.Reviews.length
          ? spot.Reviews.reduce((sum, review) => sum + review.stars, 0) / spot.Reviews.length
          : null;

      const previewImage = spot.SpotImages.length ? spot.SpotImages[0].url : null;

      return {
        id: spot.id,
        ownerId: spot.ownerId,
        address: spot.address,
        city: spot.city,
        state: spot.state,
        country: spot.country,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
        description: spot.description,
        price: spot.price,
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
        avgRating,
        previewImage,
      };
    });

    return res.status(200).json({ Spots: formattedSpots });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

module.exports = router;

