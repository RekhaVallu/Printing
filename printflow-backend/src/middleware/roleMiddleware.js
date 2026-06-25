const loadUser = require("./loadUser");

const allowRoles = (...roles) => {

    return async (req, res, next) => {

        try {

            const user = req.user || await loadUser.findOrCreateUserFromAuth(req);

            if (!roles.includes(user.role)) {

                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });

            }

            req.user = user;

            next();

        } catch (error) {

            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });

        }

    };

};

module.exports = allowRoles;
