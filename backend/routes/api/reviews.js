const express = require('express');
const { Review, Spot, User, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth'); // Assuming you have a requireAuth middleware for authentication
const router = express.Router();

// GET route to get all reviews for a specific spot
router.get('/:spotId/reviews', async (req, res) => {
  const { spotId } = req.params;
  try {
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found"
      });
    }

    const reviews = await Review.findAll({
      where: { spotId },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: ReviewImage,
          attributes: ['id', 'url']
        }
      ]
    });

    return res.status(200).json({ Reviews: reviews });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// POST route to create a review for a spot
router.post('/:spotId/reviews', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { review, stars } = req.body;

  if (!review) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: { review: 'Review text is required' }
    });
  }

  if (typeof stars !== 'number' || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: { stars: 'Stars must be an integer from 1 to 5' }
    });
  }

  try {
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found"
      });
    }

    const existingReview = await Review.findOne({
      where: { spotId, userId: req.user.id }
    });

    if (existingReview) {
      return res.status(500).json({
        message: 'User already has a review for this spot',
      });
    }

    const newReview = await Review.create({
      userId: req.user.id,
      spotId,
      review,
      stars,
    });

    return res.status(201).json({
      id: newReview.id,
      userId: newReview.userId,
      spotId: newReview.spotId,
      review: newReview.review,
      stars: newReview.stars,
      createdAt: newReview.createdAt,
      updatedAt: newReview.updatedAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// POST route to add an image to a review
router.post('/:reviewId/images', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: { url: 'Image URL is required' }
    });
  }

  try {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        message: "Review couldn't be found"
      });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({
        message: 'You are not authorized to add an image to this review',
      });
    }

    const reviewImagesCount = await ReviewImage.count({
      where: { reviewId },
    });

    if (reviewImagesCount >= 10) {
      return res.status(403).json({
        message: 'Maximum number of images for this resource was reached',
      });
    }

    const newImage = await ReviewImage.create({
      reviewId,
      url,
    });

    return res.status(201).json({
      id: newImage.id,
      url: newImage.url,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// PUT route to edit a review by ID
router.put('/:reviewId', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { review, stars } = req.body;
  const userId = req.user.id;

  if (!review) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: { review: 'Review text is required' }
    });
  }

  if (typeof stars !== 'number' || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: { stars: 'Stars must be an integer from 1 to 5' }
    });
  }

  try {
    const existingReview = await Review.findByPk(reviewId);
    if (!existingReview) {
      return res.status(404).json({
        message: "Review couldn't be found",
      });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({
        message: 'Forbidden: You do not have permission to edit this review',
      });
    }

    existingReview.review = review;
    existingReview.stars = stars;
    await existingReview.save();

    return res.status(200).json(existingReview);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

// DELETE route to delete a review by ID
router.delete('/:reviewId', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        message: "Review couldn't be found"
      });
    }

    if (review.userId !== userId) {
      return res.status(403).json({
        message: 'Forbidden: You do not have permission to delete this review',
      });
    }

    await review.destroy();
    return res.status(200).json({
      message: 'Successfully deleted',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

module.exports = router;
