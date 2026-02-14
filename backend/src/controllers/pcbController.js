const db = require('../config/db');

async function listPcbModels(req, res) {
  try {
    const result = await db.query(`SELECT * FROM pcb_models ORDER BY pcb_name`);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createPcbModel(req, res) {
  try {
    const { pcb_name, pcb_code } = req.body;
    const result = await db.query(
      `INSERT INTO pcb_models (pcb_name, pcb_code) VALUES ($1, $2) RETURNING *`,
      [pcb_name, pcb_code]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listMappings(req, res) {
  try {
    const result = await db.query(
      `SELECT pcm.id, pm.pcb_name, pm.pcb_code, c.component_name, c.part_number, pcm.quantity_per_pcb
       FROM pcb_component_mapping pcm
       JOIN pcb_models pm ON pm.id = pcm.pcb_model_id
       JOIN components c ON c.id = pcm.component_id
       ORDER BY pm.pcb_name, c.component_name`
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function upsertMapping(req, res) {
  try {
    const { pcb_model_id, component_id, quantity_per_pcb } = req.body;
    const result = await db.query(
      `INSERT INTO pcb_component_mapping (pcb_model_id, component_id, quantity_per_pcb)
       VALUES ($1, $2, $3)
       ON CONFLICT (pcb_model_id, component_id)
       DO UPDATE SET quantity_per_pcb = EXCLUDED.quantity_per_pcb
       RETURNING *`,
      [pcb_model_id, component_id, quantity_per_pcb]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listPcbModels,
  createPcbModel,
  listMappings,
  upsertMapping,
};
