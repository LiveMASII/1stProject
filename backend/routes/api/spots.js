const express = require('express');
const { Spot, Review, SpotImage, User, Booking } = require('../../db/models'); // Ensure User and Booking models are imported for owner details
const { requireAuth } = require('../../utils/auth'); // Import requireAuth
const router = express.Router();

// Get all Spots with Query Filters
router.get('/', async (req, res) => {
  const { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

  // Validate page and size
  if (page < 1) return res.status(400).json({ message: 'Page must be greater than or equal to 1' });
  if (size < 1 || size > 20) return res.status(400).json({ message: 'Size must be between 1 and 20' });

  // Build filter conditions
  const filters = {};
  if (minLat) filters.lat = { [Op.gte]: minLat };
  if (maxLat) filters.lat = { ...filters.lat, [Op.lte]: maxLat };
  if (minLng) filters.lng = { [Op.gte]: minLng };
  if (maxLng) filters.lng = { ...filters.lng, [Op.lte]: maxLng };
  if (minPrice) filters.price = { [Op.gte]: minPrice };
  if (maxPrice) filters.price = { ...filters.price, [Op.lte]: maxPrice };

  try {
    const spots = await Spot.findAll({
      where: filters,
      limit: size,
      offset: (page - 1) * size,
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

    return res.status(200).json({ Spots: formattedSpots, page, size });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// Get Spots owned by current user (require authentication)
router.get('/session/spots', requireAuth, async (req, res) => {
  try {
    const spots = await Spot.findAll({
      where: { ownerId: req.user.id }  // Use authenticated user's ID
    });

    return res.json({ Spots: spots });
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve spots', error: error.message });
  }
});

// Get details of a Spot by id
router.get('/:spotId', async (req, res) => {
  const { spotId } = req.params;

  try {
    const spot = await Spot.findByPk(spotId, {
      include: [
        {
          model: Review,
          attributes: ['stars'],
        },
        {
          model: SpotImage,
        },
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    const avgStarRating =
      spot.Reviews.length
        ? spot.Reviews.reduce((sum, review) => sum + review.stars, 0) / spot.Reviews.length
        : null;

    const previewImage = spot.SpotImages.length
      ? spot.SpotImages.find(image => image.preview === true)?.url || null
      : null;

    const formattedSpot = {
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
      numReviews: spot.Reviews.length,
      avgStarRating,
      SpotImages: spot.SpotImages.map(image => ({
        id: image.id,
        url: image.url,
        preview: image.preview,
      })),
      Owner: {
        id: spot.User.id,
        firstName: spot.User.firstName,
        lastName: spot.User.lastName,
      },
      previewImage: previewImage || 'Default image URL or null',
    };

    return res.status(200).json(formattedSpot);
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// Create a Spot (requires authentication)
router.post('/', requireAuth, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } = req.body;

  // Validate input data
  const errors = {};

  if (!address) errors.address = 'Street address is required';
  if (!city) errors.city = 'City is required';
  if (!state) errors.state = 'State is required';
  if (!country) errors.country = 'Country is required';
  if (lat === undefined || lat < -90 || lat > 90) errors.lat = 'Latitude must be within -90 and 90';
  if (lng === undefined || lng < -180 || lng > 180) errors.lng = 'Longitude must be within -180 and 180';
  if (!name || name.length > 50) errors.name = 'Name must be less than 50 characters';
  if (!description) errors.description = 'Description is required';
  if (!price || price <= 0) errors.price = 'Price per day must be a positive number';

  // If validation errors exist, return them
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Validation Error', errors });
  }

  try {
    // Create the new spot
    const newSpot = await Spot.create({
      ownerId: req.user.id, // The authenticated user's ID
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price
    });

    // Include associated models in the response
    const spotWithDetails = await Spot.findByPk(newSpot.id, {
      include: [
        {
          model: Review,
          attributes: ['stars'],
        },
        {
          model: SpotImage,
          where: { preview: true },
          required: false,
        },
      ]
    });

    return res.status(201).json(spotWithDetails);
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});

// Add Image to a Spot
router.post('/:spotId/images', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { url, preview } = req.body;

  try {
    // Find the spot by id
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    // Check if the current user is the owner of the spot
    if (spot.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to add an image to this spot",
      });
    }

    // Create the new SpotImage
    const newImage = await SpotImage.create({
      spotId: spot.id,
      url,
      preview,
    });

    // Return the image data in the response
    return res.status(201).json({
      id: newImage.id,
      url: newImage.url,
      preview: newImage.preview,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// Delete a Spot (DELETE /api/spots/:spotId)
router.delete('/:spotId', requireAuth, async (req, res) => {
  const { spotId } = req.params;

  try {
    // Find the spot by id
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    // Check if the current user is the owner of the spot
    if (spot.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to delete this spot",
      });
    }

    // Delete the spot
    await spot.destroy();

    // Return success message
    return res.status(200).json({
      message: 'Successfully deleted',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// Delete a Spot Image
router.delete('/:spotId/images/:imageId', requireAuth, async (req, res) => {
  const { spotId, imageId } = req.params;

  try {
    // Find the spot by id
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    // Check if the current user is the owner of the spot
    if (spot.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "You do not have permission to delete this image",
      });
    }

    // Find the image by id
    const image = await SpotImage.findOne({ where: { id: imageId, spotId } });

    if (!image) {
      return res.status(404).json({
        message: "Spot Image couldn't be found for this spot",
      });
    }

    // Delete the image
    await image.destroy();

    // Return success message
    return res.status(200).json({
      message: "Successfully deleted",
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// Get all bookings for a Spot by Spot ID
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const userId = req.user.id;

  try {
    // Check if the spot exists
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found"
      });
    }

    // Check if the current user is the owner of the spot
    const isOwner = spot.ownerId === userId;

    let bookings;

    if (isOwner) {
      // Owner: Include user details
      bookings = await Booking.findAll({
        where: { spotId },
        include: {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }
      });
    } else {
      // Non-owner: Only show limited booking data
      bookings = await Booking.findAll({
        where: { spotId },
        attributes: ['spotId', 'startDate', 'endDate']
      });
    }

    return res.status(200).json({ Bookings: bookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

module.exports = router;
