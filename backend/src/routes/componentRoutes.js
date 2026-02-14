const express = require('express');
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/componentController');

const router = express.Router();

router.get('/', auth, controller.listComponents);
router.post('/', auth, controller.createComponent);
router.put('/:id', auth, controller.updateComponent);
router.delete('/:id', auth, controller.deleteComponent);

module.exports = router;
