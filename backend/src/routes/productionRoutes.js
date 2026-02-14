const express = require('express');
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/productionController');

const router = express.Router();

router.get('/', auth, controller.listProductionEntries);
router.post('/', auth, controller.createProductionEntry);
router.get('/consumption-history', auth, controller.consumptionHistory);

module.exports = router;
