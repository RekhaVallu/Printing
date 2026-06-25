const mongoose = require("mongoose");

const notificationSchema =
    new mongoose.Schema({

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        meta: {
            type: Object,
            default: {}
        },

        isRead: {
            type: Boolean,
            default: false
        }

    }, {
        timestamps: true
    });

const Notification = mongoose.model("Notification", notificationSchema);

// Create a notification and emit via socket manager
async function createNotification(userId, title, message, meta = {}) {
    const n = await Notification.create({ userId, title, message, meta });
    try {
        const socketManager = require('../sockets/socketHandler');
        socketManager.emitToUser(userId.toString(), 'notification_created', { id: n._id, title, message, meta, createdAt: n.createdAt });
    } catch (err) {
        console.warn('Socket emit failed', err.message || err);
    }
    return n;
}

async function listNotifications(userId, limit = 50, skip = 0) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

module.exports = {
    createNotification,
    listNotifications,
    Notification
};