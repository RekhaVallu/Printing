const User = require("../models/User");
const Order = require("../models/Order");
const Printer = require("../models/Printer");

const getDashboardStats = async (
    req,
    res
) => {

    try {

        const totalUsers =
            await User.countDocuments();

        const totalPrinters =
            await Printer.countDocuments();

        const totalOrders =
            await Order.countDocuments();

        const pendingOrders =
            await Order.countDocuments({
                status: "pending"
            });

        const activeOrders =
            await Order.countDocuments({
                status: {
                    $in: [
                        "accepted",
                        "printing"
                    ]
                }
            });

        const completedOrders =
            await Order.countDocuments({
                status: "collected"
            });

        const priorityOrders =
            await Order.countDocuments({
                priorityApproved: true
            });

        const revenue =
            await Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum:
                                "$estimatedCost"
                        }
                    }
                }
            ]);

        res.status(200).json({
            success: true,

            totalUsers,

            totalPrinters,

            totalOrders,

            pendingOrders,

            activeOrders,

            completedOrders,

            priorityOrders,

            totalRevenue:
                revenue[0]
                    ?.totalRevenue || 0
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message:
                error.message
        });

    }

};
const getPrinterStats =
    async (req, res) => {

        try {

            const stats =
                await Order.aggregate([
                    {
                        $group: {
                            _id:
                                "$printerId",

                            ordersHandled: {
                                $sum: 1
                            },

                            pagesPrinted: {
                                $sum:
                                    "$totalPages"
                            },

                            revenue: {
                                $sum:
                                    "$estimatedCost"
                            }
                        }
                    }
                ]);

            res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    };
const getMonthlyTrends =
    async (req, res) => {

        try {

            const trends =
                await Order.aggregate([
                    {
                        $group: {

                            _id: {
                                month: {
                                    $month:
                                        "$createdAt"
                                },

                                year: {
                                    $year:
                                        "$createdAt"
                                }
                            },

                            orders: {
                                $sum: 1
                            },

                            revenue: {
                                $sum:
                                    "$estimatedCost"
                            }
                        }
                    },

                    {
                        $sort: {
                            "_id.year": 1,
                            "_id.month": 1
                        }
                    }
                ]);

            res.status(200).json({
                success: true,
                data: trends
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    };
const getTopUsers =
    async (req, res) => {

        try {

            const users =
                await Order.aggregate([
                    {
                        $group: {

                            _id:
                                "$userId",

                            orders: {
                                $sum: 1
                            },

                            spent: {
                                $sum:
                                    "$estimatedCost"
                            }
                        }
                    },

                    {
                        $sort: {
                            orders: -1
                        }
                    },

                    {
                        $limit: 10
                    }
                ]);

            res.status(200).json({
                success: true,
                data: users
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
    getDashboardStats,
    getPrinterStats,
    getMonthlyTrends,
    getTopUsers
};