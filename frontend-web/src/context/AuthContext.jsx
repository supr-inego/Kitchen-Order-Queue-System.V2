import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const access = localStorage.getItem('access');
    if (access) {
      try {
        const decoded = jwtDecode(access);
        if (decoded.exp * 1000 > Date.now()) setUser(decoded);
        else localStorage.clear();
      } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  function login(tokens) {
    localStorage.setItem('access', tokens.access);
    localStorage.setItem('refresh', tokens.refresh);
    const decoded = jwtDecode(tokens.access);
    setUser(decoded);
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
