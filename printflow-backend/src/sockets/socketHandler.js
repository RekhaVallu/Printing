const User = require('../models/User');

let ioInstance = null;
const userSockets = new Map(); // user room key -> Set(socketId)
const socketToUser = new Map(); // socketId -> user room keys

const ROLE_NOTIFICATION_CATEGORIES = {
  admin: ["orders", "priority", "printers", "users", "system"],
  operator: ["orders", "priority", "printers", "system"],
  student: ["orders", "priority", "system"],
  faculty: ["orders", "priority", "system"]
};

const normalizeList = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const notificationRoleRoom = (role) => `notifications:role:${role}`;
const notificationCategoryRoom = (category) => `notifications:category:${category}`;
const notificationRoleCategoryRoom = (role, category) => `notifications:role:${role}:category:${category}`;
const printerRoom = (printerId) => `notifications:printer:${printerId}`;

// Try to load Clerk server SDK if available
let clerkSdk = null;
try {
  clerkSdk = require('@clerk/clerk-sdk-node');
} catch (e) {
  console.warn('clerk sdk not installed, socket auth will be best-effort');
}

async function verifySocketToken(token) {
  if (!token || !clerkSdk?.verifyToken) return null;

  try {
    const verified = await clerkSdk.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      jwtKey: process.env.CLERK_JWT_KEY
    });

    return verified?.sub || verified?.subject || null;
  } catch (err) {
    console.warn('Clerk socket token verify failed', err.message || err);
    return null;
  }
}

function _safeJoinRoom(socket, room) {
  try { socket.join(room); } catch (e) { console.warn('join room failed', room, e.message || e); }
}

async function handleConnection(socket) {
  try {
    const auth = socket.handshake.auth || {};
    const token = auth.token;
    const clerkUserId = auth.clerkUserId || auth.clerkId || null;

    const verifiedClerkId = await verifySocketToken(token);
    const clerkId = verifiedClerkId || (!token ? clerkUserId : null);

    if (!clerkId) {
      // Disconnect unauthenticated sockets
      socket.emit('unauthorized', { message: 'Missing clerk credentials' });
      return socket.disconnect(true);
    }

    const roomKeys = new Set([clerkId]);
    _safeJoinRoom(socket, `user:${clerkId}`);

    // Lookup user role from DB (best-effort)
    let role = null;
    try {
      const user = await User.findOne({ clerkId }).populate('assignedPrinters');
      role = user ? user.role : null;
      if (user && user._id) {
        const dbUserId = user._id.toString();
        roomKeys.add(dbUserId);
        _safeJoinRoom(socket, `user:${dbUserId}`);

        const assignedPrinterIds = (user.assignedPrinters || []).map((printer) =>
          (printer._id || printer).toString()
        );
        assignedPrinterIds.forEach((printerId) => _safeJoinRoom(socket, printerRoom(printerId)));
      }
    } catch (err) {
      console.warn('user lookup failed during socket connect', err.message || err);
    }

    socketToUser.set(socket.id, Array.from(roomKeys));
    roomKeys.forEach((key) => {
      if (!userSockets.has(key)) userSockets.set(key, new Set());
      userSockets.get(key).add(socket.id);
    });

    if (role) {
      _safeJoinRoom(socket, `role:${role}`);
      _safeJoinRoom(socket, notificationRoleRoom(role));
      (ROLE_NOTIFICATION_CATEGORIES[role] || ["system"]).forEach((category) => {
        _safeJoinRoom(socket, notificationCategoryRoom(category));
        _safeJoinRoom(socket, notificationRoleCategoryRoom(role, category));
      });
    }

    socket.emit('connected', { clerkId, role });

    socket.on('join_user_room', () => {
      _safeJoinRoom(socket, `user:${clerkId}`);
      roomKeys.forEach((key) => _safeJoinRoom(socket, `user:${key}`));
    });

    socket.on('disconnect', () => {
      const keys = socketToUser.get(socket.id);
      if (keys) {
        keys.forEach((key) => {
          const set = userSockets.get(key);
          if (set) {
            set.delete(socket.id);
            if (set.size === 0) userSockets.delete(key);
          }
        });
        socketToUser.delete(socket.id);
      }
    });

  } catch (e) {
    console.warn('socket connect handler error', e.message || e);
  }
}

function init(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    handleConnection(socket);
  });
}

function emitToUser(clerkId, event, payload) {
  if (!ioInstance) return;
  try { ioInstance.to(`user:${clerkId}`).emit(event, payload); } catch (e) { console.warn('emitToUser failed', e.message || e); }
}

function emitToRole(role, event, payload) {
  if (!ioInstance) return;
  try { ioInstance.to(`role:${role}`).emit(event, payload); } catch (e) { console.warn('emitToRole failed', e.message || e); }
}

function emitToAll(event, payload) {
  if (!ioInstance) return;
  try { ioInstance.emit(event, payload); } catch (e) { console.warn('emitToAll failed', e.message || e); }
}

function emitNotification({ userIds = [], roles = [], category = 'system', printerIds = [], event = 'notification_created', payload = {} }) {
  if (!ioInstance) return;

  try {
    const target = ioInstance;
    const rooms = new Set();

    normalizeList(userIds).forEach((userId) => rooms.add(`user:${userId}`));
    normalizeList(roles).forEach((role) => {
      rooms.add(notificationRoleRoom(role));
      rooms.add(notificationRoleCategoryRoom(role, category));
    });
    normalizeList(printerIds).forEach((printerId) => rooms.add(printerRoom(printerId)));

    if (rooms.size === 0) return;

    let roomTarget = target;
    rooms.forEach((room) => {
      roomTarget = roomTarget.to(room);
    });

    roomTarget.emit(event, {
      ...payload,
      meta: {
        ...(payload.meta || {}),
        category
      }
    });
  } catch (e) {
    console.warn('emitNotification failed', e.message || e);
  }
}

module.exports = {
  init,
  emitToUser,
  emitToRole,
  emitToAll,
  emitNotification,
  ROLE_NOTIFICATION_CATEGORIES,
  _internal: { userSockets, socketToUser }
};
