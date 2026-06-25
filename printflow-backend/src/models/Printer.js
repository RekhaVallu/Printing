const mongoose = require("mongoose");

const printerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        location: {
            type: String,
            required: true
        },

        printerType: {
            type: String,
            enum: ["bw", "color"],
            default: "bw"
        },

        status: {
            type: String,
            enum: ["online", "offline", "maintenance"],
            default: "online"
        },

        pagesPerMinute: {
            type: Number,
            required: true
        },

        operatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        currentQueueLength: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    });

module.exports = mongoose.model("Printer", printerSchema);