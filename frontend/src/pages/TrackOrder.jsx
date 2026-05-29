import { useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const STEPS = ['pending','preparing','ready','completed'];

function ProgressBar({ status }) {
  const idx = STEPS.indexOf(status);
  const labels = ['Order Placed','Preparing','Ready for Pickup','Completed'];
  const icons = ['🧾','👨‍🍳','✅','🎉'];
  return (
    <div className="flex items-start gap-0 mt-6">
      {STEPS.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={s} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {i > 0 && <div className={`flex-1 h-0.5 ${done ? 'bg-brand-500' : 'bg-white/10'}`} />}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${active ? 'border-brand-500 bg-brand-500/20 scale-110' : done ? 'border-brand-500 bg-brand-500/10' : 'border-white/20 bg-white/5'}`}>
                {icons[i]}
              </div>
              {i < STEPS.length-1 && <div className={`flex-1 h-0.5 ${i < idx ? 'bg-brand-500' : 'bg-white/10'}`} />}
            </div>
            <div className={`text-xs mt-2 text-center ${active ? 'text-brand-400 font-medium' : done ? 'text-white/60' : 'text-white/20'}`}>{labels[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackOrder() {
  const [ticket, setTicket] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function track() {
    if (!ticket.trim()) return;
    setLoading(true); setError(''); setOrder(null);
    try {
      const { data } = await api.get(`/track/${ticket.trim()}/`);
      setOrder(data);
    } catch {
      setError('Order not found. Check your ticket number.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="font-display text-3xl font-bold text-white">Track Your Order</h1>
          <p className="text-white/40 mt-1">Enter your 4-digit ticket number</p>
        </div>

        <div className="card mb-6">
          <div className="flex gap-2">
            <input
              className="input font-mono text-xl tracking-widest text-center"
              placeholder="0000"
              maxLength={4}
              value={ticket}
              onChange={e => setTicket(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key === 'Enter' && track()}
            />
            <button onClick={track} disabled={loading} className="btn-primary px-6 whitespace-nowrap">
              {loading ? '...' : 'Track'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {order && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-brand-400 text-3xl font-black">#{order.ticket_number}</div>
                <div className="text-white/60 text-sm">{order.customer_name || 'Walk-in customer'}</div>
              </div>
              <div className={`badge-${order.status} text-sm px-3 py-1`}>{order.status}</div>
            </div>

            {order.status !== 'cancelled' && <ProgressBar status={order.status} />}

            <div className="border-t border-white/10 pt-4">
              <div className="text-white/50 text-sm mb-2">Order Items</div>
              {order.items?.map(i => (
                <div key={i.id} className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">{i.quantity}× {i.product_name}</span>
                  <span className="text-white">₱{(parseFloat(i.price)*i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex justify-between font-medium mt-2">
                <span className="text-white/60">Total</span>
                <span className="text-brand-400 font-bold">₱{parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-white/20 text-sm mt-6">
          Staff? <Link to="/login" className="text-brand-400 hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
