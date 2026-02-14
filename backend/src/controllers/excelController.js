const fs = require('fs');
const { importWorkbook } = require('../services/excelService');

async function uploadAndImport(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file required' });
    }

    const summary = await importWorkbook(req.file.path, req.user.id);
    fs.unlink(req.file.path, () => {});
    return res.json({ message: 'Import completed', summary });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  uploadAndImport,
};
