const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { importWorkbook } = require('../services/excelService');
const db = require('../config/db');

dotenv.config();

async function run() {
  const root = path.join(__dirname, '../../../data');
  const files = [
    'Atomberg Data.xlsm',
    'Bajaj PCB Dec 25 Data.xlsm',
    'Atomberg Data.xlsx',
    'Bajaj PCB Dec 25 Data.xlsx',
  ].map((f) => path.join(root, f));

  const existing = files.filter((f) => fs.existsSync(f));

  if (!existing.length) {
    console.log('No seed Excel files found in /data');
    process.exit(0);
  }

  await db.query(`DELETE FROM production_entries WHERE source = 'excel_import'`);

  for (const file of existing) {
    const summary = await importWorkbook(file, null);
    console.log(`Imported ${path.basename(file)}:`, summary);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
