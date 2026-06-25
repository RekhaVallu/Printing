const Order = require("../models/Order");
const Printer = require("../models/Printer");

// =====================================
// QUEUE POSITION FOR NEW ORDER
// =====================================

const calculateQueuePosition = async (
    printerId
) => {

    const activeOrders =
        await Order.countDocuments({
            printerId,
            status: {
                $in: [
                    "pending",
                    "accepted",
                    "printing"
                ]
            }
        });

    return activeOrders + 1;

};

// =====================================
// ETA FOR NEW ORDER
// =====================================

const calculateETA = async (
    printerId
) => {

    const printer =
        await Printer.findById(
            printerId
        );

    if (!printer) {
        return 0;
    }

    const orders =
        await Order.find({
            printerId,
            status: {
                $in: [
                    "pending",
                    "accepted",
                    "printing"
                ]
            }
        });

    let totalPagesAhead = 0;

    orders.forEach(order => {

        totalPagesAhead +=
            order.totalPages *
            order.copies;

    });

    return Math.ceil(
        totalPagesAhead /
        printer.pagesPerMinute
    );

};

// =====================================
// RECALCULATE QUEUE
// =====================================

const recalculateQueue = async (
    printerId
) => {

    const orders =
        await Order.find({
            printerId,
            status: {
                $in: [
                    "pending",
                    "accepted",
                    "printing"
                ]
            }
        })
            .sort({
                priorityScore: -1,
                createdAt: 1
            });

    for (
        let i = 0;
        i < orders.length;
        i++
    ) {

        orders[i].queuePosition =
            i + 1;

        await orders[i].save();

    }

};

// =====================================
// RECALCULATE ETA
// =====================================

const recalculateETA = async (
    printerId
) => {

    const printer =
        await Printer.findById(
            printerId
        );

    if (!printer) {
        return;
    }

    const orders =
        await Order.find({
            printerId,
            status: {
                $in: [
                    "pending",
                    "accepted",
                    "printing"
                ]
            }
        })
            .sort({
                queuePosition: 1
            });

    let pagesAhead = 0;

    for (const order of orders) {
        order.eta =
            Math.ceil(
                pagesAhead /
                printer.pagesPerMinute
            ) + 1;

        pagesAhead +=
            order.totalPages *
            order.copies;

        await order.save();

    }

};

// =====================================
// EXPORTED FUNCTIONS
// =====================================

module.exports = {

    calculateQueuePosition,

    calculateETA,

    recalculateQueue,

    recalculateETA

};