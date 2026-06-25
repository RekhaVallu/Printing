const express = require("express");

const router = express.Router();

const { requireAuth } =
    require("@clerk/express");

const allowRoles =
    require("../middleware/roleMiddleware");

const loadUser =
    require("../middleware/loadUser");

const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    syncUser,
    changeUserRole,
    updateAssignedPrinters
} = require("../controllers/userController");

// =====================================
// CLERK USER SYNC
// =====================================

router.post(
    "/sync",
    requireAuth(),
    syncUser
);

// =====================================
// ADMIN ROUTES
// =====================================

router.get(
    "/",
    requireAuth(),
    allowRoles("admin"),
    getUsers
);

router.patch(
    "/:id/role",
    requireAuth(),
    allowRoles("admin"),
    changeUserRole
);

router.patch(
    "/:id/assigned-printers",
    requireAuth(),
    allowRoles("admin"),
    updateAssignedPrinters
);

router.get(
    "/:id",
    requireAuth(),
    loadUser,
    getUserById
);

router.patch(
    "/:id",
    requireAuth(),
    loadUser,
    updateUser
);

module.exports = router;
