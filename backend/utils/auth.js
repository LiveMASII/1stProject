const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config');
const { User } = require('../db/models');
const csrf = require('csurf'); // Ensure this is required only once at the top

const { secret, expiresIn } = jwtConfig;

// Updated setTokenCookie function with debugging
const setTokenCookie = (res, user) => {
    // Create a safe user object to store in the token
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    // Generate the JWT token
    const token = jwt.sign(
      { data: safeUser },
      secret,
      { expiresIn: parseInt(expiresIn) }
    );

    // Log the generated JWT token for debugging purposes
    console.log("Generated JWT Token:", token);

    const isProduction = process.env.NODE_ENV === "production";

    // Set the token cookie in the response
    res.cookie('token', token, {
      maxAge: expiresIn * 1000, // Set cookie expiration time
      httpOnly: true,  // Make sure cookie is not accessible via JavaScript
      secure: isProduction,  // Use only in HTTPS for production
      sameSite: isProduction && "Lax"  // Prevent cross-site issues in production
    });

    // Now set CSRF token in a separate cookie (optional)
    const csrfToken = csrf();  // This generates a CSRF token
    res.cookie('XSRF-TOKEN', csrfToken, {
      maxAge: expiresIn * 1000,  // Same expiration as JWT
      httpOnly: false,  // This allows the frontend to access it
      secure: isProduction,  // Use only in HTTPS for production
      sameSite: isProduction && "Lax"  // Prevent cross-site issues in production
    });

    // Return the token
    return token;
};

// Restore user from the token
const restoreUser = (req, res, next) => {
    const { token } = req.cookies;
    req.user = null;

    return jwt.verify(token, secret, null, async (err, jwtPayload) => {
      if (err) {
        return next();
      }

      try {
        const { id } = jwtPayload.data;
        req.user = await User.findByPk(id, {
          attributes: {
            include: ['email', 'createdAt', 'updatedAt']
          }
        });
      } catch (e) {
        res.clearCookie('token');
        return next();
      }

      if (!req.user) res.clearCookie('token');

      return next();
    });
};

// Ensure user is authenticated for certain routes
const requireAuth = function (req, _res, next) {
    if (req.user) return next();

    const err = new Error('Authentication required');
    err.title = 'Authentication required';
    err.errors = { message: 'Authentication required' };
    err.status = 401;
    return next(err);
};

module.exports = { setTokenCookie, restoreUser, requireAuth };
