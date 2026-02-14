import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function HistoryPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/production/consumption-history').then((res) => setRows(res.data));
  }, []);

  return (
    <div>
      <h2>Consumption History</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Component</th>
              <th>Part Number</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Balance After</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.transaction_date).toLocaleString()}</td>
                <td>{r.component_name}</td>
                <td>{r.part_number}</td>
                <td>{r.transaction_type}</td>
                <td>{Number(r.quantity).toFixed(2)}</td>
                <td>{Number(r.balance_after).toFixed(2)}</td>
                <td>{r.reference_type}#{r.reference_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
