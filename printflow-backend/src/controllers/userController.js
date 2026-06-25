const User = require("../models/User");
const Printer = require("../models/Printer");
const isAllowedEmail =
    require("../utils/domainValidator");
const Audit = require("../models/Audit");
const { getClerkUserId } = require("../utils/getClerkAuth");

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

// Create User (safe: do not allow role assignment here)
const createUser = async (req, res) => {
    try {

        const payload = { ...req.body };
        // Never allow setting role via this endpoint
        if (payload.role) delete payload.role;

        const user = await User.create(payload);

        res.status(201).json({
            success: true,
            data: user
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// Get All Users
const getUsers = async (req, res) => {
    try {

        const users = await User.find().populate("assignedPrinters");

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// Get User By ID
const getUserById = async (req, res) => {
    try {

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const requester = req.user || await User.findOne({ clerkId: getClerkUserId(req) });
        const isSelf = requester && requester._id.toString() === user._id.toString();
        const isAdmin = requester?.role === "admin";

        if (!isSelf && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// Update User
// Allows users to update their own profile fields. Role changes require admin.
const updateUser = async (req, res) => {
    try {
        // requester
        const requesterClerkId = getClerkUserId(req);
        const requester = await User.findOne({ clerkId: requesterClerkId });

        // target user
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isSelf = requester && requester._id.toString() === targetUser._id.toString();
        const isAdmin = requester?.role === 'admin';

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // If body contains role change, only admin can perform this via the admin role endpoint
        if (req.body.role && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admin can change roles' });
        }

        // Prevent role changes here even by admin (use dedicated route) to keep intent explicit
        const payload = { ...req.body };
        if (payload.role) delete payload.role;

        // Only allow updating limited profile fields
        const allowed = ['name', 'rollNo', 'department'];
        const updatePayload = {};
        allowed.forEach((k) => {
            if (payload[k] !== undefined) updatePayload[k] = payload[k];
        });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// Admin-only: change a user's role
const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const allowedRoles = ["student", "faculty", "operator", "admin"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const previousRole = user.role;

        user.role = role;
        if (role !== "operator") {
            user.assignedPrinters = [];
            await Printer.updateMany({ operatorId: user._id }, { $unset: { operatorId: "" } });
        }
        await user.save();

        // Audit
        try {
            const requesterClerkId = getClerkUserId(req);
            const performer = await User.findOne({ clerkId: requesterClerkId });
            await Audit.create({
                action: 'change_role',
                targetUser: user._id,
                performedBy: performer ? performer._id : null,
                performedByClerkId: requesterClerkId,
                previousRole,
                newRole: role,
                meta: { source: 'admin_api' }
            });
        } catch (e) {
            console.warn('audit create failed', e.message || e);
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin-only: assign printers to an operator
const updateAssignedPrinters = async (req, res) => {
    try {
        const { printerIds = [] } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'operator') {
            return res.status(400).json({ success: false, message: 'Only operators can be assigned printers' });
        }

        user.assignedPrinters = printerIds;
        await user.save();
        await Printer.updateMany({ operatorId: user._id }, { $unset: { operatorId: "" } });
        if (printerIds.length > 0) {
            await Printer.updateMany({ _id: { $in: printerIds } }, { $set: { operatorId: user._id } });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Clerk User Sync
const syncUser = async (req, res) => {
    try {
        const clerkId = getClerkUserId(req);
        if (!clerkId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const {
            email,
            name,
            rollNo,
            department
        } = req.body;

        if (!email || !isAllowedEmail(email)) {

            return res.status(403).json({
                success: false,
                message:
                    "Only PVPSIT email addresses are allowed"
            });

        }

        let user =
            await User.findOne({
                clerkId
            });

        if (!user) {

            const createPayload = {
                clerkId,
                email,
                name,
                rollNo,
                department
            };

            // Bootstrap super-admin if email matches env var
            if (SUPER_ADMIN_EMAIL && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
                createPayload.role = 'admin';
            }

            user = await User.create(createPayload);

            // Audit bootstrap
            try {
                if (createPayload.role === 'admin') {
                    await Audit.create({
                        action: 'bootstrap_admin',
                        targetUser: user._id,
                        performedBy: null,
                        performedByClerkId: clerkId,
                        previousRole: null,
                        newRole: 'admin',
                        meta: { reason: 'super_admin_env' }
                    });
                }
            } catch (e) {
                console.warn('audit create failed', e.message || e);
            }

        } else {
            const updates = {};
            if (name && user.name !== name) updates.name = name;
            if (rollNo !== undefined && user.rollNo !== rollNo) updates.rollNo = rollNo;
            if (department !== undefined && user.department !== department) updates.department = department;

            if (Object.keys(updates).length > 0) {
                Object.assign(user, updates);
                await user.save();
            }

            // Ensure super admin email retains admin role
            if (SUPER_ADMIN_EMAIL && user.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && user.role !== 'admin') {
                const previous = user.role;
                user.role = 'admin';
                await user.save();
                try {
                    await Audit.create({
                        action: 'bootstrap_admin_enforce',
                        targetUser: user._id,
                        performedBy: null,
                        performedByClerkId: clerkId,
                        previousRole: previous,
                        newRole: 'admin',
                        meta: { reason: 'super_admin_env_enforce' }
                    });
                } catch (e) { console.warn('audit create failed', e.message || e); }
            }
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    syncUser,
    changeUserRole,
    updateAssignedPrinters
};
