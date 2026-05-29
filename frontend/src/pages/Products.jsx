import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function ProductModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || '',
    is_available: product?.is_available ?? true,
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(product?.image_url || null);
  const [saving, setSaving] = useState(false);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  const set = k => e => setForm({...form, [k]: e.target.value});

  async function submit() {
    if (!form.name || !form.price) return toast.error('Name and price required');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (image) fd.append('image', image);
    try {
      if (product) await api.patch(`/products/${product.id}/`, fd);
      else await api.post('/products/', fd);
      toast.success(product ? 'Product updated' : 'Product created');
      onSaved(); onClose();
    } catch(e) { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-white">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white">✕</button>
        </div>

        {/* Image upload */}
        <div className="mb-4">
          <label className="block text-sm text-white/60 mb-1">Product Image</label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-brand-500/50 transition-colors">
            {preview ? (
              <img src={preview} className="h-28 object-cover rounded-lg" alt="preview" />
            ) : (
              <div className="text-center text-white/30">
                <div className="text-3xl mb-1">📸</div>
                <div className="text-sm">Click to upload</div>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-white/60 mb-1 block">Name</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Product name" />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1 block">Description</label>
            <textarea className="input resize-none h-20" value={form.description} onChange={set('description')} placeholder="Short description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Price (₱)</label>
              <input className="input" type="number" step="0.01" value={form.price} onChange={set('price')} />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                <option value="" style={{background:'#1a1a1a'}}>None</option>
                {categories.map(c => <option key={c.id} value={c.id} style={{background:'#1a1a1a'}}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_available} onChange={e => setForm({...form, is_available: e.target.checked})}
              className="w-4 h-4 accent-brand-500" />
            <span className="text-sm text-white/70">Available</span>
          </label>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | product obj

  async function load() {
    const [p, c] = await Promise.all([api.get('/products/'), api.get('/categories/')]);
    setProducts(p.data); setCategories(c.data);
  }

  useEffect(() => { load(); }, []);

  async function deleteProduct(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}/`);
    toast.success('Product deleted');
    load();
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Products</h1>
          <p className="text-white/40 text-sm mt-1">{products.length} menu items</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">+ Add Product</button>
      </div>

      <input className="input mb-6" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="card overflow-hidden group relative">
            {p.image_url ? (
              <img src={p.image_url} className="w-full h-28 object-cover rounded-xl mb-3" alt={p.name} />
            ) : (
              <div className="w-full h-28 bg-white/5 rounded-xl mb-3 flex items-center justify-center text-3xl">🍔</div>
            )}
            <div className="text-white font-semibold">{p.name}</div>
            <div className="text-white/40 text-xs mt-0.5 line-clamp-1">{p.description}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-brand-400 font-bold">₱{parseFloat(p.price).toFixed(2)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {p.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setModal(p)} className="btn-ghost text-xs flex-1 py-1.5">Edit</button>
              <button onClick={() => deleteProduct(p)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs flex-1 py-1.5 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-white/30 col-span-4 text-center py-10">No products found</p>}
      </div>

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
