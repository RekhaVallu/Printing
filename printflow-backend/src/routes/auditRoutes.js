const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const allowRoles = require('../middleware/roleMiddleware');
const { listAudits } = require('../controllers/auditController');

router.get('/', requireAuth(), allowRoles('admin'), listAudits);

module.exports = router;
