const Order = require("../models/Order");

const getMyStats = async (req, res) => {

    try {

        const userId =
            req.user._id;

        const totalOrders =
            await Order.countDocuments({
                userId
            });

        const completedOrders =
            await Order.countDocuments({
                userId,
                status: "collected"
            });

        const priorityRequests =
            await Order.countDocuments({
                userId,
                priorityRequested: true
            });

        const spending =
            await Order.aggregate([
                {
                    $match: {
                        userId
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSpent: {
                            $sum:
                                "$estimatedCost"
                        },
                        totalPages: {
                            $sum:
                                "$totalPages"
                        }
                    }
                }
            ]);

        res.status(200).json({
            success: true,

            totalOrders,

            completedOrders,

            priorityRequests,

            totalSpent:
                spending[0]?.totalSpent || 0,

            totalPages:
                spending[0]?.totalPages || 0
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message:
                error.message
        });

    }

};

const getMyHistory = async (
    req,
    res
) => {

    try {

        const orders =
            await Order.find({
                userId:
                    req.user._id
            })
                .populate(
                    "printerId"
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json({
            success: true,
            count:
                orders.length,
            data: orders
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message:
                error.message
        });

    }

};

const getFavoritePrinter =
    async (req, res) => {

        try {

            const favorite =
                await Order.aggregate([
                    {
                        $match: {
                            userId:
                                req.user._id
                        }
                    },
                    {
                        $group: {
                            _id:
                                "$printerId",
                            count: {
                                $sum: 1
                            }
                        }
                    },
                    {
                        $sort: {
                            count: -1
                        }
                    },
                    {
                        $limit: 1
                    }
                ]);

            res.status(200).json({
                success: true,
                data: favorite
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
    getMyStats,
    getMyHistory,
    getFavoritePrinter
};