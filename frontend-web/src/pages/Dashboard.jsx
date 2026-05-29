import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = { pending:'#eab308', preparing:'#3b82f6', ready:'#22c55e', completed:'#6b7280', cancelled:'#ef4444' };

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-white/50 text-sm">{label}</div>
        <div className="font-display text-3xl font-bold text-white">{value}</div>
        {sub && <div className="text-white/30 text-xs mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/dashboard/stats/').then(r => setStats(r.data));
    api.get('/orders/?status=pending').then(r => setOrders(r.data.slice(0,5)));
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-full text-white/30">
      <div className="text-center"><div className="text-4xl mb-2 animate-pulse">🍽️</div>Loading...</div>
    </div>
  );

  const chartData = Object.entries(stats.by_status).map(([name, count]) => ({name, count}));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Kitchen operations overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Orders Today" value={stats.orders_today} icon="📋" />
        <StatCard label="Revenue Today" value={`₱${stats.revenue_today.toFixed(0)}`} icon="💰" />
        <StatCard label="Products" value={stats.total_products} icon="🍔" />
        <StatCard label="Customers" value={stats.total_customers} icon="👥" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display font-semibold text-white mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{fill:'#ffffff60', fontSize:12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#ffffff40', fontSize:11}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:'#1a1a1a', border:'1px solid #ffffff20', borderRadius:8, color:'#fff'}} />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {chartData.map((entry,i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#f97316'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-display font-semibold text-white mb-4">Pending Orders</h2>
          {orders.length === 0 ? (
            <p className="text-white/30 text-sm">No pending orders 🎉</p>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <span className="font-mono text-brand-400 text-sm font-medium">#{o.ticket_number}</span>
                    <span className="text-white/60 text-sm ml-2">{o.customer_name || 'Walk-in'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">₱{parseFloat(o.total).toFixed(2)}</div>
                    <div className="text-white/30 text-xs">{o.items?.length} items</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(stats.by_status).map(([st, count]) => (
          <div key={st} className="card text-center">
            <div className="text-2xl font-bold font-display" style={{color: STATUS_COLORS[st]}}>{count}</div>
            <div className="text-white/40 text-xs capitalize mt-1">{st}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
