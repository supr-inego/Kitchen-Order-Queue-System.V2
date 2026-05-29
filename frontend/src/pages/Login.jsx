import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

function getLoginErrorMessage(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return 'Wrong email or password. Please check your credentials and try again.';
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Fill in all fields');
      return;
    }
    setLoading(true);
    try {
      setError('');
      const { data } = await api.post('/auth/login/', form);
      login(data);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const message = getLoginErrorMessage(err);
      setError(message);
      toast.error(message, { duration: 6000, id: 'login-error' });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="font-display text-3xl font-bold text-white">Crammer's Restaurant</h1>
          <p className="text-white/40 mt-1 font-body">Order Management System</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 shadow-sm shadow-red-950/20 transition-opacity duration-200"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}
          <div>
            <label className="text-sm text-white/60 block mb-1">Email</label>
            <input className="input" type="email" placeholder="you@kitchen.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-white/60 block mb-1">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-white/40 text-sm">
            No account? <Link to="/register" className="text-brand-400 hover:underline">Register</Link>
          </p>
          <p className="text-center text-white/40 text-sm">
            Track your order? <Link to="/track" className="text-brand-400 hover:underline">Track here</Link>
          </p>
        </form>
        <p className="text-center text-white/20 text-xs mt-4">Demo: admin@kitchen.com / admin123</p>
      </div>
    </div>
  );
}
