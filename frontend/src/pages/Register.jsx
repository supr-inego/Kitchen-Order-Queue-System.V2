import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ email:'', first_name:'', last_name:'', password:'', password2:'' });
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();

  const set = k => e => setForm({...form, [k]: e.target.value});

  async function handleSubmit(e) {
    e.preventDefault();
    if (Object.values(form).some(v => !v)) return toast.error('Fill all fields');
    if (form.password !== form.password2) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      setRegisteredEmail(form.email);
      toast.success('Account created. Please verify your email before signing in.');
    } catch (err) {
      const errs = err.response?.data;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error('Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🍽️</div>
          <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
          <p className="text-white/40 text-sm mt-1">Join KitchenPOS today</p>
        </div>
        {registeredEmail ? (
          <div className="card text-center space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Verify your email</h2>
              <p className="text-white/45 text-sm mt-2">
                We sent a confirmation link to <span className="text-white">{registeredEmail}</span>. Open that link first, then sign in.
              </p>
            </div>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">Go to Login</button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/60 block mb-1">First Name</label>
              <input className="input" placeholder="Juan" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Last Name</label>
              <input className="input" placeholder="Cruz" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/60 block mb-1">Email</label>
            <input className="input" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="text-sm text-white/60 block mb-1">Password</label>
            <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="text-sm text-white/60 block mb-1">Confirm Password</label>
            <input className="input" type="password" placeholder="Repeat password" value={form.password2} onChange={set('password2')} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-white/40 text-sm">
            Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
