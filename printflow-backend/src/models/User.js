const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        role: {
            type: String,
            enum: [
                "student",
                "faculty",
                "operator",
                "admin"
            ],
            default: "student"
        },

        rollNo: {
            type: String
        },

        department: {
            type: String
        },

        assignedPrinters: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Printer"
        }]
    },
    {
        timestamps: true
    });

module.exports = mongoose.model("User", userSchema);