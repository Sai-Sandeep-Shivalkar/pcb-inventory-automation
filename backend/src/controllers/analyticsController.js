const ExcelJS = require('exceljs');
const db = require('../config/db');

async function dashboard(req, res) {
  try {
    const kpis = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM components) AS total_components,
        (SELECT COUNT(*) FROM pcb_models) AS total_pcbs,
        (SELECT COUNT(*) FROM procurement_alerts WHERE alert_status = 'OPEN') AS open_alerts,
        (SELECT COALESCE(SUM(production_quantity),0) FROM production_entries) AS total_production_qty`
    );

    const topConsumed = await db.query(
      `SELECT c.component_name, c.part_number, COALESCE(SUM(it.quantity),0) AS total_consumed
       FROM components c
       LEFT JOIN inventory_transactions it ON it.component_id = c.id AND it.transaction_type = 'DEDUCTION'
       GROUP BY c.id
       ORDER BY total_consumed DESC
       LIMIT 10`
    );

    const monthlyTrend = await db.query(
      `SELECT TO_CHAR(pe.production_date, 'YYYY-MM') AS month,
              COALESCE(SUM(pe.production_quantity),0) AS production_qty,
              COALESCE(SUM(it.quantity),0) AS consumed_qty
       FROM production_entries pe
       LEFT JOIN inventory_transactions it ON it.reference_type = 'PRODUCTION_ENTRY' AND it.reference_id = pe.id
       GROUP BY TO_CHAR(pe.production_date, 'YYYY-MM')
       ORDER BY month`
    );

    const lowStock = await db.query(
      `SELECT c.*,
              (c.monthly_required_quantity * (c.low_stock_threshold_percent / 100.0)) AS threshold
       FROM components c
       WHERE c.current_stock_quantity < (c.monthly_required_quantity * (c.low_stock_threshold_percent / 100.0))
       ORDER BY c.current_stock_quantity ASC`
    );

    return res.json({
      kpis: kpis.rows[0],
      topConsumed: topConsumed.rows,
      monthlyTrend: monthlyTrend.rows,
      lowStock: lowStock.rows,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function procurementAlerts(req, res) {
  try {
    const result = await db.query(
      `SELECT pa.*, c.component_name, c.part_number
       FROM procurement_alerts pa
       JOIN components c ON c.id = pa.component_id
       ORDER BY pa.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function exportReport(req, res) {
  try {
    const [components, transactions, production] = await Promise.all([
      db.query(`SELECT * FROM components ORDER BY component_name`),
      db.query(`SELECT * FROM inventory_transactions ORDER BY transaction_date DESC LIMIT 2000`),
      db.query(`SELECT * FROM production_entries ORDER BY production_date DESC LIMIT 2000`),
    ]);

    const workbook = new ExcelJS.Workbook();
    const compSheet = workbook.addWorksheet('Components');
    compSheet.columns = [
      { header: 'Component Name', key: 'component_name', width: 30 },
      { header: 'Part Number', key: 'part_number', width: 20 },
      { header: 'Stock', key: 'current_stock_quantity', width: 12 },
      { header: 'Monthly Required', key: 'monthly_required_quantity', width: 18 },
      { header: 'Threshold %', key: 'low_stock_threshold_percent', width: 12 },
    ];
    compSheet.addRows(components.rows);

    const txSheet = workbook.addWorksheet('Inventory Transactions');
    txSheet.columns = [
      { header: 'Component ID', key: 'component_id', width: 12 },
      { header: 'Type', key: 'transaction_type', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Balance After', key: 'balance_after', width: 14 },
      { header: 'Reference Type', key: 'reference_type', width: 16 },
      { header: 'Reference ID', key: 'reference_id', width: 12 },
      { header: 'Date', key: 'transaction_date', width: 20 },
    ];
    txSheet.addRows(transactions.rows);

    const prodSheet = workbook.addWorksheet('Production Entries');
    prodSheet.columns = [
      { header: 'PCB Model ID', key: 'pcb_model_id', width: 14 },
      { header: 'Qty', key: 'production_quantity', width: 10 },
      { header: 'Date', key: 'production_date', width: 15 },
      { header: 'Source', key: 'source', width: 14 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];
    prodSheet.addRows(production.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  dashboard,
  procurementAlerts,
  exportReport,
};
