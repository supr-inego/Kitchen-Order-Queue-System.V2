import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { cartSummary, clearCart, readCart, updateCartQuantity } from '../utils/customerCart';

export default function CustomerCart() {
  const [cart, setCart] = useState(readCart());
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const { items, total } = cartSummary(cart);

  useEffect(() => {
    const syncCart = () => setCart(readCart());
    window.addEventListener('customer-cart-updated', syncCart);
    return () => window.removeEventListener('customer-cart-updated', syncCart);
  }, []);

  function setQty(productId, quantity) {
    setCart(updateCartQuantity(productId, quantity));
  }

  async function placeOrder() {
    if (!items.length) return toast.error('Add at least one product');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders/', {
        notes,
        items_data: items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
      });
      clearCart();
      setCart({});
      setNotes('');
      toast.success(`Order placed. Ticket #${data.ticket_number}`);
      navigate('/customer/orders', { state: { ticket: data.ticket_number } });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Cart</h1>
          <p className="text-white/40 text-sm mt-1">Review your order before sending it to the kitchen.</p>
        </div>
        <Link to="/customer/menu" className="btn-ghost">Continue Ordering</Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <section className="card">
          <h2 className="font-display font-semibold text-white mb-4">Order Items</h2>
          {items.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-5 text-white/35">
              Your cart is empty. <Link to="/customer/menu" className="text-brand-400 hover:underline">Browse the menu</Link>.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.product_id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{item.name}</div>
                    <div className="text-white/35 text-sm">PHP {parseFloat(item.price).toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(item.product_id, item.quantity - 1)} className="h-9 w-9 rounded-lg bg-white/10 text-white">-</button>
                    <span className="w-8 text-center text-white">{item.quantity}</span>
                    <button onClick={() => setQty(item.product_id, item.quantity + 1)} className="h-9 w-9 rounded-lg bg-white/10 text-white">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="card">
          <h2 className="font-display font-semibold text-white mb-4">Checkout</h2>
          <textarea
            className="input resize-none h-28"
            placeholder="Notes for the kitchen..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="space-y-2 mt-4 text-sm">
            <div className="flex justify-between text-white/50"><span>Items</span><span>{items.length}</span></div>
            <div className="flex justify-between text-white/50"><span>Subtotal</span><span>PHP {total.toFixed(2)}</span></div>
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-white">Total</span>
              <span className="font-display text-2xl font-bold text-brand-400">PHP {total.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={placeOrder} disabled={placing || !items.length} className="btn-primary w-full mt-5 disabled:opacity-50">
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
        </aside>
      </div>
    </div>
  );
}
