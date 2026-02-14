const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, '../../sql/schema.sql'), 'utf-8');
  await db.query(schema);
  console.log('Database schema initialized');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
