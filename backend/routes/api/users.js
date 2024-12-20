const express = require('express');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');
const { Op } = require('sequelize'); // For searching in the database
const router = express.Router();

// Validation rules for sign-up
const validateSignup = [
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage('First Name is required'),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage('Last Name is required'),
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .exists({ checkFalsy: true })
    .withMessage('Email is required'),
  check('username')
    .exists({ checkFalsy: true })
    .withMessage('Username is required')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.')
    .isLength({ min: 4 })
    .withMessage('Username must be at least 4 characters long.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors,
];

// POST request to create a new user
router.post('/', validateSignup, async (req, res, next) => {
  const { firstName, lastName, email, username, password } = req.body;

  try {
    // Check if a user already exists with the provided email or username
    const existingUser = await User.findOne({
      where: {
        [Op.or]: { email, username },
      },
    });

    if (existingUser) {
      const err = new Error('User already exists');
      err.status = 500;
      err.message = 'User already exists';
      err.errors = {
        email: existingUser.email === email ? 'User with that email already exists' : undefined,
        username: existingUser.username === username ? 'User with that username already exists' : undefined,
      };
      return next(err);
    }

    // Hash the password before storing it
    const hashedPassword = bcrypt.hashSync(password);

    // Create a new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      username,
      hashedPassword,
    });

    // Safely format the user data to send in the response
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    // Set the token cookie for authentication
    await setTokenCookie(res, safeUser);

    // Return the user information in the response
    return res.status(201).json({
      user: safeUser,
    });
  } catch (error) {
    next(error); // Handle any errors
  }
});

// Route to get current user's information (for testing or any further use)
router.get('/current-user', restoreUser, async (req, res) => {
  const { user } = req;

  if (user) {
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  }

  return res.status(200).json({
    user: null,
  });
});

module.exports = router;
