const Order = require("../models/Order");
const Printer = require("../models/Printer");
const User = require("../models/User");

const {
    calculateQueuePosition,
    calculateETA,
    recalculateQueue,
    recalculateETA
} = require("../services/queueService");

const {
    calculateCost
} = require("../services/recommendationService");


const {
    createNotification
} = require(
    "../services/notificationService"
);

const getOperatorPrinterIds = async (operator) => {
    const assigned = (operator.assignedPrinters || []).map((id) => id.toString());
    const managed = await Printer.find({ operatorId: operator._id }).distinct("_id");
    return Array.from(new Set([...assigned, ...managed.map((id) => id.toString())]));
};

const canManageOrder = async (user, order) => {
    if (user.role === "admin") return true;
    if (user.role !== "operator") return false;
    const printerIds = await getOperatorPrinterIds(user);
    const orderPrinterId = order.printerId?._id
        ? order.printerId._id.toString()
        : order.printerId?.toString();
    if (!orderPrinterId) return false;
    return printerIds.includes(orderPrinterId);
};

const getOrderUserId = (order) => {
    return order.userId?._id
        ? order.userId._id.toString()
        : order.userId.toString();
};

const getUserLabel = (user) => user?.name || user?.email || "A user";

const getPrinterLabel = (printer) => printer?.name || "a printer";

const notifyAdmins = async (title, message, meta = {}) => {
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
        admins.map((admin) =>
            createNotification(admin._id, title, message, {
                ...meta,
                targetRole: "admin"
            })
        )
    );
};

const notifyAssignedOperator = async (printer, title, message, meta = {}) => {
    if (!printer?.operatorId) return;

    const operatorId = printer.operatorId?._id || printer.operatorId;
    await createNotification(operatorId, title, message, {
        ...meta,
        targetRole: "operator"
    });
};

const notifyStaffForNewOrder = async (order, user, printer) => {
    const meta = {
        orderId: order._id,
        printerId: printer._id,
        userId: user._id,
        fileName: order.fileName,
        fileUrl: order.fileUrl
    };

    await Promise.all([
        notifyAssignedOperator(
            printer,
            "New Print Job",
            `${getUserLabel(user)} submitted ${order.fileName} to ${getPrinterLabel(printer)}. Open the PDF and start printing when ready.`,
            meta
        ),
        notifyAdmins(
            "New Order Placed",
            `${getUserLabel(user)} created a print order for ${getPrinterLabel(printer)}.`,
            meta
        )
    ]);
};

const notifyStaffForPriorityRequest = async (order, printer) => {
    const user = await User.findById(order.userId).select("name email");
    const meta = {
        orderId: order._id,
        printerId: printer?._id || order.printerId,
        userId: order.userId,
        fileName: order.fileName,
        priorityReason: order.priorityReason
    };

    await Promise.all([
        notifyAssignedOperator(
            printer,
            "Priority Review Needed",
            `${getUserLabel(user)} requested priority printing for ${order.fileName}.`,
            meta
        ),
        notifyAdmins(
            "Priority Request Raised",
            `${getUserLabel(user)} requested priority approval for ${order.fileName}.`,
            meta
        )
    ]);
};

const generateCollectionOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

// =====================================
// CREATE ORDER
// =====================================

const createOrder = async (req, res) => {

    try {

        const {
            printerId,
            fileName,
            fileUrl,
            totalPages,
            copies,
            printSides,
            priorityLevel,
            priorityReason,
            confidential
        } = req.body;

        const user = req.user;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role === "operator" || user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Staff accounts cannot place print orders"
            });
        }

        const printer =
            await Printer.findById(
                printerId
            );

        if (!printer) {
            return res.status(404).json({
                success: false,
                message: "Printer not found"
            });
        }

        const queuePosition =
            await calculateQueuePosition(
                printerId
            );

        const eta =
            await calculateETA(
                printerId
            );

        const estimatedCost =
            calculateCost(
                totalPages,
                copies,
                printer.printerType,
                priorityLevel
            );

        const order =
            await Order.create({

                userId:
                    user._id,

                printerId,

                fileName,

                fileUrl,

                totalPages,

                copies,

                printSides:
                    printSides === "double"
                        ? "double"
                        : "single",

                priorityLevel,

                priorityScore:
                    priorityLevel ===
                        "priority"
                        ? 1
                        : 0,

                priorityRequested:
                    priorityLevel === "priority",

                priorityReason:
                    priorityLevel === "priority"
                        ? priorityReason || ""
                        : "",

                confidential,

                queuePosition,

                eta,

                estimatedCost

            });

        await recalculateQueue(
            printerId
        );

        await recalculateETA(
            printerId
        );

        try {
            await Promise.all([
                createNotification(
                    user._id,
                    "Order Submitted",
                    `Your file ${order.fileName} was sent to ${getPrinterLabel(printer)}.`,
                    { orderId: order._id, targetRole: user.role || "user" }
                ),
                notifyStaffForNewOrder(order, user, printer)
            ]);
        } catch (e) {
            console.warn("order notification failed", e.message || e);
        }

        res.status(201).json({
            success: true,
            data: order
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// =====================================
// GET ALL ORDERS
// =====================================

const getOrders = async (req, res) => {

    try {

        let orders;

        if (req.user.role === "admin") {

            orders =
                await Order.find()
                    .populate("userId")
                    .populate({
                        path: "printerId",
                        populate: { path: "operatorId", select: "name email role" }
                    });

        } else if (req.user.role === "operator") {

            const printerIds = await getOperatorPrinterIds(req.user);

            orders =
                await Order.find({
                    printerId: { $in: printerIds }
                })
                    .populate("userId")
                    .populate({
                        path: "printerId",
                        populate: { path: "operatorId", select: "name email role" }
                    });

        } else {

            orders =
                await Order.find({
                    userId:
                        req.user._id
                })
                    .populate("userId")
                    .populate({
                        path: "printerId",
                        populate: { path: "operatorId", select: "name email role" }
                    });

        }

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
// =====================================
// GET SINGLE ORDER
// =====================================

const getOrderById = async (req, res) => {

    try {

        const order =
            await Order.findById(req.params.id)
                .populate("userId")
                .populate({
                    path: "printerId",
                    populate: { path: "operatorId", select: "name email role" }
                });

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        if (
            req.user.role !== "admin" &&
            !(await canManageOrder(req.user, order)) &&
            getOrderUserId(order) !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });

        }

        const populatedOrder = await Order.findById(order._id)
            .populate("userId")
            .populate({
                path: "printerId",
                populate: { path: "operatorId", select: "name email role" }
            });

        res.status(200).json({
            success: true,
            data: populatedOrder
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// =====================================
// UPDATE STATUS
// =====================================

const updateOrderStatus = async (req, res) => {

    try {

        const order =
            await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        if (!(await canManageOrder(req.user, order))) {
            return res.status(403).json({
                success: false,
                message: "Operator can only update orders for assigned printers"
            });
        }

        const requestedStatus = req.body.status;

        if (requestedStatus === "collected") {
            if (order.status !== "ready") {
                return res.status(400).json({
                    success: false,
                    message: "Collection OTP can only be sent for ready orders"
                });
            }

            const otp = generateCollectionOtp();
            order.collectionOtp = otp;
            order.collectionOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            order.collectionRequestedAt = new Date();
            await order.save();

            await createNotification(
                order.userId,
                "Confirm Order Collection",
                `Use OTP ${otp} to confirm that you received ${order.fileName}. This code expires in 10 minutes.`,
                { orderId: order._id, action: "confirm_collection" }
            );

            try {
                const socketManager = require('../sockets/socketHandler');
                socketManager.emitToUser(order.userId.toString(), 'collection_otp_requested', { orderId: order._id });
            } catch (e) { }

            return res.status(200).json({
                success: true,
                message: "Collection OTP sent to the user",
                data: order
            });
        }

        order.status = requestedStatus;

        if (requestedStatus === "accepted") {
            order.acceptedAt = new Date();
        }

        if (requestedStatus === "printing") {
            order.printingAt = new Date();
        }

        if (requestedStatus === "ready") {
            order.readyAt = new Date();
        }

        await order.save();

        if (requestedStatus === "accepted") {
            await createNotification(
                order.userId,
                "Order Accepted",
                "Your print order has been accepted and queued for printing.",
                { orderId: order._id }
            );
            try { const socketManager = require('../sockets/socketHandler'); socketManager.emitToUser(order.userId.toString(), 'order_accepted', { orderId: order._id }); } catch (e) { }
        }

        if (requestedStatus === "ready") {

            await createNotification(

                order.userId,

                "Order Ready",

                "Your print job is ready for collection.",

                { orderId: order._id }

            );

            // emit socket event
            try { const socketManager = require('../sockets/socketHandler'); socketManager.emitToUser(order.userId.toString(), 'order_ready', { orderId: order._id }); } catch (e) { }

        }
        if (requestedStatus === "printing") {

            await createNotification(

                order.userId,

                "Printing Started",

                "Your document is now being printed.",

                { orderId: order._id }

            );

            try { const socketManager = require('../sockets/socketHandler'); socketManager.emitToUser(order.userId.toString(), 'order_printing', { orderId: order._id }); } catch (e) { }

        }

        await recalculateQueue(
            order.printerId
        );

        await recalculateETA(
            order.printerId
        );

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// =====================================
// CONFIRM COLLECTION
// =====================================

const confirmCollection = async (req, res) => {

    try {

        const { otp } = req.body;
        const order = await Order.findById(req.params.id).select("+collectionOtp +collectionOtpExpiresAt");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the order owner can confirm collection"
            });
        }

        if (order.status !== "ready") {
            return res.status(400).json({
                success: false,
                message: "Only ready orders can be collected"
            });
        }

        if (!order.collectionOtp || !order.collectionOtpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Collection OTP has not been requested yet"
            });
        }

        if (order.collectionOtpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Collection OTP expired. Ask staff to resend it."
            });
        }

        if (!otp || otp.toString() !== order.collectionOtp) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection OTP"
            });
        }

        order.status = "collected";
        order.collectedAt = new Date();
        order.collectionOtp = null;
        order.collectionOtpExpiresAt = null;
        await order.save();

        await createNotification(
            order.userId,
            "Order Received",
            "Your print job collection has been confirmed.",
            { orderId: order._id }
        );

        try {
            const socketManager = require('../sockets/socketHandler');
            socketManager.emitToUser(order.userId.toString(), 'order_collected', { orderId: order._id });
        } catch (e) { }

        await recalculateQueue(order.printerId);
        await recalculateETA(order.printerId);

        const populatedOrder = await Order.findById(order._id)
            .populate("userId")
            .populate({
                path: "printerId",
                populate: { path: "operatorId", select: "name email role" }
            });

        res.status(200).json({
            success: true,
            message: "Order collection confirmed",
            data: populatedOrder
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// =====================================
// CANCEL ORDER
// =====================================

const cancelOrder = async (req, res) => {

    try {

        const order =
            await Order.findById(
                req.params.id
            );

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        if (
            order.userId.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Only the order owner can cancel this order"
            });

        }

        if (!["pending", "accepted"].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: "Only pending or accepted orders can be cancelled"
            });
        }

        order.status =
            "cancelled";

        await order.save();

        await recalculateQueue(
            order.printerId
        );

        await recalculateETA(
            order.printerId
        );

        res.status(200).json({
            success: true,
            message:
                "Order cancelled"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// =====================================
// REQUEST PRIORITY
// =====================================

const requestPriority = async (req, res) => {

    try {

        const order =
            await Order.findById(
                req.params.id
            );

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        if (
            order.userId.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });

        }
        if (order.priorityRequested) {

            return res.status(400).json({
                success: false,
                message:
                    "Priority already requested"
            });

        }

        order.priorityRequested = true;

        order.priorityReason =
            req.body.reason;

        await order.save();

        try {
            const printer = await Printer.findById(order.printerId);
            await notifyStaffForPriorityRequest(order, printer);
        } catch(e){
            console.warn("priority notification failed", e.message || e);
        }

        res.status(200).json({
            success: true,
            message:
                "Priority request submitted",
            data: order
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
// =====================================
// PENDING PRIORITY REQUESTS
// =====================================

const getPendingPriorityRequests =
    async (req, res) => {

        try {

            const query = {
                priorityRequested: true,
                priorityApproved: false
            };

            if (req.user.role === "operator") {
                query.printerId = { $in: await getOperatorPrinterIds(req.user) };
            }

            const orders =
                await Order.find(query)
                    .populate("userId")
                    .populate({
                        path: "printerId",
                        populate: { path: "operatorId", select: "name email role" }
                    });

            res.status(200).json({
                success: true,
                count: orders.length,
                data: orders
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    };

// =====================================
// APPROVE PRIORITY
// =====================================

const approvePriority = async (req, res) => {

    try {

        const order =
            await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        if (!(await canManageOrder(req.user, order))) {
            return res.status(403).json({
                success: false,
                message: "Operator can only approve priority for assigned printers"
            });
        }

        order.priorityApproved = true;

        order.priorityLevel = "priority";

        order.priorityScore = 1;

        order.approvedBy = req.user._id;

        order.approvedAt =
            new Date();

        await order.save();


        await createNotification(

            order.userId,

            "Priority Approved",

            "Your priority request has been approved.",

            { orderId: order._id }

        );

        // emit socket
        try { const socketManager = require('../sockets/socketHandler'); socketManager.emitToUser(order.userId.toString(),'priority_approved',{ orderId: order._id }); } catch(e){}

        await recalculateQueue(
            order.printerId
        );

        await recalculateETA(
            order.printerId
        );

        const populatedOrder = await Order.findById(order._id)
            .populate("userId")
            .populate({
                path: "printerId",
                populate: { path: "operatorId", select: "name email role" }
            });

        res.status(200).json({
            success: true,
            message:
                "Priority approved",
            data: populatedOrder
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// =====================================
// REJECT PRIORITY
// =====================================

const rejectPriority = async (req, res) => {

    try {

        const order =
            await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        if (!(await canManageOrder(req.user, order))) {
            return res.status(403).json({
                success: false,
                message: "Operator can only reject priority for assigned printers"
            });
        }

        order.priorityRequested = false;

        order.priorityApproved = false;

        order.priorityScore = 0;

        order.rejectedReason =
            req.body.reason ||
            "Rejected";

        await order.save();

        await createNotification(

            order.userId,

            "Priority Rejected",

            `Your priority request was rejected. Reason: ${order.rejectedReason}`,

            { orderId: order._id }

        );

        // emit socket
        try { const socketManager = require('../sockets/socketHandler'); socketManager.emitToUser(order.userId.toString(),'priority_rejected',{ orderId: order._id, reason: order.rejectedReason }); } catch(e){}

        await recalculateQueue(
            order.printerId
        );

        await recalculateETA(
            order.printerId
        );

        const populatedOrder = await Order.findById(order._id)
            .populate("userId")
            .populate({
                path: "printerId",
                populate: { path: "operatorId", select: "name email role" }
            });

        res.status(200).json({
            success: true,
            message:
                "Priority rejected",
            data: populatedOrder
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {

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

};
