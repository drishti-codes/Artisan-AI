// GET /api/health - quick check that the server and database are working.
const express = require('express');
const mongoose = require('mongoose');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

router.get('/', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return sendSuccess(
    res,
    {
      status: 'ok',
      database: states[mongoose.connection.readyState] || 'unknown',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    'ArtisanAI backend is running'
  );
});

module.exports = router;
