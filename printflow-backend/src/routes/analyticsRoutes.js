const express =
    require("express");

const router =
    express.Router();

const {
    requireAuth
} = require("@clerk/express");

const loadUser =
    require("../middleware/loadUser");
const { getClerkUserId } =
    require("../utils/getClerkAuth");

const {
    getMyStats,
    getMyHistory,
    getFavoritePrinter
} = require(
    "../controllers/analyticsController"
);
router.get("/debug", (req, res) => {
    res.json({
        route: "debug reached"
    });
});
// router.get(
//     "/my-stats",
//     requireAuth(),
//     loadUser,
//     getMyStats
// );
router.get(
    "/my-stats",
    requireAuth(),
    (req, res) => {

        res.json({
            success: true,
            clerkId:
                getClerkUserId(req)
        });

    }
);

router.get(
    "/history",
    requireAuth(),
    loadUser,
    getMyHistory
);

router.get(
    "/favorite-printer",
    requireAuth(),
    loadUser,
    getFavoritePrinter
);
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Analytics route works"
    });
});

module.exports = router;
