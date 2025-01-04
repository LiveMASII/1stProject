const express = require('express');
const { Booking, Spot, User } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const router = express.Router();
const { Op } = require('sequelize');

router.get('/session/bookings', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const bookings = await Booking.findAll({
      where: { userId },
      include: {
        model: Spot,
        attributes: [
          'id', 'ownerId', 'address', 'city', 'state',
          'country', 'lat', 'lng', 'name', 'price'
        ]
      }
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      spotId: booking.spotId,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      Spot: {
        id: booking.Spot.id,
        ownerId: booking.Spot.ownerId,
        address: booking.Spot.address,
        city: booking.Spot.city,
        state: booking.Spot.state,
        country: booking.Spot.country,
        lat: booking.Spot.lat,
        lng: booking.Spot.lng,
        name: booking.Spot.name,
        price: booking.Spot.price,
        previewImage: 'image url'
      }
    }));

    return res.status(200).json({ Bookings: formattedBookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

router.post('/:spotId', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { startDate, endDate } = req.body;
  const userId = req.user.id;

  try {
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    if (spot.ownerId === userId) {
      return res.status(400).json({
        message: "You can't book your own spot",
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        message: 'Start date must be before end date',
      });
    }

    const booking = await Booking.create({
      spotId,
      userId,
      startDate,
      endDate,
    });

    return res.status(201).json({
      id: booking.id,
      spotId: booking.spotId,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const userId = req.user.id;

  try {
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    if (spot.ownerId === userId) {
      const bookings = await Booking.findAll({
        where: { spotId },
        include: {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
      });

      return res.status(200).json({
        Bookings: bookings.map(booking => ({
          id: booking.id,
          spotId: booking.spotId,
          userId: booking.userId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          User: {
            id: booking.User.id,
            firstName: booking.User.firstName,
            lastName: booking.User.lastName,
          },
        })),
      });
    } else {
      const bookings = await Booking.findAll({
        where: { spotId },
        attributes: ['startDate', 'endDate'],
      });

      return res.status(200).json({
        Bookings: bookings.map(booking => ({
          spotId: booking.spotId,
          startDate: booking.startDate,
          endDate: booking.endDate,
        })),
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
});

router.put('/:bookingId', requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const { startDate, endDate } = req.body;
  const userId = req.user.id;

  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking couldn't be found"
      });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({
        message: "You do not have permission to edit this booking"
      });
    }

    const currentDate = new Date();
    if (new Date(startDate) < currentDate) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          startDate: "startDate cannot be in the past"
        }
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          endDate: "endDate cannot be on or before startDate"
        }
      });
    }

    const conflictingBooking = await Booking.findOne({
      where: {
        spotId: booking.spotId,
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] }
          },
          {
            endDate: { [Op.between]: [startDate, endDate] }
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(403).json({
        message: "Sorry, this spot is already booked for the specified dates",
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking"
        }
      });
    }

    const today = new Date();
    if (new Date(booking.endDate) < today) {
      return res.status(403).json({
        message: "Past bookings can't be modified"
      });
    }

    booking.startDate = startDate;
    booking.endDate = endDate;
    await booking.save();

    return res.status(200).json({
      id: booking.id,
      spotId: booking.spotId,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

router.delete('/:bookingId', requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking couldn't be found"
      });
    }

    if (booking.userId !== userId && booking.Spot.ownerId !== userId) {
      return res.status(403).json({
        message: "You do not have permission to delete this booking"
      });
    }

    const today = new Date();
    if (new Date(booking.startDate) <= today) {
      return res.status(403).json({
        message: "Bookings that have been started can't be deleted"
      });
    }

    await booking.destroy();

    return res.status(200).json({
      message: "Successfully deleted"
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

module.exports = router;
