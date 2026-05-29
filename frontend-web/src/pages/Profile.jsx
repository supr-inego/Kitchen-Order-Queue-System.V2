import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/profile/').then(response => {
      setData(response.data);
      setForm({
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        phone: response.data.phone || '',
      });
      if (response.data.avatar_url || response.data.avatar) {
        setPreview(response.data.avatar_url || response.data.avatar);
      }
    });
  }, []);

  function handleAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save() {
    setSaving(true);
    const payload = new FormData();
    payload.append('first_name', form.first_name);
    payload.append('last_name', form.last_name);
    payload.append('phone', form.phone);
    if (avatar) payload.append('avatar', avatar);

    try {
      const { data: nextData } = await api.patch('/profile/', payload);
      setData(nextData);
      if (nextData.avatar_url || nextData.avatar) {
        setPreview(nextData.avatar_url || nextData.avatar);
        setAvatar(null);
      }
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <div className="p-6 text-white/30">Loading profile...</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">My Profile</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account information and contact details.</p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <aside className="card">
          <label className="block cursor-pointer group">
            <div className="mx-auto w-28 h-28 rounded-full overflow-hidden bg-brand-500/20 flex items-center justify-center">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <span className="text-4xl text-brand-400">{data.first_name?.[0]}</span>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            <div className="mt-3 text-center text-brand-400 text-sm group-hover:underline">Change photo</div>
          </label>

          <div className="mt-5 text-center">
            <div className="text-white font-bold text-xl">{data.first_name} {data.last_name}</div>
            <div className="text-white/40 text-sm mt-1">{data.email}</div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full capitalize">{data.role}</span>
              {data.is_verified ? (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Verified</span>
              ) : (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Unverified</span>
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="card">
            <h2 className="font-display font-semibold text-white mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">First Name</label>
                <input className="input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Last Name</label>
                <input className="input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-white/60 mb-1 block">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09XX XXX XXXX" />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={save} disabled={saving} className="btn-primary min-w-36 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="font-display font-semibold text-white mb-4">Account Details</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-white/40">Email</div>
                <div className="text-white mt-1 break-all">{data.email}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-white/40">Role</div>
                <div className="text-white mt-1 capitalize">{data.role}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-white/40">Member Since</div>
                <div className="text-white mt-1">{new Date(data.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
