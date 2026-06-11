const express = require('express');
const Notification = require('../movies/notif.model');

const router = express.Router();

// Helper function to get admin credentials
function getAdminCredentials(req) {
  return {
    accessToken: req.query.accessToken,
    adminPass: req.query.adminPass
  };
}

// Helper function to check admin authentication
function ensureAdmin(req, res, next) {
  const { adminPass } = getAdminCredentials(req);
  const expectedPass = process.env.ADMIN_PASS;

  if (!expectedPass) {
    return res.status(500).json({ error: 'Server missing ADMIN_PASS configuration' });
  }

  if (!adminPass || adminPass !== expectedPass) {
    return res.status(401).json({ error: 'Unauthorized admin access' });
  }

  next();
}

// GET /notifs - Get all notifications (for frontend)
router.get('/', async (req, res, next) => {
  try {
    const auth_query = req.query.accessToken;
    const expectedToken = process.env.ACCESS_TOKEN;

    if (expectedToken && auth_query !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const notifications = await Notification.find().sort({ createdAt: -1 }).lean();
    return res.json({
      ok: true,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
});

// POST /notifs/add - Add notification (admin only)
router.post('/add', ensureAdmin, async (req, res, next) => {
  try {
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const notification = new Notification({
      title,
      description
    });

    await notification.save();
    return res.json({
      ok: true,
      message: 'Notification added successfully.',
      data: notification
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid notification data.' });
    }
    next(err);
  }
});

module.exports = router;
