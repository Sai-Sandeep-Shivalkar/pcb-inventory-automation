CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  component_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  current_stock_quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
  monthly_required_quantity NUMERIC(14,2) NOT NULL DEFAULT 0,
  low_stock_threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 20,
  unit VARCHAR(30) DEFAULT 'units',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pcb_models (
  id SERIAL PRIMARY KEY,
  pcb_name VARCHAR(255) NOT NULL,
  pcb_code VARCHAR(100) UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pcb_component_mapping (
  id SERIAL PRIMARY KEY,
  pcb_model_id INTEGER NOT NULL REFERENCES pcb_models(id) ON DELETE CASCADE,
  component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  quantity_per_pcb NUMERIC(14,4) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (pcb_model_id, component_id)
);

CREATE TABLE IF NOT EXISTS production_entries (
  id SERIAL PRIMARY KEY,
  pcb_model_id INTEGER NOT NULL REFERENCES pcb_models(id) ON DELETE RESTRICT,
  production_quantity NUMERIC(14,2) NOT NULL,
  production_date DATE NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  transaction_type VARCHAR(30) NOT NULL,
  quantity NUMERIC(14,2) NOT NULL,
  reference_type VARCHAR(30),
  reference_id INTEGER,
  balance_after NUMERIC(14,2) NOT NULL,
  transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS procurement_alerts (
  id SERIAL PRIMARY KEY,
  component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  alert_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  shortage_quantity NUMERIC(14,2) NOT NULL,
  threshold_quantity NUMERIC(14,2) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_components_name ON components(component_name);
CREATE INDEX IF NOT EXISTS idx_components_part ON components(part_number);
CREATE INDEX IF NOT EXISTS idx_production_date ON production_entries(production_date);
CREATE INDEX IF NOT EXISTS idx_alert_status ON procurement_alerts(alert_status);
