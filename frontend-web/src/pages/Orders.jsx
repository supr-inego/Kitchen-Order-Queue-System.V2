import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUSES = ['pending','preparing','ready','completed','cancelled'];
const BADGE = s => <span className={`badge-${s}`}>{s}</span>;

function OrderModal({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  async function updateStatus() {
    setSaving(true);
    try {
      await api.patch(`/orders/${order.id}/update_status/`, { status });
      toast.success('Status updated');
      onUpdated();
      onClose();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-mono text-brand-400 text-xl font-bold">#{order.ticket_number}</div>
            <div className="text-white/50 text-sm">{order.customer_name || 'Walk-in'}</div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-2 mb-4">
          {order.items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-white/70">{item.quantity}× {item.product_name}</span>
              <span className="text-white">₱{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
            <span className="text-white/70">Total</span>
            <span className="text-brand-400">₱{parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        {order.notes && <p className="text-white/40 text-sm mb-4 italic">"{order.notes}"</p>}

        <div className="mb-4">
          <label className="text-sm text-white/60 mb-1 block">Update Status</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s} style={{background:'#1a1a1a'}}>{s}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={updateStatus} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewOrderModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/customers/').then(r => setCustomers(r.data));
    api.get('/products/').then(r => setProducts(r.data.filter(p => p.is_available)));
  }, []);

  function toggleProduct(p) {
    setCart(prev => {
      if (prev[p.id]) { const n = {...prev}; delete n[p.id]; return n; }
      return {...prev, [p.id]: {product_id: p.id, quantity: 1, name: p.name, price: p.price}};
    });
  }
  function setQty(id, qty) {
    if (qty < 1) { setCart(prev => { const n={...prev}; delete n[id]; return n; }); return; }
    setCart(prev => ({...prev, [id]: {...prev[id], quantity: qty}}));
  }

  const total = Object.values(cart).reduce((s,i) => s + parseFloat(i.price)*i.quantity, 0);

  async function submit() {
    if (!Object.keys(cart).length) return toast.error('Add at least one item');
    setSaving(true);
    try {
      await api.post('/orders/', {
        customer: customerId || null,
        notes,
        items_data: Object.values(cart).map(i => ({product_id:i.product_id, quantity:i.quantity}))
      });
      toast.success('Order created!');
      onCreated(); onClose();
    } catch(e) { toast.error('Failed to create order'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-lg font-bold text-white">New Order</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white">✕</button>
        </div>

        <div className="mb-4">
          <label className="text-sm text-white/60 mb-1 block">Customer (optional)</label>
          <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="" style={{background:'#1a1a1a'}}>Walk-in</option>
            {customers.map(c => <option key={c.id} value={c.id} style={{background:'#1a1a1a'}}>{c.name}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm text-white/60 mb-2 block">Menu Items</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {products.map(p => {
              const inCart = !!cart[p.id];
              return (
                <div key={p.id} onClick={() => toggleProduct(p)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${inCart ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <div className="text-white text-sm font-medium">{p.name}</div>
                  <div className="text-brand-400 text-xs">₱{p.price}</div>
                  {inCart && (
                    <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setQty(p.id, cart[p.id].quantity-1)} className="w-6 h-6 rounded bg-white/10 text-white text-sm flex items-center justify-center">−</button>
                      <span className="text-white text-sm">{cart[p.id].quantity}</span>
                      <button onClick={() => setQty(p.id, cart[p.id].quantity+1)} className="w-6 h-6 rounded bg-white/10 text-white text-sm flex items-center justify-center">+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {Object.keys(cart).length > 0 && (
          <div className="mb-4 p-3 bg-white/5 rounded-xl">
            {Object.values(cart).map(i => (
              <div key={i.product_id} className="flex justify-between text-sm text-white/70 mb-1">
                <span>{i.quantity}× {i.name}</span>
                <span>₱{(parseFloat(i.price)*i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 flex justify-between font-medium text-white">
              <span>Total</span><span className="text-brand-400">₱{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm text-white/60 mb-1 block">Notes</label>
          <input className="input" placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const url = filter ? `/orders/?status=${filter}` : '/orders/';
    const { data } = await api.get(url);
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
          <p className="text-white/40 text-sm mt-1">{orders.length} orders</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ New Order</button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['','pending','preparing','ready','completed','cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${filter === s ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <p className="text-white/30">Loading...</p> : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} onClick={() => setSelected(o)}
              className="card flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="font-mono text-brand-400 font-bold text-lg">#{o.ticket_number}</div>
                <div>
                  <div className="text-white font-medium">{o.customer_name || 'Walk-in'}</div>
                  <div className="text-white/40 text-xs">{o.items?.length} items · {new Date(o.created_at).toLocaleString('en-PH', {hour12:true, hour:'numeric', minute:'2-digit'})}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white font-medium">₱{parseFloat(o.total).toFixed(2)}</div>
                  <div className="text-white/30 text-xs">{o.staff_name}</div>
                </div>
                {BADGE(o.status)}
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-white/30 text-center py-10">No orders found</p>}
        </div>
      )}

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onUpdated={load} />}
      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  );
}
