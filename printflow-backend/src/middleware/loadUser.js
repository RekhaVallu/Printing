const User = require("../models/User");
const { getClerkAuth } = require("../utils/getClerkAuth");

const getClerkIdentity = (req) => {
    const auth = getClerkAuth(req);
    const clerkId = auth?.userId;
    const email =
        auth?.sessionClaims?.email ||
        auth?.sessionClaims?.email_address ||
        auth?.sessionClaims?.primary_email_address ||
        auth?.sessionClaims?.primaryEmailAddress?.emailAddress ||
        `${clerkId}@pvpsit.ac.in`;
    const name =
        auth?.sessionClaims?.name ||
        auth?.sessionClaims?.full_name ||
        auth?.sessionClaims?.first_name ||
        "New User";

    return { clerkId, email, name };
};

const findOrCreateUserFromAuth = async (req) => {
    const { clerkId, email, name } = getClerkIdentity(req);

    if (!clerkId) {
        const error = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
        user = await User.create({
            clerkId,
            name,
            email,
            role: "student"
        });
    }

    return user;
};

const loadUser = async (req, res, next) => {

    try {

        const user = await findOrCreateUserFromAuth(req);

        req.user = user;

        next();

    } catch (error) {

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });

    }

};

loadUser.findOrCreateUserFromAuth = findOrCreateUserFromAuth;

module.exports = loadUser;
