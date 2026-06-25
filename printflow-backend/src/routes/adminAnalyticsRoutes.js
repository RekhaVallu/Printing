const express =
    require("express");

const router =
    express.Router();

const {
    requireAuth
} = require("@clerk/express");

const allowRoles =
    require("../middleware/roleMiddleware");

const {
    getDashboardStats,
    getPrinterStats,
    getMonthlyTrends,
    getTopUsers
} = require(
    "../controllers/adminAnalyticsController"
);

router.get(
    "/dashboard",
    requireAuth(),
    allowRoles(
        "admin"
    ),
    getDashboardStats
);

router.get(
    "/printers",
    requireAuth(),
    allowRoles(
        "admin"
    ),
    getPrinterStats
);

router.get(
    "/monthly-trends",
    requireAuth(),
    allowRoles(
        "admin"
    ),
    getMonthlyTrends
);

router.get(
    "/top-users",
    requireAuth(),
    allowRoles(
        "admin"
    ),
    getTopUsers
);

module.exports = router;
