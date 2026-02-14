const express = require('express');
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/authController');

const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);

module.exports = router;
