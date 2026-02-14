const path = require('path');
const XLSX = require('xlsx');
const db = require('../config/db');
const { evaluateAlertsForComponent } = require('./productionService');

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function excelDateToISO(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    if (!d) return new Date().toISOString().slice(0, 10);
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreatePcb(client, pcbCodeOrName) {
  const key = String(pcbCodeOrName || '').trim();
  if (!key) return null;

  const existing = await client.query(
    `SELECT * FROM pcb_models WHERE pcb_code = $1 OR pcb_name = $1 LIMIT 1`,
    [key]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await client.query(
    `INSERT INTO pcb_models (pcb_name, pcb_code) VALUES ($1, $2) RETURNING *`,
    [key, key]
  );
  return created.rows[0];
}

async function upsertComponent(client, { componentName, partNumber, monthlyRequiredQty = 0, stockQty = 0 }) {
  const name = String(componentName || '').trim();
  const part = String(partNumber || componentName || '').trim();
  if (!name || !part) return null;

  const result = await client.query(
    `INSERT INTO components
      (component_name, part_number, current_stock_quantity, monthly_required_quantity)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (part_number)
     DO UPDATE SET
       component_name = EXCLUDED.component_name,
       current_stock_quantity = GREATEST(components.current_stock_quantity, EXCLUDED.current_stock_quantity),
       monthly_required_quantity = GREATEST(components.monthly_required_quantity, EXCLUDED.monthly_required_quantity),
       updated_at = NOW()
     RETURNING *`,
    [name, part, stockQty, monthlyRequiredQty]
  );

  await evaluateAlertsForComponent(client, result.rows[0].id);
  return result.rows[0];
}

async function upsertMapping(client, pcbModelId, componentId, quantityPerPcb) {
  if (!pcbModelId || !componentId || quantityPerPcb <= 0) return;
  await client.query(
    `INSERT INTO pcb_component_mapping (pcb_model_id, component_id, quantity_per_pcb)
     VALUES ($1, $2, $3)
     ON CONFLICT (pcb_model_id, component_id)
     DO UPDATE SET quantity_per_pcb = EXCLUDED.quantity_per_pcb`,
    [pcbModelId, componentId, quantityPerPcb]
  );
}

async function insertProductionBaseline(client, pcbModelId, qty, date, note) {
  if (!pcbModelId || qty <= 0) return;
  await client.query(
    `INSERT INTO production_entries (pcb_model_id, production_quantity, production_date, source, notes)
     VALUES ($1, $2, $3, 'excel_import', $4)`,
    [pcbModelId, qty, date, note]
  );
}

function tokenizeComponentChange(text) {
  const raw = String(text || '');
  if (!raw || /^na$/i.test(raw.trim())) return [];

  return raw
    .split(/[\/,+;]/)
    .map((t) => normalizeToken(t))
    .filter((t) => t && t !== 'NA' && t !== 'N/A');
}

async function importAtomberg(client, workbook, summary) {
  const compSheet = workbook.Sheets['Component Consumption'];
  if (compSheet) {
    const rows = XLSX.utils.sheet_to_json(compSheet, { defval: '' });
    for (const row of rows) {
      const componentName = row['Row Labels'];
      const totalCount = toNumber(row['Sum of Total Count']);
      if (!componentName || /grand total/i.test(String(componentName))) continue;

      const monthly = totalCount;
      const stock = Math.ceil(monthly * 1.5);
      const upserted = await upsertComponent(client, {
        componentName,
        partNumber: componentName,
        monthlyRequiredQty: monthly,
        stockQty: stock,
      });
      if (upserted) summary.componentsImported += 1;
    }
  }

  const partCodeSheet = workbook.Sheets['Part Code wise OK_SCRAP'];
  if (partCodeSheet) {
    const rows = XLSX.utils.sheet_to_json(partCodeSheet, { defval: '' });
    for (const row of rows) {
      const partCode = String(row['Row Labels'] || '').trim();
      const total = toNumber(row['Total']);
      if (!partCode || /grand total/i.test(partCode) || total <= 0) continue;
      const pcb = await getOrCreatePcb(client, partCode);
      await insertProductionBaseline(client, pcb.id, total, new Date().toISOString().slice(0, 10), 'Atomberg part-code summary import');
      summary.productionImported += 1;
    }
  }

  const serialSheet = workbook.Sheets['PCB-Serial-No'] || workbook.Sheets['PCB-Serial-No-1'] || workbook.Sheets['PCB-Serial-No (2)'];
  if (serialSheet) {
    const rows = XLSX.utils.sheet_to_json(serialSheet, { defval: '' });
    const pcbEntryCount = new Map();
    const mapCount = new Map();

    for (const row of rows) {
      const partCode = normalizeToken(row['Part code']);
      if (!partCode || partCode === 'NA') continue;

      pcbEntryCount.set(partCode, (pcbEntryCount.get(partCode) || 0) + 1);

      const components = tokenizeComponentChange(row['Component Change'] || row['Analysis']);
      for (const c of components) {
        const key = `${partCode}|||${c}`;
        mapCount.set(key, (mapCount.get(key) || 0) + 1);
      }
    }

    for (const [key, count] of mapCount.entries()) {
      const [partCode, componentToken] = key.split('|||');
      const totalForPart = pcbEntryCount.get(partCode) || 1;
      const qtyPerPcb = Number((count / totalForPart).toFixed(4));

      const pcb = await getOrCreatePcb(client, partCode);
      const component = await upsertComponent(client, {
        componentName: componentToken,
        partNumber: componentToken,
        monthlyRequiredQty: count,
        stockQty: Math.ceil(count * 1.3),
      });

      await upsertMapping(client, pcb.id, component.id, qtyPerPcb);
      summary.mappingsImported += 1;
    }
  }
}

async function importBajaj(client, workbook, summary) {
  const master = workbook.Sheets['Master_Summary'];
  const totalEntriesByPart = new Map();

  if (master) {
    const rows = XLSX.utils.sheet_to_json(master, { header: 1, defval: '' });

    for (let i = 1; i < rows.length; i += 1) {
      const r = rows[i];
      const codeForTotal = normalizeToken(r[8]);
      const totalEntries = toNumber(r[9]);
      if (codeForTotal && totalEntries > 0) {
        totalEntriesByPart.set(codeForTotal, Math.max(totalEntriesByPart.get(codeForTotal) || 0, totalEntries));
      }
    }

    for (let i = 1; i < rows.length; i += 1) {
      const r = rows[i];
      const spareCode = normalizeToken(r[0]);
      const componentName = normalizeToken(r[1]);
      const count = toNumber(r[3]);
      if (!spareCode || !componentName || count <= 0) continue;

      const monthly = count;
      const stock = Math.ceil(monthly * 1.5);
      const component = await upsertComponent(client, {
        componentName,
        partNumber: componentName,
        monthlyRequiredQty: monthly,
        stockQty: stock,
      });
      summary.componentsImported += 1;

      const pcb = await getOrCreatePcb(client, spareCode);
      const totalEntries = totalEntriesByPart.get(spareCode) || count;
      const qtyPerPcb = Number((count / Math.max(1, totalEntries)).toFixed(4));
      await upsertMapping(client, pcb.id, component.id, qtyPerPcb);
      summary.mappingsImported += 1;
    }
  }

  for (const sheetName of workbook.SheetNames) {
    if (!/^\d+$/.test(String(sheetName))) continue;
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!rows.length) continue;

    const pcb = await getOrCreatePcb(client, String(sheetName));
    const qty = rows.length;
    const firstDate = rows[0]['DC Date'] || rows[0]['Date of Purchase'];
    const date = excelDateToISO(firstDate);
    await insertProductionBaseline(client, pcb.id, qty, date, 'Bajaj part sheet import');
    summary.productionImported += 1;
  }
}

async function importWorkbook(filePath, _userId) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const fileName = path.basename(filePath);

  const summary = {
    file: fileName,
    sheetsProcessed: workbook.SheetNames.length,
    componentsImported: 0,
    mappingsImported: 0,
    productionImported: 0,
    productionSkipped: [],
    sheetTypes: {},
  };

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    if (workbook.SheetNames.includes('Component Consumption') && workbook.SheetNames.some((s) => s.includes('PCB-Serial-No'))) {
      await importAtomberg(client, workbook, summary);
      for (const s of workbook.SheetNames) summary.sheetTypes[s] = 'atomberg_dataset';
    } else if (workbook.SheetNames.includes('Master_Summary')) {
      await importBajaj(client, workbook, summary);
      for (const s of workbook.SheetNames) summary.sheetTypes[s] = /^\d+$/.test(String(s)) ? 'bajaj_part_sheet' : 'bajaj_summary';
    } else {
      for (const s of workbook.SheetNames) summary.sheetTypes[s] = 'unknown';
      summary.productionSkipped.push('Unsupported workbook shape for parser');
    }

    await client.query('COMMIT');
    return summary;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  importWorkbook,
};
