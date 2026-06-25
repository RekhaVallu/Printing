const Printer = require("../models/Printer");
const Order = require("../models/Order");

// Cost Calculation
const calculateCost = (
    pages,
    copies,
    printerType,
    priorityLevel
) => {

    let rate =
        printerType === "color"
            ? 5
            : 2;

    let cost =
        pages *
        copies *
        rate;

    if (
        priorityLevel === "priority"
    ) {

        cost =
            cost * 1.5;

    }

    return Math.ceil(cost);

};

// Recommendation Engine
const getPrinterRecommendations =
    async (
        pages,
        copies,
        priorityLevel
    ) => {

        const printers =
            await Printer.find({
                status: "online"
            });

        const recommendations = [];

        for (
            const printer of printers
        ) {

            const queueCount =
                await Order.countDocuments({
                    printerId:
                        printer._id,
                    status: {
                        $in: [
                            "pending",
                            "accepted",
                            "printing"
                        ]
                    }
                });

            const eta =
                Math.ceil(
                    queueCount /
                    printer.pagesPerMinute
                );

            const cost =
                calculateCost(
                    pages,
                    copies,
                    printer.printerType,
                    priorityLevel
                );

            recommendations.push({

                printerId:
                    printer._id,

                printerName:
                    printer.name,

                location:
                    printer.location,

                eta,

                queueLength:
                    queueCount,

                estimatedCost:
                    cost

            });

        }

        recommendations.sort(
            (a, b) =>
                a.eta - b.eta
        );

        return recommendations;

    };

module.exports = {
    calculateCost,
    getPrinterRecommendations
};