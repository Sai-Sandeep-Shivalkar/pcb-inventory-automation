import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AnalyticsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get('/analytics/alerts').then((res) => setAlerts(res.data));
  }, []);

  const exportExcel = async () => {
    const res = await api.get('/analytics/export', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-report.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2>Analytics & Reports</h2>
      <div className="card toolbar">
        <button onClick={exportExcel}>Export Inventory + Analytics Excel</button>
      </div>
      <div className="card">
        <h3>Procurement Alerts</h3>
        <table>
          <thead>
            <tr><th>Created</th><th>Component</th><th>Part</th><th>Shortage</th><th>Status</th><th>Message</th></tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>{a.component_name}</td>
                <td>{a.part_number}</td>
                <td>{Number(a.shortage_quantity).toFixed(2)}</td>
                <td>{a.alert_status}</td>
                <td>{a.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
