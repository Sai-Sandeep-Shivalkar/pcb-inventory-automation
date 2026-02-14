import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { api } from '../api/client';

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div>Loading dashboard...</div>;

  const { kpis, topConsumed, monthlyTrend, lowStock } = data;

  return (
    <div>
      <h2>Main Dashboard</h2>
      <div className="kpi-grid">
        <div className="card kpi"><span>Total Components</span><strong>{kpis.total_components}</strong></div>
        <div className="card kpi"><span>Total PCB Models</span><strong>{kpis.total_pcbs}</strong></div>
        <div className="card kpi"><span>Open Alerts</span><strong>{kpis.open_alerts}</strong></div>
        <div className="card kpi"><span>Total Production</span><strong>{Number(kpis.total_production_qty).toFixed(2)}</strong></div>
      </div>

      <div className="two-col">
        <div className="card chart-card">
          <h3>Top Consumed Components</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topConsumed}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="part_number" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_consumed" fill="#21a1ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <h3>Monthly Usage Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="production_qty" stroke="#4bd47b" />
              <Line type="monotone" dataKey="consumed_qty" stroke="#ffb74d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Low Stock Components</h3>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Part Number</th>
              <th>Stock</th>
              <th>Threshold</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((row) => (
              <tr key={row.id}>
                <td>{row.component_name}</td>
                <td>{row.part_number}</td>
                <td>{Number(row.current_stock_quantity).toFixed(2)}</td>
                <td>{Number(row.threshold).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
