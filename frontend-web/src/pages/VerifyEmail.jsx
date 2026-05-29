import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify/${token}/`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h1 className="font-display text-2xl font-bold text-white">Verifying...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="font-display text-2xl font-bold text-white">Email Verified!</h1>
            <p className="text-white/50 mt-2 text-sm">Your account is now active. You can sign in.</p>
            <Link to="/login" className="btn-primary inline-block mt-6 px-8">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="font-display text-2xl font-bold text-white">Invalid Link</h1>
            <p className="text-white/50 mt-2 text-sm">This verification link is invalid or has already been used.</p>
            <Link to="/login" className="btn-primary inline-block mt-6 px-8">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
