const express = require('express');
const router = express.Router();

// Simple dev-only emit endpoint. Protect with DEV_SECRET env var.
router.post('/emit', (req, res) => {
  const secret = process.env.DEV_SECRET;
  const provided = req.headers['x-dev-secret'] || req.body.secret;
  if (!secret || provided !== secret) return res.status(403).json({ success: false, message: 'Forbidden' });

  const { type, target, payload } = req.body;
  try {
    const socketManager = require('../sockets/socketHandler');
    if (type === 'user') {
      socketManager.emitToUser(target, payload.event || 'dev_event', payload.data || {});
    } else if (type === 'role') {
      socketManager.emitToRole(target, payload.event || 'dev_event', payload.data || {});
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    console.warn('dev emit failed', e.message || e);
    return res.status(500).json({ success: false, message: 'emit failed' });
  }
});

module.exports = router;
