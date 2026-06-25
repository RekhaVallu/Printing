const mongoose = require("mongoose");

const notificationSchema =
    new mongoose.Schema({

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        type: {
            type: String,
            default: "created"
        },

        category: {
            type: String,
            enum: [
                "orders",
                "priority",
                "printers",
                "users",
                "system"
            ],
            default: "system"
        },

        targetRole: {
            type: String,
            enum: [
                "student",
                "faculty",
                "operator",
                "admin",
                "all"
            ],
            default: "all"
        },

        meta: {
            type: Object,
            default: {}
        },

        isRead: {
            type: Boolean,
            default: false
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.model(
        "Notification",
        notificationSchema
    );
