const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        printerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Printer",
            required: true
        },

        fileName: {
            type: String,
            required: true
        },

        fileUrl: {
            type: String,
            required: true
        },

        totalPages: {
            type: Number,
            required: true
        },

        copies: {
            type: Number,
            default: 1
        },

        printSides: {
            type: String,
            enum: [
                "single",
                "double"
            ],
            default: "single"
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "printing",
                "ready",
                "collected",
                "cancelled"
            ],
            default: "pending"
        },

        acceptedAt: {
            type: Date
        },

        printingAt: {
            type: Date
        },

        readyAt: {
            type: Date
        },

        collectedAt: {
            type: Date
        },

        collectionOtp: {
            type: String,
            default: null,
            select: false
        },

        collectionOtpExpiresAt: {
            type: Date,
            default: null,
            select: false
        },

        collectionRequestedAt: {
            type: Date
        },

        priorityLevel: {
            type: String,
            enum: [
                "normal",
                "priority"
            ],
            default: "normal"
        },

        priorityLevel: {
            type: String,
            enum: [
                "normal",
                "priority"
            ],
            default: "normal"
        },
        priorityScore: {
            type: Number,
            default: 0
        },
        priorityRequested: {
            type: Boolean,
            default: false
        },

        priorityApproved: {
            type: Boolean,
            default: false
        },

        priorityReason: {
            type: String,
            default: ""
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        approvedAt: {
            type: Date
        },

        rejectedReason: {
            type: String,
            default: ""
        },

        confidential: {
            type: Boolean,
            default: false
        },


        queuePosition: {
            type: Number,
            default: 0
        },

        eta: {
            type: Number,
            default: 0
        },

        estimatedCost: {
            type: Number,
            default: 0
        },

    },
    {
        timestamps: true
    });

module.exports = mongoose.model("Order", orderSchema);
