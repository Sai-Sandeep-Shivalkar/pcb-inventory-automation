const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const db = require('../config/db');

dotenv.config();

async function run() {
  const email = process.env.ADMIN_EMAIL || 'admin@pcb.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = 'Admin User';

  const existing = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows[0]) {
    console.log('Admin user already exists');
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
    [name, email, hash]
  );

  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
