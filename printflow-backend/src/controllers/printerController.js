// Create Printer

// Get Printers

// Update Printer

// Delete Printer
const Printer = require("../models/Printer");
const User = require("../models/User");

// Create Printer
const createPrinter = async (req, res) => {
    try {
        const printer = await Printer.create(req.body);
        if (printer.operatorId) {
            await User.findByIdAndUpdate(printer.operatorId, {
                $addToSet: { assignedPrinters: printer._id },
                role: "operator"
            });
        }

        res.status(201).json({
            success: true,
            data: printer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Printers
const getPrinters = async (req, res) => {
    try {
        const printers = await Printer.find().populate("operatorId");

        res.status(200).json({
            success: true,
            count: printers.length,
            data: printers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Single Printer
const getPrinterById = async (req, res) => {
    try {
        const printer = await Printer.findById(req.params.id).populate("operatorId");

        if (!printer) {
            return res.status(404).json({
                success: false,
                message: "Printer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: printer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Printer
const updatePrinter = async (req, res) => {
    try {
        const previous = await Printer.findById(req.params.id);
        const updatePayload = { ...req.body };
        const shouldUnsetOperator =
            updatePayload.operatorId === "" ||
            updatePayload.operatorId === null;

        if (shouldUnsetOperator) {
            delete updatePayload.operatorId;
        }

        const printer = await Printer.findByIdAndUpdate(
            req.params.id,
            shouldUnsetOperator
                ? { ...updatePayload, $unset: { operatorId: "" } }
                : updatePayload,
            {
                new: true,
                runValidators: true
            }
        );

        if (!printer) {
            return res.status(404).json({
                success: false,
                message: "Printer not found"
            });
        }

        if (previous?.operatorId?.toString() !== printer.operatorId?.toString()) {
            if (previous?.operatorId) {
                await User.findByIdAndUpdate(previous.operatorId, {
                    $pull: { assignedPrinters: printer._id }
                });
            }
            if (printer.operatorId) {
                await User.findByIdAndUpdate(printer.operatorId, {
                    $addToSet: { assignedPrinters: printer._id },
                    role: "operator"
                });
            }
        }

        res.status(200).json({
            success: true,
            data: printer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Printer
const deletePrinter = async (req, res) => {
    try {
        const printer = await Printer.findByIdAndDelete(
            req.params.id
        );

        if (!printer) {
            return res.status(404).json({
                success: false,
                message: "Printer not found"
            });
        }

        if (printer.operatorId) {
            await User.findByIdAndUpdate(printer.operatorId, {
                $pull: { assignedPrinters: printer._id }
            });
        }

        res.status(200).json({
            success: true,
            message: "Printer deleted"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const {
    getPrinterRecommendations
} = require(
    "../services/recommendationService"
);

const getRecommendations =
    async (req, res) => {

        try {

            const {
                pages,
                copies,
                priorityLevel
            } = req.query;

            const recommendations =
                await getPrinterRecommendations(
                    Number(pages),
                    Number(copies),
                    priorityLevel
                );

            res.status(200).json({
                success: true,
                data:
                    recommendations
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    };

module.exports = {
    createPrinter,
    getPrinters,
    getPrinterById,
    updatePrinter,
    deletePrinter,
    getRecommendations
};
