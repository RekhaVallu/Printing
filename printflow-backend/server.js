require("dotenv").config();

const { clerkMiddleware } = require("@clerk/express");

const express = require("express");
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const connectDB = require("./src/config/db");
const printerRoutes = require("./src/routes/printerRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const adminAnalyticsRoutes = require("./src/routes/adminAnalyticsRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");

// Connect Database
connectDB();

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "*",
    credentials: true
}));

app.use(express.json());

app.use(clerkMiddleware());

app.use("/api/printers", printerRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/admin-analytics", adminAnalyticsRoutes);

app.use("/api/upload", uploadRoutes);

const notificationRoutes = require('./src/routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const auditRoutes = require('./src/routes/auditRoutes');
app.use('/api/audits', auditRoutes);

// Dev-only emit route (requires DEV_SECRET)
if (process.env.DEV_SECRET) {
    const devRoutes = require('./src/routes/devRoutes');
    app.use('/api/dev', devRoutes);
}

app.get("/", (req, res) => { res.send("PrintFlow Backend Running 🚀"); });

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

// Initialize socket handler (centralized manager)
try {
    const socketHandler = require('./src/sockets/socketHandler');
    socketHandler.init(io);
} catch (e) {
    console.warn('Socket handler init failed', e);
}

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
