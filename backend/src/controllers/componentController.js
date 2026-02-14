const db = require('../config/db');
const { evaluateAlertsForComponent } = require('../services/productionService');

async function listComponents(req, res) {
  try {
    const { search = '', lowStock } = req.query;
    const filters = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      filters.push(`(component_name ILIKE $${values.length} OR part_number ILIKE $${values.length})`);
    }

    if (lowStock === 'true') {
      filters.push(`current_stock_quantity < (monthly_required_quantity * (low_stock_threshold_percent / 100.0))`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const q = `SELECT * FROM components ${where} ORDER BY updated_at DESC`;
    const result = await db.query(q, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createComponent(req, res) {
  try {
    const {
      component_name,
      part_number,
      current_stock_quantity = 0,
      monthly_required_quantity = 0,
      low_stock_threshold_percent = 20,
      unit = 'units',
    } = req.body;

    const created = await db.query(
      `INSERT INTO components
      (component_name, part_number, current_stock_quantity, monthly_required_quantity, low_stock_threshold_percent, unit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [component_name, part_number, current_stock_quantity, monthly_required_quantity, low_stock_threshold_percent, unit]
    );

    await evaluateAlertsForComponent({
      query: (...args) => db.query(...args),
    }, created.rows[0].id);

    return res.status(201).json(created.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateComponent(req, res) {
  try {
    const { id } = req.params;
    const {
      component_name,
      part_number,
      current_stock_quantity,
      monthly_required_quantity,
      low_stock_threshold_percent,
      unit,
    } = req.body;

    const updated = await db.query(
      `UPDATE components SET
        component_name = $1,
        part_number = $2,
        current_stock_quantity = $3,
        monthly_required_quantity = $4,
        low_stock_threshold_percent = $5,
        unit = $6,
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        component_name,
        part_number,
        current_stock_quantity,
        monthly_required_quantity,
        low_stock_threshold_percent,
        unit,
        id,
      ]
    );

    if (!updated.rows[0]) return res.status(404).json({ message: 'Component not found' });

    await evaluateAlertsForComponent({
      query: (...args) => db.query(...args),
    }, Number(id));

    return res.json(updated.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteComponent(req, res) {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM components WHERE id = $1`, [id]);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listComponents,
  createComponent,
  updateComponent,
  deleteComponent,
};
