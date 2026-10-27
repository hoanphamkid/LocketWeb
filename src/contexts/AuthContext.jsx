import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { firebaseApp } from '../firebase/init';
import { signIn, signUp, resetPassword } from '../firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const auth = firebaseApp ? getAuth(firebaseApp) : null;
  const [user, setUser] = useState(() => auth ? null : { uid: 'demo-user', email: 'demo@locket.local' });
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return undefined;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const signOut = async () => {
    if (auth) await firebaseSignOut(auth);
    setUser(null);
  };

  // Wrapper functions
  const login = async (email, password) => {
    const result = await signIn(email, password);
    if (result.user) setUser(result.user);
    return result;
  };

  const register = async (email, password) => {
    const result = await signUp(email, password);
    if (result.user) setUser(result.user);
    return result;
  };

  const requestPasswordReset = async (email) => {
    return await resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, login, register, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
