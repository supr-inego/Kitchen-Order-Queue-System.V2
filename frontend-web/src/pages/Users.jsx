import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);

  async function load() {
    const { data } = await api.get('/users/');
    setUsers(data);
  }

  useEffect(() => { load(); }, []);

  async function setRole(user, role) {
    await api.patch(`/users/${user.id}/set_role/`, { role });
    toast.success(`${user.first_name} is now ${role}`);
    load();
  }

  const ROLES = ['customer','staff','admin'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">User Management</h1>
        <p className="text-white/40 text-sm mt-1">{users.length} total users</p>
      </div>

      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center font-bold text-brand-400">
                {u.first_name[0]}
              </div>
              <div>
                <div className="text-white font-medium">{u.first_name} {u.last_name}</div>
                <div className="text-white/40 text-sm">{u.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {u.is_verified ? (
                <span className="text-xs text-green-400">✓ Verified</span>
              ) : (
                <span className="text-xs text-yellow-400">⚠ Unverified</span>
              )}
              <select
                value={u.role}
                onChange={e => setRole(u, e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500">
                {ROLES.map(r => <option key={r} value={r} style={{background:'#1a1a1a'}} className="capitalize">{r}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
