const { listNotifications, Notification } = require('../services/notificationService');
const User = require('../models/User');

const list = async (req, res) => {
  try {
    const notifs = await listNotifications(req.user._id);
    res.status(200).json({ success: true, count: notifs.length, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
    const notifs = await listNotifications(req.user._id);
    res.status(200).json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.status(200).json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    if (n.userId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
    n.isRead = true;
    await n.save();
    res.status(200).json({ success: true, data: n });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const broadcastNotification = async (req, res) => {
  try {
    const { title, message, meta = {} } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const users = await User.find().select('_id');
    const docs = users.map((user) => ({
      userId: user._id,
      title,
      message,
      meta: {
        ...meta,
        broadcast: true,
        sentBy: req.user._id
      }
    }));

    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }

    try {
      const socketManager = require('../sockets/socketHandler');
      socketManager.emitToAll('notification_created', {
        id: `broadcast_${Date.now()}`,
        title,
        message,
        meta: { ...meta, broadcast: true },
        createdAt: new Date()
      });
    } catch (e) {
      console.warn('broadcast socket emit failed', e.message || e);
    }

    res.status(201).json({ success: true, count: docs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listNotifications: list, markAsRead, markAllAsRead, clearAllNotifications, broadcastNotification };
