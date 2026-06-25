// POST / api / printers

// GET / api / printers

// PATCH / api / printers /: id

// DELETE / api / printers /: id
const express = require("express");

const router = express.Router();

const { requireAuth } =
    require("@clerk/express");

const allowRoles =
    require("../middleware/roleMiddleware");

const loadUser =
    require("../middleware/loadUser");

const {
    createPrinter,
    getPrinters,
    getPrinterById,
    updatePrinter,
    deletePrinter,
    getRecommendations
} = require("../controllers/printerController");

// Create Printer
router.post(
    "/",
    requireAuth(),
    loadUser,
    allowRoles("admin"),
    createPrinter
);

// Recommendations
router.get(
    "/recommendations",
    getRecommendations
);

// Get All Printers
router.get(
    "/",
    getPrinters
);

// Get Single Printer
router.get(
    "/:id",
    getPrinterById
);

// Update Printer
router.patch(
    "/:id",
    requireAuth(),
    loadUser,
    allowRoles("admin"),
    updatePrinter
);

// Delete Printer
router.delete(
    "/:id",
    requireAuth(),
    loadUser,
    allowRoles("admin"),
    deletePrinter
);

module.exports = router;