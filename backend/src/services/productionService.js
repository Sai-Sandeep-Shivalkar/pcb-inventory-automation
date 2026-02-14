const db = require('../config/db');
const { thresholdQuantity } = require('../utils/stockUtils');

async function createOrGetOpenAlert(client, component, shortageQty, thresholdQty) {
  const existing = await client.query(
    `SELECT id FROM procurement_alerts WHERE component_id = $1 AND alert_status = 'OPEN' LIMIT 1`,
    [component.id]
  );

  const message = `LOW STOCK: ${component.component_name} (${component.part_number}) has ${component.current_stock_quantity} in stock, below threshold ${thresholdQty.toFixed(2)}.`;

  if (existing.rows[0]) {
    await client.query(
      `UPDATE procurement_alerts
       SET shortage_quantity = $1, threshold_quantity = $2, message = $3
       WHERE id = $4`,
      [shortageQty, thresholdQty, message, existing.rows[0].id]
    );
    return;
  }

  await client.query(
    `INSERT INTO procurement_alerts (component_id, shortage_quantity, threshold_quantity, message)
     VALUES ($1, $2, $3, $4)`,
    [component.id, shortageQty, thresholdQty, message]
  );
}

async function evaluateAlertsForComponent(client, componentId) {
  const componentRes = await client.query(`SELECT * FROM components WHERE id = $1`, [componentId]);
  const component = componentRes.rows[0];
  if (!component) return;

  const thresholdQty = thresholdQuantity(component);
  const current = Number(component.current_stock_quantity);

  if (current < thresholdQty) {
    await createOrGetOpenAlert(client, component, Math.max(0, thresholdQty - current), thresholdQty);
  } else {
    await client.query(
      `UPDATE procurement_alerts
       SET alert_status = 'RESOLVED', resolved_at = NOW()
       WHERE component_id = $1 AND alert_status = 'OPEN'`,
      [componentId]
    );
  }
}

async function processProductionEntry({ pcbModelId, productionQuantity, productionDate, notes, source = 'manual', createdBy = null }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const mappingRes = await client.query(
      `SELECT pcm.component_id, pcm.quantity_per_pcb, c.component_name, c.part_number, c.current_stock_quantity
       FROM pcb_component_mapping pcm
       JOIN components c ON c.id = pcm.component_id
       WHERE pcm.pcb_model_id = $1`,
      [pcbModelId]
    );

    if (!mappingRes.rows.length) {
      throw new Error('No component mapping found for the PCB model');
    }

    const requiredRows = mappingRes.rows.map((row) => {
      const requiredQty = Number(row.quantity_per_pcb) * Number(productionQuantity);
      const available = Number(row.current_stock_quantity);
      return { ...row, requiredQty, available };
    });

    const insufficient = requiredRows.filter((row) => row.requiredQty > row.available);
    if (insufficient.length) {
      const details = insufficient
        .map((r) => `${r.component_name}(${r.part_number}) required ${r.requiredQty.toFixed(2)} but available ${r.available.toFixed(2)}`)
        .join('; ');
      throw new Error(`Insufficient inventory for production: ${details}`);
    }

    const productionInsert = await client.query(
      `INSERT INTO production_entries (pcb_model_id, production_quantity, production_date, source, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [pcbModelId, productionQuantity, productionDate, source, notes || null, createdBy]
    );
    const productionEntry = productionInsert.rows[0];

    for (const row of requiredRows) {
      const updated = await client.query(
        `UPDATE components
         SET current_stock_quantity = current_stock_quantity - $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, current_stock_quantity`,
        [row.requiredQty, row.component_id]
      );

      const balance = Number(updated.rows[0].current_stock_quantity);

      await client.query(
        `INSERT INTO inventory_transactions
         (component_id, transaction_type, quantity, reference_type, reference_id, balance_after, remarks)
         VALUES ($1, 'DEDUCTION', $2, 'PRODUCTION_ENTRY', $3, $4, $5)`,
        [row.component_id, row.requiredQty, productionEntry.id, balance, `Auto deduction for PCB production x${productionQuantity}`]
      );

      await evaluateAlertsForComponent(client, row.component_id);
    }

    await client.query('COMMIT');
    return productionEntry;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  processProductionEntry,
  evaluateAlertsForComponent,
};
