const express = require('express');
const multer = require('multer');
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/excelController');

const upload = multer({ dest: 'tmp_uploads/' });
const router = express.Router();

router.post('/import', auth, upload.single('file'), controller.uploadAndImport);

module.exports = router;
