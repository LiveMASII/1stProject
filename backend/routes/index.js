const express = require('express');
const router = express.Router();
const apiRouter = require('./api');  // This is where the main API routes should go.
const spotsRouter = require('./api/spots');  // This should handle the /spots routes specifically.

router.get('/hello/world', function (req, res) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.send('Hello World!');
});

router.get('/api/csrf/restore', (req, res) => {
  const csrfToken = req.csrfToken();
  res.cookie('XSRF-TOKEN', csrfToken);
  res.status(200).json({
    'XSRF-Token': csrfToken,
  });
});

router.use('/api', apiRouter);

router.use('/api/spots', spotsRouter);

module.exports = router;
