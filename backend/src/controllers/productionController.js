const db = require('../config/db');
const { processProductionEntry } = require('../services/productionService');

async function createProductionEntry(req, res) {
  try {
    const { pcb_model_id, production_quantity, production_date, notes } = req.body;
    const entry = await processProductionEntry({
      pcbModelId: Number(pcb_model_id),
      productionQuantity: Number(production_quantity),
      productionDate: production_date,
      notes,
      source: 'manual',
      createdBy: req.user.id,
    });
    return res.status(201).json(entry);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function listProductionEntries(req, res) {
  try {
    const result = await db.query(
      `SELECT pe.*, pm.pcb_name, pm.pcb_code
       FROM production_entries pe
       JOIN pcb_models pm ON pm.id = pe.pcb_model_id
       ORDER BY pe.production_date DESC, pe.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function consumptionHistory(req, res) {
  try {
    const result = await db.query(
      `SELECT it.*, c.component_name, c.part_number
       FROM inventory_transactions it
       JOIN components c ON c.id = it.component_id
       ORDER BY it.transaction_date DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createProductionEntry,
  listProductionEntries,
  consumptionHistory,
};
