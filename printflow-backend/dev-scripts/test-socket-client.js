const io = require('socket.io-client');

const url = process.env.SERVER_URL || 'http://localhost:5000';
const clerkId = process.env.TEST_CLERK_ID || 'test-user-1';

console.log('Connecting to', url, 'as', clerkId);

const socket = io(url, {
  auth: { clerkUserId: clerkId },
  transports: ['websocket']
});

socket.on('connect', () => console.log('connected', socket.id));
socket.on('connected', (d) => console.log('server connected event', d));
socket.on('notification_created', (n) => console.log('notif', n));
socket.on('order_created', (o) => console.log('order', o));
socket.on('order_ready', (o) => console.log('order_ready', o));
socket.on('priority_approved', (o) => console.log('priority_approved', o));
socket.on('disconnect', (reason) => console.log('disconnected', reason));

setTimeout(()=>{ console.log('listening...'); }, 1000);
