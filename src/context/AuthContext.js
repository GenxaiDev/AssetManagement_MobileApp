import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const login = useCallback((data) => {
    setUser(data);
    setPermissions(data.permissions || []);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPermissions([]);
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, setLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
