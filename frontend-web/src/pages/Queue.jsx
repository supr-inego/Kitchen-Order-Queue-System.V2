import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#eab308', bg: 'rgba(234,179,8,0.15)', icon: '⏳' },
  preparing: { label: 'Preparing', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '👨‍🍳' },
  ready: { label: 'Ready!', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: '✅' },
};

function TicketCard({ order }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isReady = order.status === 'ready';
  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${isReady ? 'border-green-500/50 scale-[1.02]' : 'border-white/10'}`}
      style={{ background: cfg.bg }}>
      {isReady && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse" />
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono font-black text-4xl" style={{color: cfg.color}}>#{order.ticket_number}</div>
          <div className="text-3xl">{cfg.icon}</div>
        </div>
        <div className="text-white font-semibold text-lg">{order.customer_name || 'Walk-in'}</div>
        <div className="text-white/40 text-sm mt-1">
          {order.items?.map(i => `${i.quantity}× ${i.product_name}`).join(', ')}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40`}}>
            {cfg.label}
          </span>
          <span className="text-white/30 text-xs">
            {new Date(order.created_at).toLocaleTimeString('en-PH', {hour:'numeric', minute:'2-digit', hour12:true})}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Queue() {
  const [orders, setOrders] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  async function load() {
    const { data } = await api.get('/orders/');
    const active = data.filter(o => ['pending','preparing','ready'].includes(o.status));
    setOrders(active);
    setLastUpdate(new Date());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const groups = { pending: [], preparing: [], ready: [] };
  orders.forEach(o => { if (groups[o.status]) groups[o.status].push(o); });

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Kitchen Queue</h1>
          <p className="text-white/30 text-xs mt-1">
            Auto-refreshes every 8s · Last: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full">⏳ {groups.pending.length} Pending</span>
          <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">👨‍🍳 {groups.preparing.length} Preparing</span>
          <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full">✅ {groups.ready.length} Ready</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-white/20">
          <div className="text-5xl mb-3">🍽️</div>
          <div className="font-display text-xl">Queue is empty</div>
          <div className="text-sm mt-1">All orders have been completed</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {['pending','preparing','ready'].map(st => (
            <div key={st}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{STATUS_CONFIG[st].icon}</span>
                <h2 className="font-display font-bold text-white capitalize">{STATUS_CONFIG[st].label}</h2>
                <span className="text-white/30 text-sm">({groups[st].length})</span>
              </div>
              <div className="space-y-3">
                {groups[st].map(o => <TicketCard key={o.id} order={o} />)}
                {groups[st].length === 0 && (
                  <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center text-white/20 text-sm">
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
