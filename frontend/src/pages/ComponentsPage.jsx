import { useEffect, useState } from 'react';
import { api } from '../api/client';

const initialForm = {
  component_name: '',
  part_number: '',
  current_stock_quantity: 0,
  monthly_required_quantity: 0,
  low_stock_threshold_percent: 20,
  unit: 'units',
};

export default function ComponentsPage() {
  const [components, setComponents] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    const res = await api.get('/components', { params: { search } });
    setComponents(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.post('/components', form);
    setForm(initialForm);
    load();
  };

  const remove = async (id) => {
    await api.delete(`/components/${id}`);
    load();
  };

  return (
    <div>
      <h2>Components Management</h2>
      <div className="card">
        <div className="toolbar">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search component / part" />
          <button onClick={load}>Search</button>
        </div>
      </div>
      <form className="card form-grid" onSubmit={save}>
        <input placeholder="Component Name" value={form.component_name} onChange={(e) => setForm({ ...form, component_name: e.target.value })} required />
        <input placeholder="Part Number" value={form.part_number} onChange={(e) => setForm({ ...form, part_number: e.target.value })} required />
        <input type="number" step="0.01" placeholder="Current Stock" value={form.current_stock_quantity} onChange={(e) => setForm({ ...form, current_stock_quantity: Number(e.target.value) })} required />
        <input type="number" step="0.01" placeholder="Monthly Required" value={form.monthly_required_quantity} onChange={(e) => setForm({ ...form, monthly_required_quantity: Number(e.target.value) })} required />
        <button type="submit">Add Component</button>
      </form>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Part No</th>
              <th>Stock</th>
              <th>Monthly Req</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id}>
                <td>{c.component_name}</td>
                <td>{c.part_number}</td>
                <td>{Number(c.current_stock_quantity).toFixed(2)}</td>
                <td>{Number(c.monthly_required_quantity).toFixed(2)}</td>
                <td><button className="danger" onClick={() => remove(c.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
