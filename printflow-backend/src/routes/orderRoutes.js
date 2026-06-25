const express = require("express");

const router = express.Router();
const loadUser =
    require("../middleware/loadUser");

const { requireAuth } =
    require("@clerk/express");

const allowRoles =
    require("../middleware/roleMiddleware");

const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    confirmCollection,
    cancelOrder,
    requestPriority,
    getPendingPriorityRequests,
    approvePriority,
    rejectPriority
} = require("../controllers/orderController");

// =====================================
// USER ROUTES
// =====================================

// Create Order
router.post(
    "/",
    requireAuth(),
    loadUser,
    createOrder
);

// Get All Orders
router.get(
    "/",
    requireAuth(),
    loadUser,
    getOrders
);

// =====================================
// OPERATOR / ADMIN ROUTES
// =====================================

// View Pending Priority Requests
router.get(
    "/priority/pending",
    requireAuth(),
    allowRoles(
        "operator",
        "admin"
    ),
    getPendingPriorityRequests
);

// Approve Priority
router.patch(
    "/:id/approve-priority",
    requireAuth(),
    allowRoles(
        "operator",
        "admin"
    ),
    approvePriority
);

// Reject Priority
router.patch(
    "/:id/reject-priority",
    requireAuth(),
    allowRoles(
        "operator",
        "admin"
    ),
    rejectPriority
);

// Update Order Status
router.patch(
    "/:id/status",
    requireAuth(),
    allowRoles(
        "operator",
        "admin"
    ),
    updateOrderStatus
);

// Confirm collection with user OTP
router.patch(
    "/:id/confirm-collection",
    requireAuth(),
    loadUser,
    confirmCollection
);

// Get Single Order
router.get(
    "/:id",
    requireAuth(),
    loadUser,
    getOrderById
);

// Request Priority
router.patch(
    "/:id/request-priority",
    requireAuth(),
    loadUser,
    requestPriority
);

// Cancel Order
router.patch(
    "/:id/cancel",
    requireAuth(),
    loadUser,
    cancelOrder
);

module.exports = router;
