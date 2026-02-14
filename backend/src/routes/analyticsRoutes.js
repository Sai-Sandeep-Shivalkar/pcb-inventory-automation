const express = require('express');
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/analyticsController');

const router = express.Router();

router.get('/dashboard', auth, controller.dashboard);
router.get('/alerts', auth, controller.procurementAlerts);
router.get('/export', auth, controller.exportReport);

module.exports = router;
