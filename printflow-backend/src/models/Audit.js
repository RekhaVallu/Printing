const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performedByClerkId: { type: String, default: null },
  previousRole: { type: String, default: null },
  newRole: { type: String, default: null },
  meta: { type: Object, default: {} },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Audit', auditSchema);
