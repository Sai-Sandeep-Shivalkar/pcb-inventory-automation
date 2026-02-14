import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function ProductionPage() {
  const [pcbs, setPcbs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ pcb_model_id: '', production_quantity: 0, production_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const [pcbRes, entryRes] = await Promise.all([
      api.get('/pcb/models'),
      api.get('/production'),
    ]);
    setPcbs(pcbRes.data);
    setEntries(entryRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/production', form);
      setForm({ ...form, production_quantity: 0, notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add production entry');
    }
  };

  return (
    <div>
      <h2>PCB Production Entry</h2>
      <form className="card form-grid" onSubmit={submit}>
        <select value={form.pcb_model_id} onChange={(e) => setForm({ ...form, pcb_model_id: Number(e.target.value) })} required>
          <option value="">Select PCB</option>
          {pcbs.map((p) => <option key={p.id} value={p.id}>{p.pcb_name}</option>)}
        </select>
        <input type="number" step="0.01" value={form.production_quantity} onChange={(e) => setForm({ ...form, production_quantity: Number(e.target.value) })} placeholder="Production Qty" required />
        <input type="date" value={form.production_date} onChange={(e) => setForm({ ...form, production_date: e.target.value })} required />
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
        <button type="submit">Process Production</button>
        {error && <div className="alert error">{error}</div>}
      </form>

      <div className="card">
        <h3>Recent Production</h3>
        <table>
          <thead>
            <tr><th>Date</th><th>PCB</th><th>Qty</th><th>Source</th></tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{String(e.production_date).slice(0, 10)}</td>
                <td>{e.pcb_name}</td>
                <td>{Number(e.production_quantity).toFixed(2)}</td>
                <td>{e.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
