import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function CustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({ name: customer?.name || '', email: customer?.email || '', phone: customer?.phone || '' });
  const [saving, setSaving] = useState(false);
  const set = key => event => setForm({ ...form, [key]: event.target.value });

  async function submit() {
    if (!form.name) return toast.error('Name required');
    setSaving(true);
    try {
      if (customer) await api.patch(`/customers/${customer.id}/`, form);
      else await api.post('/customers/', form);
      toast.success(customer ? 'Customer updated' : 'Customer added');
      onSaved();
      onClose();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-white">{customer ? 'Edit Customer' : 'New Customer'}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white">x</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-white/60 mb-1 block">Name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Full name" />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1 block">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1 block">Phone</label>
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="09XX XXX XXXX" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  async function load() {
    const { data } = await api.get('/customers/');
    setCustomers(data);
  }

  useEffect(() => { load(); }, []);

  async function del(customer) {
    if (!confirm(`Delete "${customer.name}"?`)) return;
    try {
      await api.delete(`/customers/${customer.id}/`);
      toast.success('Customer deleted');
      load();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Delete failed');
    }
  }

  const filtered = customers.filter(customer => {
    const term = search.toLowerCase();
    return customer.name.toLowerCase().includes(term)
      || (customer.email || '').toLowerCase().includes(term)
      || (customer.phone || '').toLowerCase().includes(term);
  });
  const accountCount = customers.filter(customer => customer.account_id).length;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Customers</h1>
          <p className="text-white/40 text-sm mt-1">{customers.length} customer records, {accountCount} customer accounts</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">+ Add Customer</button>
      </div>

      <input className="input mb-6" placeholder="Search customers by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="space-y-3">
        {filtered.map(customer => (
          <div key={customer.id} className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center font-bold text-brand-400 shrink-0">
                {customer.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{customer.name}</div>
                <div className="text-white/40 text-sm truncate">{customer.email || 'No email'} | {customer.phone || 'No phone'}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className={`text-xs px-2 py-1 rounded-full ${customer.account_id ? 'bg-brand-500/20 text-brand-400' : 'bg-white/10 text-white/45'}`}>
                {customer.account_id ? 'Account' : 'Walk-in'}
              </span>
              {customer.account_id && (
                <span className={`text-xs px-2 py-1 rounded-full ${customer.is_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {customer.is_verified ? 'Verified' : 'Unverified'}
                </span>
              )}
              <button onClick={() => setModal(customer)} className="btn-ghost text-xs py-1.5 px-3">Edit</button>
              <button onClick={() => del(customer)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs py-1.5 px-3 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-white/30 text-center py-10">No customers found</p>}
      </div>

      {modal && (
        <CustomerModal
          customer={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
