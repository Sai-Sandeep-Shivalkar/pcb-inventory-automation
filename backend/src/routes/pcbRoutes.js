const express = require('express');
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/pcbController');

const router = express.Router();

router.get('/models', auth, controller.listPcbModels);
router.post('/models', auth, controller.createPcbModel);
router.get('/mappings', auth, controller.listMappings);
router.post('/mappings', auth, controller.upsertMapping);

module.exports = router;
