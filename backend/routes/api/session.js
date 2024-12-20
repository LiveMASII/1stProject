const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');
const router = express.Router();

const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Please provide a valid email or username.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a password.'),
  handleValidationErrors,
];

router.post('/', validateLogin, async (req, res, next) => {
  const { credential, password } = req.body;

  // Fetch user, unscoped to include all fields
  const user = await User.unscoped().findOne({
    where: {
      [Op.or]: {
        username: credential,
        email: credential,
      },
    },
  });

  if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
    const err = new Error('Login failed');
    err.status = 401;
    err.title = 'Login failed';
    err.errors = { credential: 'The provided credentials were invalid.' };
    return next(err);
  }

  // Include `firstName` and `lastName` in the safeUser object
  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName, // Assuming this exists in the database
    lastName: user.lastName,  // Assuming this exists in the database
  };

  // Set the token cookie
  await setTokenCookie(res, safeUser);

  return res.json({
    user: safeUser, // Include updated safeUser with firstName and lastName
  });
});

router.delete('/', (_req, res) => {
  res.clearCookie('token');  
  return res.json({ message: 'success' });
});

router.get('/', restoreUser, (req, res) => {
  const { user } = req;

  if (user) {
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName, 
      lastName: user.lastName,  
    };

    return res.json({ user: safeUser });
  }

  return res.json({ user: null });
});

module.exports = router;