const Audit = require('../models/Audit');

const listAudits = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const audits = await Audit.find()
      .populate('targetUser', 'name email role')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ success: true, count: audits.length, data: audits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listAudits };
