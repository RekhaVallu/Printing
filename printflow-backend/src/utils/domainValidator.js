const isAllowedEmail = (email) => {
    if (!email || typeof email !== "string") return false;

    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(normalized);
};

module.exports = isAllowedEmail;