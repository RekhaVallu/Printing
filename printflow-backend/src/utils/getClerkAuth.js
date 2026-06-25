const getClerkAuth = (req) => {
    if (!req?.auth) return {};
    return typeof req.auth === "function" ? req.auth() : req.auth;
};

const getClerkUserId = (req) => getClerkAuth(req)?.userId;

module.exports = {
    getClerkAuth,
    getClerkUserId
};
