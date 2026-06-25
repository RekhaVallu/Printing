const express = require("express");
const { requireAuth } = require("@clerk/express");
const { getClerkUserId } = require("../utils/getClerkAuth");

const router = express.Router();

router.get(
    "/me",
    requireAuth(),
    async (req, res) => {

        res.status(200).json({
            success: true,
            clerkId: getClerkUserId(req)
        });

    }
);

module.exports = router;
