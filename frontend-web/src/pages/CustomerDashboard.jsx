import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { cartSummary, readCart } from '../utils/customerCart';

const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'];

function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <div className="text-white/50 text-sm">{label}</div>
      <div className="font-display text-3xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-white/30 text-xs mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge-${status}`}>{status}</span>;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(readCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [productRes, orderRes] = await Promise.all([
        api.get('/products/'),
        api.get('/orders/'),
      ]);
      setProducts(productRes.data.filter(product => product.is_available));
      setOrders(orderRes.data);
      setLoading(false);
    }
    load();

    const syncCart = () => setCart(readCart());
    window.addEventListener('customer-cart-updated', syncCart);
    return () => window.removeEventListener('customer-cart-updated', syncCart);
  }, []);

  const { items, total } = cartSummary(cart);
  const activeOrders = orders.filter(order => ACTIVE_STATUSES.includes(order.status));
  const latestOrder = orders[0];

  if (loading) return <div className="p-6 text-white/30">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Customer Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Welcome, {user?.name?.split(' ')[0] || 'customer'}. Order food and track kitchen progress.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/customer/menu" className="btn-primary">Browse Menu</Link>
          <Link to="/customer/orders" className="btn-ghost">Track Orders</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Available Products" value={products.length} sub="ready to order" />
        <StatCard label="Active Orders" value={activeOrders.length} sub="pending, preparing, or ready" />
        <StatCard label="Cart Items" value={items.length} sub={`PHP ${total.toFixed(2)} total`} />
        <StatCard label="Latest Ticket" value={latestOrder ? `#${latestOrder.ticket_number}` : '--'} sub={latestOrder ? latestOrder.status : 'no orders yet'} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-white">Featured Menu</h2>
              <p className="text-white/35 text-sm mt-1">A quick look at what is available today.</p>
            </div>
            <Link to="/customer/menu" className="text-brand-400 text-sm hover:underline">View all</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {products.slice(0, 3).map(product => (
              <div key={product.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-24 w-full object-cover rounded-lg mb-3" />
                ) : (
                  <div className="h-24 rounded-lg bg-white/5 mb-3 flex items-center justify-center text-white/25 text-sm">Menu Item</div>
                )}
                <div className="text-white font-medium truncate">{product.name}</div>
                <div className="text-brand-400 text-sm mt-1">PHP {parseFloat(product.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="card">
          <h2 className="font-display font-semibold text-white mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-white/35 text-sm">You have not placed an order yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 4).map(order => (
                <Link key={order.id} to="/customer/orders" className="block rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-brand-400 font-medium">#{order.ticket_number}</div>
                      <div className="text-white/35 text-xs">{order.items?.length || 0} items</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm">PHP {parseFloat(order.total).toFixed(2)}</div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
