import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

const STEPS = ['pending', 'preparing', 'ready', 'completed'];
const STEP_LABELS = ['Placed', 'Preparing', 'Ready', 'Completed'];

function StatusBadge({ status }) {
  return <span className={`badge-${status}`}>{status}</span>;
}

function ProgressBar({ status }) {
  if (status === 'cancelled') {
    return <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">This order was cancelled.</div>;
  }

  const index = Math.max(STEPS.indexOf(status), 0);
  return (
    <div className="mt-5 grid grid-cols-4 gap-2">
      {STEPS.map((step, i) => (
        <div key={step}>
          <div className={`h-1.5 rounded-full ${i <= index ? 'bg-brand-500' : 'bg-white/10'}`} />
          <div className={`mt-2 text-xs ${i === index ? 'text-brand-400 font-medium' : i < index ? 'text-white/50' : 'text-white/25'}`}>{STEP_LABELS[i]}</div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerOrders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [ticket, setTicket] = useState(location.state?.ticket || '');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  async function load() {
    const { data } = await api.get('/orders/');
    setOrders(data);
    if (!selected && data.length) setSelected(data[0]);
    if (location.state?.ticket) {
      const match = data.find(order => order.ticket_number === location.state.ticket);
      if (match) setSelected(match);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function trackOrder() {
    if (!ticket.trim()) return toast.error('Enter a ticket number');
    setTracking(true);
    try {
      const { data } = await api.get(`/track/${ticket.trim()}/`);
      setSelected(data);
    } catch {
      toast.error('Order not found. Please check the ticket number.');
    } finally {
      setTracking(false);
    }
  }

  if (loading) return <div className="p-6 text-white/30">Loading orders...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
          <p className="text-white/40 text-sm mt-1">Track tickets and review your order history.</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input w-40 font-mono text-center tracking-widest"
            maxLength={4}
            placeholder="Ticket #"
            value={ticket}
            onChange={e => setTicket(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && trackOrder()}
          />
          <button onClick={trackOrder} disabled={tracking} className="btn-primary">{tracking ? 'Tracking...' : 'Track'}</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <aside className="card">
          <h2 className="font-display font-semibold text-white mb-4">My Orders</h2>
          {orders.length === 0 ? (
            <p className="text-white/35 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => { setSelected(order); setTicket(order.ticket_number); }}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${selected?.ticket_number === order.ticket_number ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-brand-400 font-medium">#{order.ticket_number}</div>
                      <div className="text-white/35 text-xs">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="card">
          <h2 className="font-display font-semibold text-white mb-4">Order Details</h2>
          {!selected ? (
            <p className="text-white/35 text-sm">Select an order or enter a ticket number.</p>
          ) : (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-mono text-brand-400 text-3xl font-bold">#{selected.ticket_number}</div>
                  <div className="text-white/40 text-sm mt-1">{selected.customer_name || 'Customer order'}</div>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <ProgressBar status={selected.status} />

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="space-y-2">
                  {selected.items?.map(item => (
                    <div key={item.id} className="flex justify-between gap-4 text-sm">
                      <span className="text-white/65">{item.quantity} x {item.product_name}</span>
                      <span className="text-white">PHP {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 flex justify-between font-medium">
                    <span className="text-white/50">Total</span>
                    <span className="text-brand-400">PHP {parseFloat(selected.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selected.status === 'ready' && (
                <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <div className="text-green-300 font-semibold">Your order is ready for pickup.</div>
                  <div className="text-green-300/70 text-sm mt-1">Please show ticket #{selected.ticket_number} at the counter.</div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
