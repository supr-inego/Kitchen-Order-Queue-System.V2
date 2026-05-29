import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { addToCart, cartSummary, readCart } from '../utils/customerCart';

export default function CustomerMenu() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState(readCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [productRes, categoryRes] = await Promise.all([
        api.get('/products/'),
        api.get('/categories/'),
      ]);
      setProducts(productRes.data.filter(product => product.is_available));
      setCategories(categoryRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const filteredProducts = useMemo(() => products.filter(product => {
    const term = search.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(term) || (product.description || '').toLowerCase().includes(term);
    const matchesCategory = category === 'all' || String(product.category) === category;
    return matchesSearch && matchesCategory;
  }), [products, search, category]);

  const { items, total } = cartSummary(cart);

  function handleAdd(product) {
    setCart(addToCart(product));
    toast.success(`${product.name} added to cart`);
  }

  if (loading) return <div className="p-6 text-white/30">Loading menu...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Menu</h1>
          <p className="text-white/40 text-sm mt-1">Choose your items and add them to your cart.</p>
        </div>
        <Link to="/customer/cart" className="btn-primary">View Cart ({items.length}) - PHP {total.toFixed(2)}</Link>
      </div>

      <div className="grid md:grid-cols-[1fr_240px] gap-3">
        <input className="input" placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all" style={{ background: '#1a1a1a' }}>All categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id} style={{ background: '#1a1a1a' }}>{cat.name}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <article key={product.id} className="card overflow-hidden flex flex-col">
            {product.image_url ? (
              <img src={product.image_url} className="h-40 w-full object-cover rounded-xl mb-4" alt={product.name} />
            ) : (
              <div className="h-40 w-full rounded-xl bg-white/5 mb-4 flex items-center justify-center text-white/25 font-display text-lg">Menu Item</div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-white font-semibold truncate">{product.name}</h2>
                  <p className="text-white/40 text-sm mt-1 line-clamp-2">{product.description || 'Freshly prepared by the kitchen.'}</p>
                </div>
                <div className="text-brand-400 font-bold whitespace-nowrap">PHP {parseFloat(product.price).toFixed(2)}</div>
              </div>
            </div>
            <button onClick={() => handleAdd(product)} className="btn-primary mt-4 w-full">Add to Cart</button>
          </article>
        ))}
      </div>

      {filteredProducts.length === 0 && <div className="card text-center text-white/30">No products match your search.</div>}
    </div>
  );
}
